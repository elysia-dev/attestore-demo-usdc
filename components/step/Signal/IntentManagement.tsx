import { IntentDetails } from '@/components/Home'
import { TOKEN_SYMBOL, USDC_SYMBOL } from '@/constant'
import { useContractWrite } from '@/hooks/useContractWrite'
import ADDRESSES from '@/lib/addresses'
import { ESCROW_ABI } from '@/lib/abi'
import { ErrorType } from '@/lib/errors'
import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import { useCallback, useContext, useEffect, useState } from 'react'
import { cn, getExplorerUrl, truncateAddress } from '@/lib/utils'
import { erc20Abi, formatUnits } from 'viem'
import { usePublicClient } from 'wagmi'
import { ErrorContext } from '@/context/ErrorContext'
import { useTranslations, useLocale } from 'next-intl'

const IntentManagement = ({
  intentId,
  searchIntentId,
  intentDetails,
  handleRefreshMyIntentId,
  setIntentId,
  setSearchIntentId,
}: {
  intentId: number | null
  searchIntentId: number | null
  intentDetails: IntentDetails | null
  handleRefreshMyIntentId: () => void
  setIntentId: (intentId: number) => void
  setSearchIntentId: (searchIntentId: number) => void
}) => {
  const publicClient = usePublicClient()
  const { setError } = useContext(ErrorContext)
  const t = useTranslations('intent')
  const locale = useLocale()

  const [receiverTokenBalance, setReceiverTokenBalance] = useState<
    bigint | undefined
  >(undefined)

  const readReceiverTokenBalance = useCallback(
    async (to: string) => {
      if (!to) return

      const balance = await publicClient?.readContract({
        address: ADDRESSES.USDC, // USDC token
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [to as `0x${string}`],
      })
      setReceiverTokenBalance(balance)
    },
    [publicClient],
  )

  useEffect(() => {
    if (intentDetails) {
      readReceiverTokenBalance(intentDetails.to)
    }
  }, [intentDetails, readReceiverTokenBalance])

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
        address: ADDRESSES.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'cancelSwap',
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
      {intentDetails && (
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
                    {intentDetails.to.slice(0, 6)}...
                    {intentDetails.to.slice(-4)}
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
                    {formatUnits(intentDetails.amount, 6)} USDC
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('createdTime')}
                  </p>
                  <p className="text-sm">
                    {new Date(
                      intentDetails.timestamp * 1000,
                    ).toLocaleDateString(locale, {
                      month: 'numeric',
                      day: 'numeric',
                    })}{' '}
                    {new Date(
                      intentDetails.timestamp * 1000,
                    ).toLocaleTimeString(locale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
                    USDC
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('address')}
                  </p>
                  <button
                    className="font-mono text-sm hover:text-primary transition-colors"
                    onClick={() => {
                      const url = getExplorerUrl(intentDetails.to)
                      window.open(url, '_blank')
                    }}>
                    {intentDetails.to.slice(0, 8)}...
                    {intentDetails.to.slice(-6)}
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
