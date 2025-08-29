import { baseSepolia, base } from 'viem/chains'
import { kairos, kaia, anvil } from '@/lib/network'
import {
  LOCALNET_ADDRESSES,
  BASE_SEPOLIA_ADDRESSES,
  BASE_ADDRESSES,
  KAIROS_ADDRESSES,
  KAIA_ADDRESSES,
} from '@/lib/addresses'

// Define address set interface
interface AddressSet {
  readonly ESCROW: `0x${string}`
  readonly USDC: `0x${string}`
  readonly NULLIFIER_REGISTRY: `0x${string}`
  readonly TOSS_BANK_VERIFIER: `0x${string}`
}

// Map chain IDs to address sets
const CHAIN_ADDRESSES: Record<number, AddressSet> = {
  [anvil.id]: LOCALNET_ADDRESSES,
  [baseSepolia.id]: BASE_SEPOLIA_ADDRESSES,
  [base.id]: BASE_ADDRESSES,
  [kairos.id]: KAIROS_ADDRESSES,
  [kaia.id]: KAIA_ADDRESSES,
}

export function useAddresses(): AddressSet {
  const { chainId } = usePrivyWallet()
  const addresses = CHAIN_ADDRESSES[chainId]

  if (!addresses) {
    // Fallback based on environment - only local returns LOCALNET_ADDRESSES
    return BASE_ADDRESSES
  }

  return addresses
}

export function isSupportedChain(chainId: number): boolean {
  return chainId in CHAIN_ADDRESSES
}

export function getSupportedChains(): number[] {
  const CHAIN_NETWORK = process.env.NEXT_PUBLIC_CHAIN_NETWORK

  if (CHAIN_NETWORK === 'test') {
    // Test environment supports Base Sepolia and Kairos
    return [baseSepolia.id, kairos.id]
  } else if (CHAIN_NETWORK === 'production') {
    // Production environment supports Base and Kaia
    return [base.id, kaia.id]
  } else {
    return [anvil.id]
  }
}

// Helper function to get addresses by chain ID (for API routes)
export function getAddressesByChainId(chainId: number): AddressSet | null {
  const addresses = CHAIN_ADDRESSES[chainId]

  if (!addresses) {
    // Return null if chain is not supported
    return null
  }

  return addresses
}
