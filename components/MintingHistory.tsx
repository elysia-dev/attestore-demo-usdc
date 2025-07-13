import React, { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { TOKEN_SYMBOL } from "@/constant";
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
              {mintingHistory.map((item, index) => (
                <div
                  key={`${item.txHash}-${index}`}
                  className={cn(
                    "border border-gray-border rounded-[10px] p-4 bg-gray-50",
                    "max-sm:rounded-[5px] max-sm:p-3"
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text font-semibold text-green-600">
                      ✅ Minting Successful
                    </h3>
                    <span className="label text-gray-500">
                      {new Date(item.timestamp * 1000).toLocaleDateString()}
                    </span>
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
                      <p className="font-chivo-mono label break-all">
                        {item.txHash}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </section>
  );
}
