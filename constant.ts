import { keccak256, toBytes } from 'viem'

export const BASE_URL = 'https://attestor-core-production-5795.up.railway.app'

// export const faucetLink = "https://www.alchemy.com/faucets/ethereum-holesky";
export const faucetLink =
  'https://cloud.google.com/application/web3/faucet/ethereum/holesky'

const TOSS_ACCOUNT_NUMBER_PROD = '100202642943' // production
const TOSS_ACCOUNT_NUMBER_TEST = '100000021389' // test

export const TOSS_ACCOUNT_NUMBER =
  process.env.NODE_ENV === 'production'
    ? TOSS_ACCOUNT_NUMBER_PROD
    : TOSS_ACCOUNT_NUMBER_TEST

export const TOKEN_SYMBOL = 'KRW'
export const USDC_SYMBOL = 'USDC'

// Fixed depositId for frontend
export const DEFAULT_DEPOSIT_ID = 1

export const USD_CURRENCY_CODE = keccak256(toBytes('USD'))
export const KRW_CURRENCY_CODE = keccak256(toBytes('KRW'))

export const TOSS_PLAY =
  'https://play.google.com/store/apps/details?id=viva.republica.toss'
export const TOSS_APPLE = 'https://apps.apple.com/kr/app/id839333328'

const FROM_BLOCK_LOCAL = 0
const FROM_BLOCK_PROD = 4097338 //https://holesky.etherscan.io/tx/0x8920cf17e74709867b1896283eda803f11fe1390f586dd1c4ad004c76720e219
export const FROM_BLOCK =
  process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'local'
    ? FROM_BLOCK_LOCAL
    : FROM_BLOCK_PROD

export const isLocal = process.env.NEXT_PUBLIC_CHAIN_NETWORK === 'local'

export enum NetworkName {
  LOCAL = 'local',
  TEST = 'holesky',
  PRODUCTION = 'production',
}

export const networkName = (function () {
  const chainNetwork = process.env.NEXT_PUBLIC_CHAIN_NETWORK
  if (chainNetwork === 'local') return NetworkName.LOCAL
  if (chainNetwork === 'test') return NetworkName.TEST
  return NetworkName.PRODUCTION
})()
