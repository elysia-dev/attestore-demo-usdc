import { ALLOWED_CHAIN_ID, isLocal, isProduction } from '@/constant'
import { ConnectedWallet, usePrivy, useWallets } from '@privy-io/react-auth'
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets'
import { useMemo } from 'react'
import { useChainId } from 'wagmi'

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

    // is smart wallet -> get chainId based environment
    // is external wallet -> get chainId from connected wallet
    const getChainIdFromConnectedWallet = (wallet?: ConnectedWallet) => {
      if (!wallet) return undefined
      // "eip155:42161"
      const chainId = wallet.chainId
      try {
        return Number(chainId.split(':')[1])
      } catch (error) {
        return undefined
      }
    }
    // TODO: check this logic
    const chainId = smartWalletClient
      ? ALLOWED_CHAIN_ID
      : getChainIdFromConnectedWallet(linkedWallet)

    const isCorrectNetwork = chainId === ALLOWED_CHAIN_ID

    return {
      authenticated,
      user,
      wallet: linkedWallet,
      smartWalletClient,
      walletAddress,
      chainId,
      isCorrectNetwork,
    }
  }, [authenticated, user, smartWalletClient, wallets])

  return walletInfo
}
