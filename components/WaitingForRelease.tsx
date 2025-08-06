'use client'

import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { Clock, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { parseAbiItem } from 'viem'
import ADDRESSES from '@/lib/addresses'
import { useTranslations } from 'next-intl'

interface WaitingForReleaseProps {
  intentId: string
  onManualProof: () => void
  onComplete: () => void
  handlePrevious: () => void
}

export function WaitingForRelease({
  intentId,
  onManualProof,
  onComplete,
  handlePrevious,
}: WaitingForReleaseProps) {
  const publicClient = usePublicClient()
  const t = useTranslations('waitingForRelease')
  const tCommon = useTranslations('common')

  // Check for IntentReleased event
  useEffect(() => {
    if (!publicClient || !intentId) return

    const checkRelease = async () => {
      try {
        const logs = await publicClient.getLogs({
          address: ADDRESSES.ESCROW,
          event: parseAbiItem(
            'event IntentReleased(uint256 indexed intentId, uint256 indexed depositId, address owner, address to, uint256 amount)',
          ),
          args: {
            intentId: BigInt(intentId),
          },
          fromBlock: 'earliest',
          toBlock: 'latest',
        })

        if (logs.length > 0) {
          // Intent has been released by admin
          onComplete()
        }
      } catch (error) {
        console.error('Error checking release status:', error)
      }
    }

    // Check immediately
    checkRelease()

    // Then check every 5 seconds
    const interval = setInterval(checkRelease, 5000)

    return () => clearInterval(interval)
  }, [publicClient, intentId, onComplete])

  return (
    <div className="container mx-auto max-w-2xl">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-background to-secondary/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2 animate-pulse">
            <Clock className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('processingTransfer')}</CardTitle>
          <CardDescription className="text-base">
            {t('waitingDescription')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status indicator */}
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
          {/* Info box */}
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
        </CardContent>

        <CardFooter>
          <button
            onClick={handlePrevious}
            className="flex-1 px-2 py-2 rounded-full bg-secondary/50 hover:bg-secondary/70 transition-all duration-200 border border-border/50 flex items-center justify-center gap-2 text-sm font-medium">
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

          <button
            onClick={onManualProof}
            className="flex-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-3 py-2 rounded-full font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-1">
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
        </CardFooter>
      </Card>
    </div>
  )
}
