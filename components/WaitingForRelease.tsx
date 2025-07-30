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

interface WaitingForReleaseProps {
  intentId: string
  intentTimestamp?: number
  onManualProof: () => void
  onComplete: () => void
}

export function WaitingForRelease({
  intentId,
  intentTimestamp,
  onManualProof,
  onComplete,
}: WaitingForReleaseProps) {
  const publicClient = usePublicClient()
  const [isChecking, setIsChecking] = useState(false)

  // Check for IntentReleased event
  useEffect(() => {
    if (!publicClient || !intentId) return

    const checkRelease = async () => {
      setIsChecking(true)
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
      } finally {
        setIsChecking(false)
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
          <CardTitle className="text-2xl">Processing Your Transfer</CardTitle>
          <CardDescription className="text-base">
            Please wait while the admin verifies your off-chain payment and
            releases USDC
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
            <span className="text-sm text-muted-foreground">
              {isChecking ? 'Checking status...' : ''}
            </span>
          </div>
          {/* Info box */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <p className="text-sm">
              <strong>Typical processing time:</strong> 1-5 minutes
            </p>
            <p className="text-sm text-muted-foreground">
              The admin regularly checks payments and processes them
              automatically.
            </p>
          </div>

          {/* Manual proof option */}
          <div className="border-t pt-6">
            <div className="flex items-start space-x-3">
              <FileCheck className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">Don&apos;t want to wait?</p>
                <p className="text-sm text-muted-foreground">
                  You can generate a payment proof manually to receive USDC
                  instantly.
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button variant="outline" className="w-full" onClick={onManualProof}>
            Prove Transfer Manually
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
