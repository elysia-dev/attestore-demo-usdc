import React, { useCallback, useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { TOKEN_SYMBOL, USDC_SYMBOL, isLocal } from '@/constant'
import { cn } from '@/lib/utils'

export type TransferHistoryItem = {
  intentHash: `0x${string}`
  verifier: `0x${string}`
  owner: `0x${string}`
  to: `0x${string}`
  amount: bigint
  txHash: `0x${string}`
  blockNumber: bigint
  timestamp: number
}

export default function MintingHistory({
  showHistory,
}: {
  showHistory: boolean
}) {
  const { address, isConnected } = useAccount()
  const [mintingHistory, setMintingHistory] = useState<TransferHistoryItem[]>(
    [],
  )
  const [isLoading, setIsLoading] = useState(false)

  const fetchTransferHistory = useCallback(async () => {
    if (!address) return

    try {
      setIsLoading(true)

      // Call our API route instead of querying blockchain directly
      const response = await fetch(`/api/transfer-history?address=${address}`)

      if (!response.ok) {
        throw new Error('Failed to fetch transfer history')
      }

      const data = await response.json()
      setMintingHistory(data.mintingHistory)
    } catch (error) {
      console.error('Failed to fetch transfer history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address])

  // Get block explorer URL based on network
  const getExplorerUrl = (txHash: string) => {
    if (isLocal) {
      // For local network, no explorer available
      return null
    }
    // Holesky testnet explorer
    return `https://holesky.etherscan.io/tx/${txHash}`
  }

  useEffect(() => {
    if (isConnected) {
      fetchTransferHistory()
    }
  }, [isConnected, fetchTransferHistory])

  if (!isConnected) {
    return null
  }
  if (transferHistory.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      {showHistory && (
        <section className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Loading transfer history...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mintingHistory.map((item, index) => {
                const explorerUrl = getExplorerUrl(item.txHash)
                return (
                  <div
                    key={`${item.txHash}-${index}`}
                    className={cn(
                      'bg-secondary/30 rounded-2xl p-4 border border-border/50 transition-all duration-300',
                      explorerUrl &&
                        'cursor-pointer hover:bg-secondary/50 hover:scale-[1.02]',
                    )}
                    onClick={() => {
                      if (explorerUrl) {
                        window.open(explorerUrl, '_blank')
                      }
                    }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <span className="text-green-500">✅</span>
                        Minting Successful
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.timestamp * 1000).toLocaleDateString()}
                        </span>
                        {explorerUrl && (
                          <svg
                            className="w-4 h-4 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Amount
                        </span>
                        <p className="text-sm font-mono font-medium text-primary">
                          {formatUnits(BigInt(item.amount), 6)} {USDC_SYMBOL}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Receiver
                        </span>
                        <p className="text-sm font-mono">
                          {item.to.slice(0, 6)}...{item.to.slice(-4)}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Intent Hash
                        </span>
                        <p className="text-xs font-mono break-all">
                          {item.intentHash}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Transaction
                        </span>
                        <p className="text-xs font-mono break-all hover:text-primary transition-colors">
                          {item.txHash}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </section>
  )
}
