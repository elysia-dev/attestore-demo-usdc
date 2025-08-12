'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import {
  cn,
  getKRWAmount,
  getTransactionExplorerUrl,
  truncateAddress,
} from '@/lib/utils'
import { Button } from './ui/button'
import { useReleaseFunds } from '@/hooks/useReleaseFunds'
import { useTranslations } from 'next-intl'
import {
  GraphQLResponse,
  IntentStatus,
  IntentWithStatus,
} from '@/types/transfer-history'

const getStatusColor = (type: IntentStatus) => {
  switch (type) {
    case IntentStatus.SIGNALED:
      return 'text-yellow-500'
    case IntentStatus.FULFILLED:
      return 'text-green-500'
    case IntentStatus.CANCELLED:
      return 'text-red-500'
    case IntentStatus.RELEASED:
      return 'text-blue-500'
    default:
      return 'text-gray-500'
  }
}

const getStatusIcon = (type: IntentStatus) => {
  switch (type) {
    case IntentStatus.SIGNALED:
      return '⏳'
    case IntentStatus.FULFILLED:
      return '✅'
    case IntentStatus.RELEASED:
      return '✅'
    case IntentStatus.CANCELLED:
      return '❌'
    default:
      return '❓'
  }
}

const getIntentTypeString = (type: IntentStatus) => {
  switch (type) {
    case IntentStatus.SIGNALED:
      return 'Signaled'
    case IntentStatus.FULFILLED:
      return 'Fulfilled'
    case IntentStatus.RELEASED:
      return 'Released'
    case IntentStatus.CANCELLED:
      return 'Cancelled'
  }
}

enum Filter {
  ALL = 'all',
  MY = 'my',
}

export function IntentHistory() {
  const t = useTranslations('intentHistory')
  const tCommon = useTranslations('common')
  const { address, isConnected } = useAccount()
  const [allIntents, setAllIntents] = useState<IntentWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<Filter>(Filter.ALL)
  const [processingIntentId, setProcessingIntentId] = useState<string | null>(
    null,
  )
  const myIntents = useMemo(() => {
    if (filter === Filter.ALL) {
      return allIntents
    }
    return allIntents.filter(
      (intent) => intent.owner.toLowerCase() === address?.toLowerCase(),
    )
  }, [allIntents, address, filter])

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
      const result: GraphQLResponse = await response.json()

      if (response.ok && result.data) {
        const {
          intentSignaleds,
          intentFulfilleds,
          intentReleaseds,
          intentCancelleds,
        } = result.data

        const allIntents: IntentWithStatus[] = []
        intentSignaleds.items.forEach((intent) => {
          allIntents.push({ ...intent, status: IntentStatus.SIGNALED })
        })
        intentFulfilleds.items.forEach((intent) => {
          allIntents.push({ ...intent, status: IntentStatus.FULFILLED })
        })
        intentReleaseds.items.forEach((intent) => {
          allIntents.push({ ...intent, status: IntentStatus.RELEASED })
        })
        intentCancelleds.items.forEach((intent) => {
          allIntents.push({ ...intent, status: IntentStatus.CANCELLED })
        })
        allIntents.sort((a, b) => b.blockNumber - a.blockNumber)
        setAllIntents(allIntents)
      } else {
        console.error('Failed to fetch intents:', result)
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
        <p className="text-muted-foreground">{t('connectWalletMessage')}</p>
      </div>
    )
  }

  const intents = filter === Filter.MY ? myIntents : allIntents
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
            {t('allRequests')}
          </button>
          <button
            onClick={() => setFilter(Filter.MY)}
            className={cn(
              'flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              filter === Filter.MY
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted-foreground hover:text-foreground',
            )}>
            {t('myRequests')}
          </button>
        </div>

        {isAdmin && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {t('adminModeMessage')}
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('loadingRequests')}</p>
          </div>
        ) : intents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('noRequestsFound')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {intents.map((intent: IntentWithStatus) => (
              <div
                key={intent.intentId}
                className="bg-secondary/30 rounded-2xl p-4 border border-border/50 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span className={getStatusColor(intent.status)}>
                      {getStatusIcon(intent.status)}
                    </span>
                    {t('requestId')}
                    {intent.intentId}
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        intent.status === IntentStatus.SIGNALED &&
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
                        intent.status === IntentStatus.FULFILLED &&
                          'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
                        intent.status === IntentStatus.RELEASED &&
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
                        intent.status === IntentStatus.CANCELLED &&
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
                      )}>
                      {getIntentTypeString(intent.status)}
                    </span>
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(intent.blockNumber * 1000).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      {tCommon('amount')}
                    </span>
                    {intent.status !== IntentStatus.CANCELLED && (
                      <p className="text-sm font-mono font-medium text-primary">
                        {formatUnits(BigInt(intent.amount), 6)} USDC
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      {t('krwAmount')}
                    </span>
                    {intent.status === IntentStatus.SIGNALED && (
                      <p className="text-sm font-mono font-medium text-primary">
                        {getKRWAmount({
                          usdcAmount: BigInt(intent.amount),
                          conversionRate: BigInt(intent.conversionRate),
                        })}
                        KRW
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      {t('from')}
                    </span>
                    <p className="text-sm font-mono">
                      {truncateAddress(intent.owner)}
                    </p>
                  </div>

                  {intent.status !== IntentStatus.CANCELLED && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">
                        {t('to')}
                      </span>
                      <p className="text-sm font-mono">
                        {truncateAddress(intent.to)}
                      </p>
                    </div>
                  )}
                  <div
                    className="space-y-1 cursor-pointer"
                    onClick={() => {
                      window.open(
                        getTransactionExplorerUrl(intent.txHash),
                        '_blank',
                      )
                    }}>
                    <span className="text-xs text-muted-foreground">
                      {t('transaction')}
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
                </div>

                {/* Admin actions */}
                {isAdmin && intent.status === IntentStatus.SIGNALED && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      size="sm"
                      onClick={() => handleReleaseFunds(intent.intentId)}
                      disabled={
                        isReleasing || processingIntentId === intent.intentId
                      }
                      className="w-full sm:w-auto">
                      {processingIntentId === intent.intentId
                        ? t('processing')
                        : t('releaseFunds')}
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
