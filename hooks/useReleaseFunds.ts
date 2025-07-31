import { useState } from 'react'
import { useContractWrite } from './useContractWrite'
import { ESCROW_ABI } from '@/lib/abi'
import ADDRESSES from '@/lib/addresses'
import { usePublicClient } from 'wagmi'

interface UseReleaseFundsOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function useReleaseFunds(options?: UseReleaseFundsOptions) {
  const [intentId, setIntentId] = useState<string>('')
  const publicClient = usePublicClient()

  const { writeAndWait, isLoading, error, clearError } = useContractWrite({
    onSuccess: (receipt) => {
      options?.onSuccess?.()
    },
    onError: (error) => {
      console.error('❌ Failed to release funds:', error)
      options?.onError?.(error)
    },
  })

  // Check if intent exists before attempting to release funds
  const checkIntentExists = async (intentIdToCheck: string) => {
    if (!publicClient) {
      throw new Error('Public client not available')
    }

    try {
      const intentData = await publicClient.readContract({
        address: ADDRESSES.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'intents',
        args: [BigInt(intentIdToCheck)],
      })

      // Check if intent exists (owner should not be zero address)
      const [owner] = intentData as [
        string,
        string,
        bigint,
        bigint,
        bigint,
        string,
        string,
        bigint,
      ]
      return owner !== '0x0000000000000000000000000000000000000000'
    } catch (error) {
      console.error('Failed to check intent existence:', error)
      return false
    }
  }

  const releaseFunds = async (intentIdToRelease?: string) => {
    const id = intentIdToRelease || intentId
    if (!id) {
      throw new Error('Intent ID is required')
    }

    try {
      // Check if intent exists first
      const intentExists = await checkIntentExists(id)
      if (!intentExists) {
        throw new Error(`Intent ID ${id} does not exist`)
      }

      // Note: ESCROW contract is NOT an ERC20 token
      // It's a smart contract that manages intents and deposits
      const result = await writeAndWait({
        address: ADDRESSES.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'releaseFundsToPayer',
        args: [BigInt(id)],
      })

      return result
    } catch (error) {
      console.error('Failed to release funds:', error)

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Intent does not exist')) {
          throw new Error(`Intent ID ${id} does not exist`)
        } else if (error.message.includes('Caller must be the depositor')) {
          throw new Error(
            'Only the depositor can release funds for this intent',
          )
        } else if (error.message.includes('execution reverted')) {
          throw new Error(
            'Transaction failed: Intent may not exist or you may not have permission',
          )
        }
      }

      throw error
    }
  }

  return {
    releaseFunds,
    setIntentId,
    intentId,
    isLoading,
    error,
    clearError,
    checkIntentExists,
  }
}
