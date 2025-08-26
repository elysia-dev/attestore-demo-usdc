import { Button } from './button'
import { useTranslations } from 'next-intl'

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  name,
  transferAmount,
  memo,
  address,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  name: string
  transferAmount: number
  memo: string
  address: string
}) {
  const tCommon = useTranslations('common')
  const tConfirmationModal = useTranslations('confirmationModal')

  if (!isOpen) return null

  const ArrowIcon = () => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="inline-block"
        aria-hidden="true"
        focusable="false">
        <path d="M9 18l6-6-6-6" />
      </svg>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center mb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#00000060] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <aside className="relative min-w-[320px] z-10 max-w-[400px] mx-auto w-[90%] bg-card/95 backdrop-blur-xl rounded-3xl overflow-hidden border border-border/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/30">
          <h3 className="text-lg font-semibold">
            {tConfirmationModal('title')}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary/50 transition-colors">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-sm text-muted-foreground mb-4">
            {tConfirmationModal('question')}
          </p>
          <div className="mb-6 p-5 bg-gradient-to-r from-red-500/5 via-orange-500/10 to-red-500/5 border border-red-500/20 rounded-2xl shadow-lg backdrop-blur-sm relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-bold text-red-600 dark:text-red-400 text-center leading-relaxed drop-shadow-sm flex items-center justify-center gap-2">
                <span className="inline-block animate-caret-blink">⚠️</span>
                {tConfirmationModal('question2')}
              </p>
            </div>
          </div>
          <section className="relative w-full max-h-[600px] aspect-[1080/1394] bg-[#18171c] rounded-2xl overflow-hidden">
            <section className="pt-10">
              <p className="text-white text-center text-[22px] font-bold">
                <span className="text-[#3a83f1]">{name}</span>
                {tConfirmationModal('recipientDisplay')}
              </p>
              <p className="text-white text-center text-[22px] font-bold">
                {transferAmount.toLocaleString()}
                {tConfirmationModal('amountDisplay')}
              </p>
              <p className="text-white text-center text-[22px] font-bold">
                {tConfirmationModal('confirmQuestion')}
              </p>
            </section>
            <section className="flex flex-col absolute bottom-10 w-[90%] -translate-x-1/2 left-1/2 gap-2">
              <div className="flex justify-between w-full items-center">
                <p className="text-[#7e7e86] label">
                  {tConfirmationModal('receiverLabel')}
                </p>
                <div className="flex items-center">
                  <p className="text-blue-primary font-bold border border-red-primary px-2 py-1 label">
                    {memo}
                  </p>
                  <ArrowIcon />
                </div>
              </div>
              <div className="flex justify-between w-full items-center">
                <p className="text-[#7e7e86] label">
                  {tConfirmationModal('withdrawAccountLabel')}
                </p>
                <div className="flex items-center">
                  <p className="text-white label pr-2">-</p>
                  <ArrowIcon />
                </div>
              </div>
              <div className="flex justify-between w-full items-center">
                <p className="text-[#7e7e86] label">
                  {tConfirmationModal('depositAccountLabel')}
                </p>
                <div className="flex items-center">
                  <p className="text-blue-primary font-bold border border-red-primary px-2 py-1 label">
                    {address}
                  </p>
                  <ArrowIcon />
                </div>
              </div>
            </section>
          </section>

          {/* Buttons */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary/70 transition-all duration-200 border border-border/30 hover:border-border/50 text-sm font-semibold">
              {tConfirmationModal('no')}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-all duration-200 hover:shadow-lg">
              {tConfirmationModal('yes')}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

export default ConfirmationModal
