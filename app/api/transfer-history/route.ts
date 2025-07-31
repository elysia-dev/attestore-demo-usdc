import { NextRequest, NextResponse } from 'next/server'
import {
  createPublicClient,
  http,
  defineChain,
  parseAbiItem,
  decodeEventLog,
} from 'viem'
import { holesky, anvil } from 'viem/chains'
import ADDRESSES from '@/lib/addresses'
import { ESCROW_ABI } from '@/lib/abi'
import { FROM_BLOCK, chain } from '@/constant'

type IntentStatus = 'active' | 'fulfilled' | 'cancelled' | 'released'

interface TransferHistoryItem {
  id: string
  owner: string
  to: string
  amount: string
  timestamp: number
  status: IntentStatus
  txHash: string
  blockNumber: string
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const address = searchParams.get('address')
  const filter = searchParams.get('filter') || 'all'

  try {
    const publicClient = createPublicClient({
      chain,
      transport: http(),
    })

    const fromBlock = FROM_BLOCK

    // Get all event logs in parallel
    const [
      intentSignaledLogs,
      intentFulfilledLogs,
      intentCancelledLogs,
      intentReleasedLogs,
    ] = await Promise.all([
      // IntentSignaled events
      publicClient.getLogs({
        address: ADDRESSES.ESCROW,
        event: parseAbiItem(
          'event IntentSignaled(address to, address verifier, uint256 amount, uint256 intentId)',
        ),
        fromBlock,
        toBlock: 'latest',
      }),
      // IntentFulfilled events - updated signature
      publicClient.getLogs({
        address: ADDRESSES.ESCROW,
        event: parseAbiItem(
          'event IntentFulfilled(uint256 indexed intentId, uint256 indexed depositId, address indexed verifier, address owner, address to, uint256 amount)',
        ),
        fromBlock,
        toBlock: 'latest',
      }),
      // IntentCancelled events
      publicClient.getLogs({
        address: ADDRESSES.ESCROW,
        event: parseAbiItem('event IntentCancelled(uint256 intentId)'),
        fromBlock,
        toBlock: 'latest',
      }),
      // IntentReleased events
      publicClient.getLogs({
        address: ADDRESSES.ESCROW,
        event: parseAbiItem(
          'event IntentReleased(uint256 indexed intentId, uint256 indexed depositId, address owner, address to, uint256 amount)',
        ),
        fromBlock,
        toBlock: 'latest',
      }),
    ])

    // Create status maps
    const fulfilledIntentIds = new Set<string>()
    const cancelledIntentIds = new Set<string>()
    const releasedIntentIds = new Set<string>()

    // Mark fulfilled intents
    intentFulfilledLogs.forEach((log) => {
      if (log.args.intentId) {
        fulfilledIntentIds.add(log.args.intentId.toString())
      }
    })

    // Mark released intents
    intentReleasedLogs.forEach((log) => {
      if (log.args.intentId) {
        releasedIntentIds.add(log.args.intentId.toString())
      }
    })

    // Mark cancelled intents
    intentCancelledLogs.forEach((log) => {
      if (log.args.intentId) {
        cancelledIntentIds.add(log.args.intentId.toString())
      }
    })

    // Create intent objects from signaled events
    const allIntents: TransferHistoryItem[] = await Promise.all(
      intentSignaledLogs.map(async (log) => {
        const block = await publicClient.getBlock({
          blockNumber: log.blockNumber,
        })
        const intentId = log.args.intentId!
        const intentIdStr = intentId.toString()

        let status: IntentStatus = 'active'
        if (fulfilledIntentIds.has(intentIdStr)) {
          status = 'fulfilled'
        } else if (cancelledIntentIds.has(intentIdStr)) {
          status = 'cancelled'
        } else if (releasedIntentIds.has(intentIdStr)) {
          status = 'released'
        }

        // Get the transaction to find the 'from' address (owner)
        const tx = await publicClient.getTransaction({
          hash: log.transactionHash,
        })

        return {
          id: intentIdStr,
          owner: tx.from,
          to: log.args.to!,
          amount: log.args.amount!.toString(),
          timestamp: Number(block.timestamp),
          status,
          txHash: log.transactionHash,
          blockNumber: log.blockNumber.toString(),
        }
      }),
    )

    // Apply filter
    const filteredIntents = allIntents.filter((intent) => {
      if (filter === 'all') {
        return true
      }
      return intent.owner.toLowerCase() === address?.toLowerCase()
    })

    // Sort by timestamp (newest first)
    filteredIntents.sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json({
      intents: filteredIntents,
      totalCount: filteredIntents.length,
    })
  } catch (error) {
    console.error('Error fetching transfer history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfer history' },
      { status: 500 },
    )
  }
}
