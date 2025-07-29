import { IntentDetails, RedeemDetails, RedeemResult } from '@/components/Home'
import { useContext, useEffect, useState, useCallback } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useSearchParams } from 'next/navigation'
import ADDRESSES from '@/lib/addresses'
import { cn } from '@/lib/utils'
import { ESCROW_ABI } from '@/lib/abi'
import { ErrorType } from '@/lib/errors'
import EnrollIntent from './EnrollIntent'
import IntentManagement from './IntentManagement'
import Redeem from './Redeem'
import RedeemRequest from './RedeemRequest'
import WalletStatus from '@/components/step/Signal/WalletStatus'
import { ErrorContext } from '@/context/ErrorContext'
import TransferHistory from '@/components/TransferHistory'
import SwapInterface from './SwapInterface'
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

enum SignalMode {
  ONRAMP = 'onramp',
  OFFRAMP = 'offramp',
}

type TabView = 'swap' | 'history'

export default function Signal({
  intentId,
  searchIntentId,
  intentDetails,
  setIntentId,
  setSearchIntentId,
  handleRefreshMyIntentId,
  setCurrentStep,
  chainId,
  isConnected,
}: {
  intentId: number | null
  searchIntentId: number | null
  intentDetails: IntentDetails | null
  setIntentId: (intentId: number) => void
  setSearchIntentId: (searchIntentId: number) => void
  handleRefreshMyIntentId: () => void
  setCurrentStep: (step: WorkflowStep) => void
  chainId: number
  isConnected: boolean
}) {
  const [mode, setMode] = useState<SignalMode>(SignalMode.ONRAMP)
  const { setError, freeError } = useContext(ErrorContext)
  const [redeemId, setRedeemId] = useState<number | null>(null)
  const [redeemDetails, setRedeemDetails] = useState<RedeemDetails | null>(null)
  const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('138')
  const [swapMode, setSwapMode] = useState<'buy' | 'sell'>('buy')
  const [conversionRate, setConversionRate] = useState<bigint | null>(null)
  const [recipientAddress, setRecipientAddress] = useState('')
  const [isSwapping, setIsSwapping] = useState(false)

  const { address } = useAccount()
  const searchParams = useSearchParams()
  const view = searchParams.get('view')

  const publicClient = usePublicClient()

  // Contract write hook for signalIntent
  const { writeAndWait: signalIntentWrite, isLoading: isSignalIntentLoading } =
    useContractWrite({
      onSuccess: (receipt) => {
        // signalIntent 성공 시 intentId 추출
        try {
          const intentSignaledEvent = receipt.logs.find((log: any) => {
            const intentSignaledTopic = keccak256(
              toBytes('IntentSignaled(address,address,uint256,uint256)'),
            )
            return (
              log.topics[0] === intentSignaledTopic &&
              log.address.toLowerCase() === ADDRESSES.ESCROW.toLowerCase()
            )
          })

          if (intentSignaledEvent) {
            const decodedLog = decodeEventLog({
              abi: ESCROW_ABI,
              data: intentSignaledEvent.data,
              topics: intentSignaledEvent.topics,
            })

            const { intentId: newIntentId } = decodedLog.args as {
              to: string
              verifier: string
              amount: bigint
              intentId: bigint
            }

            const intentIdNumber = Number(newIntentId)
            setIntentId(intentIdNumber)
            setSearchIntentId(intentIdNumber)
            handleRefreshMyIntentId()
            // Reset form after successful intent creation
            setAmount('')
            setRecipientAddress('')
          }
        } catch (error) {
          console.error('Failed to parse IntentSignaled event:', error)
        }
      },
    })

  const handleRefreshRedeemDetails = useCallback(
    async (targetRedeemId: number) => {
      if (!targetRedeemId) return

      try {
        const redeemData = await publicClient?.readContract({
          address: ADDRESSES.ESCROW,
          abi: ESCROW_ABI,
          functionName: 'deposits',
          args: [BigInt(targetRedeemId)],
        })

        if (
          redeemData &&
          redeemData[0] !== '0x0000000000000000000000000000000000000000'
        ) {
          // outputs: [
          //   { name: 'depositor', type: 'address' },
          //   { name: 'token', type: 'address' },
          //   { name: 'amount', type: 'uint256' },
          //   {
          //     name: 'intentAmountRange',
          //     type: 'tuple',
          //     components: [
          //       { name: 'min', type: 'uint256' },
          //       { name: 'max', type: 'uint256' },
          //     ],
          //   },
          //   { name: 'acceptingIntents', type: 'bool' },
          //   { name: 'remainingDeposits', type: 'uint256' },
          //   { name: 'outstandingIntentAmount', type: 'uint256' },
          // ],
          const [
            depositor,
            token,
            amount,
            intentAmountRange,
            acceptingIntents,
            remainingDeposits,
            outstandingIntentAmount,
          ] = redeemData as [
            string,
            string,
            bigint,
            {
              min: bigint
              max: bigint
            },
            boolean,
            bigint,
            bigint,
          ]
          setRedeemDetails({
            depositor,
            token,
            amount,
            intentAmountRange,
            acceptingIntents,
            remainingDeposits,
            outstandingIntentAmount,
          })
        } else {
          setRedeemDetails(null)
          setError(ErrorType.REDEEM_NOT_FOUND, { redeemId: targetRedeemId })
        }
      } catch (error) {
        console.error('Failed to lookup Redeem ID:', error)
        setRedeemDetails(null)
        setError(ErrorType.REDEEM_NOT_FOUND, { redeemId: targetRedeemId })
      }
    },
    [publicClient, setError],
  )

  const readRedeemRequest = useCallback(async () => {
    if (!address) return

    try {
      const redeemRequestId = await publicClient?.readContract({
        address: ADDRESSES.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'accountDeposits',
        args: [address, BigInt(0)],
      })

      if (redeemRequestId && Number(redeemRequestId) > 0) {
        setRedeemId(Number(redeemRequestId))
        await handleRefreshRedeemDetails(Number(redeemRequestId))
      }
    } catch (error) {
      console.error('Failed to read redeem request:', error)
    }
  }, [address, publicClient, handleRefreshRedeemDetails])

  const disableNextStep = !intentId || !intentDetails?.amount
  const isOnramp = mode === SignalMode.ONRAMP

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

  useEffect(() => {
    if (!isOnramp) {
      readRedeemRequest()
    }
  }, [address, isOnramp, readRedeemRequest])

  // Fetch conversion rate when component mounts or when connected
  useEffect(() => {
    if (isConnected) {
      fetchConversionRate()
    }
  }, [isConnected, fetchConversionRate])

  const handleSwap = async () => {
    if (swapMode === 'buy') {
      // KRW -> USDC (onramp)
      if (!recipientAddress || !amount || !address) {
        setError(ErrorType.REQUIRED_FIELDS_MISSING)
        return
      }

      // Calculate USDC amount from KRW input
      const usdcAmount = calculateConvertedAmount(amount, true)
      try {
        setIsSwapping(true)
        await signalIntentWrite({
          address: ADDRESSES.ESCROW,
          abi: ESCROW_ABI,
          functionName: 'signalIntent',
          args: [
            BigInt(DEFAULT_DEPOSIT_ID),
            parseUnits(usdcAmount, 6), // USDC has 6 decimals
            recipientAddress as `0x${string}`,
            ADDRESSES.TOSS_BANK_VERIFIER,
            KRW_CURRENCY_CODE,
          ],
        })
        // Success handling is done in the onSuccess callback
      } catch (error) {
        const errorMessage = extractErrorMessage(error)
        setError(ErrorType.INTENT_SIGNAL_FAILED, {
          error: errorMessage,
        })
      } finally {
        setIsSwapping(false)
      }
    } else {
      // USDC -> KRW (offramp/redeem)
      setMode(SignalMode.OFFRAMP)
      // The Redeem component will be shown next
    }
  }

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

  return (
    <>
      <section className="space-y-6">
        {/* Content based on URL parameter */}
        {view !== 'history' ? (
          // Swap interface
          <div className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50">
            {!intentId && !redeemId ? (
              <div className="space-y-4">
                {/* You send */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    You send
                  </label>
                  <div className="flex items-center justify-between bg-background/50 rounded-xl p-4 border border-border/30">
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => {
                        const value = e.target.value

                        if (swapMode === 'buy') {
                          // KRW input - only integers allowed
                          if (value === '' || /^\d+$/.test(value)) {
                            setAmount(value)
                          }
                        } else {
                          // USDC input - up to 3 decimal places
                          if (value === '' || /^\d*\.?\d{0,3}$/.test(value)) {
                            setAmount(value)
                          }
                        }
                      }}
                      placeholder={swapMode === 'buy' ? '0' : '0.00'}
                      className="bg-transparent text-2xl font-medium outline-none w-full"
                    />
                    <div className="flex items-center gap-2 min-w-fit">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {swapMode === 'buy' ? '₩' : '$'}
                        </span>
                      </div>
                      <span className="font-medium">
                        {swapMode === 'buy' ? 'KRW' : 'USDC'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recipient Address - only show for buy mode */}
                {swapMode === 'buy' && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground flex items-center justify-between">
                      <span>Recipient Address</span>
                      {address && (
                        <button
                          type="button"
                          onClick={() => setRecipientAddress(address)}
                          className="text-xs text-primary hover:text-primary/80 transition-colors">
                          Use my address
                        </button>
                      )}
                    </label>
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-background/50 rounded-xl p-4 border border-border/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/50"
                    />
                  </div>
                )}

                {/* Paying using */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    Paying using
                  </label>
                  <div className="bg-background/50 rounded-xl p-4 border border-border/30 opacity-60">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">TossBank</span>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">T</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Swap Direction Button */}
                <div className="flex justify-center py-2">
                  <button
                    onClick={() => {
                      // Calculate the converted amount before switching
                      const convertedAmount = calculateConvertedAmount(
                        amount,
                        swapMode === 'buy',
                      )
                      // Switch mode
                      setSwapMode(swapMode === 'buy' ? 'sell' : 'buy')
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

                {/* You receive */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    You receive
                  </label>
                  <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-medium text-muted-foreground">
                        {amount
                          ? calculateConvertedAmount(amount, swapMode === 'buy')
                          : swapMode === 'buy'
                            ? '0.00'
                            : '0'}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {swapMode === 'buy' ? '$' : '₩'}
                          </span>
                        </div>
                        <span className="font-medium">
                          {swapMode === 'buy' ? 'USDC' : 'KRW'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exchange Rate Info */}
                {conversionRate && (
                  <div className="text-center text-sm text-muted-foreground">
                    1 KRW = {(Number(conversionRate) / 1e18).toFixed(6)} USDC
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={handleSwap}
                  disabled={
                    !amount ||
                    parseFloat(amount) <= 0 ||
                    isSwapping ||
                    isSignalIntentLoading ||
                    (swapMode === 'buy' && !recipientAddress)
                  }
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-8 py-4 rounded-full font-semibold transition-all duration-200 hover:shadow-lg">
                  {isSwapping || isSignalIntentLoading
                    ? 'Processing...'
                    : swapMode === 'buy'
                      ? 'Buy USDC'
                      : 'Sell USDC'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {isOnramp ? (
                  intentId ? (
                    <IntentManagement
                      intentId={intentId}
                      searchIntentId={searchIntentId}
                      intentDetails={intentDetails}
                      handleRefreshMyIntentId={handleRefreshMyIntentId}
                      setIntentId={setIntentId}
                      setSearchIntentId={setSearchIntentId}
                    />
                  ) : (
                    <EnrollIntent
                      address={address}
                      setIntentId={setIntentId}
                      setSearchIntentId={setSearchIntentId}
                      handleRefreshMyIntentId={handleRefreshMyIntentId}
                      intentId={intentId}
                      initialAmount={amount}
                    />
                  )
                ) : redeemId ? (
                  <RedeemRequest
                    redeemId={redeemId}
                    redeemDetails={redeemDetails}
                    setRedeemId={setRedeemId}
                    setRedeemDetails={setRedeemDetails}
                    setRedeemResult={setRedeemResult}
                    setAccountNumber={setAccountNumber}
                    setAmount={setAmount}
                  />
                ) : (
                  <Redeem
                    redeemId={redeemId}
                    accountNumber={accountNumber}
                    amount={amount}
                    setRedeemId={setRedeemId}
                    handleRefreshRedeemDetails={handleRefreshRedeemDetails}
                    redeemResult={redeemResult}
                    setRedeemResult={setRedeemResult}
                    setAccountNumber={setAccountNumber}
                    setAmount={setAmount}
                  />
                )}
              </div>
            )}
          </div>
        ) : (
          // History view
          <TransferHistory showHistory={true} />
        )}
      </section>

      {isOnramp && !disableNextStep && view !== 'history' && (
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

const ArrowIcon = () => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M7.5 15L12.5 10L7.5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
