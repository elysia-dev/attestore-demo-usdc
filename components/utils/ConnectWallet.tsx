import { useTranslations } from 'next-intl'
import { useState } from 'react'
import CustomAccountModal from '../ui/CustomAccountModal'
import { truncateAddress } from '@/lib/utils'
import { usePrivy } from '@privy-io/react-auth'

const ConnectWallet = () => {
  const t = useTranslations('connectButton')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user, login } = usePrivy()
  const address = user?.wallet?.address
  const openConnectModal = () => {
    setIsModalOpen(true)
  }
  console.log('address', address)
  console.log('isModalOpen', isModalOpen)

  if (address && !isModalOpen) {
    return (
      <button
        // onClick={handleLogout}
        onClick={openConnectModal}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/10 hover:bg-white/20 transition-all duration-200">
        <span className="text-sm font-medium text-white">
          {truncateAddress(address)}
        </span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={login} // open login UI of privy
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
