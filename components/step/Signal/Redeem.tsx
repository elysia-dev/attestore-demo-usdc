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
import { RedeemDetails, RedeemResult, WorkflowStep } from "@/components/Home";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI } from "@/lib/wagmi";
import { useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useContractWrite } from "@/hooks/useContractWrite";

export default function Redeem({
  setError,
  setCurrentStep,
  freeError,
  isLoading,
}: {
  setError: (error: string) => void;
  setCurrentStep: (step: WorkflowStep) => void;
  freeError: () => void;
  isLoading: boolean;
}) {
  const [redeemId, setRedeemId] = useState<number | null>(null);
  const [redeemDetails, setRedeemDetails] = useState<RedeemDetails | null>(
    null
  );
  const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
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

  const handleRefreshRedeemDetails = async (targetRedeemId: number) => {
    if (!targetRedeemId) return;

    try {
      const redeemData = await publicClient?.readContract({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "redeemRequests",
        args: [BigInt(targetRedeemId)],
      });

      if (
        redeemData &&
        redeemData[0] !== "0x0000000000000000000000000000000000000000"
      ) {
        const [owner, amount, timestamp] = redeemData as [
          string,
          bigint,
          bigint
        ];
        setRedeemDetails({
          owner,
          amount,
          timestamp: Number(timestamp),
        });
      } else {
        setRedeemDetails(null);
        setError(`Redeem ID ${targetRedeemId} not found`);
      }
    } catch (error) {
      console.error("Failed to lookup Redeem ID:", error);
      setRedeemDetails(null);
      setError(`Redeem ID ${targetRedeemId} not found`);
    }
  };

  const handleRefreshMyRedeemId = async () => {
    console.log("address", address);
    if (!address) return;
    try {
      const userRedeemId = await publicClient?.readContract({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "accountRedeemRequest",
        args: [address],
      });
      console.log("userRedeemId", userRedeemId);

      if (userRedeemId && Number(userRedeemId) > 0) {
        const newRedeemId = Number(userRedeemId);
        setRedeemId(newRedeemId);
        handleRefreshRedeemDetails(newRedeemId);
      } else {
        setError("No Redeem request found");
        setRedeemDetails(null);
      }
    } catch (error) {
      console.error("Failed to lookup Redeem ID:", error);
      setError("Failed to lookup Redeem ID");
    }
  };

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

  const { writeAndWait: cancelRedeemWrite, isLoading: isCancelRedeemLoading } =
    useContractWrite({
      onSuccess: () => {
        setRedeemId(null);
        setRedeemDetails(null);
        setRedeemResult(null);
        setAccountNumber("");
        setAmount("");
      },
    });

  const handleCancelRedeem = async () => {
    if (!redeemId) return;

    try {
      await cancelRedeemWrite({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "cancelRedeem",
        args: [BigInt(redeemId)],
      });
    } catch (error) {
      setError(
        `Cancel redeem failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Step 2: Offramp (Redeem Tokens)
      </h2>
      <p className="text-gray-600 mb-8">
        Redeem your tokens for fiat currency. Enter your bank account number and
        the amount you want to redeem.
      </p>

      {/* Current Balance */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">
          💰 Your Token Balance
        </h3>
        <div className="flex items-center gap-2">
          <p className="text-yellow-700 text-lg font-semibold">
            {userTokenBalance ? formatUnits(userTokenBalance, 18) : "0"}{" "}
            KRW_TEST
          </p>
          <button
            onClick={readUserTokenBalance}
            className="text-yellow-700 hover:text-yellow-900 transition-colors duration-200 p-2 rounded-full hover:bg-yellow-50"
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
      </div>

      {/* Existing Redeem Request */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-orange-800 mb-4">
          🔍 My Redeem Request
        </h3>
        <div className="flex gap-4 mb-4">
          <Button
            onClick={handleRefreshMyRedeemId}
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 rounded-lg"
          >
            {isLoading ? "Loading..." : "Lookup My Request"}
          </Button>
        </div>

        {redeemId && redeemDetails && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-3">
              📋 Redeem Request Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-orange-800">Redeem ID:</span>
                <p className="text-orange-700 font-mono">{redeemId}</p>
              </div>
              <div>
                <span className="font-medium text-orange-800">Amount:</span>
                <p className="text-orange-700">
                  {formatUnits(redeemDetails.amount, 18)} KRW_TEST
                </p>
              </div>
              <div>
                <span className="font-medium text-orange-800">Status:</span>
                <p className="text-orange-700">
                  Pending (Awaiting fulfillment)
                </p>
              </div>
              <div>
                <span className="font-medium text-orange-800">
                  Created Time:
                </span>
                <p className="text-orange-700">
                  {new Date(redeemDetails.timestamp * 1000).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleCancelRedeem}
                disabled={isCancelRedeemLoading}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {isCancelRedeemLoading ? "Cancelling..." : "Cancel Request"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create New Redeem Request */}
      {!redeemId && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ➕ Create Redeem Request
          </h3>
          <p className="text-gray-600 mb-6">
            Enter your bank account details and the amount you want to redeem.
          </p>

          <form onSubmit={handleSignalRedeem} className="space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="accountNumber"
                className="text-lg font-medium text-gray-700"
              >
                Bank Account Number
              </Label>
              <Input
                id="accountNumber"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="12345678"
                className="h-14 text-base border-gray-300 rounded-lg px-4"
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="amount"
                className="text-lg font-medium text-gray-700"
              >
                Amount (KRW_TEST)
              </Label>
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1.0"
                className="h-14 text-base border-gray-300 rounded-lg px-4"
              />
            </div>

            {/* Progress indicator */}
            {isProcessing && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-800 font-medium">
                    {processStep}
                  </span>
                  <span className="text-blue-600 text-sm">
                    {processProgress.current}/{processProgress.total}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (processProgress.current / processProgress.total) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium text-lg px-8 py-4 rounded-lg h-auto disabled:bg-gray-400"
              disabled={!accountNumber || !amount || isProcessing}
            >
              {isProcessing ? "Processing..." : "Create Redeem Request"}
            </Button>
          </form>
        </div>
      )}

      {/* Success Message */}
      {redeemResult?.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-4">
            ✅ Redeem Request Created Successfully
          </h3>
          <div className="space-y-2 text-sm">
            <p className="text-green-700">
              <span className="font-medium">Redeem ID:</span>{" "}
              {redeemResult.redeemId}
            </p>
            <p className="text-green-700">
              <span className="font-medium">Transaction Hash:</span>{" "}
              <span className="font-mono">{redeemResult.txHash}</span>
            </p>
            <p className="text-green-600 mt-4">
              Your tokens have been escrowed. The admin will process your
              request and send fiat to your bank account.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="text-left">
        <Button
          onClick={() => {
            setCurrentStep(WorkflowStep.SIGNAL);
            freeError();
          }}
          variant="outline"
          className="font-medium text-lg px-6 py-3 rounded-lg"
        >
          ← Back to Choose Action
        </Button>
      </div>
    </div>
  );
}
