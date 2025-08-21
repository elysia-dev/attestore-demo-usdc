/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { phantomWallet, rabbyWallet } from '@rainbow-me/rainbowkit/wallets'
import { rainbowWallet } from '@rainbow-me/rainbowkit/wallets'
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import { anvil, base, baseSepolia, kairos, kaia } from 'viem/chains'

// Dynamic import to avoid SSR issues
let config: any

if (typeof window !== 'undefined') {
  function getChainByEnv(chainNetwork?: string) {
    if (!chainNetwork) return [base] as const
    if (chainNetwork === 'local') return [anvil] as const
    if (chainNetwork === 'test') return [baseSepolia] as const
    if (chainNetwork === 'kairos') return [kairos] as const
    if (chainNetwork === 'kaia') return [kaia] as const
    return [base] as const
  }

  const chainNetwork = process.env.NEXT_PUBLIC_CHAIN_NETWORK
  config = getDefaultConfig({
    appName: 'Zenie',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    chains: getChainByEnv(chainNetwork),
    wallets: [
      {
        groupName: 'Recommended',
        wallets: [rabbyWallet, rainbowWallet, metaMaskWallet, phantomWallet],
      },
    ],
    ssr: true,
  })
}

export { config }
