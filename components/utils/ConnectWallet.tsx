import { useTranslations } from 'next-intl'
import { useState } from 'react'
import CustomAccountModal from '../ui/CustomAccountModal'
import { truncateAddress } from '@/lib/utils'
import { usePrivy } from '@privy-io/react-auth'
import { usePrivyWallet } from '@/hooks/usePrivyWallet'
import { ALLOWED_CHAIN_ID } from '@/constant'

const ConnectWallet = () => {
  const t = useTranslations('connectButton')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { login } = usePrivy()
  const { walletAddress, isCorrectNetwork, wallet } = usePrivyWallet()
  const handleLogin = () => {
    login()
  }
  const openConnectModal = () => {
    setIsModalOpen(true)
  }
  const handleSwitchNetwork = () => {
    if (!wallet) return
    wallet.switchChain(ALLOWED_CHAIN_ID)
  }

  if (walletAddress && !isModalOpen) {
    if (!isCorrectNetwork) {
      return (
        <button
          onClick={handleSwitchNetwork}
          className="flex items-center gap-2 rounded-full px-4 py-2 bg-red-500/90 hover:bg-red-600/90 transition-all duration-200 shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:scale-105 active:scale-95">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-white">
            Wrong Network
          </span>
        </button>
      )
    }
    return (
      <>
        <button
          onClick={openConnectModal}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-all duration-200">
          <span className="text-sm font-medium text-white">
            {truncateAddress(walletAddress)}
          </span>
        </button>
      </>
    )
  }

  return (
    <>
      <button
        onClick={handleLogin} // open login UI of privy
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_30px_rgba(255,0,122,0.4)] shadow-[0_0_20px_rgba(255,0,122,0.3)]">
        {t('connectWallet')}
      </button>

      <CustomAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

export default ConnectWallet
