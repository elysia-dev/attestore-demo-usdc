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
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Background line */}
        <div className="absolute left-0 right-0 top-4 h-[2px] bg-border/20 rounded-full" />
        
        {/* Progress line */}
        <div
          className="absolute left-0 top-4 h-[2px] bg-primary transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(255,0,122,0.5)]"
          style={{
            width: currentStepIndex > 0
              ? `${(currentStepIndex / (steps.length - 1)) * 100}%`
              : "0",
          }}
        />

        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isUpcoming = index > currentStepIndex;

            return (
              <div key={step.step} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500",
                    isCompleted && "border-primary bg-primary shadow-[0_0_15px_rgba(255,0,122,0.5)]",
                    isCurrent && "border-primary bg-primary shadow-[0_0_20px_rgba(255,0,122,0.6)] animate-pulse",
                    isUpcoming && "border-border bg-secondary/50"
                  )}
                >
                  {(isCompleted || isCurrent) ? (
                    <span className="text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>

                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-300",
                    (isCompleted || isCurrent) && "text-foreground opacity-100",
                    isUpcoming && "text-muted-foreground opacity-60"
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
