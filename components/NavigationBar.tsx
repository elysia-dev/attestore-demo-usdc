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

          {/* Main navigation links - back to original style */}
          <div className="flex items-center gap-3 sm:gap-4 ml-2">
            <button
              onClick={() => {
                setActiveTab(Tab.SWAP)
                router.push('/')
              }}
              className={cn(
                'text-sm sm:text-base font-medium transition-colors relative pb-1',
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
                'text-sm sm:text-base font-medium transition-colors relative pb-1',
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
          {/* Language Toggle - Only on desktop */}
          <LanguageToggle />

          {/* Add Token Button */}
          {isConnected && <AddTokenButton />}

          {/* Network Badge - simplified for mobile */}
          {isConnected && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm text-white/80">
                {getNetworkNameByChainId(chainId)}
              </span>
            </div>
          )}

          {/* Mobile network indicator - clickable with tooltip */}
          {isConnected && (
            <div className="relative flex sm:hidden">
              <button
                onClick={() => setShowNetwork(!showNetwork)}
                className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full transition-all hover:bg-white/20">
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </button>
              {showNetwork && (
                <div className="absolute top-10 right-0 px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap bg-card/80 border border-border/50">
                  <span className="text-xs text-white">
                    {getNetworkNameByChainId(chainId)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Connect Button with better mobile handling */}
          <div className="min-w-0">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                // Note: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks
                const ready = mounted && authenticationStatus !== 'loading'
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated')

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}>
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-medium hover:bg-primary/90 transition-all">
                            {t('connectWallet')}
                          </button>
                        )
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-medium">
                            {t('wrongNetwork')}
                          </button>
                        )
                      }

                      return (
                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="bg-white/10 text-white px-3 sm:px-4 py-2 rounded-full font-medium hover:bg-white/20 transition-all flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                          <span className="hidden sm:inline">
                            {truncateAddress(account.address)}
                          </span>

                          {/* <span className="sm:hidden text-sm">
                            {account.address.slice(0, 6)}...
                            {account.address.slice(-4)}
                          </span> */}
                        </button>
                      )
                    })()}
                  </div>
                )
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </nav>
  )
}
