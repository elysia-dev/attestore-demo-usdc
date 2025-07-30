import { useState } from 'react'
import { usePublicClient } from 'wagmi'
import useDepositStore from '@/stores/useDepositStore'
import { DepositDetails } from './Home'

interface DepositDetailDisplayProps {
  depositDetails: DepositDetails | null
}

export default function DepositDetailDisplay({
  depositDetails,
}: DepositDetailDisplayProps) {
  const publicClient = usePublicClient()
  const { fetchDepositIntentIds, isLoadingIntentIds } = useDepositStore()
  const [intentIds, setIntentIds] = useState<bigint[]>([])
  const [showIntentIds, setShowIntentIds] = useState(false)

  const handleFetchIntentIds = async () => {
    if (!depositDetails?.id || !publicClient) return

    const ids = await fetchDepositIntentIds(publicClient, depositDetails.id)
    setIntentIds(ids)
    setShowIntentIds(true)
  }

  if (!depositDetails) {
    return <div className="text-muted-foreground">No deposit selected</div>
  }

  return (
    <div className="space-y-4">
      <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Deposit ID:</span>
          <span className="font-mono">{depositDetails.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount:</span>
          <span className="font-mono">{depositDetails.amount.toString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Remaining:</span>
          <span className="font-mono">
            {depositDetails.remainingDeposits.toString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Outstanding Intents:</span>
          <span className="font-mono">
            {depositDetails.outstandingIntentAmount.toString()}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleFetchIntentIds}
          disabled={isLoadingIntentIds}
          className="w-full bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-all duration-200">
          {isLoadingIntentIds ? 'Loading Intent IDs...' : 'Show Intent IDs'}
        </button>

        {showIntentIds && intentIds.length > 0 && (
          <div className="bg-secondary/30 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2">Intent IDs:</h4>
            <div className="space-y-1">
              {intentIds.map((id, index) => (
                <div key={index} className="font-mono text-sm">
                  {id.toString()}
                </div>
              ))}
            </div>
          </div>
        )}

        {showIntentIds && intentIds.length === 0 && (
          <div className="text-muted-foreground text-sm">
            No intents found for this deposit
          </div>
        )}
      </div>
    </div>
  )
}
