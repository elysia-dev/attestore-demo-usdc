/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import React, { useEffect, useState, useRef, useContext } from 'react'

import { usePublicClient } from 'wagmi'
import useDepositStore from '@/stores/useDepositStore'
import { useAddresses } from '@/hooks/useAddresses'
import { ESCROW_ABI } from '@/lib/abi'
import { ErrorType } from '@/lib/errors'
import Connect from './step/Connect'
import Signal from './step/Signal/index'
import Transfer from './step/Transfer'
import Proof from './step/Proof'
import FulFill from './step/FulFill'
import { IntentHistory } from './IntentHistory'
import { ErrorContext } from '@/context/ErrorContext'
import { StepIndicator, WorkflowStep } from './StepIndicator'
import ErrorMessage from './ErrorMessage'
import { testData } from '@/data'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { usePrivyWallet } from '@/hooks/usePrivyWallet'

export type FulfillmentResult = {
  success: boolean
  intentId?: number
  verifier?: string
  owner?: string
  to?: string
  amount?: bigint
  txHash?: string
}
export type IntentDetail = {
  owner: string
  to: string
  depositId: bigint
  amount: bigint
  timestamp: number
  paymentVerifier: string
  fiatCurrency: string
  conversionRate: bigint
}

export type DepositDetail = {
  id: number
  depositor: string
  token: string
  amount: bigint
  intentAmountRange: {
    min: bigint
    max: bigint
  }
  acceptingIntents: boolean
  remainingDeposits: bigint
  outstandingIntentAmount: bigint
  intentIds?: bigint[]
}

export type DepositResult = {
  success: boolean
  depositId?: number
  txHash?: string
}

export type ProofResult = {
  success?: boolean
  error?: string
  data?: {
    extractedParameters: {
      documentTitle: string
      receivingBankAccount: string
      recipientName: string
      senderNickname: string
      transactionAmount: string
      transactionDate: string
    }
    provider: string
    receipt: {
      request: any
      claim: {
        context: string
        epoch: number
        identifier: string
        owner: string
        parameters: string
        provider: string
        timestampS: number
      }
      signatures: {
        attestorAddresS: string
        claimSignature: any
        resultSignature: any
      }
    }
  }
}

