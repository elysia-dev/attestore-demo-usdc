'use client'

import { cn } from '@/lib/utils'
import { useStepLabels } from '@/hooks/useStepLabels'

interface StepInfo {
  step: WorkflowStep
  number: number
}
export enum WorkflowStep {
  CONNECT = 'connect',
  SIGNAL = 'signal',
  TRANSFER = 'transfer',
  PROOF = 'proof',
  FULFILL = 'fulfill',
}

const steps: StepInfo[] = [
  { step: WorkflowStep.CONNECT, number: 1 },
  { step: WorkflowStep.SIGNAL, number: 2 },
  { step: WorkflowStep.TRANSFER, number: 3 },
  { step: WorkflowStep.PROOF, number: 4 },
  { step: WorkflowStep.FULFILL, number: 5 },
]
interface StepIndicatorProps {
  currentStep: WorkflowStep
  className?: string
}

export function StepIndicator({ currentStep, className }: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex((s) => s.step === currentStep)
  const { getStepLabel } = useStepLabels()

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        {/* Grid layout for better control */}
        <div className="grid grid-cols-5 relative">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex
            const isCurrent = index === currentStepIndex
            const isUpcoming = index > currentStepIndex
            const stepLabel = getStepLabel(step.step)

            return (
              <div key={step.step} className="relative">
                {/* Line extending from circle to next circle */}
                {index < steps.length - 1 && (
                  <div className="absolute left-1/2 top-4 w-full h-[2px] -z-10">
                    <div
                      className={cn(
                        'h-full w-full transition-all duration-700',
                        index < currentStepIndex
                          ? 'bg-primary shadow-[0_0_10px_rgba(255,0,122,0.5)]'
                          : 'bg-border/20',
                      )}
                    />
                  </div>
                )}

                {/* Circle and label container */}
                <div className="flex flex-col items-center gap-1">
                  {/* Circle */}
                  <div
                    className={cn(
                      'relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500',
                      isCompleted &&
                        'border-primary bg-primary shadow-[0_0_15px_rgba(255,0,122,0.5)]',
                      isCurrent &&
                        'border-primary bg-primary shadow-[0_0_20px_rgba(255,0,122,0.6)] animate-pulse',
                      isUpcoming && 'border-border bg-background',
                    )}>
                    {isCompleted || isCurrent ? (
                      <span className="text-xs font-bold text-primary-foreground">
                        {index + 1}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'text-[10px] font-medium transition-all duration-300 whitespace-nowrap',
                      (isCompleted || isCurrent) &&
                        'text-foreground opacity-100',
                      isUpcoming && 'text-muted-foreground opacity-60',
                    )}>
                    {stepLabel}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
