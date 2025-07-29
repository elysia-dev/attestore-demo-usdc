import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, defineChain } from 'viem'
import { holesky, anvil } from 'viem/chains'
import ADDRESSES from '@/lib/addresses'
import { ESCROW_ABI } from '@/lib/abi'
import { FROM_BLOCK, isLocal } from '@/constant'

// Define Anvil chain for local development
// const anvil = defineChain({
//   id: 31337,
//   name: 'Anvil',
//   network: 'anvil',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'Ether',
//     symbol: 'ETH',
//   },
//   rpcUrls: {
//     default: {
//       http: ['http://127.0.0.1:8545'],
//     },
//     public: {
//       http: ['http://127.0.0.1:8545'],
//     },
//   },
// })

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')

  try {
    const publicClient = createPublicClient({
      chain: isLocal ? anvil : holesky,
      transport: http(),
    })

    // Get all IntentFulfilled events
    const events = await publicClient.getLogs({
      address: ADDRESSES.ESCROW,
      event: {
        type: 'event',
        name: 'IntentFulfilled',
        inputs: [
          { name: 'intentHash', type: 'bytes32' },
          { name: 'verifier', type: 'address' },
          { name: 'owner', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
      },
      fromBlock: isLocal ? 0n : BigInt(FROM_BLOCK),
      toBlock: 'latest',
    })
    console.log('events', events)

    // Get block timestamps
    const blocksMap = new Map()
    for (const event of events) {
      if (!blocksMap.has(event.blockNumber)) {
        const block = await publicClient.getBlock({
          blockNumber: event.blockNumber,
        })
        blocksMap.set(event.blockNumber, block.timestamp)
      }
    }

    const transferHistory = events
      .filter((event) => {
        // If address is provided, filter by owner or to address
        if (address) {
          const owner = event.args?.owner?.toLowerCase()
          const to = event.args?.to?.toLowerCase()
          const userAddress = address.toLowerCase()
          return owner === userAddress || to === userAddress
        }
        // If no address, return all events
        return true
      })
      .map((event) => ({
        intentHash: event.args?.intentHash || '0x',
        verifier: event.args?.verifier || '0x',
        owner: event.args?.owner || '0x',
        to: event.args?.to || '0x',
        amount: event.args?.amount || 0n,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: Number(blocksMap.get(event.blockNumber) || 0),
      }))
      .reverse() // Most recent first

    return NextResponse.json({ transferHistory })
  } catch (error) {
    console.error('Error fetching transfer history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfer history' },
      { status: 500 },
    )
  }
}
