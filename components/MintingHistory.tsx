import React, { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { FROM_BLOCK, TOKEN_SYMBOL } from "@/constant";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import ADDRESSES from "@/lib/addresses";

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

export default function MintingHistory() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [mintingHistory, setMintingHistory] = useState<MintingHistoryItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const fetchMintingHistory = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      setIsLoading(true);
      const currentBlock = await publicClient.getBlockNumber();
      const logs = await publicClient.getLogs({
        address: ADDRESSES.ZK_MINTER,
        event: {
          type: "event",
          name: "IntentFulfilled",
          inputs: [
            { type: "bytes32", name: "intentHash", indexed: false },
            { type: "address", name: "verifier", indexed: false },
            { type: "address", name: "owner", indexed: false },
            { type: "address", name: "to", indexed: false },
            { type: "uint256", name: "amount", indexed: false },
          ],
        },
        args: {
          owner: address, // Filter by current user as owner
        },
        fromBlock: BigInt(FROM_BLOCK),
        toBlock: currentBlock,
      });

      const historyWithTimestamps = await Promise.all(
        logs.map(async (log) => {
          const block = await publicClient.getBlock({
            blockNumber: log.blockNumber,
          });

          if (
            !log.args.intentHash ||
            !log.args.verifier ||
            !log.args.owner ||
            !log.args.to ||
            !log.args.amount
          ) {
            return null;
          }

          return {
            intentHash: log.args.intentHash,
            verifier: log.args.verifier,
            owner: log.args.owner,
            to: log.args.to,
            amount: log.args.amount,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            timestamp: Number(block.timestamp),
          };
        })
      );

      // Filter out null values and sort by timestamp (newest first)
      const sortedHistory = historyWithTimestamps
        .filter((item): item is MintingHistoryItem => item !== null)
        .sort((a, b) => b.timestamp - a.timestamp);

      setMintingHistory(sortedHistory);
    } catch (error) {
      console.error("Failed to fetch minting history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient]);

  useEffect(() => {
    if (isConnected && showHistory) {
      fetchMintingHistory();
    }
  }, [isConnected, showHistory, fetchMintingHistory]);

  if (!isConnected) {
    return null;
  }
  if (mintingHistory.length === 0) {
    return null;
  }

  return (
    <section className="space-y-[10px]">
      <div className="flex justify-center">
        <Button
          onClick={() => setShowHistory(!showHistory)}
          variant="outline"
          className={cn(
            "bg-white px-8 py-2 h-auto rounded-full border-2 border-gray-400  flex flex-col items-center justify-center transition-all duration-200",
            "hover:border-gray-500 hover:bg-gray-100 hover:text-black"
          )}
          style={{ minWidth: 64 }}
        >
          <div
            className="flex flex-col items-center justify-center relative"
            style={{ height: 14 }}
          >
            <svg
              width="22"
              height="10"
              viewBox="0 0 24 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${
                showHistory ? "rotate-180" : ""
              }`}
              style={{ marginBottom: -2 }}
            >
              <polyline points="6,8 12,2 18,8" />
            </svg>
            <svg
              width="22"
              height="10"
              viewBox="0 0 24 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${
                showHistory ? "rotate-180" : ""
              }`}
              style={{ marginTop: -2 }}
            >
              <polyline points="6,8 12,2 18,8" />
            </svg>
          </div>
        </Button>
      </div>

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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text font-semibold text-green-600">
                      ✅ Minting Successful
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(item.timestamp * 1000).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="text">
                      <span className="text-gray-600 font-chivo-mono text-sm">
                        Amount:
                      </span>
                      <p className="font-chivo-mono font-semibold">
                        {formatUnits(item.amount, 18)} {TOKEN_SYMBOL}
                      </p>
                    </div>

                    <div className="text">
                      <span className="text-gray-600 font-chivo-mono text-sm">
                        Receiver:
                      </span>
                      <p className="font-chivo-mono">
                        {item.to.slice(0, 6)}...{item.to.slice(-4)}
                      </p>
                    </div>

                    <div className="text">
                      <span className="text-gray-600 font-chivo-mono text-sm">
                        Intent Hash:
                      </span>
                      <p className="font-chivo-mono text-xs break-all">
                        {item.intentHash}
                      </p>
                    </div>

                    <div className="text">
                      <span className="text-gray-600 font-chivo-mono text-sm">
                        Transaction:
                      </span>
                      <p className="font-chivo-mono text-xs break-all">
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
