import { formatUnits } from 'viem'
import { IntentDetails, WorkflowStep } from '../Home'
import { TOSS_ACCOUNT_NUMBER } from '@/constant'
import { useContext, useState } from 'react'
import { ErrorContext } from '@/context/ErrorContext'
import QRCode from 'react-qr-code'

import { VideoPopup } from '@/components/ui/VideoPopup'
import { cn } from '@/lib/utils'
import { useTossLauncher } from '../../hooks/useTossLauncher'
import ConfirmationModal from '../ui/ConfirmationModal'

export default function Transfer({
  intentId,
  intentDetails,
  setCurrentStep,
}: {
  intentId: number | null
  intentDetails: IntentDetails | null
  setCurrentStep: (step: WorkflowStep) => void
}) {
  const { freeError } = useContext(ErrorContext)
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)

  const checkAndGoNext = () => {
    setCurrentStep(WorkflowStep.PROOF)
    freeError()
    setIsConfirmationModalOpen(false)
  }

  const handleConfirmTransfer = () => {
    setIsConfirmationModalOpen(true)
  }

  const amount = formatUnits(intentDetails?.amount ?? BigInt(0), 18)
  const qrCodeUrl = `supertoss://send?amount=${amount}&bank=%ED%86%A0%EC%8A%A4%EB%B1%85%ED%81%AC&accountNo=${TOSS_ACCOUNT_NUMBER}&origin=qr`

  const { launch, fallback, storeURL, reset } = useTossLauncher(qrCodeUrl)

  // 계좌번호 복사 함수
  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(TOSS_ACCOUNT_NUMBER)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy account number:', err)
    }
  }

  const BackAccountCopyButton = () => {
    return (
      <button
        onClick={handleCopyAccountNumber}
        className={cn(
          'flex items-center gap-2 text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary',
          isCopied && 'bg-primary text-primary-foreground border-primary',
        )}
        title="Click to copy account number">
        {isCopied ? (
          <span>Copied!</span>
        ) : (
          <>
            <span>토스뱅크 {TOSS_ACCOUNT_NUMBER}</span>
            <CopyButtonIcon />
          </>
        )}
      </button>
    )
  }

  return (
    <section className="space-y-6">
      {/* 토스 송금 데모 비디오 */}
      <section className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50">
        <button
          onClick={() => setIsVideoPopupOpen(true)}
          className="w-full px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-200 border border-primary/20 flex items-center justify-center gap-2 text-sm font-medium text-primary sm:hidden">
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
          Play Tutorial Video
        </button>

        <div className="flex justify-center items-center rounded-2xl border border-border/50 overflow-hidden max-sm:hidden bg-secondary/30">
          <video controls className="w-full rounded-lg h-[640px]">
            <source src="/tossbank_transfer_korean_.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </section>

      {/* Video Popup */}
      <VideoPopup
        isOpen={isVideoPopupOpen}
        onClose={() => setIsVideoPopupOpen(false)}
        videoSrc="/tossbank_transfer_korean_.mp4"
        title="Bank Transfer Demo"
      />

      {/* 토스 송금 안내 - Intent ID가 있을 때만 표시 */}
      {intentId && intentDetails?.amount && (
        <section className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary">◆</span>
              Send money via Bank app
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground ml-6">
              <p>
                1. Send KRW WON to the recipient via{' '}
                <span className="text-foreground font-medium">Bank app.</span>
              </p>
              <p>
                2. You{' '}
                <span className="text-foreground font-medium">
                  must use Toss (In this version)
                </span>{' '}
                as the sending bank.
              </p>
            </div>
          </div>
          {/* QR Code for Toss payment */}
          <div className="flex justify-center pt-4 pb-4 max-sm:hidden">
            <div className="bg-background p-4 rounded-2xl border border-border/50">
              <QRCode value={qrCodeUrl} size={200} level="H" />
            </div>
          </div>
          <button
            onClick={launch}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2 sm:hidden">
            Send via Bank App
            <ExternalLinkIcon />
          </button>
          {fallback && (
            <button
              onClick={() => {
                window.open(storeURL, '_blank')
                reset()
              }}
              className="w-full px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary/70 transition-all duration-200 border border-border/50 flex items-center justify-center gap-2 text-sm font-medium sm:hidden mt-2">
              Install Bank App
              <ExternalLinkIcon />
            </button>
          )}

          <section className="bg-secondary/30 rounded-2xl p-4 space-y-3 border border-border/50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Recipient Name</p>
              <p className="text-sm font-medium">
                이 현 민{' '}
                <span className="text-muted-foreground">(Bank account)</span>
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Bank Account</p>
              <BackAccountCopyButton />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Transfer Memo</p>
              <p className="text-sm font-medium text-primary">{intentId}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="text-sm font-medium">
                {formatUnits(intentDetails?.amount, 18)} KRW
              </p>
            </div>
          </section>
        </section>
      )}

      {!intentId && (
        <p className="text-center text-sm text-muted-foreground">
          Please lookup Intent ID first. (click previous)
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
          Previous
        </button>

        <button
          onClick={() => {
            handleConfirmTransfer()
          }}
          disabled={!intentId}
          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-8 py-3 rounded-full font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2">
          Next
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={checkAndGoNext}
        name={`이현민(모임통장)`}
        amount={amount}
        memo={intentId ?? ''}
        address={`토스뱅크 ${TOSS_ACCOUNT_NUMBER}`}
      />
    </section>
  )
}

const CopyButtonIcon = () => {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

const ExternalLinkIcon = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path
        d="M7 3H5.5C4.11929 3 3 4.11929 3 5.5V12.5C3 13.8807 4.11929 15 5.5 15H12.5C13.8807 15 15 13.8807 15 12.5V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 3H15V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 10L15 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
