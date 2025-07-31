import { base, baseSepolia } from 'viem/chains'
import { anvil } from '@/lib/network'
import { keccak256, toBytes } from 'viem'

export const BASE_URL = 'https://attestor-core-production-5795.up.railway.app'

const TOSS_ACCOUNT_NUMBER_PROD = '100202642943' // production
const TOSS_ACCOUNT_NUMBER_TEST = '100202642943' // test
const TOSS_ACCOUNT_NUMBER_LOCAL = '100000021389' // local

export const TOSS_ACCOUNT_NUMBER =
  process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'production'
    ? TOSS_ACCOUNT_NUMBER_PROD
    : process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'test'
      ? TOSS_ACCOUNT_NUMBER_TEST
      : TOSS_ACCOUNT_NUMBER_LOCAL

export const TOKEN_SYMBOL = 'KRW'
export const USDC_SYMBOL = 'USDC'

// Fixed depositId for frontend
export const DEFAULT_DEPOSIT_ID = 1

export const USD_CURRENCY_CODE = keccak256(toBytes('USD'))
export const KRW_CURRENCY_CODE = keccak256(toBytes('KRW'))

export const TOSS_PLAY =
  'https://play.google.com/store/apps/details?id=viva.republica.toss'
export const TOSS_APPLE = 'https://apps.apple.com/kr/app/id839333328'

const FROM_BLOCK_LOCAL = BigInt(0)
const FROM_BLOCK_BASE_SEPOLIA = BigInt(28962302)
const FROM_BLOCK_BASE = BigInt(33575627)
export const FROM_BLOCK =
  process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'local'
    ? FROM_BLOCK_LOCAL
    : process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'test'
      ? FROM_BLOCK_BASE_SEPOLIA
      : FROM_BLOCK_BASE

export const isLocal = process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'local'

export const chain = (function () {
  const chainNetwork = process.env.NEXT_PUBLIC_CHAIN_NETWORK
  if (chainNetwork === 'local') {
    return anvil
  } else if (chainNetwork === 'test') {
    return baseSepolia
  } else {
    return base
  }
})()
