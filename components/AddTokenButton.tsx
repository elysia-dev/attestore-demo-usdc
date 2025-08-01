'use client'

import React from 'react'
import { Button } from './ui/button'
import { Plus } from 'lucide-react'
import { useChainId } from 'wagmi'
import ADDRESSES from '@/lib/addresses'

const address = ADDRESSES.USDC
export function AddTokenButton() {
  const addToken = async () => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address,
            symbol: 'USDC',
            decimals: 6,
            image:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
          },
        },
      })
    } catch (error) {
      console.error('Failed to add token:', error)
    }
  }

  return (
    <Button
      onClick={addToken}
      variant="outline"
      size="sm"
      className="bg-white/10 border-white/20 hover:bg-white/20 text-white text-xs sm:text-sm">
      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
      <span className="hidden sm:inline">Add USDC</span>
      <span className="sm:hidden">USDC</span>
    </Button>
  )
}
