import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import { DEFAULT_DEPOSIT_ID, KRW_CURRENCY_CODE } from '@/constant'
import { ErrorContext } from '@/context/ErrorContext'
import { ESCROW_ABI } from '@/lib/abi'
import ADDRESSES from '@/lib/addresses'
import { ErrorType } from '@/lib/errors'
import { useContext, useState } from 'react'
import {
  decodeEventLog,
  erc20Abi,
  formatUnits,
  keccak256,
  parseUnits,
  toBytes,
} from 'viem'
import { SignalMode } from '.'
import { useContractWrite } from '@/hooks/useContractWrite'
import { useAccount, usePublicClient } from 'wagmi'
import CreateDeposit from './CreateDeposit'
import { DepositResult } from '@/components/Home'

interface SwapInterfaceProps {
  fetchAllDeposits: () => void
  amount: string
  setAmount: (amount: string) => void
  isOnramp: boolean
  setMode: (mode: SignalMode) => void
  recipientAddress: string
  setRecipientAddress: (address: string) => void
  accountNumber: string
  setAccountNumber: (accountNumber: string) => void
  conversionRate: bigint | null
  calculateConvertedAmount: (amount: string, isBuying: boolean) => string
  setIntentId: (intentId: number) => void
  setSearchIntentId: (searchIntentId: number) => void
  handleRefreshMyIntentId: () => void

  setDepositResult: (depositResult: DepositResult) => void
  setShowDepositWaiting: (show: boolean) => void
  setDepositTimestamp: (timestamp: number) => void
  handleRefreshDepositDetails: (depositId: number) => Promise<void>
}

