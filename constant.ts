import { kairos, kaia } from '@/lib/network'
import { keccak256, toBytes } from 'viem'
import { ESCROW_ABI } from '@/lib/abi'

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

// Dynamic currency symbol based on chain ID
export function getCurrencySymbol(chainId: number): string {
  return chainId === kaia.id || chainId === kairos.id ? 'USDT' : 'USDC'
}
// Fixed depositId for frontend
export const DEFAULT_DEPOSIT_ID = 1

export const USD_CURRENCY_CODE = keccak256(toBytes('USD'))
export const KRW_CURRENCY_CODE = keccak256(toBytes('KRW'))

export const TOSS_PLAY =
  'https://play.google.com/store/apps/details?id=viva.republica.toss'
export const TOSS_APPLE = 'https://apps.apple.com/kr/app/id839333328'

export const isLocal = process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'local'
export const isProduction =
  process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'production'

export const NETWORK_CONFIG = {
  production: {
    allowedNetworks: ['base', 'kaia'] as const,
    defaultNetwork: 'base' as const,
  },
  development: {
    allowedNetworks: ['baseSepolia', 'kairos'] as const,
    defaultNetwork: 'baseSepolia' as const,
  },
} as const

export const getCurrentNetworkConfig = () => {
  return isProduction ? NETWORK_CONFIG.production : NETWORK_CONFIG.development
}

export const getTossBankQRCode = (transferAmount: string) =>
  `supertoss://send?amount=${transferAmount}&bank=%ED%86%A0%EC%8A%A4%EB%B1%85%ED%81%AC&accountNo=${TOSS_ACCOUNT_NUMBER}&origin=qr`

export const DECIMALS_CONVERSION_RATE = 18
export const DECIMALS_STABLE_COIN = 6

// const INTENT_SIGNAL_TOPIC = keccak256(
//   toBytes('IntentSignaled(address,address,address,uint256,uint256,uint256)'),
// )
export const INTENT_SIGNAL_TOPIC = (function () {
  const intentSignaled = ESCROW_ABI.find(
    (abi) => abi.type === 'event' && abi.name === 'IntentSignaled',
  )
  const name = intentSignaled?.name
  const inputs = intentSignaled?.inputs
  const typesString = inputs?.map((input) => `${input.type}`).join(',')
  return keccak256(toBytes(`${name}(${typesString})`))
})()

export const PRIVY_APP_ID = 'cmembr83y0031jo0bx9bc08ko'
export const PRIVY_CLIENT_ID =
  'client-WY6PqNJw3ouz1pnqEUkh4z8x68JFLBMnhr6nhivEVhPBt'
