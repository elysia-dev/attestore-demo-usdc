import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatUnits } from 'viem'
import { kaia, kairos } from '@/lib/network'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string) {
  return address.slice(0, 6) + '...' + address.slice(-4)
}

export function isKaiaNetwork({ chainId }: { chainId?: number }) {
  return chainId === kaia.id || chainId === kairos.id
}

export enum NetworkName {
  LOCAL = 'local',
  TEST = 'test',
  PRODUCTION = 'production',
}

export function getExplorerUrl(address: string, chainId?: number) {
  const chainNetwork = process.env.NEXT_PUBLIC_CHAIN_NETWORK
  if (chainNetwork === NetworkName.LOCAL) {
    return `https://holesky.etherscan.io/address/${address}`
  } else if (chainNetwork === NetworkName.TEST) {
    if (isKaiaNetwork({ chainId })) {
      return `https://kairos.kaiascan.io/address/${address}`
    } else {
      return `https://sepolia.basescan.org/address/${address}`
    }
  } else {
    if (isKaiaNetwork({ chainId })) {
      return `https://www.kaiascan.io/address/${address}`
    } else {
      return `https://basescan.org/address/${address}`
    }
  }
}

export function getTransactionExplorerUrl(txHash: string, chainId?: number) {
  const chainNetwork = process.env.NEXT_PUBLIC_CHAIN_NETWORK
  if (chainNetwork === NetworkName.LOCAL) {
    return `https://holesky.etherscan.io/tx/${txHash}`
  } else if (chainNetwork === NetworkName.TEST) {
    if (isKaiaNetwork({ chainId })) {
      return `https://kairos.kaiascan.io/tx/${txHash}`
    } else {
      return `https://sepolia.basescan.org/tx/${txHash}`
    }
  } else {
    if (isKaiaNetwork({ chainId })) {
      return `https://www.kaiascan.io/tx/${txHash}`
    } else {
      return `https://basescan.org/tx/${txHash}`
    }
  }
}

// usdcAmount: 100000n (6 decimals)
// conversionRate: 1380000000000000000000n (18 decimals)
export function getKRWAmount({
  usdcAmount,
  conversionRate,
}: {
  usdcAmount: bigint
  conversionRate: bigint
}) {
  const amount = formatUnits(usdcAmount, 6)
  const rate = formatUnits(conversionRate, 18)

  // We need to ceil up to the nearest integer for KRW amount
  return Math.ceil(Number(amount) * Number(rate))
}

export const getNetworkNameByChainId = (chainId: number, short = false) => {
  switch (chainId) {
    case 1:
      return 'Ethereum'
    case 8453:
      return 'Base'
    case 17000:
      return 'Holesky'
    case 11155111:
      return 'Sepolia'
    case 84532:
      return 'Base Sepolia'
    case 31337:
      return 'Anvil'
    case 1001:
      return 'Kairos Testnet'
    case 8217:
      return 'Kaia'
    default:
      return `Chain ID: ${chainId}`
  }
}

export const getNetworkNameByEnv = (chainId?: number) => {
  const chainNetwork = process.env.NEXT_PUBLIC_CHAIN_NETWORK
  if (chainNetwork === NetworkName.LOCAL) {
    return 'anvil'
  } else if (chainNetwork === NetworkName.TEST) {
    if (isKaiaNetwork({ chainId })) {
      return 'kairos'
    } else {
      return 'basesep'
    }
  } else {
    if (isKaiaNetwork({ chainId })) {
      return 'kaia'
    } else {
      return 'base'
    }
  }
}

// anvil-1
export const getTransferMemo = (intentId: number, chainId?: number) => {
  const networkName = getNetworkNameByEnv(chainId)
  return `${networkName}-${intentId}`
}
