"use client";

import { cn } from "@/lib/utils";

interface StepInfo {
  step: string;
  label: string;
  number: number;
}

const steps: StepInfo[] = [
  { step: "connect", label: "Connect", number: 1 },
  { step: "signal", label: "Signal", number: 2 },
  { step: "transfer", label: "Transfer", number: 3 },
  { step: "proof", label: "Proof", number: 4 },
  { step: "fulfill", label: "Fulfill", number: 5 },
];

interface StepIndicatorProps {
  currentStep: string;
  className?: string;
}

export function StepIndicator({ currentStep, className }: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex((s) => s.step === currentStep);

  return (
    <div
      className={cn(
        "w-full max-w-[600px] mx-auto my-10 max-sm:mb-6",
        className
      )}
    >
      <div className="relative">
        {/* Background line */}
        <div className="absolute left-[20px] right-[20px] top-[20px] h-[2px] bg-gray-border max-sm:left-[16px] max-sm:right-[16px] max-sm:top-[16px]" />
        {/* Progress line */}
        <div
          className="absolute left-[20px] top-[20px] h-[2px] bg-blue-primary transition-all duration-500 ease-out max-sm:left-[16px] max-sm:top-[16px]"
          style={{
            width:
              currentStepIndex > 0
                ? `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - ${
                    40 / (steps.length - 1)
                  }px)`
                : "0",
          }}
        />

        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isUpcoming = index > currentStepIndex;

            return (
              <div key={step.step} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white transition-all duration-300 max-sm:h-8 max-sm:w-8",
                    isCompleted && "border-blue-primary bg-blue-primary",
                    isCurrent && "border-blue-primary bg-white animate-pulse",
                    isUpcoming && "border-gray-border bg-white"
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="h-5 w-5 text-white max-sm:h-4 max-sm:w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-semibold transition-colors max-sm:text-xs",
                        isCurrent && "text-blue-primary",
                        isUpcoming && "text-gray-500"
                      )}
                    >
                      {step.number}
                    </span>
                  )}
                </div>

                <span
                  className={cn(
                    "text-xs font-medium transition-colors max-sm:text-[10px]",
                    (isCompleted || isCurrent) && "text-blue-primary",
                    isUpcoming && "text-gray-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
