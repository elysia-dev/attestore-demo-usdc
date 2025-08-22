'use client'

import { cn, getNetworkNameByChainId, truncateAddress } from '@/lib/utils'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Image from 'next/image'
import { AddTokenButton } from './AddTokenButton'
import { useTranslations } from 'next-intl'
import LanguageToggle from './LanguageToggle'
import CustomConnectButton from './utils/CustomConnectButton'
import { NetworkSwitcher } from './ui/NetworkSwitcher'

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
  const [showNetwork, setShowNetwork] = useState(false)
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const t = useTranslations('navigation')

  // Check if current network is Kaia or Kairos
  const isKaiaNetwork = chainId === 8217 || chainId === 1001

  useEffect(() => {
    if (view === 'history') {
      setActiveTab(Tab.HISTORY)
    } else {
      setActiveTab(Tab.SWAP)
    }
  }, [view])

  // Redirect to main page if on Kaia/Kairos and viewing history
  useEffect(() => {
    if (isKaiaNetwork && view === 'history') {
      router.push('/')
    }
  }, [isKaiaNetwork, view, router])

  useEffect(() => {
    if (showNetwork) {
      const timer = setTimeout(() => setShowNetwork(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showNetwork])

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3 sm:py-4',
        className,
      )}>
      <div className="flex items-center justify-between">
        {/* Left side - Logo and main navigation */}
        <div className="flex items-center gap-2 sm:gap-2">
          <Image
            src="/favicon-pink.svg"
            alt="Zenie"
            width={30}
            height={30}
            className="w-7 h-7 sm:w-8 sm:h-8 cursor-pointer"
            onClick={() => (window.location.href = '/')}
          />

          {/* Main navigation links - hidden on Kaia/Kairos networks */}
          {!isKaiaNetwork && (
            <div className="flex items-center gap-3 sm:gap-4 ml-2">
              <button
                onClick={() => {
                  setActiveTab(Tab.SWAP)
                  router.push('/')
                }}
                className={cn(
                  'text-sm font-medium transition-colors relative pb-1',
                  activeTab === 'swap'
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/80',
                )}>
                {t('swap')}
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
                  'text-sm font-medium transition-colors relative pb-1',
                  activeTab === 'history'
                    ? 'text-white'
                    : 'text-white/60 hover:text-white/80',
                )}>
                {t('history')}
                {activeTab === Tab.HISTORY && (
                  <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-white" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right side - Wallet and Network info */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Network Switcher */}
          <NetworkSwitcher />

          {/* Language Toggle - Only on desktop */}
          <LanguageToggle />

          {/* Connect Button with better mobile handling */}
          <CustomConnectButton />
        </div>
      </div>
    </nav>
  )
}
