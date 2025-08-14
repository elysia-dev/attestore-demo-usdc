import { extractErrorMessage } from '@/components/utils/extractErrorMessage'
import {
  DEFAULT_DEPOSIT_ID,
  INTENT_SIGNAL_TOPIC,
  KRW_CURRENCY_CODE,
  TOSS_ACCOUNT_NUMBER,
} from '@/constant'
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
import { useContractWrite } from '@/hooks/useContractWrite'
import { useAccount, usePublicClient } from 'wagmi'
import { calculateConvertedAmount } from '@/lib/tokenConversoin'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import useDepositStore from '@/stores/useDepositStore'

interface SwapInterfaceProps {
  amount: string
  setAmount: (amount: string) => void
  isOnramp: boolean
  recipientAddress: string
  setRecipientAddress: (address: string) => void
  accountNumber: string
  setAccountNumber: (accountNumber: string) => void
  conversionRate: bigint | null
  setIntentId: (intentId: number) => void
  setSearchIntentId: (searchIntentId: number) => void
  handleRefreshMyIntentId: () => void
}

export default function SwapInterface({
  amount,
  setAmount,
  isOnramp,
  recipientAddress,
  setRecipientAddress,
  accountNumber,
  setAccountNumber,
  conversionRate,
  setIntentId,
  setSearchIntentId,
  handleRefreshMyIntentId,
}: SwapInterfaceProps) {
  const t = useTranslations('common')
  const tSwap = useTranslations('swap')
  const publicClient = usePublicClient()
  const [isSwapping, setIsSwapping] = useState(false)
  const { setError, freeError } = useContext(ErrorContext)
  const { allDeposits } = useDepositStore()
  const defaultDeposit = allDeposits.find((d) => d.id === DEFAULT_DEPOSIT_ID)

  const { address } = useAccount()
  // Contract write hook for signalIntent
  const { writeAndWait: signalIntentWrite, isLoading: isSignalIntentLoading } =
    useContractWrite({
      onSuccess: (receipt) => {
        try {
          const intentSignaledEvent = receipt.logs.find((log: any) => {
            return (
              log.topics[0] === INTENT_SIGNAL_TOPIC &&
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

  const { writeAndWait: approveWrite } = useContractWrite()

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
      // 1. Check user token balance
      const balance = await publicClient?.readContract({
        address: ADDRESSES.USDC,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      })

      const depositAmount = parseUnits(amount, 6) // USDC has 6 decimals

      if (!balance || balance < depositAmount) {
        setError(
          tSwap('insufficientBalance', {
            balance: balance ? formatUnits(balance, 6) : '0',
            amount,
          }),
        )
        return
      }

      // 2. Validate account number
      if (!accountNumber.trim()) {
        setError(ErrorType.ACCOUNT_NUMBER_EMPTY)
        return
      }

      // 3. Check and handle token approval
      const hasAllowance = await checkAllowance(depositAmount)

      if (!hasAllowance) {
        // Ensure addresses are defined
        if (!ADDRESSES.USDC || !ADDRESSES.ESCROW) {
          throw new Error('Contract addresses not properly configured')
        }

        try {
          // Validate args before sending
          const approveArgs = [ADDRESSES.ESCROW, depositAmount]

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
      }

      // 4. Create deposit

      const minIntentAmount = parseUnits('0.1', 6)
      const maxIntentAmount = parseUnits('100', 6)

      // Prepare verifier data
      const verifierData = [
        {
          payeeDetails: accountNumber.trim(),
          data: '0x', // Add the missing data field
        },
      ]

      // Prepare currency data for TossBank verifier
      // The structure should match the contract's expectation: array of structs
      const currencies: {
        code: `0x${string}`
        conversionRate: bigint | null
      }[][] = []
      currencies[0] = [
        {
          code: KRW_CURRENCY_CODE, // bytes32 currency code
          conversionRate,
        },
      ]

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
    } catch (error: any) {
      const errorMessage = extractErrorMessage(error)
      console.error('CreateDeposit error:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        cause: error?.cause,
      })
      setError(tSwap('depositCreationFailed', { error: errorMessage }))
    } finally {
      handleRefreshMyIntentId()
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
      const usdcAmount = calculateConvertedAmount({
        inputAmount: amount,
        isBuying: true,
        conversionRate,
      })

      // Validate the calculated amount
      if (!usdcAmount || usdcAmount === '0' || usdcAmount === '0.00') {
        setError(tSwap('invalidAmount'))
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
          setError(tSwap('transactionFailed'))
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
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">{t('youSend')}</label>
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
                setAmount(value)
              }
            }}
            placeholder="0"
            className="bg-transparent text-xl font-medium outline-none w-full"
          />

          <div className="flex items-center gap-2 min-w-fit">
            <span className="font-medium">{isOnramp ? 'KRW' : 'USDC'}</span>
            {!isOnramp && (
              <Image
                src="/base-usdc.png"
                alt="USDC"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            )}
          </div>
        </div>
      </div>

      {/* Paying using */}
      {isOnramp && <PayingUsing />}

      {/* You receive */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">
          {tSwap('youReceive')}
        </label>
        <div className="bg-background/50 rounded-xl p-4 border border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-xl font-medium text-muted-foreground">
              {amount
                ? calculateConvertedAmount({
                    inputAmount: amount,
                    isBuying: isOnramp,
                    conversionRate,
                  })
                : isOnramp
                  ? '0.00'
                  : '0'}
            </span>
            {
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 min-w-fit">
                  <span className="font-medium">
                    {isOnramp ? 'USDC' : 'KRW'}
                  </span>
                  {isOnramp && (
                    <Image
                      src="/base-usdc.png"
                      alt="USDC"
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                  )}
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      {/* Recipient Address for buy mode, Bank Account for sell mode */}
      {isOnramp ? (
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground flex items-center justify-between">
            <span>{tSwap('recipientAddress')}</span>
            {address && (
              <button
                type="button"
                onClick={() => setRecipientAddress(address)}
                className="text-xs text-primary hover:text-primary/80 transition-colors">
                {tSwap('useMyAddress')}
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
            {tSwap('receivingBankAccount')}
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={`토스뱅크 ${TOSS_ACCOUNT_NUMBER}`}
            className="w-full bg-background/50 rounded-xl p-4 border border-border/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/50"
          />
        </div>
      )}

      {!!conversionRate && <ConversionRate conversionRate={conversionRate} />}
      <ActionButton
        isSwapping={isSwapping}
        isSignalIntentLoading={isSignalIntentLoading}
        isOnramp={isOnramp}
        amount={amount}
        recipientAddress={recipientAddress}
        accountNumber={accountNumber}
        handleSwap={handleSwap}
      />
    </div>
  )
}
const PayingUsing = () => {
  const tSwap = useTranslations('swap')
  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground">
        {tSwap('payingUsing')}
      </label>
      <div className="bg-background/50 rounded-xl p-4 border border-border/30 opacity-60">
        <div className="flex items-center justify-between">
          <span className="font-medium">TossBank</span>
          <Image
            src="/toss.png"
            alt="TossBank"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        </div>
      </div>
    </div>
  )
}

const ConversionRate = ({ conversionRate }: { conversionRate: bigint }) => {
  return (
    <div className="text-center text-sm text-muted-foreground">
      1 KRW ={' '}
      {(Number(conversionRate) / 1e18).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6,
      })}{' '}
      USDC
    </div>
  )
}

const ActionButton = ({
  isSwapping,
  isSignalIntentLoading,
  isOnramp,
  amount,
  recipientAddress,
  accountNumber,
  handleSwap,
}: {
  isSwapping: boolean
  isSignalIntentLoading: boolean
  isOnramp: boolean
  amount: string
  recipientAddress: string
  accountNumber: string
  handleSwap: () => void
}) => {
  const t = useTranslations('common')
  const tSwap = useTranslations('swap')

  return (
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
      className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-4 py-2 rounded-full font-semibold transition-all duration-200 hover:shadow-lg">
      {isSwapping || isSignalIntentLoading
        ? t('processing')
        : isOnramp
          ? tSwap('buyUSDC')
          : tSwap('sellUSDC')}
    </button>
  )
}
