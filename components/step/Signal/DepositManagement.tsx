import { DepositDetails, DepositResult } from '@/components/Home'
import { Button } from '@/components/ui/button'
import { TOKEN_SYMBOL, USDC_SYMBOL } from '@/constant'
import { useContractWrite } from '@/hooks/useContractWrite'
import ADDRESSES from '@/lib/addresses'
import { ESCROW_ABI } from '@/lib/abi'
import { Dispatch, SetStateAction, useContext } from 'react'
import { formatUnits } from 'viem'
import { ErrorType } from '@/lib/errors'
import { ErrorContext } from '@/context/ErrorContext'
import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import { cn } from '@/lib/utils'

const DepositManagement = ({
  depositId,
  depositDetails,
  setDepositDetails,
}: {
  depositId: number | null
  depositDetails: DepositDetails | null
  setDepositDetails: Dispatch<SetStateAction<DepositDetails | null>>
}) => {
  const { setError } = useContext(ErrorContext)

  const {
    writeAndWait: withdrawDepositWrite,
    isLoading: isWithdrawDepositLoading,
  } = useContractWrite({
    onSuccess: () => {
      setDepositDetails(null)
    },
  })

  const handleWithdrawDeposit = async () => {
    if (!depositId) return

    try {
      await withdrawDepositWrite({
        address: ADDRESSES.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'withdrawDeposit',
        args: [BigInt(depositId)],
      })
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      setError(ErrorType.CANCEL_REDEEM_FAILED, {
        error: errorMessage,
      })
    }
  }

  return (
    <div>
      {depositId && depositDetails && (
        <section
          className={cn(
            'p-5 border border-gray-border rounded-[10px] bg-white mt-5',
            'max-sm:p-3 max-sm:rounded-none max-sm:px-0 max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-0 max-sm:mt-2',
          )}>
          <h4 className="font-semibold text">· Deposit Details</h4>
          <section className="border border-gray-border rounded-[10px] p-5 mt-5 bg-gray-300 max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5">
            <div className="grid grid-cols-2 gap-x-[15px] gap-y-[10px] max-sm:grid-cols-1">
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">
                  Deposit ID:
                </span>
                <p className="font-chivo-mono">{depositId}</p>
              </div>
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">Amount:</span>
                <p className="font-chivo-mono">
                  {formatUnits(depositDetails.amount, 6)} {USDC_SYMBOL}
                </p>
              </div>
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">Status:</span>
                <p className="font-chivo-mono">
                  {depositDetails.acceptingIntents ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">
                  Remaining:
                </span>
                <p className="font-chivo-mono">
                  {formatUnits(depositDetails.remainingDeposits, 6)}{' '}
                  {USDC_SYMBOL}
                </p>
              </div>
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">
                  Outstanding Intents:
                </span>
                <p className="font-chivo-mono">
                  {formatUnits(depositDetails.outstandingIntentAmount, 6)}{' '}
                  {USDC_SYMBOL}
                </p>
              </div>
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">
                  Intent Range:
                </span>
                <p className="font-chivo-mono">
                  {formatUnits(depositDetails.intentAmountRange.min, 6)} -{' '}
                  {formatUnits(depositDetails.intentAmountRange.max, 6)}{' '}
                  {USDC_SYMBOL}
                </p>
              </div>
            </div>
          </section>
          <div className="mt-4">
            <Button
              onClick={handleWithdrawDeposit}
              disabled={isWithdrawDepositLoading}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-600 hover:text-white max-sm:w-full">
              {isWithdrawDepositLoading ? 'Withdrawing...' : 'Withdraw Deposit'}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

export default DepositManagement
