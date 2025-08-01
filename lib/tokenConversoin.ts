export const calculateConvertedAmount = ({
  inputAmount,
  isBuying,
  conversionRate,
}: {
  inputAmount: string
  isBuying: boolean
  conversionRate: bigint | null
}): string => {
  if (!inputAmount || !conversionRate || parseFloat(inputAmount) === 0) {
    return isBuying ? '0.00' : '0'
  }

  try {
    const inputValue = parseFloat(inputAmount)

    if (isBuying) {
      // KRW -> USDC: divide KRW amount by conversion rate
      // conversionRate is in 18 decimals, represents KRW per 1USDC
      // Example: 1380 * 1e18 = 1380 KRW per 1 USDC
      const rateAsNumber = Number(conversionRate) / 1e18
      const usdcAmount = inputValue / rateAsNumber

      // Format with up to 6 decimal places for USDC, truncating instead of rounding
      const truncatedAmount = Math.floor(usdcAmount * 1e6) / 1e6
      const formatted = truncatedAmount.toFixed(6)
      // Remove trailing zeros after decimal point
      return formatted.replace(/\.?0+$/, '') || '0.00'
    } else {
      // USDC -> KRW: multiply USDC amount by conversion rate
      // USDC input is only allowed as integer, no decimal handling needed
      const rateAsNumber = Number(conversionRate) / 1e18
      const krwAmount = inputValue * rateAsNumber

      return Math.floor(krwAmount).toString()
    }
  } catch (error) {
    console.error('Error calculating converted amount:', error)
    return isBuying ? '0.00' : '0'
  }
}
