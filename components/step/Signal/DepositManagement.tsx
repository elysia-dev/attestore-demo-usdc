import { DepositDetail, DepositResult } from '@/components/Home'
import { Button } from '@/components/ui/button'
import { TOKEN_SYMBOL, USDC_SYMBOL } from '@/constant'
import { useContractWrite } from '@/hooks/useContractWrite'
import ADDRESSES from '@/lib/addresses'
import { ESCROW_ABI } from '@/lib/abi'
import { Dispatch, SetStateAction, useContext } from 'react'
import { formatUnits } from 'viem'
import { ErrorType } from '@/lib/errors'
import { ErrorContext } from '@/context/ErrorContext'
import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import useDepositStore from '@/stores/useDepositStore'

const DepositManagement = ({
  depositId,
  depositDetail,
}: {
  depositId: number | null
  depositDetail: DepositDetail | null
}) => {
  const t = useTranslations('depositManagement')
  const tCommon = useTranslations('common')
  const { setError } = useContext(ErrorContext)

  const { setDepositDetail } = useDepositStore()

  const {
    writeAndWait: withdrawDepositWrite,
    isLoading: isWithdrawDepositLoading,
  } = useContractWrite({
    onSuccess: () => {
      setDepositDetail(null)
    },
  })

  const handleWithdrawDeposit = async () => {
    if (!depositId) return

    try {
      await withdrawDepositWrite({
        address: ADDRESSES.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'withdrawDeposit',
        args: [BigInt(depositId)],
      })
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      setError(ErrorType.CANCEL_REDEEM_FAILED, {
        error: errorMessage,
      })
    }
  }

  return (
    <div className="space-y-6">
      {depositId && depositDetail && (
        <div className="bg-card/50 backdrop-blur-sm rounded-3xl border border-border/50 overflow-hidden">
          {/* Deposit Details Section */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">{t('title')}</h3>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  depositDetail.acceptingIntents
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-gray-500/10 text-gray-500',
                )}>
                {depositDetail.acceptingIntents ? t('active') : t('inactive')}
              </span>
            </div>

            {/* Compact Info Grid */}
            <div className="space-y-4">
              {/* Deposit ID and Amount Row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('depositId')}
                  </p>
                  <p className="font-mono font-medium text-lg">#{depositId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">
                    {tCommon('amount')}
                  </p>
                  <p className="font-mono font-medium text-lg">
                    {formatUnits(depositDetail.amount, 6)} USDC
                  </p>
                </div>
              </div>

              {/* Remaining and Outstanding Intents Row */}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('intentRange')}
                  </p>
                  <p className="text-sm">
                    {formatUnits(depositDetail.intentAmountRange.min, 6)} -{' '}
                    {formatUnits(depositDetail.intentAmountRange.max, 6)} USDC
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t('remaining')}
                  </p>
                  <p className="font-mono font-medium text-lg">
                    {formatUnits(depositDetail.remainingDeposits, 6)} USDC
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-5">
              <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((Number(depositDetail.amount - depositDetail.remainingDeposits) / Number(depositDetail.amount)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Withdraw Deposit Button - Inside the same card */}
          <div className="p-6 pt-4">
            <button
              onClick={handleWithdrawDeposit}
              disabled={isWithdrawDepositLoading}
              className="w-full bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed text-destructive-foreground px-6 py-3 rounded-2xl font-semibold transition-all duration-200 hover:shadow-lg">
              {isWithdrawDepositLoading ? (
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
                  {t('withdrawing')}
                </span>
              ) : (
                t('withdrawDeposit')
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DepositManagement
