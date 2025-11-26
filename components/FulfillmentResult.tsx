import { formatUnits } from 'viem'
import { FulfillmentResult } from './Home'
import { getCurrencySymbol } from '@/constant'
import { useTranslations, useLocale } from 'next-intl'
import { useAccount } from 'wagmi'
import { useSearchParams } from 'next/navigation'

export default function FulfillmentResultComponent({
  fulfillmentResult,
}: {
  fulfillmentResult: FulfillmentResult
}) {
  const t = useTranslations('fulfillmentResult')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { chainId } = useAccount()
  const currencySymbol = getCurrencySymbol(chainId || 0, token || '')

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold text-center text-gradient">
        {t('transferCompleted')}
      </h2>
      <section className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <span className="text-lg">🎉</span>
          {t('transferInfo')}
        </h3>
        <section className="bg-secondary/30 rounded-2xl p-4 border border-border/50">
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">{t('id')}</span>
              <p className="text-sm font-mono break-all">
                {fulfillmentResult.intentId}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">
                {t('receiver')}
              </span>
              <p className="text-sm font-mono">
                {fulfillmentResult.to?.slice(0, 6)}...
                {fulfillmentResult.to?.slice(-4)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">
                {t('amount')}
              </span>
              <p className="text-sm font-mono font-medium text-primary">
                {fulfillmentResult.amount &&
                  formatUnits(fulfillmentResult.amount, 6)}{' '}
                {currencySymbol}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">
                {t('transaction')}
              </span>
              <p className="text-sm font-mono">
                {fulfillmentResult.txHash?.slice(0, 6)}...
                {fulfillmentResult.txHash?.slice(-4)}
              </p>
            </div>
          </div>
        </section>
      </section>
      <button
        onClick={() => {
          const url = token ? `/${locale}?token=${token}` : `/${locale}`
          window.location.href = url
        }}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 hover:shadow-lg">
        {t('goToMain')}
      </button>
    </section>
  )
}
