'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import MainBackground from '@/components/ui/MainBackground'

// See: https://docs.tosspayments.com/reference/error-codes
type PaymentErrorCode =
  | 'PAY_PROCESS_CANCELED'
  | 'PAY_PROCESS_ABORTED'
  | 'REJECT_CARD_PAYMENT'
  | 'INVALID_REJECT_CARD'
  | 'REJECT_CARD_COMPANY'
  | 'INVALID_STOPPED_CARD'
  | 'INVALID_CARD_NUMBER'
  | 'INVALID_CARD_EXPIRATION'
  | 'EXCEED_MAX_AUTH_COUNT'
  | 'EXCEED_MAX_PAYMENT_AMOUNT'
  | 'DUPLICATED_ORDER_ID'

export default function PaymentFailPage() {
  const searchParams = useSearchParams()
  const t = useTranslations('paymentErrors')
  const tPage = useTranslations('paymentFail')

  const code = searchParams.get('code')
  const message = searchParams.get('message')
  const orderId = searchParams.get('orderId')
  const intentId = searchParams.get('intentId')

  const getErrorMessage = (code: string | null) => {
    if (code && isValidErrorCode(code)) {
      return t(code)
    }
    return message || t('default')
  }

  const isValidErrorCode = (code: string): code is PaymentErrorCode => {
    const validCodes: PaymentErrorCode[] = [
      'PAY_PROCESS_CANCELED',
      'PAY_PROCESS_ABORTED',
      'REJECT_CARD_PAYMENT',
      'INVALID_REJECT_CARD',
      'REJECT_CARD_COMPANY',
      'INVALID_STOPPED_CARD',
      'INVALID_CARD_NUMBER',
      'INVALID_CARD_EXPIRATION',
      'EXCEED_MAX_AUTH_COUNT',
      'EXCEED_MAX_PAYMENT_AMOUNT',
      'DUPLICATED_ORDER_ID',
    ]
    return validCodes.includes(code as PaymentErrorCode)
  }

  return (
    <MainBackground>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold">{tPage('title')}</h1>
              <p className="text-muted-foreground">{tPage('subtitle')}</p>
            </div>

            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl p-4 space-y-3">
              <h2 className="font-semibold text-red-400">
                {tPage('errorInfo')}
              </h2>
              <div className="space-y-2 text-sm">
                <p className="text-red-400">{getErrorMessage(code)}</p>
                {code && (
                  <div className="flex justify-between items-center">
                    <span className="text-red-400">{tPage('errorCode')}</span>
                    <span className="font-medium text-red-400">{code}</span>
                  </div>
                )}
                {orderId && (
                  <div className="flex justify-between items-center">
                    <span className="text-red-400">{tPage('orderNumber')}</span>
                    <span className="font-medium text-red-400">{orderId}</span>
                  </div>
                )}
                {intentId && (
                  <div className="flex justify-between items-center">
                    <span className="text-red-400">{tPage('intentId')}</span>
                    <span className="font-medium text-red-400">
                      #{intentId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-secondary/30 rounded-2xl p-4">
              <h3 className="font-semibold mb-2">{tPage('nextSteps')}</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• {tPage('nextStep1')}</li>
                <li>• {tPage('nextStep2')}</li>
                <li>• {tPage('nextStep3')}</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Link
                href="/"
                className="flex-1 px-4 py-3 rounded-full bg-secondary/50 hover:bg-secondary/70 transition-all duration-200 border border-border/50 flex items-center justify-center gap-2 text-sm font-medium">
                {tPage('backToMain')}
              </Link>
              <button
                onClick={() => window.history.back()}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-full font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2">
                {tPage('tryAgain')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainBackground>
  )
}
