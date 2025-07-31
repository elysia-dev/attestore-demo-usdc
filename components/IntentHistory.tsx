'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { cn, getTransactionExplorerUrl, truncateAddress } from '@/lib/utils'
import { Button } from './ui/button'
import { useReleaseFunds } from '@/hooks/useReleaseFunds'

type IntentStatus = 'active' | 'fulfilled' | 'cancelled' | 'released'

type Intent = {
  id: string
  owner: string
  to: string
  amount: string
  timestamp: number
  status: IntentStatus
  txHash: string
  blockNumber: string
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

enum Filter {
  ALL = 'all',
  MY = 'my',
}
export function IntentHistory() {
  const { address, isConnected } = useAccount()
  const [allRequests, setAllRequests] = useState<Intent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<Filter>(Filter.ALL)
  const [processingIntentId, setProcessingIntentId] = useState<string | null>(
    null,
  )
  const myRequests = useMemo(() => {
    if (filter === Filter.ALL) {
      return allRequests
    }
    return allRequests.filter(
      (intent) => intent.owner.toLowerCase() === address?.toLowerCase(),
    )
  }, [allRequests, address, filter])

  const { releaseFunds, isLoading: isReleasing } = useReleaseFunds({
    onSuccess: () => {
      setProcessingIntentId(null)
      fetchIntents() // Refresh after release
    },
    onError: () => {
      setProcessingIntentId(null)
    },
  })

  const adminAddress = process.env.NEXT_PUBLIC_ADMIN_ADDRESS
  const isAdmin = address?.toLowerCase() === adminAddress?.toLowerCase()

  const fetchIntents = useCallback(async () => {
    if (!address) return

    try {
      setIsLoading(true)

      const response = await fetch(`/api/transfer-history`)
      const data = await response.json()

      if (response.ok) {
        setAllRequests(data.intents || [])
      } else {
        console.error('Failed to fetch intents:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch intents:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address])

  useEffect(() => {
    if (isConnected && address) {
      fetchIntents()
    }
  }, [isConnected, address, fetchIntents])

  const handleReleaseFunds = async (intentId: string) => {
    setProcessingIntentId(intentId)
    try {
      await releaseFunds(intentId)
    } catch (error) {
      console.error('Failed to release funds:', error)
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

  const requests = filter === Filter.MY ? myRequests : allRequests
  return (
    <section className="space-y-4">
      <div className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2 p-1 bg-secondary/30 rounded-full">
          <button
            onClick={() => setFilter(Filter.ALL)}
            className={cn(
              'flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              filter === Filter.ALL
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            All Requests
          </button>
          <button
            onClick={() => setFilter(Filter.MY)}
            className={cn(
              'flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              filter === Filter.MY
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            My Requests
          </button>
        </div>

        {isAdmin && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              🔑 Admin Mode: You can release funds for active requests
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((intent) => (
              <div
                key={intent.id}
                className="bg-secondary/30 rounded-2xl p-4 border border-border/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className={getStatusColor(intent.status)}>
                      {getStatusIcon(intent.status)}
                    </span>
                    Request #{intent.id}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      Amount
                    </span>
                    <p className="text-sm font-mono font-medium text-primary">
                      {formatUnits(BigInt(intent.amount), 6)} USDC
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      Transaction
                    </span>
                    <p
                      className="text-sm font-mono"
                      onClick={() => {
                        window.open(
                          getTransactionExplorerUrl(intent.txHash),
                          '_blank',
                        )
                      }}>
                      {truncateAddress(intent.txHash)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">From</span>
                    <p className="text-sm font-mono">
                      {truncateAddress(intent.owner)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">To</span>
                    <p className="text-sm font-mono">
                      {truncateAddress(intent.to)}
                    </p>
                  </div>
                </div>

                {/* Admin actions */}
                {isAdmin && intent.status === 'active' && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      size="sm"
                      onClick={() => handleReleaseFunds(intent.id)}
                      disabled={isReleasing || processingIntentId === intent.id}
                      className="w-full sm:w-auto">
                      {processingIntentId === intent.id
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
