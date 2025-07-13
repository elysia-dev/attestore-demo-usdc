import React, { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { FROM_BLOCK, TOKEN_SYMBOL } from "@/constant";
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

export default function MintingHistory({ showHistory }: { showHistory: boolean }  ) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [mintingHistory, setMintingHistory] = useState<MintingHistoryItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchMintingHistory = useCallback(async () => {
    if (!address || !publicClient) return;

    try {
      setIsLoading(true);
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = BigInt(FROM_BLOCK);
      const maxBlockRange = BigInt(50000); // RPC limit
      
      let allLogs: any[] = [];
      let startBlock = fromBlock;
      
      // Fetch logs in chunks to respect RPC block range limit
      while (startBlock <= currentBlock) {
        const endBlock = startBlock + maxBlockRange > currentBlock 
          ? currentBlock 
          : startBlock + maxBlockRange;
        
        try {
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
            fromBlock: startBlock,
            toBlock: endBlock,
          });
          
          allLogs = allLogs.concat(logs);
        } catch (error) {
          console.warn(`Failed to fetch logs from ${startBlock} to ${endBlock}:`, error);
          // Continue with next chunk even if one fails
        }
        
        startBlock = endBlock + BigInt(1);
      }

      const historyWithTimestamps = await Promise.all(
        allLogs.map(async (log: any) => {
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
        .filter((item: any): item is MintingHistoryItem => item !== null)
        .sort((a: MintingHistoryItem, b: MintingHistoryItem) => b.timestamp - a.timestamp);

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
                        {formatUnits(item.amount, 18)} {TOKEN_SYMBOL}
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
