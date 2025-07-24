/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { decodeEventLog, erc20Abi, keccak256, parseUnits, toBytes } from 'viem'
import { RedeemResult } from '@/components/Home'
import ADDRESSES from '@/lib/addresses'
import { ZK_MINTER_ABI } from '@/lib/abi'
import { useContext, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useContractWrite } from '@/hooks/useContractWrite'
import { TOKEN_SYMBOL } from '@/constant'
import { ErrorType } from '@/lib/errors'
import { ErrorContext } from '@/context/ErrorContext'
import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import { cn } from '@/lib/utils'

export default function Redeem({
  accountNumber,
  amount,
  handleRefreshRedeemDetails,
  redeemId,
  redeemResult,
  setAccountNumber,
  setAmount,
  setRedeemId,
  setRedeemResult,
}: {
  accountNumber: string
  amount: string
  handleRefreshRedeemDetails: (targetRedeemId: number) => Promise<void>
  redeemId: number | null
  redeemResult: RedeemResult | null
  setAccountNumber: (accountNumber: string) => void
  setAmount: (amount: string) => void
  setRedeemId: (redeemId: number) => void
  setRedeemResult: (redeemResult: RedeemResult) => void
}) {
  const { setError } = useContext(ErrorContext)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processStep, setProcessStep] = useState<string>('')
  const [processProgress, setProcessProgress] = useState<{
    current: number
    total: number
  }>({ current: 0, total: 0 })

  const { address } = useAccount()
  const publicClient = usePublicClient()

  const { writeAndWait: approveWrite } = useContractWrite({
    onSuccess: () => {
      console.log('Approve transaction successful')
    },
  })

  const { writeAndWait: signalRedeemWrite } = useContractWrite({
    onSuccess: (receipt) => {
      try {
        const redeemSignaledEvent = receipt.logs.find((log: any) => {
          const redeemSignaledTopic = keccak256(
            toBytes('RedeemRequestSignaled(uint256,address,uint256,string)'),
          )
          return (
            log.topics[0] === redeemSignaledTopic &&
            log.address.toLowerCase() === ADDRESSES.ZK_MINTER.toLowerCase()
          )
        })

        if (redeemSignaledEvent) {
          const decodedLog = decodeEventLog({
            abi: ZK_MINTER_ABI,
            data: redeemSignaledEvent.data,
            topics: redeemSignaledEvent.topics,
          })

          const { redeemId: newRedeemId } = decodedLog.args as unknown as {
            redeemId: bigint
          }

          const redeemIdNumber = Number(newRedeemId)
          setRedeemId(redeemIdNumber)
          setRedeemResult({
            success: true,
            redeemId: redeemIdNumber,
            txHash: receipt.transactionHash,
          })
          handleRefreshRedeemDetails(redeemIdNumber)
        }
      } catch (error) {
        console.error('Failed to parse RedeemRequestSignaled event:', error)
      }
    },
  })

  const checkAllowance = async (redeemAmount: bigint): Promise<boolean> => {
    if (!address || !publicClient) return false

    const allowance = await publicClient.readContract({
      address: ADDRESSES.TOKEN,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address, ADDRESSES.ZK_MINTER],
    })

    return allowance >= redeemAmount
  }

  const handleSignalRedeem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accountNumber || !amount || !address) {
      setError(ErrorType.REQUIRED_FIELDS_MISSING)
      return
    }

    try {
      setIsProcessing(true)
      setProcessStep('Checking requirements...')
      setProcessProgress({ current: 1, total: 3 })

      // 1. Check if user already has an existing redeem request
      const existingRedeemId = await publicClient?.readContract({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: 'accountRedeemRequest',
        args: [address],
      })

      if (existingRedeemId && Number(existingRedeemId) > 0) {
        setError(ErrorType.REDEEM_ALREADY_EXISTS)
        return
      }

      // 2. Check user token balance
      const balance = await publicClient?.readContract({
        address: ADDRESSES.TOKEN,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      })

      const redeemAmount = parseUnits(amount, 18)

      if (!balance || balance < redeemAmount) {
        setError(ErrorType.INSUFFICIENT_BALANCE)
        return
      }

      // 3. Validate account number
      if (!accountNumber.trim()) {
        setError(ErrorType.ACCOUNT_NUMBER_EMPTY)
        return
      }

      // 4. Check and handle token approval
      setProcessStep('Checking token approval...')
      const hasAllowance = await checkAllowance(redeemAmount)

      if (!hasAllowance) {
        setProcessStep('Approving tokens...')
        setProcessProgress({ current: 2, total: 3 })

        console.log('Insufficient allowance, requesting approval...')
        await approveWrite({
          address: ADDRESSES.TOKEN,
          abi: erc20Abi,
          functionName: 'approve',
          args: [ADDRESSES.ZK_MINTER, redeemAmount],
        })

        console.log('Approval successful')
      }

      // 5. Create redeem request
      setProcessStep('Creating redeem request...')
      setProcessProgress({ current: 3, total: 3 })

      await signalRedeemWrite({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: 'signalRedeem',
        args: [accountNumber.trim(), redeemAmount],
      })

      setProcessStep('Success! Redeem request created.')
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      console.error('SignalRedeem error:', error)
      setError(`Redeem process failed: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
      setProcessStep('')
      setProcessProgress({ current: 0, total: 0 })
    }
  }

  return (
    <section
      className={cn(
        'mt-5 p-5 bg-gray-300 rounded-[10px] border border-gray-border',
        'max-sm:p-3 max-sm:rounded-none max-sm:px-0 max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-0 max-sm:bg-white max-sm:mt-2',
      )}>
      {/* Create New Redeem Request */}
      {!redeemId && (
        <div className="mt-5 max-sm:mt-3">
          <p className="body font-bold">
            <strong
              className={cn(
                'text-blue-primary w-4 mr-1',
                'max-sm:mr-0.5 max-sm:w-3',
              )}>
              ◆
            </strong>{' '}
            Create a Redeem Request
          </p>
          <div
            className={cn(
              'space-y-[5px] text text-gray-600 pl-4 mt-[15px]',
              'max-sm:pl-3.5 max-sm:mt-[5px]',
            )}>
            <p>
              Enter your bank account details and the amount you want to redeem.
            </p>
          </div>

          <form
            onSubmit={handleSignalRedeem}
            className="space-y-5 mt-5 max-sm:mt-3 max-sm:space-y-2.5">
            <section
              className={cn(
                'p-5 border border-gray-border rounded-[10px] bg-white space-y-2.5',
                'max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5 max-sm:bg-gray-300',
              )}>
              <div className="space-y-[5px]">
                <Label htmlFor="accountNumber" className="text font-semibold">
                  · Bank Account Number
                </Label>
                <Input
                  id="accountNumber"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="12345678"
                  className="text max-sm:label border-gray-border bg-white rounded-[5px] py-2.5 px-[15px] max-sm:py-[5px] max-sm:px-2"
                />
              </div>

              <div className="space-y-[5px]">
                <Label htmlFor="amount" className="text font-semibold">
                  Amount ({TOKEN_SYMBOL})
                </Label>
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1.0"
                  className="text max-sm:label border-gray-border bg-white rounded-[5px] py-2.5 px-[15px] max-sm:py-[5px] max-sm:px-2"
                />
              </div>

              {/* Progress indicator */}
              {isProcessing && (
                <div className="p-5 border border-gray-border rounded-[10px] max-sm:bg-white bg-gray-300 mt-5 max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text">{processStep}</span>
                    <span className="text-black text font-semibold">
                      {processProgress.current}/{processProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2 border border-gray-border">
                    <div
                      className="bg-blue-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (processProgress.current / processProgress.total) *
                          100
                        }%`,
                      }}></div>
                  </div>
                </div>
              )}
            </section>

            <Button
              type="submit"
              className="disabled:bg-black/50 bg-black/75 text-white font-semibold hover:bg-black transition-colors duration-200 max-sm:w-full"
              disabled={!accountNumber || !amount || isProcessing}>
              {isProcessing ? 'Processing...' : 'Create Redeem Request'}
            </Button>
          </form>
        </div>
      )}

      {/* Success Message */}
      {redeemResult?.success && (
        <section className="mt-5 p-5 bg-white rounded-[10px] border border-gray-border max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5">
          <h3 className="text font-semibold">
            Redeem Request Created Successfully
          </h3>
          <section className="border border-gray-border rounded-[10px] p-5 mt-5 bg-gray-300 space-y-[10px] max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5">
            <div className="text">
              <span className="font-chivo-mono text-gray-600">Redeem ID:</span>{' '}
              <p className="font-chivo-mono">{redeemResult?.redeemId}</p>
            </div>
            <div className="text">
              <span className="font-chivo-mono text-gray-600">
                Transaction Hash:
              </span>{' '}
              <p className="font-chivo-mono">{redeemResult?.txHash}</p>
            </div>
          </section>
          <p className="text-blue-primary mt-4 text max-sm:mt-2.5">
            Your tokens have been escrowed. The admin will process your request
            and send fiat to your bank account.
          </p>
        </section>
      )}
    </section>
  )
}
