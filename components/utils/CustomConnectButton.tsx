import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import CustomAccountModal from '../ui/CustomAccountModal'
import { truncateAddress } from '@/lib/utils'

const CustomConnectButton = () => {
  const t = useTranslations('connectButton')
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, mounted, openConnectModal }) => {
          const connected = mounted && account && chain
          if (!connected) {
            return (
              <button
                onClick={openConnectModal}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_30px_rgba(255,0,122,0.4)] shadow-[0_0_20px_rgba(255,0,122,0.3)]">
                {t('connectWallet')}
              </button>
            )
          }
          return (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-all duration-200">
              <span className="text-sm font-medium text-white">
                {truncateAddress(account.address)}
              </span>
            </button>
          )
        }}
      </ConnectButton.Custom>

      <CustomAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

export default CustomConnectButton
