import { IntentDetail, DepositDetail } from '@/components/Home'
import { useContext, useEffect, useState, useCallback } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import useDepositStore from '@/stores/useDepositStore'
import { useAddresses } from '@/hooks/useAddresses'
import { ESCROW_ABI } from '@/lib/abi'
import SwapInterface from './SwapInterface'
import { ErrorContext } from '@/context/ErrorContext'
import { ArrowIcon } from '@/components/icons/ArrowIcon'
import {
  getCurrencySymbol,
  DEFAULT_DEPOSIT_ID,
  KRW_CURRENCY_CODE,
} from '@/constant'
import { WorkflowStep } from '@/components/StepIndicator'
import DepositManagement from './DepositManagement'
import IntentManagement from './IntentManagement'
import { calculateConvertedAmount } from '@/lib/tokenConversoin'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'

export enum SignalMode {
  ONRAMP = 'onramp',
  OFFRAMP = 'offramp',
}

export default function Signal({
  intentId,
  searchIntentId,
  intentDetail,
  setIntentId,
  setSearchIntentId,
  handleRefreshMyIntentId,
  setCurrentStep,
  chainId,
  isConnected,
}: {
  intentId: number | null
  searchIntentId: number | null
  intentDetail: IntentDetail | null
  setIntentId: (intentId: number) => void
  setSearchIntentId: (searchIntentId: number) => void
  handleRefreshMyIntentId: () => void
  setCurrentStep: (step: WorkflowStep) => void
  chainId: number
  isConnected: boolean
  deposits?: DepositDetail[] // Optional for backward compatibility
  isLoadingDeposits?: boolean // Optional for backward compatibility
}) {
  // Get data from Zustand store
  const { myDeposits, depositDetail } = useDepositStore()
  const addresses = useAddresses()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const currencySymbol = getCurrencySymbol(chainId || 0, token || '')
  const [mode, setMode] = useState<SignalMode>(SignalMode.ONRAMP)
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('1000')
  const [conversionRate, setConversionRate] = useState<bigint | null>(null)
  const [recipientAddress, setRecipientAddress] = useState('')
  const tCommon = useTranslations('common')

  const depositId = depositDetail?.id || myDeposits[myDeposits.length - 1]?.id

  const publicClient = usePublicClient()
  const { freeError } = useContext(ErrorContext)
  // conversionRate of deposit 1
  const fetchConversionRate = useCallback(async () => {
    if (!publicClient) return

    try {
      // Read conversion rate for depositId 1, TOSS_BANK_VERIFIER, and KRW currency
      // rate: 1380 * 1e18
      const rate = await publicClient.readContract({
        address: addresses.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'depositCurrencyConversionRate',
        args: [
          BigInt(DEFAULT_DEPOSIT_ID),
          addresses.TOSS_BANK_VERIFIER,
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
  const renderSignal = () => {
    const showSwapInterface =
      (isOnramp && !intentId) || (!isOnramp && !depositId)
    if (showSwapInterface) {
      return (
        <SwapInterface
          amount={amount}
          setAmount={setAmount}
          isOnramp={isOnramp}
          recipientAddress={recipientAddress}
          setRecipientAddress={setRecipientAddress}
          accountNumber={accountNumber}
          setAccountNumber={setAccountNumber}
          conversionRate={conversionRate}
          setIntentId={setIntentId}
          setSearchIntentId={setSearchIntentId}
          handleRefreshMyIntentId={handleRefreshMyIntentId}
        />
      )
    } else if (isOnramp) {
      if (!intentId) {
        return <> no intentId </>
      }
      return (
        <IntentManagement
          intentId={intentId}
          searchIntentId={searchIntentId}
          intentDetail={intentDetail}
          handleRefreshMyIntentId={handleRefreshMyIntentId}
          setIntentId={setIntentId}
          setSearchIntentId={setSearchIntentId}
        />
      )
    } else {
      if (!depositId) {
        return <> no depositId </>
      }
      return (
        <DepositManagement
          depositId={depositId}
          depositDetail={depositDetail}
        />
      )
    }
  }

  const disableNextStep = !intentId || !intentDetail?.amount
  const tSwap = useTranslations('swap')

  const swapText = isOnramp
    ? `${tSwap('swap')}(KRW->${currencySymbol})`
    : `${tSwap('swap')}(${currencySymbol}->KRW)`
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">{swapText}</h2>

        {/* Swap Direction Button */}
        <div className="justify-center py-2">
          <button
            onClick={() => {
              // Calculate the converted amount before switching
              const convertedAmount = calculateConvertedAmount({
                inputAmount: amount,
                isBuying: isOnramp,
                conversionRate,
              })
              // Switch mode
              setMode(isOnramp ? SignalMode.OFFRAMP : SignalMode.ONRAMP)
              // Set the converted amount as the new input
              setAmount(convertedAmount)
            }}
            className="p-3 rounded-full bg-secondary/50 hover:bg-secondary/70 transition-all duration-200 border border-border/30 hover:border-border/50">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="transform rotate-90">
              <path
                d="M7 4V16M7 16L3 12M7 16L11 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 16V4M13 4L9 8M13 4L17 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
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
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-4 py-2 rounded-full font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2">
            {tCommon('next')}
            <ArrowIcon />
          </button>
        </div>
      )}
    </>
  )
}
