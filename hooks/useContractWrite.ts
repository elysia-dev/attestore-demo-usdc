import { useState } from 'react'
import { useWriteContract, usePublicClient } from 'wagmi'
import { Abi, Address, TransactionReceipt } from 'viem'
import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import { captureWeb3Error, trackTransaction } from '@/lib/sentry-utils'
import * as Sentry from '@sentry/nextjs'

interface UseContractWriteOptions {
  onSuccess?: (receipt: TransactionReceipt) => void
  onError?: (error: Error) => void
}

export function useContractWrite(options?: UseContractWriteOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

  const writeAndWait = async ({
    address,
    abi,
    functionName,
    args,
  }: {
    address: Address
    abi: Abi
    functionName: string
    args?: readonly unknown[]
  }) => {
    // Sentry 스팬 시작
    const result = await Sentry.startSpan(
      {
        name: `contract.${functionName}`,
        op: 'blockchain.transaction',
        attributes: {
          address,
          functionName,
        },
      },
      async () => {
        try {
          setIsLoading(true)
          setError(null)

          console.log(`🚀 Calling ${functionName}...`)

          // 1. 트랜잭션 전송
          console.log('Contract write params:', {
            address,
            functionName,
            hasArgs: !!args,
            argsLength: args?.length,
          })

          const hash = await writeContractAsync({
            address,
            abi,
            functionName,
            args,
          })

          console.log(`📝 Transaction submitted: ${hash}`)
          trackTransaction(hash, 'pending', { functionName, address })

          // 2. 트랜잭션 완료 대기
          const receipt = await publicClient?.waitForTransactionReceipt({
            hash,
          })

          console.log(
            `✅ Transaction confirmed in block: ${receipt?.blockNumber}`,
          )

          if (receipt?.status === 'success') {
            trackTransaction(hash, 'success', {
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
            })
            options?.onSuccess?.(receipt)
            return { hash, receipt }
          } else {
            trackTransaction(hash, 'failed')
            throw new Error('Transaction failed')
          }
        } catch (err) {
          const errorMessage = extractErrorMessage(err)
          console.error(`❌ Transaction failed:`, err)
          setError(errorMessage)

          // Sentry에 Web3 에러 전송
          captureWeb3Error(err, {
            functionName,
            address,
            args,
          })

          options?.onError?.(
            err instanceof Error ? err : new Error(errorMessage),
          )
          throw err
        } finally {
          setIsLoading(false)
        }
      },
    )

    return result
  }

  return {
    writeAndWait,
    isLoading,
    error,
    clearError: () => setError(null),
  }
}
