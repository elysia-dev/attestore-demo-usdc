/* eslint-disable @typescript-eslint/no-explicit-any */
import { FulfillmentResult, ProofResult } from '../Home'
import FulfillmentResultComponent from '../FulfillmentResult'
import { decodeEventLog, encodeAbiParameters, keccak256, toBytes } from 'viem'
import { useContractWrite } from '@/hooks/useContractWrite'
import { useAccount, usePublicClient } from 'wagmi'
import { useAddresses } from '@/hooks/useAddresses'
import { ESCROW_ABI } from '@/lib/abi'
import { ErrorType } from '@/lib/errors'
import { useContext, useState, useEffect, useRef } from 'react'
import { ErrorContext } from '@/context/ErrorContext'
import { extractErrorMessage } from '../utils/extractErrorMessage'
import { trackUserAction } from '@/lib/sentry-utils'
import * as Sentry from '@sentry/nextjs'
import { cn, getTransactionExplorerUrl } from '@/lib/utils'
import { WorkflowStep } from '../StepIndicator'
import { useTranslations } from 'next-intl'
import { getCurrencySymbol } from '@/constant'
import { useSearchParams } from 'next/navigation'

const formatProofForContract = (receiptData: any) => {
  if (!receiptData) {
    throw new Error('Invalid receipt data')
  }

  const receipt = receiptData.data.receipt
  const claim = receipt.claim
  const signatures = receipt.signatures

  let claimSignatureHex = signatures.claimSignature
  if (
    signatures.claimSignature &&
    typeof signatures.claimSignature === 'object'
  ) {
    claimSignatureHex =
      '0x' + Buffer.from(signatures.claimSignature).toString('hex')
  }

  const proofObject = {
    claimInfo: {
      provider: claim.provider,
      parameters: claim.parameters,
      context: claim.context,
    },
    signedClaim: {
      claim: {
        identifier: claim.identifier,
        owner: claim.owner,
        timestampS: claim.timestampS,
        epoch: claim.epoch,
      },
      signatures: [claimSignatureHex],
    },
    isAppclipProof: false,
  }

  return proofObject
}

// proof 객체를 바이트로 인코딩하는 함수 (ABI 인코딩 사용)
const encodeProofToBytes = (proofObject: any) => {
  try {
    // ReclaimProof 구조체에 맞게 ABI 인코딩
    const encodedProof = encodeAbiParameters(
      [
        {
          type: 'tuple',
          components: [
            {
              type: 'tuple',
              name: 'claimInfo',
              components: [
                { type: 'string', name: 'provider' },
                { type: 'string', name: 'parameters' },
                { type: 'string', name: 'context' },
              ],
            },
            {
              type: 'tuple',
              name: 'signedClaim',
              components: [
                {
                  type: 'tuple',
                  name: 'claim',
                  components: [
                    { type: 'bytes32', name: 'identifier' },
                    { type: 'address', name: 'owner' },
                    { type: 'uint32', name: 'timestampS' },
                    { type: 'uint32', name: 'epoch' },
                  ],
                },
                { type: 'bytes[]', name: 'signatures' },
              ],
            },
            { type: 'bool', name: 'isAppclipProof' },
          ],
        },
      ],
      [
        {
          claimInfo: {
            provider: proofObject.claimInfo.provider,
            parameters: proofObject.claimInfo.parameters,
            context: proofObject.claimInfo.context,
          },
          signedClaim: {
            claim: {
              identifier: proofObject.signedClaim.claim
                .identifier as `0x${string}`,
              owner: proofObject.signedClaim.claim.owner as `0x${string}`,
              timestampS: proofObject.signedClaim.claim.timestampS,
              epoch: proofObject.signedClaim.claim.epoch,
            },
            signatures: proofObject.signedClaim.signatures,
          },
          isAppclipProof: false,
        },
      ],
    )

    return encodedProof
  } catch (error) {
    console.error('ABI encoding error:', error)
    throw new Error('Failed to ABI encode proof: ' + error)
  }
}

const INTENT_FULFILLED_TOPIC = keccak256(
  toBytes('IntentFulfilled(uint256,uint256,address,address,address,uint256)'),
)

