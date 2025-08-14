/* eslint-disable @typescript-eslint/no-explicit-any */
import { Label } from '@radix-ui/react-label'
import { ProofResult } from '../Home'
import { Input } from '../ui/input'
import axios from 'axios'
import { BASE_URL } from '@/constant'
import { useContext, useState } from 'react'
import ProofResultComponent from '../ProofResult'
import { ErrorType } from '@/lib/errors'
import { ErrorContext } from '@/context/ErrorContext'
import { trackUserAction } from '@/lib/sentry-utils'
import * as Sentry from '@sentry/nextjs'
import { cn } from '@/lib/utils'
import { VideoPopup } from '../ui/VideoPopup'
import { WorkflowStep } from '../StepIndicator'
import { WaitingForRelease } from '../WaitingForRelease'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

// Certificate number formatting function - don't filter out Korean characters
const formatCertificateNumber = (value: string): string => {
  // Only remove dashes and spaces for formatting
  const cleanValue = value.replace(/[-\s]/g, '')

  // Only apply formatting if the value contains only valid characters
  if (/^[0-9A-Za-z]*$/.test(cleanValue)) {
    const upperValue = cleanValue.toUpperCase()

    // Format: XXXX-XXXX-XXXXXXXX (4-4-8 format)
    if (upperValue.length > 8) {
      return (
        upperValue.slice(0, 4) +
        '-' +
        upperValue.slice(4, 8) +
        '-' +
        upperValue.slice(8, 16)
      )
    } else if (upperValue.length > 4) {
      return upperValue.slice(0, 4) + '-' + upperValue.slice(4, 8)
    }
    return upperValue
  }

  // Return original value if it contains invalid characters (including Korean)
  return value
}

// Validation functions
const validateIssueDate = (date: string, t: any): string | undefined => {
  if (!date) return t('issueDateRequired')

  // Check if it's exactly 8 digits (YYYYMMDD format)
  if (!/^\d{8}$/.test(date)) {
    return t('issueDateFormat')
  }

  const year = parseInt(date.substring(0, 4))
  const month = parseInt(date.substring(4, 6))
  const day = parseInt(date.substring(6, 8))

  // Basic date validation
  if (year !== 2025) {
    return t('yearMust2025')
  }

  if (month < 1 || month > 12) {
    return t('monthRange')
  }

  if (day < 1 || day > 31) {
    return t('dayRange')
  }

  return undefined
}

const validateCertificateNumber = (
  certNumber: string,
  t: any,
): string | undefined => {
  if (!certNumber) return t('certificateNumberRequired')

  // Check if it matches the format: XXXX-XXXX-XXXXXXXX
  if (!/^\d{4}-[A-Z]{4}-[A-Z]{8}$/.test(certNumber)) {
    return t('certificateNumberFormat')
  }

  return undefined
}

