/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { anvil, base, baseSepolia, kaia, kairos } from 'wagmi/chains'
import { createConfig, http } from 'wagmi'

// Dynamic import to avoid SSR issues
let wagmiConfig: any

if (typeof window !== 'undefined') {
  const isLocal = process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'local'
  const isTest = process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'test'
  const supportedChains = isLocal
    ? ([anvil] as const)
    : isTest
      ? ([baseSepolia, kairos] as const)
      : ([base, kaia] as const)

  wagmiConfig = createConfig({
    chains: supportedChains,
    transports: {
      [anvil.id]: http(),
      [base.id]: http(), // TODO: use alchemy rpc
      [baseSepolia.id]: http(),
      [kairos.id]: http(),
      [kaia.id]: http(),
    },
    ssr: true,
  })
}

export { wagmiConfig }