export default function FulFill({
  issueDate,
  certificateNumber,
  intentId,
  setCurrentStep,
  fulfillmentResult,
  proofResult,
  setFulfillmentResult,
}: {
  issueDate: string
  certificateNumber: string
  intentId: number | null
  setCurrentStep: (step: WorkflowStep) => void
  fulfillmentResult: FulfillmentResult | null
  proofResult: ProofResult | null
  setFulfillmentResult: (result: FulfillmentResult | null) => void
}) {
  const t = useTranslations('fulfill')
  const tCommon = useTranslations('common')
  const { setError } = useContext(ErrorContext)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [transactionStatus, setTransactionStatus] = useState<
    'idle' | 'pending' | 'confirming' | 'success' | 'error'
  >('idle')
  const [elapsedTime, setElapsedTime] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const publicClient = usePublicClient()
  const { chainId } = useAccount()
  const addresses = useAddresses()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const currencySymbol = getCurrencySymbol(chainId || 0, token || '')

  // Manual check transaction status
  const checkTransactionStatus = async () => {
    if (!transactionHash || !publicClient) return

    try {
      const receipt = await publicClient.getTransactionReceipt({
        hash: transactionHash as `0x${string}`,
      })

      if (receipt) {
        if (receipt.status === 'success') {
          // Process the receipt to get fulfillment details
          const intentFulfilledEvent = receipt.logs.find((log: any) => {
            return (
              log.topics[0] === INTENT_FULFILLED_TOPIC &&
              log.address.toLowerCase() === addresses.ESCROW.toLowerCase()
            )
          })

          if (intentFulfilledEvent) {
            const decodedLog = decodeEventLog({
              abi: ESCROW_ABI,
              data: intentFulfilledEvent.data,
              topics: intentFulfilledEvent.topics,
            })

            const { intentId, depositId, verifier, owner, to, amount } =
              decodedLog.args as {
                intentId: bigint
                depositId: bigint
                verifier: string
                owner: string
                to: string
                amount: bigint
              }

            setFulfillmentResult({
              success: true,
              intentId: Number(intentId),
              verifier,
              owner,
              to,
              amount,
              txHash: receipt.transactionHash,
            })
            setTransactionStatus('success')
          }
        } else {
          setTransactionStatus('error')
          setError('Transaction failed')
        }
      }
    } catch (error) {
      console.error('Error checking transaction status:', error)
    }
  }

  // Track elapsed time when transaction is confirming
  useEffect(() => {
    if (transactionStatus === 'confirming') {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (transactionStatus === 'idle' || transactionStatus === 'error') {
        setElapsedTime(0)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [transactionStatus])

  const {
    writeAndWait: fulfillIntentWrite,
    isLoading: isFulfillIntentLoading,
  } = useContractWrite({
    onSuccess: (receipt) => {
      try {
        const intentFulfilledEvent = receipt.logs.find((log: any) => {
          return (
            log.topics[0] === INTENT_FULFILLED_TOPIC &&
            log.address.toLowerCase() === addresses.ESCROW.toLowerCase()
          )
        })

        if (intentFulfilledEvent) {
          const decodedLog = decodeEventLog({
            abi: ESCROW_ABI,
            data: intentFulfilledEvent.data,
            topics: intentFulfilledEvent.topics,
          })

          // The event signature looks different - it has intentId, depositId, verifier as indexed
          const { intentId, depositId, verifier, owner, to, amount } =
            decodedLog.args as {
              intentId: bigint
              depositId: bigint
              verifier: string
              owner: string
              to: string
              amount: bigint
            }

          // 성공 추적
          trackUserAction('Token minting successful', {
            intentId: Number(intentId),
            depositId: Number(depositId),
            amount: amount.toString(),
            receiver: to,
            txHash: receipt.transactionHash,
          })

          setFulfillmentResult({
            success: true,
            intentId: Number(intentId),
            verifier,
            owner,
            to,
            amount,
            txHash: receipt.transactionHash,
          })
          setTransactionStatus('success')
        } else {
          setTransactionStatus('success')
          setFulfillmentResult({
            success: true,
            intentId: intentId ?? undefined,
            verifier: 'Unknown',
            owner: 'Unknown',
            to: 'Unknown',
            amount: BigInt(0),
            txHash: receipt.transactionHash,
          })
        }
      } catch (error) {
        console.error('Failed to parse IntentFulfilled event:', error)
        setTransactionStatus('success') // Still mark as success since transaction went through
      }
    },
    onError: (error) => {
      setTransactionStatus('error')
      setTransactionHash(null)
    },
  })

  const handleFulfillIntent = async () => {
    if (!intentId || !proofResult) {
      console.error('Missing intentId or proofResult')
      setError(ErrorType.MISSING_INTENT_OR_PROOF)
      return
    }

    try {
      setFulfillmentResult(null) // 이전 결과 초기화
      setTransactionStatus('pending')
      setTransactionHash(null)

      // result 데이터를 컨트랙트가 요구하는 형태로 변환
      const formattedProof = formatProofForContract(proofResult)
      // proof 객체를 바이트로 인코딩
      const encodedProof = encodeProofToBytes(formattedProof)

      trackUserAction('Transfer USDC clicked', {
        intentId,
        encodedProof,
      })

      const result = await fulfillIntentWrite({
        address: addresses.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'fulfillIntent',
        args: [
          encodedProof, // _paymentProof as bytes
          BigInt(intentId), // intentId
        ],
      })

      if (result?.hash) {
        setTransactionHash(result.hash)
        setTransactionStatus('confirming')
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error)

      // 포맷팅/인코딩 에러 추적
      Sentry.captureException(error, {
        tags: {
          type: 'proof_formatting_error',
          step: '5_token_minting',
        },
        contexts: {
          proof_formatting: {
            intentId,
            proofIdentifier: proofResult?.data,
            errorMessage,
            errorPhase: 'pre_transaction',
            proofResultKeys: Object.keys(proofResult || {}),
          },
        },
      })

      setError(`${currencySymbol} transfer failed: ${errorMessage}`)
      setFulfillmentResult({ success: false })
      setTransactionStatus('error')
    }
  }

  const renderButtonText = () => {
    const buttonText =
      transactionStatus === 'pending'
        ? t('confirmInWallet')
        : transactionStatus === 'confirming'
          ? t('confirming')
          : isFulfillIntentLoading
            ? t('transferringUSDC', {
                token: currencySymbol.toUpperCase(),
              })
            : fulfillmentResult?.success
              ? t('transferComplete')
              : t('transferUSDC', {
                  token: currencySymbol.toUpperCase(),
                })

    if (
      !isFulfillIntentLoading &&
      !fulfillmentResult?.success &&
      transactionStatus === 'idle'
    ) {
      return (
        <>
          {buttonText}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M7.5 15L12.5 10L7.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      )
    }
    return buttonText
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {t('title', { token: currencySymbol.toUpperCase() })}
        </h2>
      </div>
      {fulfillmentResult?.success && (
        <FulfillmentResultComponent fulfillmentResult={fulfillmentResult} />
      )}

      {!fulfillmentResult?.success && (
        <section className="space-y-6">
          {/* Transaction Status */}
          {transactionStatus !== 'idle' && (
            <section className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50">
              <div className="space-y-4">
                {transactionStatus === 'pending' && (
                  <>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                      {t('preparingTransaction')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('confirmTransactionWallet')}
                    </p>
                  </>
                )}

                {transactionStatus === 'confirming' && transactionHash && (
                  <>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <div className="animate-pulse rounded-full h-5 w-5 bg-yellow-500" />
                      {t('transactionSubmitted')}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {t('waitingConfirmation')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor(elapsedTime / 60)}:
                        {(elapsedTime % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                    <div className="bg-secondary/30 rounded-xl p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {t('transactionHash')}
                      </p>
                      <p className="text-xs font-mono break-all">
                        {transactionHash}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <a
                          href={getTransactionExplorerUrl(
                            transactionHash,
                            chainId,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                          {t('viewOnExplorer')}
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none">
                            <path
                              d="M4.5 2.25H2.25V9.75H9.75V7.5M6 6L9.75 2.25M9.75 2.25H7.5M9.75 2.25V4.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </a>
                        {elapsedTime > 30 && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={checkTransactionStatus}
                              className="text-xs text-primary hover:text-primary/80 transition-colors">
                              {t('checkStatus')}
                            </button>
                            <span className="text-xs text-muted-foreground">
                              •
                            </span>
                            <button
                              onClick={() => window.location.reload()}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                              {t('refreshPage')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {elapsedTime > 60 && (
                      <div className="bg-yellow-500/10 rounded-xl p-3 border border-yellow-500/20">
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          {t('transactionDelayWarning')}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {transactionStatus === 'error' && (
                  <>
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-destructive">
                      <span className="text-xl">⚠️</span>
                      {t('transactionFailed')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t('checkErrorMessage')}
                    </p>
                  </>
                )}
              </div>
            </section>
          )}

          <section className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-primary">◆</span>
                {t('clickTransferTitle', {
                  token: currencySymbol.toUpperCase(),
                })}
              </h3>
              <p className="text-sm text-muted-foreground ml-6">
                {t('proofGeneratedSuccess')}
                <br />
                {t('transferUSDCDescription', {
                  token: currencySymbol.toUpperCase(),
                })}
              </p>
            </div>
          </section>

          <section className="bg-secondary/30 rounded-2xl p-4 space-y-3 border border-border/50">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('swapId')}</label>
              <input
                id="intentId"
                type="text"
                value={intentId?.toString() || ''}
                disabled={true}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="issueDate" className="text-sm font-medium">
                {t('issueDate')}
              </label>
              <input
                id="issueDate"
                type="text"
                value={issueDate}
                disabled={!!proofResult}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="certificateNumber"
                className="text-sm font-medium">
                {t('certificateIssueNumber')}
              </label>
              <input
                id="certificateNumber"
                type="text"
                value={certificateNumber}
                disabled={!!proofResult}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
              />
            </div>
          </section>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(WorkflowStep.PROOF)}
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

            <button
              onClick={handleFulfillIntent}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-4 py-2 rounded-full font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2 text-sm"
              disabled={
                isFulfillIntentLoading ||
                !intentId ||
                fulfillmentResult?.success ||
                transactionStatus === 'pending' ||
                transactionStatus === 'confirming'
              }>
              {renderButtonText()}
            </button>
          </div>
        </section>
      )}
    </>
  )
}
