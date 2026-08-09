import { useState } from 'react'
import {
  useWriteContract,
  usePublicClient,
  useAccount,
  useWalletClient,
} from 'wagmi'
import { Abi, Address, TransactionReceipt } from 'viem'
import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import { captureWeb3Error, trackTransaction } from '@/lib/sentry-utils'
import * as Sentry from '@sentry/nextjs'
import { kaia, kairos } from '@/lib/network'

interface UseContractWriteOptions {
  onSuccess?: (receipt: TransactionReceipt) => void
  onError?: (error: Error) => void
}

export function useContractWrite(options?: UseContractWriteOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const { chainId } = useAccount()
  const { data: walletClient } = useWalletClient()

  const isKaiaNetwork = chainId === kaia.id || chainId === kairos.id
  const shouldUseFeeDelegation = isKaiaNetwork

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

          let hash: `0x${string}`

          if (shouldUseFeeDelegation && address && walletClient) {
            try {
              // BigInt to string
              const serializeArgs = (args: readonly unknown[] | undefined) => {
                if (!args) return args
                return args.map((arg) =>
                  typeof arg === 'bigint' ? arg.toString() : arg,
                )
              }

              // Server-side fee delegation processing
              const response = await fetch('/api/kaia/fee-delegation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  address,
                  abi,
                  functionName,
                  args: serializeArgs(args),
                  chainId,
                  userAddress: walletClient.account.address,
                }),
              })

              if (!response.ok) {
                throw new Error('Fee delegation failed')
              }

              const { txHash } = await response.json()
              hash = txHash
              console.log('✅ Fee delegated transaction successful:', hash)
            } catch (feeDelegationError) {
              console.warn(
                '⚠️ Fee delegation failed, falling back to regular transaction:',
                feeDelegationError,
              )
              // Fallback to regular transaction if fee delegation fails
              hash = await writeContractAsync({
                address,
                abi,
                functionName,
                args,
              })
            }
          } else {
            // Regular transaction
            hash = await writeContractAsync({
              address,
              abi,
              functionName,
              args,
            })
          }

          trackTransaction(hash, 'pending', { functionName, address })

          // 2. 트랜잭션 완료 대기
          const receipt = await publicClient?.waitForTransactionReceipt({
            hash,
          })

          console.log(
            `✅ Transaction confirmed in block: ${receipt?.blockNumber}`,
          )
          console.log('receipt', receipt)

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
