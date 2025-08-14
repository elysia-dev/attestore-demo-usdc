'use client'

import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { FileCheck, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import { formatUnits } from 'viem'
import { useTranslations } from 'next-intl'
import { getKRWAmount } from '@/lib/utils'
import { Intent, IntentStatus } from '@/types/transfer-history'
import {
  graphQLResponseSchema,
  IntentCancelled,
  IntentFulfilled,
  IntentReleased,
  IntentSignaled,
} from '@/lib/schemas'
import { validateApiResponse } from '@/lib/validation'
import { getStatusText } from './ui/intent'
import StatusIcon from './ui/StatusIcon'

interface WaitingForReleaseProps {
  intentId: string
  onManualProof: () => void
  handlePrevious: () => void
}

export function WaitingForRelease({
  intentId,
  onManualProof,
  handlePrevious,
}: WaitingForReleaseProps) {
  const router = useRouter()
  const t = useTranslations('waitingForRelease')
  const tCommon = useTranslations('common')
  const tIntentStatus = useTranslations('intentStatus')
  const [intent, setIntent] = useState<Intent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch intent data
  useEffect(() => {
    const fetchIntentData = async () => {
      if (!intentId) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/transfer-history/${intentId}`)

        if (!response.ok) {
          throw new Error(
            `HTTP error: ${response.status} ${response.statusText}`,
          )
        }

        const rawData = await response.json()
        const validationResult = validateApiResponse(
          rawData,
          graphQLResponseSchema,
        )

        if (!validationResult.success) {
          console.error(
            'API response validation failed:',
            validationResult.error,
          )
          throw new Error('Invalid API response format')
        }

        const result = validationResult.data
        if (result.data) {
          const {
            intentSignaleds,
            intentFulfilleds,
            intentReleaseds,
            intentCancelleds,
          } = result.data

          // Find the intent data
          const signaled = intentSignaleds.items.find(
            (item: IntentSignaled) => item.intentId === intentId,
          )

          const fulfilled = intentFulfilleds.items.find(
            (item: IntentFulfilled) => item.intentId === intentId,
          )

          const released = intentReleaseds.items.find(
            (item: IntentReleased) => item.intentId === intentId,
          )

          const cancelled = intentCancelleds.items.find(
            (item: IntentCancelled) => item.intentId === intentId,
          )

          // Determine current status
          let status = IntentStatus.SIGNALED
          if (cancelled) status = IntentStatus.CANCELLED
          if (fulfilled) status = IntentStatus.FULFILLED
          if (released) status = IntentStatus.RELEASED

          if (signaled) {
            setIntent({
              ...signaled,
              status,
              depositId: fulfilled?.depositId || released?.depositId,
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch intent data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchIntentData()

    const interval = setInterval(fetchIntentData, 5000)
    return () => clearInterval(interval)
  }, [intentId])

  const isCompleted =
    intent?.status &&
    [
      IntentStatus.FULFILLED,
      IntentStatus.RELEASED,
      IntentStatus.CANCELLED,
    ].includes(intent.status)

  const handleGoToHistory = () => {
    window.location.href = '/?view=history'
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-background to-secondary/10">
        <CardHeader className="text-center space-y-2">
          <CardDescription className="text-base">
            {intent?.status === IntentStatus.SIGNALED &&
              t('waitingDescription')}
            {intent?.status === IntentStatus.RELEASED && t('transferReleased')}
            {intent?.status === IntentStatus.CANCELLED &&
              t('transferCancelled')}
            {intent?.status === IntentStatus.FULFILLED &&
              t('transferFulfilled')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Intent Card */}
          {intent && (
            <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusIcon status={intent.status} />
                  <span className="font-medium">
                    {t('request')} #{intent.intentId}
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium
                  ${intent.status === IntentStatus.SIGNALED ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' : ''}
                  ${intent.status === IntentStatus.FULFILLED ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : ''}
                  ${intent.status === IntentStatus.RELEASED ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' : ''}
                  ${intent.status === IntentStatus.CANCELLED ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' : ''}
                `}>
                  {getStatusText(intent.status, tIntentStatus)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {tCommon('amount')}:
                  </span>
                  <span className="font-mono font-medium">
                    {formatUnits(BigInt(intent.amount), 6)} USDC
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">KRW:</span>
                  <span className="font-mono font-medium">
                    {getKRWAmount({
                      usdcAmount: BigInt(intent.amount),
                      conversionRate: BigInt(intent.conversionRate),
                    })}{' '}
                    KRW
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && !intent && (
            <div className="flex items-center justify-center space-x-2">
              <div className="flex space-x-1">
                <div
                  className="w-3 h-3 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-3 h-3 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-3 h-3 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}

          {/* Info box - only show when still processing */}
          {!isCompleted && (
            <>
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  <strong>{t('typicalProcessingTime')}:</strong>{' '}
                  {t('processingTimeValue')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('processingDescription')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('authorizationNote')}
                </p>
              </div>

              {/* Manual proof option */}
              <div className="border-t pt-6">
                <div className="flex items-start space-x-3">
                  <FileCheck className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium">{t('dontWantToWait')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('manualProofDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Completed message */}
          {isCompleted && (
            <div className="bg-secondary/50 rounded-lg p-4 text-left">
              <p className="text-sm font-medium mb-2">
                {t('checkHistoryForDetails')}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between gap-3">
          <button
            onClick={handlePrevious}
            className="flex-1 px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary/70 transition-all duration-200 border border-border/50 flex items-center justify-center gap-2 text-sm font-medium">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {tCommon('previous')}
          </button>

          {isCompleted ? (
            <button
              onClick={handleGoToHistory}
              className="flex-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-1">
              {t('goToHistory')}
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onManualProof}
              className="flex-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-1">
              {t('proveTransferManually')}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M7.5 15L12.5 10L7.5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
