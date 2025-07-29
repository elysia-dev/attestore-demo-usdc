import { useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { USDC_SYMBOL, TOKEN_SYMBOL } from '@/constant'

interface SwapInterfaceProps {
  amount: string
  setAmount: (amount: string) => void
  onSwap: () => void
  isSwapping: boolean
  mode: 'buy' | 'sell'
  onModeChange: (mode: 'buy' | 'sell') => void
}

export default function SwapInterface({
  amount,
  setAmount,
  onSwap,
  isSwapping,
  mode,
  onModeChange,
}: SwapInterfaceProps) {
  const [inputAmount, setInputAmount] = useState('')

  const handleAmountChange = (value: string) => {
    // Only allow valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputAmount(value)
      setAmount(value)
    }
  }

  const handleSwapDirection = () => {
    onModeChange(mode === 'buy' ? 'sell' : 'buy')
    setInputAmount('')
    setAmount('')
  }

  const isBuying = mode === 'buy'

  return (
    <div className="bg-secondary/30 rounded-2xl p-6 border border-border/50 space-y-4">
      {/* You send */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">You send</label>
        <div className="flex items-center justify-between bg-background/50 rounded-xl p-4 border border-border/30">
          <input
            type="text"
            value={inputAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            className="bg-transparent text-2xl font-medium outline-none w-full"
          />
          <div className="flex items-center gap-2 min-w-fit">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {isBuying ? '₩' : '$'}
              </span>
            </div>
            <span className="font-medium">
              {isBuying ? TOKEN_SYMBOL : USDC_SYMBOL}
            </span>
          </div>
        </div>
      </div>

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
          onClick={handleSwapDirection}
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
              {inputAmount ? inputAmount : '0.00'}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {isBuying ? '$' : '₩'}
                </span>
              </div>
              <span className="font-medium">
                {isBuying ? USDC_SYMBOL : TOKEN_SYMBOL}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onSwap}
        disabled={!inputAmount || parseFloat(inputAmount) <= 0 || isSwapping}
        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-8 py-4 rounded-full font-semibold transition-all duration-200 hover:shadow-lg">
        {isSwapping ? 'Processing...' : isBuying ? 'Buy USDC' : 'Sell USDC'}
      </button>
    </div>
  )
}
