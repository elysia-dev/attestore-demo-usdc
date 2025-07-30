import IntentManagement from './IntentManagement'
import { IntentDetails } from '@/components/Home'

interface OnrampFlowProps {
  intentId: number
  searchIntentId: number | null
  intentDetails: IntentDetails | null
  handleRefreshMyIntentId: () => void
  setIntentId: (intentId: number) => void
  setSearchIntentId: (searchIntentId: number) => void
  amount: string
}

export default function OnrampFlow({
  intentId,
  searchIntentId,
  intentDetails,
  handleRefreshMyIntentId,
  setIntentId,
  setSearchIntentId,
}: OnrampFlowProps) {
  console.log('intentId in onRampFlow', intentId)
  return (
    <IntentManagement
      intentId={intentId}
      searchIntentId={searchIntentId}
      intentDetails={intentDetails}
      handleRefreshMyIntentId={handleRefreshMyIntentId}
      setIntentId={setIntentId}
      setSearchIntentId={setSearchIntentId}
    />
  )
}
