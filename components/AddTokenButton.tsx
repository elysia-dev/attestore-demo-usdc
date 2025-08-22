'use client'

import React from 'react'
import { Button } from './ui/button'
import { Plus } from 'lucide-react'
import { useChainId } from 'wagmi'
import ADDRESSES from '@/lib/addresses'
import { kaia, kairos } from '@/lib/network'

const address = ADDRESSES.USDC

const USDC_OPTIONS = {
  symbol: 'USDC',
  image:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
}
const USDT_OPTIONS = {
  symbol: 'USDT',
  image:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png',
}

export function AddTokenButton() {
  const [isAdding, setIsAdding] = React.useState(false)
  const chainId = useChainId()

  const tokenOptions =
    chainId === kairos.id || chainId === kaia.id ? USDT_OPTIONS : USDC_OPTIONS

  const addToken = async () => {
    if (!window.ethereum) return

    try {
      setIsAdding(true)

      // Try to add the token
      const result = await window.ethereum
        .request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address,
              symbol: tokenOptions.symbol,
              decimals: 6,
              image: tokenOptions.image,
            },
          },
        })
        .catch((error: any) => {
          // Handle specific wallet errors
          if (
            error.message?.includes("isn't implemented") ||
            error.message?.includes('not supported') ||
            error.code === -32601
          ) {
            // Method not found
            alert(
              `Your wallet does not support automatic token addition. Please add the ${tokenOptions.symbol} token manually using address: ` +
                address,
            )
            return false
          }
          throw error
        })
    } catch (error: any) {
      console.error('Failed to add token:', error)
      // Show user-friendly error message
      if (error.code === 4001) {
        // User rejected
        console.log('User rejected token addition')
      } else {
        alert('Failed to add token. Please try adding it manually.')
      }
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Button
      onClick={addToken}
      disabled={isAdding}
      variant="outline"
      size="sm"
      className="bg-white/10 border-white/20 hover:bg-white/20 text-white text-xs sm:text-sm disabled:opacity-50">
      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
      <span className="hidden sm:inline">
        {isAdding ? 'Adding...' : `Add ${tokenOptions.symbol}`}
      </span>
      <span className="sm:hidden">
        {isAdding ? '...' : tokenOptions.symbol}
      </span>
    </Button>
  )
}
