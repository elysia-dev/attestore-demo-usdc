import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets'
import { useMemo } from 'react'

export const usePrivyWallet = () => {
  const { authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const { client: smartWalletClient } = useSmartWallets()

  // if smartWalletClient : use 'smart-wallet'
  // else linkedWallet : use 'external-wallet'
  // else : no wallet connected
  const walletInfo = useMemo(() => {
    if (!authenticated || !user) {
      return {
        wallet: null,
        smartWalletClient: null,
        walletType: null,
        walletAddress: null,
      }
    }
    const linkedWallet = wallets.find((wallet) => wallet.linked === true)
    const userWallet = user?.wallet

    // TODO: check this logic
    const walletAddress = smartWalletClient
      ? smartWalletClient.account?.address
      : linkedWallet?.address
        ? linkedWallet?.address
        : userWallet?.address
    return {
      authenticated,
      user,
      wallet: linkedWallet,
      smartWalletClient,
      walletAddress,
    }
  }, [authenticated, user, smartWalletClient, wallets])

  return walletInfo
}
