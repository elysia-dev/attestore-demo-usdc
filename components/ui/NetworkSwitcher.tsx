'use client'

import { useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { getCurrentNetworkConfig } from '@/constant'
import { cn, getNetworkNameByChainId } from '@/lib/utils'
import { base, baseSepolia, kaia, kairos } from 'viem/chains'
import { usePrivyWallet } from '@/hooks/usePrivyWallet'

interface NetworkSwitcherProps {
  className?: string
}

export function NetworkSwitcher({ className }: NetworkSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { chain, isConnected } = useAccount()
  const { chainId, wallet } = usePrivyWallet()
  console.log('chain', chain)
  console.log('chainId from privy', chainId)
  // const { switchChain } = useSwitchChain()
  const handleSwitchNetwork = async (chainId: number) => {
    if (!wallet) return
    await wallet.switchChain(chainId)
  }
  const networkConfig = getCurrentNetworkConfig()

  const networkMap: Record<string, { id: number; name: string; icon: string }> =
    {
      base: {
        id: base.id,
        name: 'Base',
        icon: '🔵',
      },
      baseSepolia: {
        id: baseSepolia.id,
        name: 'Base Sepolia',
        icon: '🔵',
      },
      kairos: {
        id: kairos.id,
        name: 'Kairos Testnet',
        icon: '🟡',
      },
      kaia: {
        id: kaia.id,
        name: 'Kaia',
        icon: '🟡',
      },
    }

  const isUnsupportedNetwork =
    chainId &&
    !networkConfig.allowedNetworks.some(
      (network) => networkMap[network]?.id === chainId,
    )

  const handleNetworkSwitch = async (networkKey: string) => {
    console.log('!!!!!!!!!!!!!!!!handlenetworkswitch!!!!!!!!!!!!!!!!!!')
    console.log('networkkey', networkKey)
    try {
      const targetChainId = networkMap[networkKey]?.id
      console.log('targetChainId', targetChainId)
      if (!targetChainId) return

      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          await handleSwitchNetwork(targetChainId)
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            const network = networkMap[networkKey]
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${targetChainId.toString(16)}`,
                  chainName: network?.name,
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: [getRpcUrl(networkKey)],
                  blockExplorerUrls: [getExplorerUrl(networkKey)],
                },
              ],
            })
          } else {
            throw switchError
          }
        }
      } else {
        await handleSwitchNetwork(targetChainId)
      }

      setIsOpen(false)
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  const getRpcUrl = (networkKey: string) => {
    switch (networkKey) {
      case 'base':
        return 'https://mainnet.base.org'
      case 'baseSepolia':
        return 'https://sepolia.base.org'
      case 'kairos':
        return 'https://public-en-kairos.node.kaia.io'
      case 'kaia':
        return 'https://kaia-browser.line-apps.com'
      default:
        return 'https://mainnet.base.org'
    }
  }

  const getExplorerUrl = (networkKey: string) => {
    switch (networkKey) {
      case 'base':
        return 'https://basescan.org'
      case 'baseSepolia':
        return 'https://sepolia.basescan.org'
      case 'kairos':
        return 'https://kairos.kaiascan.io'
      case 'kaia':
        return 'https://www.kaiascan.io'
      default:
        return 'https://basescan.org'
    }
  }

  if (!chainId) {
    return null
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
        <span>
          {isUnsupportedNetwork
            ? '⚠️'
            : chainId === base.id || chainId === baseSepolia.id
              ? '🔵'
              : chainId === kairos.id || chainId === kaia.id
                ? '🟡'
                : '⚠️'}
        </span>
        <span className="hidden sm:inline">
          {isUnsupportedNetwork
            ? `${getNetworkNameByChainId(chainId) || 'Unknown'}`
            : chainId === kairos.id || chainId === kaia.id
              ? 'Kairos Testnet'
              : chainId === base.id || chainId === baseSepolia.id
                ? 'Base'
                : 'Unknown'}
        </span>
        {chainId && (
          <span
            className={cn(
              'text-xs',
              isUnsupportedNetwork ? 'text-red-400' : 'text-green-400',
            )}>
            ●
          </span>
        )}
        <svg
          className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {isUnsupportedNetwork && (
              <div className="px-4 py-2 text-xs text-red-400 bg-red-400/10 border-b border-red-400/20">
                Wrong Network
              </div>
            )}
            {networkConfig.allowedNetworks.map((networkKey) => {
              const network = networkMap[networkKey]
              const isActive = network?.id === chainId

              return (
                <button
                  key={networkKey}
                  onClick={() => handleNetworkSwitch(networkKey)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
                    isActive
                      ? 'text-white bg-white/20'
                      : 'text-white/70 hover:text-white hover:bg-white/10',
                  )}>
                  <span>{network?.icon}</span>
                  <span>{network?.name}</span>
                  {isActive && <span className="ml-auto text-xs">✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}