export default function SwapInterface({
  fetchAllDeposits,
  amount,
  setAmount,
  isOnramp,
  setMode,
  recipientAddress,
  setRecipientAddress,
  accountNumber,
  setAccountNumber,
  conversionRate,
  calculateConvertedAmount,
  setIntentId,
  setSearchIntentId,
  handleRefreshMyIntentId,

  setDepositResult,
  setShowDepositWaiting,
  setDepositTimestamp,
  handleRefreshDepositDetails,
}: SwapInterfaceProps) {
  const publicClient = usePublicClient()
  const [isSwapping, setIsSwapping] = useState(false)
  const { setError, freeError } = useContext(ErrorContext)
  const { address } = useAccount()
  // Contract write hook for signalIntent
  const { writeAndWait: signalIntentWrite, isLoading: isSignalIntentLoading } =
    useContractWrite({
      onSuccess: (receipt) => {
        // signalIntent 성공 시 intentId 추출
        try {
          const intentSignaledEvent = receipt.logs.find((log: any) => {
            const intentSignaledTopic = keccak256(
              toBytes('IntentSignaled(address,address,uint256,uint256)'),
            )
            return (
              log.topics[0] === intentSignaledTopic &&
              log.address.toLowerCase() === ADDRESSES.ESCROW.toLowerCase()
            )
          })

          if (intentSignaledEvent) {
            const decodedLog = decodeEventLog({
              abi: ESCROW_ABI,
              data: intentSignaledEvent.data,
              topics: intentSignaledEvent.topics,
            })

            const { intentId: newIntentId } = decodedLog.args as {
              to: string
              verifier: string
              amount: bigint
              intentId: bigint
            }

            const intentIdNumber = Number(newIntentId)
            setIntentId(intentIdNumber)
            setSearchIntentId(intentIdNumber)
            handleRefreshMyIntentId()
            // Reset form after successful intent creation
            setAmount('')
            setRecipientAddress('')
          }
        } catch (error) {
          console.error('Failed to parse IntentSignaled event:', error)
        }
      },
    })

  const [isProcessing, setIsProcessing] = useState(false)
  const [processStep, setProcessStep] = useState<string>('')
  const [processProgress, setProcessProgress] = useState<{
    current: number
    total: number
  }>({ current: 0, total: 0 })

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
          // setDepositId(depositIdNumber)
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

  const handleCreateDeposit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!accountNumber || !amount || !address) {
      setError(ErrorType.REQUIRED_FIELDS_MISSING)
      return
    }

    try {
      console.log('!!!!!!!!!!!!!!!!try!!!!!!!!!!!!!!!!!!')
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

      console.log('balance', balance)
      const depositAmount = parseUnits(amount, 6) // USDC has 6 decimals
      console.log('depositAmount', depositAmount.toString())

      if (!balance || balance < depositAmount) {
        setError(
          `Insufficient USDC balance. You have ${balance ? formatUnits(balance, 6) : '0'} USDC but need ${amount} USDC`,
        )
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
        console.log('Approval params:', {
          address: ADDRESSES.USDC,
          escrow: ADDRESSES.ESCROW,
          amount: depositAmount.toString(),
        })

        // Ensure addresses are defined
        if (!ADDRESSES.USDC || !ADDRESSES.ESCROW) {
          throw new Error('Contract addresses not properly configured')
        }

        try {
          // Validate args before sending
          const approveArgs = [ADDRESSES.ESCROW, depositAmount]
          console.log('Approve args before call:', approveArgs)

          if (!approveArgs[0] || approveArgs[1] === undefined) {
            throw new Error('Invalid approve arguments')
          }

          await approveWrite({
            address: ADDRESSES.USDC as `0x${string}`,
            abi: erc20Abi,
            functionName: 'approve',
            args: approveArgs as unknown as readonly [string, bigint],
          })
        } catch (approveError) {
          console.error('Approval error details:', approveError)
          throw approveError
        }

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
          data: '0x', // Add the missing data field
        },
      ]

      // Prepare currency data for TossBank verifier
      // The structure should match the contract's expectation: array of structs
      const currencies = [
        {
          code: KRW_CURRENCY_CODE, // bytes32 currency code
          conversionRate,
        },
      ]

      console.log('Creating deposit with params:', {
        escrowAddress: ADDRESSES.ESCROW,
        token: ADDRESSES.USDC,
        amount: depositAmount.toString(),
        intentRange: {
          min: minIntentAmount.toString(),
          max: maxIntentAmount.toString(),
        },
        verifiers: [ADDRESSES.TOSS_BANK_VERIFIER],
        verifierData,
        currencies,
      })

      // Double check we're on the right network
      const chainId = await publicClient?.getChainId()
      console.log('Current chain ID:', chainId)

      // Check if contracts are deployed
      const escrowCode = await publicClient?.getBytecode({
        address: ADDRESSES.ESCROW,
      })
      const usdcCode = await publicClient?.getBytecode({
        address: ADDRESSES.USDC,
      })

      console.log('Contract deployment status:', {
        escrowDeployed: !!escrowCode && escrowCode !== '0x',
        usdcDeployed: !!usdcCode && usdcCode !== '0x',
        escrowAddress: ADDRESSES.ESCROW,
        usdcAddress: ADDRESSES.USDC,
      })

      if (!escrowCode || escrowCode === '0x') {
        throw new Error('ESCROW contract not deployed at ' + ADDRESSES.ESCROW)
      }

      if (!usdcCode || usdcCode === '0x') {
        throw new Error('USDC contract not deployed at ' + ADDRESSES.USDC)
      }

      try {
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
      } catch (createError: any) {
        console.error('Create deposit error:', createError)
        // Check if it's a specific revert reason
        if (createError?.cause?.reason) {
          throw new Error(`Contract reverted: ${createError.cause.reason}`)
        }
        throw createError
      }

      setProcessStep('Success! Deposit created.')
      setDepositTimestamp(Math.floor(Date.now() / 1000))
      setShowDepositWaiting(true)
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error)
      console.error('CreateDeposit error:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        cause: error?.cause,
      })
      setError(`Deposit creation failed: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
      setProcessStep('')
      setProcessProgress({ current: 0, total: 0 })
    }
  }

  const handleSwap = async () => {
    if (isOnramp) {
      // KRW -> USDC (onramp)
      if (!recipientAddress || !amount || !address) {
        setError(ErrorType.REQUIRED_FIELDS_MISSING)
        return
      }

      // Calculate USDC amount from KRW input
      const usdcAmount = calculateConvertedAmount(amount, true)

      // Validate the calculated amount
      if (!usdcAmount || usdcAmount === '0' || usdcAmount === '0.00') {
        setError('Invalid amount')
        return
      }

      try {
        setIsSwapping(true)
        await signalIntentWrite({
          address: ADDRESSES.ESCROW,
          abi: ESCROW_ABI,
          functionName: 'signalIntent',
          args: [
            BigInt(DEFAULT_DEPOSIT_ID),
            parseUnits(usdcAmount, 6), // USDC has 6 decimals
            recipientAddress as `0x${string}`,
            ADDRESSES.TOSS_BANK_VERIFIER,
            KRW_CURRENCY_CODE,
          ],
        })

        // Success handling is done in the onSuccess callback
      } catch (error: any) {
        console.error('signalIntent error:', error)
        const errorMessage = extractErrorMessage(error)

        // More specific error handling
        if (error?.message?.includes('gasLimit')) {
          setError(
            'Transaction failed: Unable to estimate gas. Please check your wallet balance and try again.',
          )
        } else {
          setError(ErrorType.INTENT_SIGNAL_FAILED, {
            error: errorMessage,
          })
        }
      } finally {
        setIsSwapping(false)
      }
    } else {
      // USDC -> KRW (offramp/deposit)
      // Set the account number from swap interface
      if (!accountNumber) {
        setError(ErrorType.ACCOUNT_NUMBER_EMPTY)
        return
      }

      handleCreateDeposit()
    }
  }

  return (
    <div className="space-y-4">
      {/* You send */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">You send</label>
        <div className="flex items-center justify-between bg-background/50 rounded-xl p-4 border border-border/30">
          <input
            type="text"
            value={amount}
            onChange={(e) => {
              const value = e.target.value

              if (isOnramp) {
                // KRW input - only integers allowed
                if (value === '' || /^\d+$/.test(value)) {
                  setAmount(value)
                }
              } else {
                // USDC input - up to 3 decimal places
                if (value === '' || /^\d*\.?\d{0,3}$/.test(value)) {
                  setAmount(value)
                }
              }
            }}
            placeholder={isOnramp ? '0' : '0.00'}
            className="bg-transparent text-2xl font-medium outline-none w-full"
          />
          <div className="flex items-center gap-2 min-w-fit">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {isOnramp ? '₩' : '$'}
              </span>
            </div>
            <span className="font-medium">{isOnramp ? 'KRW' : 'USDC'}</span>
          </div>
        </div>
      </div>

      {/* Recipient Address for buy mode, Bank Account for sell mode */}
      {isOnramp ? (
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground flex items-center justify-between">
            <span>Recipient Address</span>
            {address && (
              <button
                type="button"
                onClick={() => setRecipientAddress(address)}
                className="text-xs text-primary hover:text-primary/80 transition-colors">
                Use my address
              </button>
            )}
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-background/50 rounded-xl p-4 border border-border/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/50"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Bank Account Number
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="12345678"
            className="w-full bg-background/50 rounded-xl p-4 border border-border/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/50"
          />
        </div>
      )}

      {/* Paying using */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Paying using</label>
        <div className="bg-background/50 rounded-xl p-4 border border-border/30 opacity-60">
          <div className="flex items-center justify-between">
            <span className="font-medium">TossBank</span>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">T</span>
            </div>
          </div>
        </div>
      </div>

      {/* Swap Direction Button */}
      <div className="flex justify-center py-2">
        <button
          onClick={() => {
            // Calculate the converted amount before switching
            const convertedAmount = calculateConvertedAmount(amount, isOnramp)
            // Switch mode
            setMode(isOnramp ? SignalMode.OFFRAMP : SignalMode.ONRAMP)
            // Set the converted amount as the new input
            setAmount(convertedAmount)
          }}
          className="p-3 rounded-full bg-secondary/50 hover:bg-secondary/70 transition-all duration-200 border border-border/30 hover:border-border/50">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="transform rotate-90">
            <path
              d="M7 4V16M7 16L3 12M7 16L11 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13 16V4M13 4L9 8M13 4L17 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* You receive */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">You receive</label>
        <div className="bg-background/50 rounded-xl p-4 border border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-medium text-muted-foreground">
              {amount
                ? calculateConvertedAmount(amount, isOnramp)
                : isOnramp
                  ? '0.00'
                  : '0'}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {isOnramp ? '$' : '₩'}
                </span>
              </div>
              <span className="font-medium">{isOnramp ? 'USDC' : 'KRW'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      {conversionRate && (
        <div className="text-center text-sm text-muted-foreground">
          1 KRW = {(Number(conversionRate) / 1e18).toFixed(6)} USDC
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleSwap}
        disabled={
          !amount ||
          parseFloat(amount) <= 0 ||
          isSwapping ||
          isSignalIntentLoading ||
          (isOnramp && !recipientAddress) ||
          (!isOnramp && !accountNumber)
        }
        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-8 py-4 rounded-full font-semibold transition-all duration-200 hover:shadow-lg">
        {isSwapping || isSignalIntentLoading
          ? 'Processing...'
          : isOnramp
            ? 'Buy USDC'
            : 'Sell USDC'}
      </button>
    </div>
  )
}