export default function Proof({
  intentId,
  intentDetail,
  issueDate,
  setIssueDate,
  certificateNumber,
  setCertificateNumber,
  setCurrentStep,
  isLoading,
  setIsLoading,
  setProofResult,
  proofResult,
}: {
  intentId: number | null
  intentDetail: any | null
  issueDate: string
  setIssueDate: (issueDate: string) => void
  certificateNumber: string
  setCertificateNumber: (certificateNumber: string) => void
  setCurrentStep: (step: WorkflowStep) => void
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
  setProofResult: (proofResult: ProofResult) => void
  proofResult: ProofResult | null
}) {
  const t = useTranslations('proof')
  const tCommon = useTranslations('common')
  const { setError, freeError } = useContext(ErrorContext)
  const [showTooltip, setShowTooltip] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showManualProof, setShowManualProof] = useState(false)

  // Validation states
  const [validationErrors, setValidationErrors] = useState<{
    issueDate?: string
    certificateNumber?: string
  }>({})

  const validateForm = (): boolean => {
    const errors: { issueDate?: string; certificateNumber?: string } = {}

    const issueDateError = validateIssueDate(issueDate, t)
    if (issueDateError) errors.issueDate = issueDateError

    const certificateNumberError = validateCertificateNumber(
      certificateNumber,
      t,
    )
    if (certificateNumberError)
      errors.certificateNumber = certificateNumberError

    setValidationErrors(errors)

    return Object.keys(errors).length === 0
  }
  // ZK Proof 생성
  const handleGenerateProof = async (e: React.FormEvent) => {
    e.preventDefault()

    // Form validation
    if (!validateForm()) {
      return // Stop if validation fails
    }

    setIsLoading(true)
    freeError()

    // 사용자 액션 추적
    trackUserAction('Generate Transfer Proof clicked', {
      intentId,
      issueDate,
      certificateNumber,
    })

    try {
      const formattedDate = issueDate.replace(
        /(\d{4})(\d{2})(\d{2})/,
        '$1-$2-$3',
      )

      // Sentry 스팬으로 API 호출 추적
      const response = await Sentry.startSpan(
        {
          name: 'Generate Transfer Proof',
          op: 'http.client',
          attributes: {
            'http.method': 'POST',
            'http.url': `${BASE_URL}/api/generate-receipt`,
            issueDate: formattedDate,
            issueNumber: certificateNumber,
          },
        },
        async () => {
          return await axios.post(
            `${BASE_URL}/api/generate-receipt`,
            {
              issuedDate: formattedDate,
              issueNumber: certificateNumber,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )
        },
      )

      setProofResult(response.data)
      trackUserAction('Transfer Proof generated successfully', {
        proof: response.data || 'unknown',
      })
      freeError()
    } catch (error) {
      console.error('API Error:', error)

      // 상세한 에러 정보 Sentry로 전송
      Sentry.captureException(error, {
        tags: {
          type: 'proof_generation_error',
          step: '4_proof_generation',
        },
        contexts: {
          proof_generation: {
            intentId,
            issueDate,
            certificateNumber,
            apiUrl: `${BASE_URL}/api/generate-receipt`,
            errorResponse: (error as any)?.response?.data,
            errorStatus: (error as any)?.response?.status,
          },
        },
      })

      setError(ErrorType.PROOF_GENERATION_FAILED)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    setCurrentStep(WorkflowStep.FULFILL)
    freeError()
  }
  const handlePrevious = () => {
    setCurrentStep(WorkflowStep.TRANSFER)
    freeError()
  }

  // If manual proof is not requested, show waiting screen
  if (!showManualProof && !proofResult) {
    return (
      <WaitingForRelease
        intentId={intentId?.toString() || ''}
        onManualProof={() => setShowManualProof(true)}
        handlePrevious={handlePrevious}
      />
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">{t('title')}</h2>
      </div>
      <section className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-primary">◆</span>
            {t('generateProofTitle')}
          </h3>
          <div className="relative inline-block">
            {/* <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors">
              ?
            </button> */}
            {/* <span className="text-primary text-xs ml-1 max-sm:hidden">
              (for devs)
            </span> */}

            {showTooltip && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-card text-foreground text-xs rounded-lg shadow-lg z-10 w-64 border border-border">
                <div className="font-semibold text-primary mb-2">for devs</div>
                <div className="space-y-1 text-muted-foreground">
                  <p>
                    · remote server generates tls proof using attestor-server
                    for the Bank transfer
                  </p>
                  <p>· remote server sends the proof to the attestor-server</p>
                  <p>
                    · attestor-server validates the proof and signs data with
                    its private key
                  </p>
                  <p>· signed data is sent to the client</p>
                </div>
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-card"></div>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground ml-6 mt-4">
          <p>{t('generateProofDescription1')}</p>
          <p>{t('generateProofDescription2')}</p>
        </div>
        <button
          onClick={() => setShowGuide(true)}
          className="w-full px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-200 border border-primary/20 flex items-center justify-center gap-2 text-sm font-medium text-primary mt-6">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          {t('showGuide')}
        </button>
      </section>
      {/* 토스 송금 데모 비디오 */}
      <VideoPopup
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        videoSrc="/tossbank_certificate.mp4"
        title={t('showGuide')}
      />
      <form onSubmit={handleGenerateProof} className="space-y-6">
        <section className="bg-secondary/30 rounded-2xl p-4 space-y-3 border border-border/50">
          {/* intentId */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('swapId')}</label>
            <input
              id="intentId"
              type="text"
              value={intentId?.toString() || ''}
              disabled={true}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="issueDate" className="text-sm font-medium">
              {t('issueDate')}
            </label>
            <input
              id="issueDate"
              type="text"
              value={issueDate}
              disabled={!!proofResult}
              onChange={(e) => {
                setIssueDate(e.target.value)
                // Clear validation error when user starts typing
                if (validationErrors.issueDate) {
                  setValidationErrors((prev) => ({
                    ...prev,
                    issueDate: undefined,
                  }))
                }
              }}
              placeholder={t('issueDatePlaceholder')}
              className={cn(
                'w-full h-10 rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-50',
                validationErrors.issueDate
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-border',
              )}
              maxLength={8}
            />
            {validationErrors.issueDate && (
              <p className="text-destructive text-xs mt-1">
                {validationErrors.issueDate}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="certificateNumber" className="text-sm font-medium">
              {t('certificateIssueNumber')}
            </label>
            <input
              id="certificateNumber"
              type="text"
              value={certificateNumber}
              disabled={!!proofResult}
              onChange={(e) => {
                const formatted = formatCertificateNumber(e.target.value)
                setCertificateNumber(formatted)
                // Clear validation error when user starts typing
                if (validationErrors.certificateNumber) {
                  setValidationErrors((prev) => ({
                    ...prev,
                    certificateNumber: undefined,
                  }))
                }
              }}
              onBlur={() => {
                // Validate on blur to show error when user leaves the field
                const error = validateCertificateNumber(certificateNumber, t)
                if (error) {
                  setValidationErrors((prev) => ({
                    ...prev,
                    certificateNumber: error,
                  }))
                }
              }}
              placeholder={t('certificateNumberPlaceholder')}
              className={cn(
                'w-full h-10 rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-50',
                validationErrors.certificateNumber
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-border',
              )}
              maxLength={18} // 4-4-8 format: 4+1+4+1+8 = 18
            />
            {validationErrors.certificateNumber && (
              <p className="text-destructive text-xs mt-1">
                {validationErrors.certificateNumber}
              </p>
            )}
          </div>
        </section>

        {proofResult && (
          <div className="bg-secondary/30 border border-border/50 rounded-2xl mb-2">
            <ProofResultComponent proofResult={proofResult} />
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(WorkflowStep.TRANSFER)}
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

          {proofResult ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full font-medium  transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2">
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
          ) : (
            <button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
              disabled={!issueDate || !certificateNumber || isLoading}>
              {t('generateProof')}
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="max-sm:hidden">
                <path
                  d="M7.5 15L12.5 10L7.5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
