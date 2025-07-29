import { forwardRef } from 'react'

const ErrorMessage = forwardRef<
  HTMLDivElement,
  { error: string | null; freeError: () => void }
>(function ErrorMessage({ error, freeError }, ref) {
  if (!error) return null

  return (
    <section
      ref={ref}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground">{error}</p>
          </div>
          <button
            onClick={freeError}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            <svg
              className="w-5 h-5"
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
          </button>
        </div>
      </div>
    </section>
  )
})

export default ErrorMessage
