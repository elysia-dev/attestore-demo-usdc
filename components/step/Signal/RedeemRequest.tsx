import { RedeemDetails, RedeemResult } from '@/components/Home'
import { Button } from '@/components/ui/button'
import { TOKEN_SYMBOL } from '@/constant'
import { useContractWrite } from '@/hooks/useContractWrite'
import ADDRESSES from '@/lib/addresses'
import { ZK_MINTER_ABI } from '@/lib/abi'
import { Dispatch, SetStateAction, useContext } from 'react'
import { formatUnits } from 'viem'
import { ErrorType } from '@/lib/errors'
import { ErrorContext } from '@/context/ErrorContext'
import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import { cn } from '@/lib/utils'

const RedeemRequest = ({
  redeemId,
  redeemDetails,
  setRedeemId,
  setRedeemDetails,
  setRedeemResult,
  setAccountNumber,
  setAmount,
}: {
  redeemId: number | null
  redeemDetails: RedeemDetails | null
  setRedeemId: Dispatch<SetStateAction<number | null>>
  setRedeemDetails: Dispatch<SetStateAction<RedeemDetails | null>>
  setRedeemResult: Dispatch<SetStateAction<RedeemResult | null>>
  setAccountNumber: Dispatch<SetStateAction<string>>
  setAmount: Dispatch<SetStateAction<string>>
}) => {
  const { setError } = useContext(ErrorContext)

  const { writeAndWait: cancelRedeemWrite, isLoading: isCancelRedeemLoading } =
    useContractWrite({
      onSuccess: () => {
        setRedeemId(null)
        setRedeemDetails(null)
        setRedeemResult(null)
        setAccountNumber('')
        setAmount('')
      },
    })

  const handleCancelRedeem = async () => {
    if (!redeemId) return

    try {
      await cancelRedeemWrite({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: 'cancelRedeem',
        args: [BigInt(redeemId)],
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
      {redeemId && redeemDetails && (
        <section
          className={cn(
            'p-5 border border-gray-border rounded-[10px] bg-white mt-5',
            'max-sm:p-3 max-sm:rounded-none max-sm:px-0 max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-0 max-sm:mt-2',
          )}>
          <h4 className="font-semibold text">· Redeem Request Details</h4>
          <section className="border border-gray-border rounded-[10px] p-5 mt-5 bg-gray-300 max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5">
            <div className="grid grid-cols-2 gap-x-[15px] gap-y-[10px] max-sm:grid-cols-1">
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">
                  Redeem ID:
                </span>
                <p className="font-chivo-mono">{redeemId}</p>
              </div>
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">Amount:</span>
                <p className="font-chivo-mono">
                  {formatUnits(redeemDetails.amount, 18)} {TOKEN_SYMBOL}
                </p>
              </div>
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">Status:</span>
                <p className="font-chivo-mono">
                  Pending (Awaiting fulfillment)
                </p>
              </div>
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">
                  Created Time:
                </span>
                <p className="font-chivo-mono">
                  {new Date(redeemDetails.timestamp * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          </section>
          <div className="mt-4">
            <Button
              onClick={handleCancelRedeem}
              disabled={isCancelRedeemLoading}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-600 hover:text-white max-sm:w-full">
              {isCancelRedeemLoading ? 'Cancelling...' : 'Cancel Request'}
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

export default RedeemRequest
