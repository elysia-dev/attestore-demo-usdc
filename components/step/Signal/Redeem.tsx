/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  decodeEventLog,
  erc20Abi,
  formatUnits,
  keccak256,
  parseUnits,
  toBytes,
} from "viem";
import { RedeemResult } from "@/components/Home";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI } from "@/lib/wagmi";
import { useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useContractWrite } from "@/hooks/useContractWrite";
import { TOKEN_SYMBOL } from "@/constant";

export default function Redeem({
  accountNumber,
  amount,
  handleRefreshRedeemDetails,
  redeemId,
  redeemResult,
  setAccountNumber,
  setAmount,
  setError,
  setRedeemId,
  setRedeemResult,
}: {
  accountNumber: string;
  amount: string;
  handleRefreshRedeemDetails: (targetRedeemId: number) => Promise<void>;
  redeemId: number | null;
  redeemResult: RedeemResult | null;
  setAccountNumber: (accountNumber: string) => void;
  setAmount: (amount: string) => void;
  setError: (error: string) => void;
  setRedeemId: (redeemId: number) => void;
  setRedeemResult: (redeemResult: RedeemResult) => void;
}) {
  const [userTokenBalance, setUserTokenBalance] = useState<bigint | undefined>(
    undefined
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>("");
  const [processProgress, setProcessProgress] = useState<{
    current: number;
    total: number;
  }>({ current: 0, total: 0 });

  const { address } = useAccount();
  const publicClient = usePublicClient();

  const readUserTokenBalance = async () => {
    if (!address) return;

    const balance = await publicClient?.readContract({
      address: ADDRESSES.TOKEN,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });
    setUserTokenBalance(balance);
  };

  const { writeAndWait: approveWrite } = useContractWrite({
    onSuccess: () => {
      console.log("Approve transaction successful");
    },
  });

  const { writeAndWait: signalRedeemWrite } = useContractWrite({
    onSuccess: (receipt) => {
      try {
        const redeemSignaledEvent = receipt.logs.find((log: any) => {
          const redeemSignaledTopic = keccak256(
            toBytes("RedeemRequestSignaled(uint256,address,uint256,string)")
          );
          return (
            log.topics[0] === redeemSignaledTopic &&
            log.address.toLowerCase() === ADDRESSES.ZK_MINTER.toLowerCase()
          );
        });

        if (redeemSignaledEvent) {
          const decodedLog = decodeEventLog({
            abi: ZK_MINTER_ABI,
            data: redeemSignaledEvent.data,
            topics: redeemSignaledEvent.topics,
          });

          const { redeemId: newRedeemId } = decodedLog.args as unknown as {
            redeemId: bigint;
          };

          const redeemIdNumber = Number(newRedeemId);
          setRedeemId(redeemIdNumber);
          setRedeemResult({
            success: true,
            redeemId: redeemIdNumber,
            txHash: receipt.transactionHash,
          });
          handleRefreshRedeemDetails(redeemIdNumber);
        }
      } catch (error) {
        console.error("Failed to parse RedeemRequestSignaled event:", error);
      }
    },
  });

  const checkAllowance = async (redeemAmount: bigint): Promise<boolean> => {
    if (!address || !publicClient) return false;

    const allowance = await publicClient.readContract({
      address: ADDRESSES.TOKEN,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address, ADDRESSES.ZK_MINTER],
    });

    return allowance >= redeemAmount;
  };

  const handleSignalRedeem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountNumber || !amount || !address) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setIsProcessing(true);
      setProcessStep("Checking requirements...");
      setProcessProgress({ current: 1, total: 3 });

      // 1. Check if user already has an existing redeem request
      const existingRedeemId = await publicClient?.readContract({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "accountRedeemRequest",
        args: [address],
      });

      if (existingRedeemId && Number(existingRedeemId) > 0) {
        setError(
          "You already have an active redeem request. Please cancel it first."
        );
        return;
      }

      // 2. Check user token balance
      const balance = await publicClient?.readContract({
        address: ADDRESSES.TOKEN,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      });

      const redeemAmount = parseUnits(amount, 18);

      if (!balance || balance < redeemAmount) {
        setError("Insufficient token balance for redeem request");
        return;
      }

      // 3. Validate account number
      if (!accountNumber.trim()) {
        setError("Account number cannot be empty");
        return;
      }

      // 4. Check and handle token approval
      setProcessStep("Checking token approval...");
      const hasAllowance = await checkAllowance(redeemAmount);

      if (!hasAllowance) {
        setProcessStep("Approving tokens...");
        setProcessProgress({ current: 2, total: 3 });

        console.log("Insufficient allowance, requesting approval...");
        await approveWrite({
          address: ADDRESSES.TOKEN,
          abi: erc20Abi,
          functionName: "approve",
          args: [ADDRESSES.ZK_MINTER, redeemAmount],
        });

        console.log("Approval successful");
      }

      // 5. Create redeem request
      setProcessStep("Creating redeem request...");
      setProcessProgress({ current: 3, total: 3 });

      await signalRedeemWrite({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "signalRedeem",
        args: [accountNumber.trim(), redeemAmount],
      });

      setProcessStep("Success! Redeem request created.");
    } catch (error) {
      console.error("SignalRedeem error:", error);
      setError(
        `Redeem process failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsProcessing(false);
      setProcessStep("");
      setProcessProgress({ current: 0, total: 0 });
    }
  };

  return (
    <section className="mt-5 p-5 bg-gray-300 rounded-[10px] border border-gray-border">
      {/* Current Balance */}
      <p className="body font-bold">
        <strong className="text-blue-primary w-4">◆</strong> Your Token Balance
      </p>
      <section className="mt-[5px] rounded-[10px] bg-blue-200 px-[15px] py-2.5 border border-gray-border">
        <div className="flex items-center justify-between">
          <p className="text-blue-primary text font-bold">
            {userTokenBalance ? formatUnits(userTokenBalance, 18) : "0"}{" "}
            {TOKEN_SYMBOL}
          </p>
          <button
            onClick={readUserTokenBalance}
            className="text-blue-primary hover:text-blue-primary/50 transition-colors duration-200"
            title="Refresh balance"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
          </button>
        </div>
        <p className="text font-chivo-mono text-gray-600 mt-[5px]">
          Address: {address}
        </p>
      </section>

      {/* Create New Redeem Request */}
      {!redeemId && (
        <div className="mt-5">
          <p className="body font-bold">
            <strong className="text-blue-primary w-4">◆</strong> Create a Redeem
            Request
          </p>
          <div className="space-y-[5px] text text-gray-600 pl-4 mt-[15px]">
            <p>
              1. Enter your bank account details and the amount you want to
              redeem.
            </p>
          </div>

          <form onSubmit={handleSignalRedeem} className="space-y-5 mt-5">
            <section className="p-5 border border-gray-border rounded-[10px] bg-white space-y-2.5">
              <div className="space-y-[5px]">
                <Label htmlFor="accountNumber" className="text font-semibold">
                  · Bank Account Number
                </Label>
                <Input
                  id="accountNumber"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="12345678"
                  className="text border-gray-border rounded-[5px] py-2.5 px-[15px]"
                />
              </div>

              <div className="space-y-[5px]">
                <Label htmlFor="amount" className="text font-semibold">
                  Amount ({TOKEN_SYMBOL})
                </Label>
                <Input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1.0"
                  className="text border-gray-border rounded-[5px] py-2.5 px-[15px]"
                />
              </div>

              {/* Progress indicator */}
              {isProcessing && (
                <div className="p-5 border border-gray-border rounded-[10px] bg-gray-300 mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text">{processStep}</span>
                    <span className="text-black text font-semibold">
                      {processProgress.current}/{processProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2 border border-gray-border">
                    <div
                      className="bg-blue-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (processProgress.current / processProgress.total) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </section>

            <Button
              type="submit"
              className="disabled:bg-black/50 bg-black/75 text-white font-semibold hover:bg-black transition-colors duration-200"
              disabled={!accountNumber || !amount || isProcessing}
            >
              {isProcessing ? "Processing..." : "Create Redeem Request"}
            </Button>
          </form>
        </div>
      )}

      {/* Success Message */}
      {redeemResult?.success && (
        <section className="mt-5 p-5 bg-white rounded-[10px] border border-gray-border">
          <h3 className="text font-semibold">
            Redeem Request Created Successfully
          </h3>
          <section className="border border-gray-border rounded-[10px] p-5 mt-5 bg-gray-300 space-y-[10px]">
            <div className="text">
              <span className="font-chivo-mono text-gray-600">Redeem ID:</span>{" "}
              <p className="font-chivo-mono">{redeemResult?.redeemId}123</p>
            </div>
            <div className="text">
              <span className="font-chivo-mono text-gray-600">
                Transaction Hash:
              </span>{" "}
              <p className="font-chivo-mono">{redeemResult?.txHash}123</p>
            </div>
          </section>
          <p className="text-blue-primary mt-4 text">
            Your tokens have been escrowed. The admin will process your request
            and send fiat to your bank account.
          </p>
        </section>
      )}
    </section>
  );
}
