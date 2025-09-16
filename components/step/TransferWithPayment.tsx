import { formatUnits } from 'viem'
import { IntentDetail } from '../Home'
import { getCurrencySymbol } from '@/constant'

import { getKRWAmount, getTransferMemo } from '@/lib/utils'
import { WorkflowStep } from '../StepIndicator'
import { useTranslations } from 'next-intl'
import { useAccount } from 'wagmi'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'

export default function TransferWithPayment({
  intentId,
  intentDetail,
  setCurrentStep,
}: {
  intentId: number
  intentDetail: IntentDetail
  setCurrentStep: (step: WorkflowStep) => void
}) {
  const t = useTranslations('transfer')
  const tWithPayment = useTranslations('transferWithPayment')
  const tCommon = useTranslations('common')
  const { chainId } = useAccount()
  const currencySymbol = getCurrencySymbol(chainId || 0)

  const transferAmount = getKRWAmount({
    usdcAmount: intentDetail.amount,
    conversionRate: intentDetail.conversionRate,
  })

  const handleConfirmTransfer = async () => {
    try {
      const clientKey = process.env.NEXT_PUBLIC_API_CLIENT_KEY || ''
      const tossPayments = await loadTossPayments(clientKey)

      const payment = tossPayments.payment({
        customerKey: 'ANONYMOUS',
      })

      const orderId = getTransferMemo(intentId, chainId)
      const orderName = `KRW Transfer for Intent #${intentId}`

      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: transferAmount,
        },
        orderId: orderId,
        orderName: orderName,
        customerName: orderId,
        successUrl: `${window.location.origin}/payment/success?intentId=${intentId}`,
        failUrl: `${window.location.origin}/payment/fail?intentId=${intentId}`,
      })
    } catch (error) {
      console.error('Payment request failed:', error)
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">{tWithPayment('title')}</h2>
      </div>
      {/* 토스 송금 안내 - Intent ID가 있을 때만 표시 */}
      {intentId && intentDetail?.amount && (
        <section className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary">◆</span>
              {tWithPayment('paymentTitle')}
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground ml-6">
              <p>{tWithPayment('paymentDescription')}</p>
            </div>
          </div>
          <section className="bg-secondary/30 rounded-2xl p-4 space-y-3 border border-border/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {tWithPayment('expectedReceiveAmount')}
              </p>
              <p className="text-sm font-medium">
                {formatUnits(intentDetail?.amount, 6)} {currencySymbol}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t('transferAmount')}
              </p>
              <p className="text-sm font-medium">
                {transferAmount.toLocaleString()} KRW
              </p>
            </div>
          </section>
        </section>
      )}

      {!intentId && (
        <p className="text-center text-sm text-muted-foreground">
          {t('lookupIntentFirst')}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setCurrentStep(WorkflowStep.SIGNAL)}
          className="flex-1 px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary/70 transition-all duration-200 border border-border/50 flex items-center justify-center gap-2 text-sm font-medium">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {tCommon('previous')}
        </button>

        <button
          onClick={() => {
            handleConfirmTransfer()
          }}
          disabled={!intentId}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-4 py-2 rounded-full font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2">
          {tCommon('next')}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M7.5 15L12.5 10L7.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  )
}
