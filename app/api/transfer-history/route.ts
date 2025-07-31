import { NextRequest, NextResponse } from 'next/server'
import { AbiEvent, createPublicClient, http, parseAbiItem } from 'viem'
import ADDRESSES from '@/lib/addresses'
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
  try {
    // Use a more reliable RPC endpoint for Base Sepolia
    const rpcUrl =
      chain.id === 84532
        ? 'https://base-sepolia-rpc.publicnode.com'
        : chain.rpcUrls.default.http[0]

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    })

    // Fetch current block number
    const currentBlock = await publicClient.getBlockNumber()
    const fromBlock = BigInt(FROM_BLOCK)
    const maxBlockRange = BigInt(10000) // Safe block range

    // Helper function to fetch logs in chunks
    const fetchLogsInChunks = async (eventAbi: string) => {
      let allLogs: any[] = []
      let startBlock = fromBlock

      while (startBlock <= currentBlock) {
        const endBlock =
          startBlock + maxBlockRange > currentBlock
            ? currentBlock
            : startBlock + maxBlockRange

        try {
          const logs = await publicClient.getLogs({
            address: ADDRESSES.ESCROW,
            event: parseAbiItem(eventAbi) as AbiEvent,
            fromBlock: startBlock,
            toBlock: endBlock,
          })
          allLogs = allLogs.concat(logs)
        } catch (error) {
          console.warn(
            `Failed to fetch logs from ${startBlock} to ${endBlock}:`,
            error,
          )
          // Continue with next chunk even if one fails
        }

        startBlock = endBlock + BigInt(1)
      }

      return allLogs
    }

    // Get all event logs in parallel
    const [
      intentSignaledLogs,
      intentFulfilledLogs,
      intentCancelledLogs,
      intentReleasedLogs,
    ] = await Promise.all([
      // IntentSignaled events
      fetchLogsInChunks(
        'event IntentSignaled(address to, address verifier, uint256 amount, uint256 intentId)',
      ),
      // IntentFulfilled events - updated signature
      fetchLogsInChunks(
        'event IntentFulfilled(uint256 indexed intentId, uint256 indexed depositId, address indexed verifier, address owner, address to, uint256 amount)',
      ),
      // IntentCancelled events
      fetchLogsInChunks('event IntentCancelled(uint256 intentId)'),
      // IntentReleased events
      fetchLogsInChunks(
        'event IntentReleased(uint256 indexed intentId, uint256 indexed depositId, address owner, address to, uint256 amount)',
      ),
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

    // Sort by timestamp (newest first)
    allIntents.sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json({
      intents: allIntents,
      totalCount: allIntents.length,
    })
  } catch (error) {
    console.error('Error fetching transfer history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transfer history' },
      { status: 500 },
    )
  }
}
