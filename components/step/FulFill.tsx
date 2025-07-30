/* eslint-disable @typescript-eslint/no-explicit-any */
import { FulfillmentResult, ProofResult } from '../Home'
import FulfillmentResultComponent from '../FulfillmentResult'
import { decodeEventLog, encodeAbiParameters, keccak256, toBytes } from 'viem'
import { useContractWrite } from '@/hooks/useContractWrite'
import ADDRESSES from '@/lib/addresses'
import { ESCROW_ABI } from '@/lib/abi'
import { ErrorType } from '@/lib/errors'
import { useContext } from 'react'
import { ErrorContext } from '@/context/ErrorContext'
import { extractErrorMessage } from '../utils/extractErrorMessage'
import { trackUserAction } from '@/lib/sentry-utils'
import * as Sentry from '@sentry/nextjs'
import { cn } from '@/lib/utils'
import { WorkflowStep } from '../StepIndicator'

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
  const { setError } = useContext(ErrorContext)
  const {
    writeAndWait: fulfillIntentWrite,
    isLoading: isFulfillIntentLoading,
  } = useContractWrite({
    onSuccess: (receipt) => {
      // fulfillIntent 성공 시 처리
      try {
        const intentFulfilledEvent = receipt.logs.find((log: any) => {
          const intentFulfilledTopic = keccak256(
            toBytes('IntentFulfilled(bytes32,address,address,address,uint256)'),
          )
          return (
            log.topics[0] === intentFulfilledTopic &&
            log.address.toLowerCase() === ADDRESSES.ESCROW.toLowerCase()
          )
        })

        if (intentFulfilledEvent) {
          const decodedLog = decodeEventLog({
            abi: ESCROW_ABI,
            data: intentFulfilledEvent.data,
            topics: intentFulfilledEvent.topics,
          })

          const { intentHash, verifier, owner, to, amount } =
            decodedLog.args as {
              intentHash: string
              verifier: string
              owner: string
              to: string
              amount: bigint
            }

          // 성공 추적
          trackUserAction('Token minting successful', {
            intentHash,
            amount: amount.toString(),
            receiver: to,
            txHash: receipt.transactionHash,
          })

          setFulfillmentResult({
            success: true,
            intentHash,
            verifier,
            owner,
            to,
            amount,
            txHash: receipt.transactionHash,
          })
        }
      } catch (error) {
        console.error('Failed to parse IntentFulfilled event:', error)
      }
    },
  })

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

  // fulfillIntent 호출
  const handleFulfillIntent = async () => {
    if (!intentId || !proofResult) {
      console.error('Missing intentId or proofResult')
      setError(ErrorType.MISSING_INTENT_OR_PROOF)
      return
    }

    try {
      setFulfillmentResult(null) // 이전 결과 초기화

      // result 데이터를 컨트랙트가 요구하는 형태로 변환
      const formattedProof = formatProofForContract(proofResult)

      // proof 객체를 바이트로 인코딩
      const encodedProof = encodeProofToBytes(formattedProof)
      // 사용자 액션 추적
      trackUserAction('Transfer USDC clicked', {
        intentId,
        encodedProof,
      })
      console.log('encodedProof', encodedProof)
      console.log('intentId', intentId)

      await fulfillIntentWrite({
        address: ADDRESSES.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'fulfillIntent',
        args: [
          encodedProof, // _paymentProof as bytes
          BigInt(intentId), // intentId
        ],
      })
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      console.error('Failed to fulfillIntent:', error)

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

      setError(`USDC transfer failed: ${errorMessage}`)
      setFulfillmentResult({ success: false })
    }
  }
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Transfer USDC</h2>
      </div>
      {fulfillmentResult?.success && (
        <FulfillmentResultComponent fulfillmentResult={fulfillmentResult} />
      )}
      {!fulfillmentResult?.success && (
        <section className="space-y-6">
          <section className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-primary">◆</span>
                Click &apos;Transfer USDC&apos;
              </h3>
              <p className="text-sm text-muted-foreground ml-6">
                Proof generated successfully.
                <br />
                Transfer USDC to the recipient wallet.
              </p>
            </div>
          </section>

          <section className="bg-secondary/30 rounded-2xl p-4 space-y-3 border border-border/50">
            <div className="space-y-2">
              <label className="text-sm font-medium">Intent ID</label>
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
                Issue Date
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
                Certificate Issue Number
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
              Previous
            </button>

            <button
              onClick={handleFulfillIntent}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-4 py-2 rounded-full font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2 text-sm"
              disabled={
                isFulfillIntentLoading ||
                !intentId ||
                fulfillmentResult?.success
              }>
              {isFulfillIntentLoading
                ? 'Transferring USDC...'
                : fulfillmentResult?.success
                  ? 'Transfer Complete'
                  : 'Transfer USDC'}
              {!isFulfillIntentLoading && !fulfillmentResult?.success && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M7.5 15L12.5 10L7.5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </section>
      )}
    </>
  )
}
