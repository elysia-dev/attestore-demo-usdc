'use client'

import { useState } from 'react'
import { useAccount, useDisconnect, useChainId } from 'wagmi'
import { useTranslations } from 'next-intl'
import { emojiAvatarForAddress } from '@/lib/emojiAvatarForAddress'
import { getNetworkNameByChainId, truncateAddress } from '@/lib/utils'
import { Copy, X } from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'

interface CustomAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

const CustomAccountModal = ({ isOpen, onClose }: CustomAccountModalProps) => {
  const t = useTranslations('accountModal')
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { logout } = usePrivy()
  const chainId = useChainId()
  const account = useAccount()
  const { emoji, color } = emojiAvatarForAddress(account.address ?? '')
  const [copied, setCopied] = useState(false)

  if (!isOpen || !isConnected || !address) return null

  const handleDisconnect = () => {
    logout()
    disconnect()
    onClose()
  }

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl overflow-hidden border border-border/50 shadow-2xl max-w-sm w-[90%]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="text-base font-semibold">{t('title')}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Avatar and Address */}
          <div className="flex flex-col items-center gap-3 py-4">
            <span
              className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-medium"
              style={{ backgroundColor: color }}>
              {emoji}
            </span>
            <div className="text-center space-y-1">
              <p className="font-medium text-sm">{truncateAddress(address)}</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-xs text-muted-foreground">
                  {getNetworkNameByChainId(chainId)}
                </p>
              </div>
            </div>
            <button
              onClick={handleCopyAddress}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/30 hover:bg-secondary/50 transition-colors text-xs">
              <Copy className="w-3 h-3" />
              <span>{copied ? t('addressCopied') : t('copyAddress')}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0">
          <button
            onClick={handleDisconnect}
            className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium text-sm transition-colors">
            {t('disconnect')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomAccountModal
