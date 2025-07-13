/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { holesky } from "viem/chains";
import ADDRESSES from "@/lib/addresses";
import { FROM_BLOCK, isLocal } from "@/constant";
import { anvil } from "@/lib/network";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 }
      );
    }

    const chain = isLocal ? anvil : holesky;
    const rpcUrl = isLocal
      ? anvil.rpcUrls.default.http[0]
      : `https://eth-holesky.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    // Fetch current block number
    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = BigInt(FROM_BLOCK);
    const maxBlockRange = BigInt(10000);

    // Fetch logs in chunks to respect Alchemy's block range limit
    let allLogs: any[] = [];
    let startBlock = fromBlock;

    while (startBlock <= currentBlock) {
      const endBlock =
        startBlock + maxBlockRange > currentBlock
          ? currentBlock
          : startBlock + maxBlockRange;

      try {
        const logs = await publicClient.getLogs({
          address: ADDRESSES.ZK_MINTER as `0x${string}`,
          event: {
            anonymous: false,
            inputs: [
              { indexed: false, name: "intentHash", type: "bytes32" },
              { indexed: false, name: "verifier", type: "address" },
              { indexed: false, name: "owner", type: "address" },
              { indexed: false, name: "to", type: "address" },
              { indexed: false, name: "amount", type: "uint256" },
            ],
            name: "IntentFulfilled",
            type: "event",
          },
          fromBlock: startBlock,
          toBlock: endBlock,
        });

        allLogs = allLogs.concat(logs);
      } catch (error) {
        console.warn(
          `Failed to fetch logs from ${startBlock} to ${endBlock}:`,
          error
        );
        // Continue with next chunk even if one fails
      }

      startBlock = endBlock + BigInt(1);
    }

    const logs = allLogs;

    // Process logs and filter by owner
    const mintingHistory = await Promise.all(
      logs
        .filter(
          (log) => log.args.owner?.toLowerCase() === address.toLowerCase()
        )
        .map(async (log) => {
          try {
            // Get block timestamp
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber,
            });

            return {
              intentHash: log.args.intentHash as `0x${string}`,
              verifier: log.args.verifier as `0x${string}`,
              owner: log.args.owner as `0x${string}`,
              to: log.args.to as `0x${string}`,
              amount: log.args.amount?.toString() || "0",
              txHash: log.transactionHash,
              blockNumber: log.blockNumber.toString(),
              timestamp: Number(block.timestamp),
            };
          } catch (error) {
            console.error("Error processing log:", error);
            return null;
          }
        })
    );

    const filteredHistory = mintingHistory
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({ mintingHistory: filteredHistory });
  } catch (error) {
    console.error("Error fetching minting history:", error);
    return NextResponse.json(
      { error: "Failed to fetch minting history" },
      { status: 500 }
    );
  }
}
