'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { formatUnits, parseAbiItem, decodeEventLog } from 'viem'
import { ESCROW_ABI } from '@/lib/abi'
import ADDRESSES from '@/lib/addresses'
import { USDC_SYMBOL } from '@/constant'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { useReleaseFunds } from '@/hooks/useReleaseFunds'

const ADMIN_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

type IntentStatus = 'active' | 'fulfilled' | 'cancelled' | 'released'

type Intent = {
  id: bigint
  owner: string
  to: string
  amount: bigint
  timestamp: number
  status: IntentStatus
  txHash: string
  blockNumber: bigint
}

export function IntentHistory() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [intents, setIntents] = useState<Intent[]>([])
  console.log('intents', intents)
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'my'>('all')
  const [processingIntentId, setProcessingIntentId] = useState<string | null>(
    null,
  )

  const { releaseFunds, isLoading: isReleasing } = useReleaseFunds({
    onSuccess: () => {
      setProcessingIntentId(null)
      fetchIntents() // Refresh after release
    },
    onError: () => {
      setProcessingIntentId(null)
    },
  })

  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()

  const fetchIntents = useCallback(async () => {
    if (!publicClient) return

    try {
      setIsLoading(true)
      console.log('Fetching intent events from:', ADDRESSES.ESCROW)

      // Get IntentSignaled events
      const intentSignaledLogs = await publicClient.getLogs({
        address: ADDRESSES.ESCROW,
        event: parseAbiItem(
          'event IntentSignaled(address to, address verifier, uint256 amount, uint256 intentId)',
        ),
        fromBlock: 0n,
        toBlock: 'latest',
      })

      // Get IntentFulfilled events
      const intentFulfilledLogs = await publicClient.getLogs({
        address: ADDRESSES.ESCROW,
        event: parseAbiItem(
          'event IntentFulfilled(bytes32 intentHash, address verifier, address owner, address to, uint256 amount)',
        ),
        fromBlock: 0n,
        toBlock: 'latest',
      })

      // Get IntentCancelled events
      const intentCancelledLogs = await publicClient.getLogs({
        address: ADDRESSES.ESCROW,
        event: parseAbiItem('event IntentCancelled(uint256 intentId)'),
        fromBlock: 0n,
        toBlock: 'latest',
      })

      //   emit IntentReleased(
      //     _intentId,
      //     intent.depositId,
      //     intent.owner,
      //     intent.to,
      //     intent.amount
      // );
      const intentReleasedLogs = await publicClient.getLogs({
        address: ADDRESSES.ESCROW,
        event: parseAbiItem(
          'event IntentReleased(uint256 intentId, uint256 depositId, address owner, address to, uint256 amount)',
        ),
        fromBlock: 0n,
        toBlock: 'latest',
      })
      console.log('intentFulfilledLogs', intentFulfilledLogs)
      console.log('intentCancelledLogs', intentCancelledLogs)
      console.log('intentReleasedLogs', intentReleasedLogs)
      console.log('intentSignaledLogs', intentSignaledLogs)

      // Create a map to track intent status
      const fulfilledIntentIds = new Set<string>()
      const cancelledIntentIds = new Set<string>()
      const releasedIntentIds = new Set<string>()

      // Mark fulfilled intents
      intentFulfilledLogs.forEach((log) => {
        // Try to find the corresponding intent ID from signaled events
        const matchingSignaled = intentSignaledLogs.find(
          (signaled) =>
            signaled.args.to === log.args.to &&
            signaled.args.amount === log.args.amount,
        )
        if (matchingSignaled) {
          fulfilledIntentIds.add(matchingSignaled.args.intentId!.toString())
        }
      })

      // Mark released intents
      intentReleasedLogs.forEach((log) => {
        try {
          // Decode the event log data manually since parameters are not indexed
          const decodedLog = decodeEventLog({
            abi: ESCROW_ABI,
            data: log.data,
            topics: log.topics,
            eventName: 'IntentReleased',
          })

          if (decodedLog.args && decodedLog.args.intentId) {
            releasedIntentIds.add(decodedLog.args.intentId.toString())
          }
        } catch (error) {
          console.error('Failed to decode IntentReleased log:', error)
        }
      })

      // Mark cancelled intents
      intentCancelledLogs.forEach((log) => {
        cancelledIntentIds.add(log.args.intentId!.toString())
      })
      console.log('fulfilledIntentIds', fulfilledIntentIds)
      console.log('cancelledIntentIds', cancelledIntentIds)
      console.log('releasedIntentIds', releasedIntentIds)

      // Create intent objects from signaled events
      const allIntents: Intent[] = await Promise.all(
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

          // Try to get the transaction to find the 'from' address
          const tx = await publicClient.getTransaction({
            hash: log.transactionHash,
          })

          return {
            id: intentId,
            owner: tx.from,
            to: log.args.to!,
            amount: log.args.amount!,
            timestamp: Number(block.timestamp),
            status,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
          }
        }),
      )

      // Apply filter
      const filteredIntents = allIntents.filter((intent) => {
        if (filter === 'all') return true
        return (
          intent.owner.toLowerCase() === address?.toLowerCase() ||
          intent.to.toLowerCase() === address?.toLowerCase()
        )
      })

      // Sort by timestamp (newest first)
      filteredIntents.sort((a, b) => b.timestamp - a.timestamp)
      setIntents(filteredIntents)
    } catch (error) {
      console.error('Failed to fetch intents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [publicClient, address, filter])

  useEffect(() => {
    if (isConnected && publicClient) {
      fetchIntents()
    }
  }, [isConnected, publicClient, fetchIntents])

  const handleReleaseFunds = async (intentId: string) => {
    setProcessingIntentId(intentId)
    try {
      await releaseFunds(intentId)
    } catch (error) {
      console.error('Failed to release funds:', error)
    }
  }

  const getStatusColor = (status: IntentStatus) => {
    switch (status) {
      case 'active':
        return 'text-yellow-500'
      case 'fulfilled':
        return 'text-green-500'
      case 'cancelled':
        return 'text-red-500'
      case 'released':
        return 'text-blue-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: IntentStatus) => {
    switch (status) {
      case 'active':
        return '⏳'
      case 'fulfilled':
        return '✅'
      case 'released':
        return '✅'
      case 'cancelled':
        return '❌'
      default:
        return '❓'
    }
  }

  if (!isConnected) {
    return (
      <div className="bg-card/50 rounded-[24px] p-8 backdrop-blur-xl border border-border/50 text-center">
        <p className="text-muted-foreground">
          Please connect your wallet to view intent history
        </p>
      </div>
    )
  }

  return (
    <section className="space-y-4">
      <div className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 p-1 bg-secondary/30 rounded-full">
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              filter === 'all'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            All Intents
          </button>
          <button
            onClick={() => setFilter('my')}
            className={cn(
              'flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              filter === 'my'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            My Intents
          </button>
        </div>

        {isAdmin && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              🔑 Admin Mode: You can release funds for active intents
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading intents...</p>
          </div>
        ) : intents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No intents found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {intents.map((intent) => (
              <div
                key={intent.id.toString()}
                className="bg-secondary/30 rounded-2xl p-4 border border-border/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className={getStatusColor(intent.status)}>
                      {getStatusIcon(intent.status)}
                    </span>
                    Intent #{intent.id.toString()}
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        intent.status === 'active' &&
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
                        intent.status === 'fulfilled' &&
                          'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
                        intent.status === 'released' &&
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
                        intent.status === 'cancelled' &&
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
                      )}>
                      {intent.status.toUpperCase()}
                    </span>
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(intent.timestamp * 1000).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      Amount
                    </span>
                    <p className="text-sm font-mono font-medium text-primary">
                      {formatUnits(intent.amount, 6)} USDC
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">From</span>
                    <p className="text-sm font-mono">
                      {intent.owner.slice(0, 6)}...{intent.owner.slice(-4)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">To</span>
                    <p className="text-sm font-mono">
                      {intent.to.slice(0, 6)}...{intent.to.slice(-4)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      Transaction
                    </span>
                    <p className="text-sm font-mono">
                      {intent.txHash.slice(0, 10)}...
                    </p>
                  </div>
                </div>

                {/* Admin actions */}
                {isAdmin && intent.status === 'active' && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      size="sm"
                      onClick={() => handleReleaseFunds(intent.id.toString())}
                      disabled={
                        isReleasing ||
                        processingIntentId === intent.id.toString()
                      }
                      className="w-full sm:w-auto">
                      {processingIntentId === intent.id.toString()
                        ? 'Processing...'
                        : 'Release Funds'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
