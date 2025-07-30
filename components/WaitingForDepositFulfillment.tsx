'use client'

import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { Clock, BanknoteIcon } from 'lucide-react'
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
import { ESCROW_ABI } from '@/lib/abi'

interface WaitingForDepositFulfillmentProps {
  depositId: string
  depositTimestamp?: number
  amount: string
  accountNumber: string
  onComplete: () => void
  onCancel: () => void
}

export function WaitingForDepositFulfillment({
  depositId,
  depositTimestamp,
  amount,
  accountNumber,
  onComplete,
  onCancel,
}: WaitingForDepositFulfillmentProps) {
  const publicClient = usePublicClient()
  const [isChecking, setIsChecking] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Check for DepositClosed event (which indicates all funds have been processed)
  useEffect(() => {
    if (!publicClient || !depositId) return

    const checkFulfillment = async () => {
      setIsChecking(true)
      try {
        // Check if deposit is closed
        const logs = await publicClient.getLogs({
          address: ADDRESSES.ESCROW,
          event: parseAbiItem(
            'event DepositClosed(uint256 indexed depositId, address depositor)',
          ),
          args: {
            depositId: BigInt(depositId),
          },
          fromBlock: 'earliest',
          toBlock: 'latest',
        })

        if (logs.length > 0) {
          // Deposit has been closed (all funds processed)
          onComplete()
        } else {
          // Also check if deposit is empty (remainingDeposits = 0)
          const deposit = await publicClient.readContract({
            address: ADDRESSES.ESCROW,
            abi: ESCROW_ABI,
            functionName: 'deposits',
            args: [BigInt(depositId)],
          })

          if (deposit && deposit[5] === BigInt(0)) {
            // remainingDeposits = 0
            onComplete()
          }
        }
      } catch (error) {
        console.error('Error checking deposit fulfillment status:', error)
      } finally {
        setIsChecking(false)
      }
    }

    // Check immediately
    checkFulfillment()

    // Then check every 5 seconds
    const interval = setInterval(checkFulfillment, 5000)

    return () => clearInterval(interval)
  }, [publicClient, depositId, onComplete])

  // Update elapsed time every second based on deposit creation time
  useEffect(() => {
    const updateElapsedTime = () => {
      if (depositTimestamp) {
        const now = Math.floor(Date.now() / 1000)
        const elapsed = now - depositTimestamp
        setElapsedTime(elapsed > 0 ? elapsed : 0)
      }
    }

    // Update immediately
    updateElapsedTime()

    // Then update every second
    const timer = setInterval(updateElapsedTime, 1000)

    return () => clearInterval(timer)
  }, [depositTimestamp])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-background to-secondary/10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
            <BanknoteIcon className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Processing Your Deposit</CardTitle>
          <CardDescription className="text-base">
            The admin is processing KRW transfers for your deposit
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

          {/* Elapsed time */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Elapsed Time</p>
            <p className="text-2xl font-mono font-semibold">
              {formatTime(elapsedTime)}
            </p>
          </div>

          {/* Deposit details */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-sm font-medium">{amount} USDC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Bank Account
              </span>
              <span className="text-sm font-medium font-mono">
                {accountNumber}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Deposit ID</span>
              <span className="text-sm font-medium">#{depositId}</span>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
            <p className="text-sm">
              <strong>How it works:</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              The admin monitors your deposit and sends KRW to your bank account
              as users create intents. Your deposit will be marked as complete
              once all funds have been processed.
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button variant="outline" className="w-full" onClick={onCancel}>
            Cancel Waiting
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
