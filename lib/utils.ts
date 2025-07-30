import { NetworkName, networkName } from '@/constant'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatUnits } from 'viem'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address: string) {
  return address.slice(0, 6) + '...' + address.slice(-4)
}

export function getExplorerUrl(address: string) {
  if (networkName === NetworkName.LOCAL) {
    return `https://holesky.etherscan.io/address/${address}`
  } else if (networkName === NetworkName.TEST) {
    return `https://holesky.etherscan.io/address/${address}`
  } else {
    return `https://basescan.org/address/${address}`
  }
}

// usdcAmount: 100000n
// conversionRate: 1380000000000000000000n
export function getKRWAmount(usdcAmount: bigint, conversionRate: bigint) {
  const amount = formatUnits(usdcAmount, 6)
  const rate = formatUnits(conversionRate, 18)
  return Math.ceil(Number(amount) * Number(rate))
}
