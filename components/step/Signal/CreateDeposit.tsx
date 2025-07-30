import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BanknoteIcon } from 'lucide-react'
import { decodeEventLog, erc20Abi, keccak256, parseUnits, toBytes } from 'viem'
import { DepositResult } from '@/components/Home'
import ADDRESSES from '@/lib/addresses'
import { ESCROW_ABI } from '@/lib/abi'
import { useContext, useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useContractWrite } from '@/hooks/useContractWrite'
import { TOKEN_SYMBOL, USDC_SYMBOL, KRW_CURRENCY_CODE } from '@/constant'
import { ErrorType } from '@/lib/errors'
import { ErrorContext } from '@/context/ErrorContext'
import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import { cn } from '@/lib/utils'

export default function CreateDeposit({
  accountNumber,
  amount,
  handleRefreshDepositDetails,
  depositId,
  depositResult,
  setAccountNumber,
  setAmount,
  setDepositResult,
  autoCreate = false,
}: {
  accountNumber: string
  amount: string
  handleRefreshDepositDetails: (targetDepositId: number) => Promise<void>
  depositId: number | null
  depositResult: DepositResult | null
  setAccountNumber: (accountNumber: string) => void
  setAmount: (amount: string) => void
  setDepositResult: (depositResult: DepositResult) => void
  autoCreate?: boolean
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

  const { writeAndWait: createDepositWrite } = useContractWrite({
    onSuccess: (receipt) => {
      try {
        const depositCreatedEvent = receipt.logs.find((log: any) => {
          const depositCreatedTopic = keccak256(
            toBytes(
              'DepositCreated(uint256,address,address,uint256,(uint256,uint256))',
            ),
          )
          return (
            log.topics[0] === depositCreatedTopic &&
            log.address.toLowerCase() === ADDRESSES.ESCROW.toLowerCase()
          )
        })

        if (depositCreatedEvent) {
          const decodedLog = decodeEventLog({
            abi: ESCROW_ABI,
            data: depositCreatedEvent.data,
            topics: depositCreatedEvent.topics,
          })

          const { depositId: newDepositId } = decodedLog.args as unknown as {
            depositId: bigint
          }

          const depositIdNumber = Number(newDepositId)
          setDepositResult({
            success: true,
            depositId: depositIdNumber,
            txHash: receipt.transactionHash,
          })
          handleRefreshDepositDetails(depositIdNumber)
        }
      } catch (error) {
        console.error('Failed to parse DepositCreated event:', error)
      }
    },
  })

  const checkAllowance = async (depositAmount: bigint): Promise<boolean> => {
    if (!address || !publicClient) return false

    const allowance = await publicClient.readContract({
      address: ADDRESSES.USDC,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [address, ADDRESSES.ESCROW],
    })

    return allowance >= depositAmount
  }

  // Auto-create deposit when component mounts if autoCreate is true
  useEffect(() => {
    if (autoCreate && accountNumber && amount && !depositId && !isProcessing) {
      handleCreateDeposit()
    }
  }, [autoCreate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateDeposit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!accountNumber || !amount || !address) {
      setError(ErrorType.REQUIRED_FIELDS_MISSING)
      return
    }

    try {
      setIsProcessing(true)
      setProcessStep('Checking requirements...')
      setProcessProgress({ current: 1, total: 3 })

      // 1. Skip checking for existing deposits due to contract interface mismatch
      // In a production environment, you would need to implement proper tracking
      // of user deposits, possibly through events or a different contract method

      // 2. Check user token balance
      const balance = await publicClient?.readContract({
        address: ADDRESSES.USDC,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      })

      const depositAmount = parseUnits(amount, 6) // USDC has 6 decimals

      if (!balance || balance < depositAmount) {
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
      const hasAllowance = await checkAllowance(depositAmount)

      if (!hasAllowance) {
        setProcessStep('Approving tokens...')
        setProcessProgress({ current: 2, total: 3 })

        console.log('Insufficient allowance, requesting approval...')
        await approveWrite({
          address: ADDRESSES.USDC,
          abi: erc20Abi,
          functionName: 'approve',
          args: [ADDRESSES.ESCROW, depositAmount],
        })

        console.log('Approval successful')
      }

      // 5. Create deposit
      setProcessStep('Creating deposit...')
      setProcessProgress({ current: 3, total: 3 })

      // Set intent amount range (min: 100 USDC, max: deposit amount)
      const minIntentAmount = parseUnits('100', 6)
      const maxIntentAmount = depositAmount

      // Prepare verifier data
      const verifierData = [
        {
          payeeDetails: accountNumber.trim(),
          data: '0x', // Add the required data field
        },
      ]

      // Prepare currency data for TossBank verifier
      const currencies = [
        {
          code: KRW_CURRENCY_CODE,
          conversionRate: parseUnits('1380', 18), // 1 USDC = 1380 KRW
        },
      ]

      await createDepositWrite({
        address: ADDRESSES.ESCROW,
        abi: ESCROW_ABI,
        functionName: 'createDeposit',
        args: [
          ADDRESSES.USDC, // token
          depositAmount, // amount
          { min: minIntentAmount, max: maxIntentAmount }, // intentAmountRange
          [ADDRESSES.TOSS_BANK_VERIFIER], // verifiers
          verifierData, // verifierData
          currencies, // currencies
        ],
      })

      setProcessStep('Success! Deposit created.')
    } catch (error) {
      const errorMessage = extractErrorMessage(error)
      console.error('CreateDeposit error:', error)
      setError(`Deposit creation failed: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
      setProcessStep('')
      setProcessProgress({ current: 0, total: 0 })
    }
  }

  // If autoCreate is true and processing, show processing state
  if (autoCreate && isProcessing && !depositResult) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 animate-pulse">
            <BanknoteIcon className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">Creating Your Deposit</h3>
        <p className="text-sm text-muted-foreground mb-4">{processStep}</p>
        {processProgress.total > 0 && (
          <div className="max-w-xs mx-auto">
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(processProgress.current / processProgress.total) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Step {processProgress.current} of {processProgress.total}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <section
      className={cn(
        'mt-5 p-5 bg-gray-300 rounded-[10px] border border-gray-border',
        'max-sm:p-3 max-sm:rounded-none max-sm:px-0 max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-0 max-sm:bg-white max-sm:mt-2',
      )}>
      {/* Create New Deposit */}
      {!depositId && (
        <div className="mt-5 max-sm:mt-3">
          <p className="body font-bold">
            <strong
              className={cn(
                'text-blue-primary w-4 mr-1',
                'max-sm:mr-0.5 max-sm:w-3',
              )}>
              ◆
            </strong>{' '}
            Create a Deposit
          </p>
          <div
            className={cn(
              'space-y-[5px] text text-gray-600 pl-4 mt-[15px]',
              'max-sm:pl-3.5 max-sm:mt-[5px]',
            )}>
            <p>
              Enter your bank account details and the amount of USDC you want to
              deposit.
            </p>
          </div>

          <form
            onSubmit={handleCreateDeposit}
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
                  Amount ({USDC_SYMBOL})
                </Label>
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1000.0"
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
              {isProcessing ? 'Processing...' : 'Create Deposit'}
            </Button>
          </form>
        </div>
      )}

      {/* Success Message */}
      {depositResult?.success && (
        <section className="mt-5 p-5 bg-white rounded-[10px] border border-gray-border max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5">
          <h3 className="text font-semibold">Deposit Created Successfully</h3>
          <section className="border border-gray-border rounded-[10px] p-5 mt-5 bg-gray-300 space-y-[10px] max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5">
            <div className="text">
              <span className="font-chivo-mono text-gray-600">Deposit ID:</span>{' '}
              <p className="font-chivo-mono">{depositResult?.depositId}</p>
            </div>
            <div className="text">
              <span className="font-chivo-mono text-gray-600">
                Transaction Hash:
              </span>{' '}
              <p className="font-chivo-mono">{depositResult?.txHash}</p>
            </div>
          </section>
          <p className="text-blue-primary mt-4 text max-sm:mt-2.5">
            Your USDC has been deposited. The admin will process KRW transfers
            to your bank account.
          </p>
        </section>
      )}
    </section>
  )
}
