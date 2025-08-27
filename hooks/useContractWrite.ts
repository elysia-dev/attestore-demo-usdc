import { useState } from 'react'
import { Abi, Address, encodeFunctionData, TransactionReceipt } from 'viem'
import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import { captureWeb3Error, trackTransaction } from '@/lib/sentry-utils'
import * as Sentry from '@sentry/nextjs'
import { useSendTransaction } from '@privy-io/react-auth'
import { usePublicClient } from 'wagmi'
import { usePrivyWallet } from './usePrivyWallet'
interface UseContractWriteOptions {
  onSuccess?: (receipt: TransactionReceipt) => void
  onError?: (error: Error) => void
}

export function useContractWrite(options?: UseContractWriteOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const publicClient = usePublicClient()
  const { sendTransaction: privySendTransaction } = useSendTransaction()

  const { smartWalletClient, walletAddress } = usePrivyWallet()

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

          const hash = await (async function () {
            if (smartWalletClient) {
              const hash = await smartWalletClient.sendTransaction({
                to: address,
                data: encodeFunctionData({
                  abi,
                  functionName,
                  args,
                }),
              })
              return hash
            } else {
              const { hash } = await privySendTransaction(
                {
                  to: address,
                  data: encodeFunctionData({
                    abi,
                    functionName,
                    args,
                  }),
                },
                {
                  address: walletAddress || undefined,
                },
              )
              return hash
            }
          })()

          trackTransaction(hash, 'pending', { functionName, address })

          if (!publicClient) {
            console.warn('Public client not available, cannot wait for receipt')
            return { hash }
          }

          // 2. 트랜잭션 완료 대기
          const receipt = await publicClient.waitForTransactionReceipt({
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
