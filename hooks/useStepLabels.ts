import { useTranslations } from 'next-intl'
import { WorkflowStep } from '@/components/StepIndicator'

export const useStepLabels = () => {
  const tStep = useTranslations('step')

  const getStepLabel = (step: WorkflowStep): string => {
    const labels = {
      [WorkflowStep.CONNECT]: tStep('connectWallet'),
      [WorkflowStep.SIGNAL]: tStep('swap'),
      [WorkflowStep.TRANSFER]: tStep('transferKRW'),
      [WorkflowStep.PROOF]: tStep('waitProof'),
      [WorkflowStep.FULFILL]: tStep('transferUSDC'),
    }
    return labels[step] || 'Unknown Step'
  }

  return { getStepLabel }
}
