'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import MainBackground from '@/components/ui/MainBackground'

interface PaymentData {
  method?: string
  approvedAt?: string
  totalAmount?: number
  currency?: string
  status?: string
  card?: {
    cardType?: string
    number?: string
    approveNo?: string
  }
  receipt?: {
    url?: string
  }
  code?: string
  message?: string
}

interface PaymentVerificationResult {
  success: boolean
  data?: PaymentData
  error?: string
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const t = useTranslations('paymentSuccess')
  const [verificationResult, setVerificationResult] =
    useState<PaymentVerificationResult | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')
  const amount = searchParams.get('amount')
  const intentId = searchParams.get('intentId')

  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentKey || !orderId || !amount) {
        setVerificationResult({
          success: false,
          error: t('missingPaymentInfo'),
        })
        return
      }

      setIsVerifying(true)

      try {
        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
          }),
        })
        const data = await response.json()

        if (response.ok) {
          setVerificationResult({
            success: true,
            data: data,
          })
        } else {
          setVerificationResult({
            success: false,
            error: data.message || t('paymentApprovalFailed'),
            data: data,
          })
        }
      } catch (error) {
        setVerificationResult({
          success: false,
          error: t('verificationError'),
        })
      } finally {
        setIsVerifying(false)
      }
    }

    verifyPayment()
  }, [paymentKey, orderId, amount, t])

  return (
    <MainBackground>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100  rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600 "
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <p className="text-muted-foreground">{t('subtitle')}</p>
              <p className="text-muted-foreground">
                ✅ USDT를 등록한 판매자가 내역을 확인 한 뒤 송금 과정이
                완료됩니다
              </p>
            </div>

            <div className="bg-secondary/30 rounded-2xl p-4 space-y-3">
              <h2 className="font-semibold mb-3">{t('paymentInfo')}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t('paymentKey')}
                  </span>
                  <span className="font-medium">{paymentKey}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('orderId')}</span>
                  <span className="font-medium">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('amount')}</span>
                  <span className="font-medium">
                    {amount ? parseInt(amount).toLocaleString() : '0'} KRW
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('intentId')}</span>
                  <span className="font-medium">#{intentId}</span>
                </div>
              </div>
            </div>

            {isVerifying && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-blue-700 text-sm">{t('verifying')}</p>
              </div>
            )}

            {verificationResult && (
              <div
                className={`border rounded-2xl p-4 ${
                  verificationResult.success
                    ? 'bg-green-50  border-green-200'
                    : 'bg-red-50  border-red-200'
                }`}>
                <h3
                  className={`font-semibold mb-2 ${
                    verificationResult.success
                      ? 'text-green-400 '
                      : 'text-red-400 '
                  }`}>
                  {t('verificationResult')}
                </h3>
                {verificationResult.success ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-green-400">{t('successMessage')}</p>
                    {verificationResult.data && (
                      <div className="mt-3 space-y-1">
                        <p className="text-green-600 ">
                          {t('paymentMethod')}:{' '}
                          {verificationResult.data.method || ''}
                          {verificationResult.data.card?.cardType &&
                            ` (${verificationResult.data.card.cardType})`}
                        </p>
                        {verificationResult.data.approvedAt && (
                          <p className="text-green-600 ">
                            {t('approvalTime')}:{' '}
                            {new Date(
                              verificationResult.data.approvedAt,
                            ).toLocaleString('ko-KR')}
                          </p>
                        )}
                        {verificationResult.data.totalAmount && (
                          <p className="text-green-600 ">
                            {t('paymentAmount')}:{' '}
                            {verificationResult.data.totalAmount.toLocaleString()}{' '}
                            {verificationResult.data.currency || ''}
                          </p>
                        )}
                        {verificationResult.data.status && (
                          <p className="text-green-600 ">
                            {t('paymentStatus')}:{' '}
                            {verificationResult.data.status === 'DONE'
                              ? t('statusDone')
                              : verificationResult.data.status}
                          </p>
                        )}
                        {verificationResult.data.card && (
                          <>
                            {verificationResult.data.card.number && (
                              <p className="text-green-600 ">
                                {t('cardNumber')}:{' '}
                                {verificationResult.data.card.number}
                              </p>
                            )}
                            {verificationResult.data.card.approveNo && (
                              <p className="text-green-600 ">
                                {t('approvalNumber')}:{' '}
                                {verificationResult.data.card.approveNo}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="text-red-400">
                      {t('errorMessage', {
                        error: verificationResult.error || '',
                      })}
                    </p>
                    {verificationResult.data?.code && (
                      <p className="text-red-400 text-xs font-mono">
                        {t('errorCode')}: {verificationResult.data.code}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4">
              <Link
                href="/"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2">
                {t('backToMain')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainBackground>
  )
}
