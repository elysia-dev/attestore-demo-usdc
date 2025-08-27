'use client'
import { useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { setWalletContext, trackUserAction } from '@/lib/sentry-utils'
import * as Sentry from '@sentry/nextjs'
import { usePrivyWallet } from './usePrivyWallet'

export function useSentryTracking() {
  const { walletAddress, authenticated } = usePrivyWallet()
  const chainId = useChainId()

  // 지갑 연결 상태 추적
  useEffect(() => {
    if (authenticated && walletAddress) {
      setWalletContext(walletAddress, chainId)

      // 사용자 식별 (익명화된 주소 사용)
      Sentry.setUser({
        id: walletAddress.toLowerCase(),
        username: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      })
    } else {
      setWalletContext()
      Sentry.setUser(null)
    }
  }, [walletAddress, authenticated, chainId])

  // 체인 변경 추적
  useEffect(() => {
    if (chainId) {
      trackUserAction('Chain switched', {
        chainId: chainId,
      })
    }
  }, [chainId])
}
