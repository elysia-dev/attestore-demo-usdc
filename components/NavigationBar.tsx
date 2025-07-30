'use client'

import { cn } from '@/lib/utils'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface NavigationBarProps {
  className?: string
}

enum Tab {
  SWAP = 'swap',
  HISTORY = 'history',
}

export default function NavigationBar({ className }: NavigationBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get('view')
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SWAP)
  const { isConnected } = useAccount()
  const chainId = useChainId()

  useEffect(() => {
    if (view === 'history') {
      setActiveTab(Tab.HISTORY)
    } else {
      setActiveTab(Tab.SWAP)
    }
  }, [view])

  return (
    <nav className={cn('fixed top-0 left-0 right-0 z-50 px-6 py-4', className)}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - Logo and main navigation */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500" />
          </div>

          {/* Main navigation tabs */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                setActiveTab(Tab.SWAP)
                router.push('/')
              }}
              className={cn(
                'text-base font-medium transition-colors relative pb-1',
                activeTab === 'swap'
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/80',
              )}>
              Swap
              {activeTab === 'swap' && (
                <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab(Tab.HISTORY)
                router.push('/?view=history')
              }}
              className={cn(
                'text-base font-medium transition-colors relative pb-1',
                activeTab === 'history'
                  ? 'text-white'
                  : 'text-white/60 hover:text-white/80',
              )}>
              History
              {activeTab === Tab.HISTORY && (
                <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-white" />
              )}
            </button>
          </div>
        </div>

        {/* Right side - Wallet and Network info */}
        <div className="flex items-center gap-4">
          {/* Network Badge */}
          {isConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm text-white/80">
                {chainId === 1
                  ? 'Ethereum'
                  : chainId === 84532
                    ? 'Base Sepolia'
                    : chainId === 11155111
                      ? 'Sepolia'
                      : chainId === 31337
                        ? 'Anvil'
                        : chainId === 17000
                          ? 'Holesky'
                          : `Chain ${chainId}`}
              </span>
            </div>
          )}

          {/* Connect Button */}
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      </div>
    </nav>
  )
}
