import type { PrivyClientConfig } from '@privy-io/react-auth'
import { anvil, base, baseSepolia } from 'wagmi/chains'

const isLocal = process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'local'
const isTest = process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'test'
const supportedChains = isLocal ? [anvil] : isTest ? [baseSepolia] : [base]

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'users-without-wallets',
  },
  appearance: {
    theme: 'dark',
    walletList: ['metamask', 'rabby_wallet'],
  },
  supportedChains,
  loginMethods: ['wallet', 'google'],
}
