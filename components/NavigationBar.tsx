'use client'

import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import LanguageToggle from './LanguageToggle'
import { NetworkSwitcher } from './ui/NetworkSwitcher'
import ConnectWallet from './utils/ConnectWallet'

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
  const t = useTranslations('navigation')

  useEffect(() => {
    if (view === 'history') {
      setActiveTab(Tab.HISTORY)
    } else {
      setActiveTab(Tab.SWAP)
    }
  }, [view])

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

          {/* Main navigation links */}
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
        </div>

        {/* Right side - Wallet and Network info */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Network Switcher */}
          <NetworkSwitcher />

          {/* Language Toggle - Only on desktop */}
          <LanguageToggle />

          {/* Connect Button with better mobile handling */}
          <ConnectWallet />
        </div>
      </div>
    </nav>
  )
}