export default function Home() {
  const { walletAddress: address } = usePrivyWallet()
  const publicClient = usePublicClient()
  const errorRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const view = searchParams.get('view')
  const t = useTranslations('home')
  const addresses = useAddresses()

  useEffect(() => {
    handleRefreshMyIntentId()
    if (address) {
      setCurrentAddress(address)
      fetchDeposits(publicClient, addresses)
    }
  }, [address, publicClient]) // eslint-disable-line react-hooks/exhaustive-deps

  const [currentStep, setCurrentStep] = useState<WorkflowStep>(
    WorkflowStep.CONNECT,
  )

  const [intentId, setIntentId] = useState<number | null>(null)
  const [searchIntentId, setSearchIntentId] = useState<number | null>(null)
  const [intentDetail, setIntentDetail] = useState<IntentDetail | null>(null)

  const defaultValue =
    process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'local'
      ? testData[0]
      : {
          issueDate: '',
          certificateNumber: '',
        }
  const [issueDate, setIssueDate] = useState(defaultValue.issueDate)
  const [certificateNumber, setCertificateNumber] = useState(
    defaultValue.certificateNumber,
  )

  const [isLoading, setIsLoading] = useState(false)
  const { error, setError, freeError } = useContext(ErrorContext)

  const [fulfillmentResult, setFulfillmentResult] =
    useState<FulfillmentResult | null>(null)

  const [proofResult, setProofResult] = useState<ProofResult | null>(null)

  const { setCurrentAddress, fetchDeposits } = useDepositStore()

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [error])

  // 지갑 연결 상태가 변경될 때 단계 업데이트
  useEffect(() => {
    if (address && currentStep === WorkflowStep.CONNECT) {
      setCurrentStep(WorkflowStep.SIGNAL)
    } else if (!address) {
      setCurrentStep(WorkflowStep.CONNECT)
      setIntentId(null)
      setProofResult(null)
      setIssueDate('')
      setCertificateNumber('')
      setFulfillmentResult(null)
      setSearchIntentId(null)
      setIntentDetail(null)
    }
  }, [address, currentStep])

  // 내 intentId 조회 함수 (address 기반)
  const handleRefreshMyIntentId = async () => {
    if (!address) return
    try {
      setIsLoading(true)
      // accountIntent 함수로 현재 사용자의 intentId 조회
      const userIntentId = await publicClient?.readContract({
        address: addresses.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'accountIntent',
        args: [address],
      })

      if (userIntentId && Number(userIntentId) > 0) {
        const newIntentId = Number(userIntentId)
        setSearchIntentId(newIntentId) // 검색 필드에도 표시
        setIntentId(newIntentId)
        handleSearchIntentDetails(newIntentId)
      } else {
        setIntentDetail(null)
      }
    } catch (error) {
      console.error('Failed to lookup Intent ID:', error)
      setError(ErrorType.INTENT_LOOKUP_FAILED)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchIntentDetails = async (targetIntentId: number) => {
    if (!targetIntentId) return

    try {
      setIsLoading(true)
      const intentData = await publicClient?.readContract({
        address: addresses.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'intents',
        args: [BigInt(targetIntentId)],
      })

      if (
        intentData &&
        intentData[0] !== '0x0000000000000000000000000000000000000000'
      ) {
        const [
          owner,
          to,
          depositId,
          amount,
          timestamp,
          paymentVerifier,
          fiatCurrency,
          conversionRate,
        ] = intentData as [
          string,
          string,
          bigint,
          bigint,
          bigint,
          string,
          string,
          bigint,
        ]
        setIntentDetail({
          owner,
          to,
          depositId,
          amount,
          timestamp: Number(timestamp),
          paymentVerifier,
          fiatCurrency,
          conversionRate,
        })
      } else {
        setIntentDetail(null)
        setError(ErrorType.INTENT_NOT_FOUND, { id: targetIntentId })
      }
    } catch (error) {
      console.error('Failed to lookup Intent ID:', error)
      setIntentDetail(null)
      setError(ErrorType.INTENT_NOT_FOUND, { id: targetIntentId })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case WorkflowStep.CONNECT:
        return <Connect />
      case WorkflowStep.SIGNAL:
        return (
          <Signal
            intentId={intentId}
            searchIntentId={searchIntentId}
            intentDetail={intentDetail}
            setIntentId={setIntentId}
            setSearchIntentId={setSearchIntentId}
            handleRefreshMyIntentId={handleRefreshMyIntentId}
            setCurrentStep={setCurrentStep}
          />
        )

      case WorkflowStep.TRANSFER:
        if (!intentId || !intentDetail) {
          return <>no intent</>
        }
        return (
          <Transfer
            intentId={intentId}
            intentDetail={intentDetail}
            setCurrentStep={setCurrentStep}
          />
        )

      case WorkflowStep.PROOF:
        return (
          <Proof
            issueDate={issueDate}
            setIssueDate={setIssueDate}
            certificateNumber={certificateNumber}
            setCertificateNumber={setCertificateNumber}
            intentId={intentId}
            intentDetail={intentDetail}
            setCurrentStep={setCurrentStep}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setProofResult={setProofResult}
            proofResult={proofResult}
          />
        )
      case WorkflowStep.FULFILL:
        return (
          <FulFill
            issueDate={issueDate}
            certificateNumber={certificateNumber}
            intentId={intentId}
            setCurrentStep={setCurrentStep}
            fulfillmentResult={fulfillmentResult}
            proofResult={proofResult}
            setFulfillmentResult={setFulfillmentResult}
          />
        )

      default:
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden pt-20 pb-20">
      {/* Animated background - exactly like Zenie USDC */}
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="absolute inset-0">
        {/* Pink blob - top left */}
        <div className="absolute top-10 -left-10 sm:top-20 sm:left-20 w-40 h-40 sm:w-56 md:w-72 sm:h-56 md:h-72 bg-pink-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob" />
        {/* Purple blob - top right */}
        <div
          className="absolute top-1/4 -right-10 sm:top-40 sm:right-20 w-32 h-32 sm:w-48 md:w-72 sm:h-48 md:h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob"
          style={{ animationDelay: '2s' }}
        />
        {/* Blue blob - bottom */}
        <div
          className="absolute bottom-20 left-1/4 sm:-bottom-20 sm:left-40 w-36 h-36 sm:w-56 md:w-72 sm:h-56 md:h-72 bg-blue-500 rounded-full mix-blend-screen filter blur-xl opacity-20 animate-blob"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Main content */}
        <div className="flex flex-col items-center justify-center px-4">
          {view === 'history' ? (
            <div className="w-full max-w-md">
              <IntentHistory />
            </div>
          ) : (
            <>
              {/* Subtitle */}
              {currentStep === WorkflowStep.CONNECT && (
                <p className="text-center text-muted-foreground mb-8">
                  Instant KRW to USDC swaps powered by zero-knowledge proofs
                </p>
              )}

              {/* Step Indicator */}
              {address && (
                <div className="sm:my-12 my-4">
                  <StepIndicator currentStep={currentStep} />
                </div>
              )}

              {/* Card */}
              <div className="bg-card/80 rounded-[32px] p-6 backdrop-blur-xl border border-border/50 shadow-2xl glow">
                {renderStepContent()}
              </div>

              {/* Footer text */}
              <div className="hidden sm:flex justify-center mt-4">
                <p className="text-center text-muted-foreground text-sm">
                  {t('securedByZK')}
                </p>
              </div>
            </>
          )}
        </div>

        <ErrorMessage error={error} freeError={freeError} ref={errorRef} />
      </div>
    </main>
  )
}
