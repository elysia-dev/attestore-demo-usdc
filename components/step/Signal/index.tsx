import { IntentDetails, DepositDetails, DepositResult } from '@/components/Home'
import { useContext, useEffect, useState, useCallback } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useSearchParams } from 'next/navigation'
import ADDRESSES from '@/lib/addresses'
import { cn } from '@/lib/utils'
import { ESCROW_ABI } from '@/lib/abi'
import { ErrorType } from '@/lib/errors'
import OnrampFlow from './OnrampFlow'
import OfframpFlow from './OfframpFlow'
import SwapInterface from './SwapInterface'
import { ErrorContext } from '@/context/ErrorContext'
import TransferHistory from '@/components/TransferHistory'
import { ArrowIcon } from '@/components/icons/ArrowIcon'
import { DEFAULT_DEPOSIT_ID, KRW_CURRENCY_CODE } from '@/constant'
import {
  parseUnits,
  formatUnits,
  keccak256,
  toBytes,
  decodeEventLog,
} from 'viem'
import { useContractWrite } from '@/hooks/useContractWrite'
import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import { WorkflowStep } from '@/components/StepIndicator'

export enum SignalMode {
  ONRAMP = 'onramp',
  OFFRAMP = 'offramp',
}

export default function Signal({
  deposits,
  fetchAllDeposits,
  intentId,
  searchIntentId,
  intentDetails,
  setIntentId,
  setSearchIntentId,
  handleRefreshMyIntentId,
  setCurrentStep,
  chainId,
  isConnected,
  isLoadingDeposits,
}: {
  deposits: DepositDetails[]
  fetchAllDeposits: () => void
  intentId: number | null
  searchIntentId: number | null
  intentDetails: IntentDetails | null
  setIntentId: (intentId: number) => void
  setSearchIntentId: (searchIntentId: number) => void
  handleRefreshMyIntentId: () => void
  setCurrentStep: (step: WorkflowStep) => void
  chainId: number
  isConnected: boolean
  isLoadingDeposits: boolean
}) {
  console.log('deposits', deposits)
  const [mode, setMode] = useState<SignalMode>(SignalMode.ONRAMP)
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('138')
  const [conversionRate, setConversionRate] = useState<bigint | null>(null)
  const [recipientAddress, setRecipientAddress] = useState('')

  const lastDeposit = deposits[deposits.length - 1]
  console.log('lastDeposit', lastDeposit)

  // Deposit related states
  const [depositDetails, setDepositDetails] = useState<DepositDetails | null>(
    lastDeposit,
  )
  console.log('depositDetails', depositDetails)
  const [depositResult, setDepositResult] = useState<DepositResult | null>(null)
  const [showDepositWaiting, setShowDepositWaiting] = useState(false)
  const [depositTimestamp, setDepositTimestamp] = useState<number | null>(null)

  const { address } = useAccount()
  const searchParams = useSearchParams()
  const view = searchParams.get('view')

  const depositId = deposits[deposits.length - 1]?.id

  const publicClient = usePublicClient()
  const { setError, freeError } = useContext(ErrorContext)

  // Handle deposit details refresh
  const handleRefreshDepositDetails = useCallback(
    async (targetDepositId: number) => {
      if (!targetDepositId) return

      try {
        const depositData = await publicClient?.readContract({
          address: ADDRESSES.ESCROW,
          abi: ESCROW_ABI,
          functionName: 'deposits',
          args: [BigInt(targetDepositId)],
        })

        if (
          depositData &&
          depositData[0] !== '0x0000000000000000000000000000000000000000'
        ) {
          const [
            depositor,
            token,
            amount,
            intentAmountRange,
            acceptingIntents,
            remainingDeposits,
            outstandingIntentAmount,
          ] = depositData
          setDepositDetails({
            id: targetDepositId,
            depositor,
            token,
            amount,
            intentAmountRange,
            acceptingIntents,
            remainingDeposits,
            outstandingIntentAmount,
          })
        } else {
          setError('Deposit not found')
        }
      } catch (error) {
        console.error('Failed to lookup Deposit ID:', error)
        setError('Failed to lookup Deposit')
      }
    },
    [publicClient, setError],
  )
  const fetchConversionRate = useCallback(async () => {
    if (!publicClient) return

    try {
      // Read conversion rate for depositId 1, TOSS_BANK_VERIFIER, and KRW currency
      // rate: 1380 * 1e18
      const rate = await publicClient.readContract({
        address: ADDRESSES.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'depositCurrencyConversionRate',
        args: [
          BigInt(DEFAULT_DEPOSIT_ID),
          ADDRESSES.TOSS_BANK_VERIFIER,
          KRW_CURRENCY_CODE,
        ],
      })

      setConversionRate(rate)
    } catch (error) {
      console.error('Failed to fetch conversion rate:', error)
    }
  }, [publicClient])

  // Fetch conversion rate when component mounts or when connected
  useEffect(() => {
    if (isConnected) {
      fetchConversionRate()
    }
  }, [isConnected, fetchConversionRate])

  const isOnramp = mode === SignalMode.ONRAMP

  // Calculate converted amount based on conversion rate
  const calculateConvertedAmount = (
    inputAmount: string,
    isBuying: boolean,
  ): string => {
    if (!inputAmount || !conversionRate || parseFloat(inputAmount) === 0) {
      return '0.00'
    }

    try {
      const inputValue = parseFloat(inputAmount)

      if (isBuying) {
        // KRW -> USDC: multiply KRW amount by conversion rate
        // conversionRate is in 18 decimals, represents KRW per 1USDC
        // Example: 1380 * 1e18 = 1380 KRW per 1 USDC
        const rateAsNumber = Number(conversionRate) / 1e18
        const usdcAmount = inputValue / rateAsNumber

        // Format with up to 3 decimal places for USDC
        return usdcAmount.toFixed(3).replace(/\.?0+$/, '') || '0.00'
      } else {
        // USDC -> KRW: divide USDC amount by conversion rate
        const rateAsNumber = Number(conversionRate) / 1e18
        const krwAmount = inputValue * rateAsNumber

        // Round to nearest integer for KRW
        return Math.round(krwAmount).toString()
      }
    } catch (error) {
      console.error('Error calculating converted amount:', error)
      return '0.00'
    }
  }

  if (view === 'history') {
    return <TransferHistory showHistory={true} />
  }

  const renderSignal = () => {
    const showSwapInterface =
      (isOnramp && !intentId) || (!isOnramp && !depositId)
    if (showSwapInterface) {
      return (
        <SwapInterface
          fetchAllDeposits={fetchAllDeposits}
          amount={amount}
          setAmount={setAmount}
          isOnramp={isOnramp}
          setMode={setMode}
          recipientAddress={recipientAddress}
          setRecipientAddress={setRecipientAddress}
          accountNumber={accountNumber}
          setAccountNumber={setAccountNumber}
          conversionRate={conversionRate}
          calculateConvertedAmount={calculateConvertedAmount}
          setIntentId={setIntentId}
          setSearchIntentId={setSearchIntentId}
          handleRefreshMyIntentId={handleRefreshMyIntentId}
          setDepositResult={setDepositResult}
          setShowDepositWaiting={setShowDepositWaiting}
          setDepositTimestamp={setDepositTimestamp}
          handleRefreshDepositDetails={handleRefreshDepositDetails}
        />
      )
    } else if (isOnramp) {
      if (!intentId) {
        return <> no intentId </>
      }
      return (
        <OnrampFlow
          intentId={intentId}
          searchIntentId={searchIntentId}
          intentDetails={intentDetails}
          handleRefreshMyIntentId={handleRefreshMyIntentId}
          setIntentId={setIntentId}
          setSearchIntentId={setSearchIntentId}
          amount={amount}
        />
      )
    } else {
      if (!depositId) {
        return <> no depositId </>
      }
      return (
        <OfframpFlow
          depositId={depositId}
          depositDetails={depositDetails}
          depositResult={depositResult}
          showDepositWaiting={showDepositWaiting}
          depositTimestamp={depositTimestamp}
          accountNumber={accountNumber}
          amount={amount}
          setDepositDetails={setDepositDetails}
          setDepositResult={setDepositResult}
          setShowDepositWaiting={setShowDepositWaiting}
          setDepositTimestamp={setDepositTimestamp}
          setAccountNumber={setAccountNumber}
          setAmount={setAmount}
          handleRefreshDepositDetails={handleRefreshDepositDetails}
          isOnramp={isOnramp}
          setMode={setMode}
        />
      )
    }
  }

  const disableNextStep = !intentId || !intentDetails?.amount
  return (
    <>
      <section className="space-y-6">
        {/* Content based on URL parameter */}
        {renderSignal()}
      </section>

      {isOnramp && !disableNextStep && (
        <div className="mt-6">
          <button
            onClick={() => {
              setCurrentStep(WorkflowStep.TRANSFER)
              freeError()
            }}
            disabled={disableNextStep}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-8 py-3 rounded-full font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2">
            Next
            <ArrowIcon />
          </button>
        </div>
      )}
    </>
  )
}
