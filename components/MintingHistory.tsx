import React, { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { TOKEN_SYMBOL, isLocal } from "@/constant";
import { cn } from "@/lib/utils";

export type MintingHistoryItem = {
  intentHash: `0x${string}`;
  verifier: `0x${string}`;
  owner: `0x${string}`;
  to: `0x${string}`;
  amount: bigint;
  txHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: number;
};

export default function MintingHistory({
  showHistory,
}: {
  showHistory: boolean;
}) {
  const { address, isConnected } = useAccount();
  const [mintingHistory, setMintingHistory] = useState<MintingHistoryItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchMintingHistory = useCallback(async () => {
    if (!address) return;

    try {
      setIsLoading(true);

      // Call our API route instead of querying blockchain directly
      const response = await fetch(`/api/minting-history?address=${address}`);

      if (!response.ok) {
        throw new Error("Failed to fetch minting history");
      }

      const data = await response.json();
      setMintingHistory(data.mintingHistory);
    } catch (error) {
      console.error("Failed to fetch minting history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Get block explorer URL based on network
  const getExplorerUrl = (txHash: string) => {
    if (isLocal) {
      // For local network, no explorer available
      return null;
    }
    // Holesky testnet explorer
    return `https://holesky.etherscan.io/tx/${txHash}`;
  };

  useEffect(() => {
    if (isConnected) {
      fetchMintingHistory();
    }
  }, [isConnected, fetchMintingHistory]);

  if (!isConnected) {
    return null;
  }
  if (mintingHistory.length === 0) {
    return null;
  }

  return (
    <section className="space-y-[10px]">
      {showHistory && (
        <section
          className={cn(
            "bg-white border border-gray-border rounded-[10px] py-[30px] px-[20px]",
            "max-sm:rounded-[5px] max-sm:p-3"
          )}
        >
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading minting history...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mintingHistory.map((item, index) => {
                const explorerUrl = getExplorerUrl(item.txHash);
                return (
                  <div
                    key={`${item.txHash}-${index}`}
                    className={cn(
                      "border border-gray-border rounded-[10px] p-4 bg-gray-50",
                      "max-sm:rounded-[5px] max-sm:p-3",
                      explorerUrl && "cursor-pointer hover:bg-gray-100 transition-colors"
                    )}
                    onClick={() => {
                      if (explorerUrl) {
                        window.open(explorerUrl, "_blank");
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text font-semibold text-green-600">
                        ✅ Minting Successful
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="label text-gray-500">
                          {new Date(item.timestamp * 1000).toLocaleDateString()}
                        </span>
                        {explorerUrl && (
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
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

                  <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-x-[15px] gap-y-[10px]">
                    <div className="text">
                      <span className="text-gray-600 font-chivo-mono">
                        Amount:
                      </span>
                      <p className="font-chivo-mono font-semibold">
                        {formatUnits(BigInt(item.amount), 18)} {TOKEN_SYMBOL}
                      </p>
                    </div>

                    <div className="text">
                      <span className="text-gray-600 font-chivo-mono">
                        Receiver:
                      </span>
                      <p className="font-chivo-mono">
                        {item.to.slice(0, 6)}...{item.to.slice(-4)}
                      </p>
                    </div>

                    <div className="text">
                      <span className="text-gray-600 font-chivo-mono">
                        Intent Hash:
                      </span>
                      <p className="font-chivo-mono label break-all">
                        {item.intentHash}
                      </p>
                    </div>

                    <div className="text">
                      <span className="text-gray-600 font-chivo-mono">
                        Transaction:
                      </span>
                      <p className="font-chivo-mono label break-all hover:text-blue-600 transition-colors">
                        {item.txHash}
                      </p>
                    </div>
                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
