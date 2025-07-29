import { NetworkName, networkName } from '@/constant'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
