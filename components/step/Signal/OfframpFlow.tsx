import CreateDeposit from './CreateDeposit'
import DepositManagement from './DepositManagement'
import { WaitingForDepositFulfillment } from '@/components/WaitingForDepositFulfillment'
import { DepositDetails, DepositResult } from '@/components/Home'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { SignalMode } from '.'

interface OfframpFlowProps {
  depositId: number | null
  depositDetails: DepositDetails | null
  depositResult: DepositResult | null
  showDepositWaiting: boolean
  depositTimestamp: number | null
  accountNumber: string
  amount: string
  setDepositDetails: Dispatch<SetStateAction<DepositDetails | null>>
  setDepositResult: (result: DepositResult | null) => void
  setShowDepositWaiting: (show: boolean) => void
  setDepositTimestamp: (timestamp: number | null) => void
  setAccountNumber: (accountNumber: string) => void
  setAmount: (amount: string) => void
  handleRefreshDepositDetails: (depositId: number) => Promise<void>
  setMode: (mode: SignalMode) => void
  isOnramp: boolean
}

export default function OfframpFlow({
  depositId,
  depositDetails,
  depositResult,
  showDepositWaiting,
  depositTimestamp,
  accountNumber,
  amount,
  setDepositDetails,
  setDepositResult,
  setShowDepositWaiting,
  setDepositTimestamp,
  setAccountNumber,
  setAmount,
  handleRefreshDepositDetails,
  setMode,
  isOnramp,
}: OfframpFlowProps) {
  console.log('!!!!!!!!!!!!!!!!offRampflow!!!!!!!!!!!!!!!!!!')
  // Use a default timestamp to avoid hydration mismatch
  const [defaultTimestamp] = useState(() => Math.floor(Date.now() / 1000))

  if (depositId && showDepositWaiting) {
    return (
      <WaitingForDepositFulfillment
        depositId={depositId.toString()}
        depositTimestamp={depositTimestamp || defaultTimestamp}
        amount={amount}
        accountNumber={accountNumber}
        onComplete={() => {
          // Reset deposit state
          setDepositResult(null)
          setShowDepositWaiting(false)
          setDepositTimestamp(null)
          setAccountNumber('')
          setAmount('')
          // Switch back to onramp mode
          setMode(SignalMode.ONRAMP)
        }}
        onCancel={() => {
          setShowDepositWaiting(false)
        }}
      />
    )
  }
  console.log('depositId', depositId)
  console.log('depositDetails', depositDetails)

  if (depositId) {
    return (
      <DepositManagement
        depositId={depositId}
        depositDetails={depositDetails}
        setDepositDetails={setDepositDetails}
      />
    )
  }

  return (
    <CreateDeposit
      depositId={depositId}
      accountNumber={accountNumber}
      amount={amount}
      handleRefreshDepositDetails={handleRefreshDepositDetails}
      depositResult={depositResult}
      setDepositResult={(result) => {
        setDepositResult(result)
        if (result?.success) {
          setDepositTimestamp(Math.floor(Date.now() / 1000))
          setShowDepositWaiting(true)
        }
      }}
      setAccountNumber={setAccountNumber}
      setAmount={setAmount}
      autoCreate={true}
    />
  )
}
