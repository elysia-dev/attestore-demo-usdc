import { IntentDetail } from '@/components/Home'
import { getCurrencySymbol, TOKEN_SYMBOL } from '@/constant'
import { useContractWrite } from '@/hooks/useContractWrite'
import { useAddresses } from '@/hooks/useAddresses'
import { ESCROW_ABI } from '@/lib/abi'
import { ErrorType } from '@/lib/errors'
import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import { useCallback, useContext, useEffect, useState } from 'react'
import { cn, getExplorerUrl, truncateAddress } from '@/lib/utils'
import { erc20Abi, formatUnits } from 'viem'
import { usePublicClient } from 'wagmi'
import { ErrorContext } from '@/context/ErrorContext'
import { useTranslations, useLocale } from 'next-intl'
import { usePrivyWallet } from '@/hooks/usePrivyWallet'

const IntentManagement = ({
  intentId,
  searchIntentId,
  intentDetail,
  handleRefreshMyIntentId,
  setIntentId,
  setSearchIntentId,
}: {
  intentId: number | null
  searchIntentId: number | null
  intentDetail: IntentDetail | null
  handleRefreshMyIntentId: () => void
  setIntentId: (intentId: number) => void
  setSearchIntentId: (searchIntentId: number) => void
}) => {
  const { chainId } = usePrivyWallet()
  const publicClient = usePublicClient()
  const { setError } = useContext(ErrorContext)
  const t = useTranslations('intent')
  const locale = useLocale()
  const addresses = useAddresses()
  const currencySymbol = getCurrencySymbol(chainId || 0)
  const [receiverTokenBalance, setReceiverTokenBalance] = useState<
    bigint | undefined
  >(undefined)

  const readReceiverTokenBalance = useCallback(
    async (to: string) => {
      if (!to) return

      const balance = await publicClient?.readContract({
        address: addresses.USDC, // USDC token
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [to as `0x${string}`],
      })
      setReceiverTokenBalance(balance)
    },
    [publicClient, addresses],
  )

  useEffect(() => {
    if (intentDetail) {
      readReceiverTokenBalance(intentDetail.to)
    }
  }, [intentDetail, readReceiverTokenBalance])

  const { writeAndWait: cancelIntentWrite, isLoading: isCancelIntentLoading } =
    useContractWrite({
      onSuccess: () => {
        if (setIntentId) setIntentId(0)
        if (setSearchIntentId) setSearchIntentId(0)
        handleRefreshMyIntentId()
      },
    })

  const handleCancelIntent = async () => {
    if (!intentId) return

    try {
      await cancelIntentWrite({
        address: addresses.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'cancelIntent',
        args: [BigInt(intentId)],
      })
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      setError(ErrorType.INTENT_CANCEL_FAILED, {
        error: errorMessage,
      })
    }
  }

  if (!searchIntentId) {
    return null
  }

  return (
    <div className="space-y-6">
      {intentDetail && (
        <div className="bg-card/50 backdrop-blur-sm rounded-3xl border border-border/50 overflow-hidden">
          {/* Pending Swap Section */}
          <div className="p-6 pb-4">
            <h3 className="text-lg font-semibold mb-5">{t('pendingSwap')}</h3>

            {/* Compact Info Grid */}
            <div className="space-y-4">
              {/* ID and Receiver Row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('id')}
                  </p>
                  <p className="font-mono font-medium text-lg">{intentId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('receiver')}
                  </p>
                  <p className="font-mono">
                    {intentDetail.to.slice(0, 6)}...
                    {intentDetail.to.slice(-4)}
                  </p>
                </div>
              </div>

              {/* Amount and Created Time Row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('amount')}
                  </p>
                  <p className="font-mono font-medium text-lg text-primary">
                    {formatUnits(intentDetail.amount, 6)} {currencySymbol}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('createdTime')}
                  </p>
                  <p className="text-sm">
                    {new Date(intentDetail.timestamp * 1000).toLocaleDateString(
                      locale,
                      {
                        month: 'numeric',
                        day: 'numeric',
                      },
                    )}{' '}
                    {new Date(intentDetail.timestamp * 1000).toLocaleTimeString(
                      locale,
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Receiver Info Section - Inside the same card */}
          <div className="p-6 border-t border-border/30">
            <h4 className="text-base font-semibold mb-3">
              {t('receiverInfo')}
            </h4>

            <div className="space-y-3">
              {/* Balance and Address in one row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('balance')}
                  </p>
                  <p className="font-mono font-medium text-lg">
                    {receiverTokenBalance
                      ? formatUnits(receiverTokenBalance, 6)
                      : '0'}{' '}
                    {currencySymbol}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('address')}
                  </p>
                  <button
                    className="font-mono text-sm hover:text-primary transition-colors"
                    onClick={() => {
                      const url = getExplorerUrl(intentDetail.to, chainId)
                      window.open(url, '_blank')
                    }}>
                    {intentDetail.to.slice(0, 8)}...
                    {intentDetail.to.slice(-6)}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel Intent Button - Inside the same card */}
          <div className="p-6 pt-4">
            <button
              onClick={handleCancelIntent}
              disabled={isCancelIntentLoading}
              className="w-full bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed text-destructive-foreground px-4 py-2 rounded-2xl font-semibold transition-all duration-200 hover:shadow-lg">
              {isCancelIntentLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('cancelling')}
                </span>
              ) : (
                t('cancelSwap')
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default IntentManagement
