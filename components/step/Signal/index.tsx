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
import { IntentDetails, WorkflowStep } from "@/components/Home";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI } from "@/lib/wagmi";
import { useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useContractWrite } from "@/hooks/useContractWrite";
import Redeem from "./Redeem";

enum SignalMode {
  ONRAMP = "onramp",
  OFFRAMP = "offramp",
}

export default function Signal({
  intentId,
  searchIntentId,
  intentDetails,
  setIntentId,
  setSearchIntentId,
  handleRefreshMyIntentId,
  setError,
  setCurrentStep,
  freeError,
  isLoading,
}: {
  intentId: number | null;
  searchIntentId: number | null;
  intentDetails: IntentDetails | null;
  setIntentId: (intentId: number) => void;
  setSearchIntentId: (searchIntentId: number) => void;
  handleRefreshMyIntentId: () => void;
  setError: (error: string) => void;
  setCurrentStep: (step: WorkflowStep) => void;
  freeError: () => void;
  isLoading: boolean;
}) {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<SignalMode>(SignalMode.ONRAMP);

  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [receiverTokenBalance, setReceiverTokenBalance] = useState<
    bigint | undefined
  >(undefined);
  const readReceiverTokenBalance = async (to: string) => {
    if (!to) return;

    const balance = await publicClient?.readContract({
      address: ADDRESSES.TOKEN,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [to as `0x${string}`],
    });
    setReceiverTokenBalance(balance);
  };

  const { writeAndWait: signalIntentWrite, isLoading: isSignalIntentLoading } =
    useContractWrite({
      onSuccess: (receipt) => {
        // signalIntent 성공 시 intentId 추출
        try {
          const intentSignaledEvent = receipt.logs.find((log: any) => {
            const intentSignaledTopic = keccak256(
              toBytes("IntentSignaled(address,address,uint256,uint256)")
            );
            return (
              log.topics[0] === intentSignaledTopic &&
              log.address.toLowerCase() === ADDRESSES.ZK_MINTER.toLowerCase()
            );
          });

          if (intentSignaledEvent) {
            const decodedLog = decodeEventLog({
              abi: ZK_MINTER_ABI,
              data: intentSignaledEvent.data,
              topics: intentSignaledEvent.topics,
            });

            const { intentId: newIntentId } = decodedLog.args as {
              to: string;
              verifier: string;
              amount: bigint;
              intentId: bigint;
            };

            const intentIdNumber = Number(newIntentId);
            setIntentId(intentIdNumber);
            setSearchIntentId(intentIdNumber);
            handleRefreshMyIntentId();
          }
        } catch (error) {
          console.error("Failed to parse IntentSignaled event:", error);
        }
      },
    });

  // signalIntent 호출
  const handleSignalIntent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!toAddress || !amount || !address) {
      setError("Please fill in all required fields");
      return;
    }
    try {
      await signalIntentWrite({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "signalIntent",
        args: [
          toAddress as `0x${string}`,
          parseUnits(amount, 18),
          ADDRESSES.TOSS_BANK_VERIFIER,
        ],
      });
      // 성공 시 onSuccess 콜백에서 자동으로 intentId 설정됨
    } catch (error) {
      setError(
        `Intent signal failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const disableNextStep = !intentId || !intentDetails?.amount;
  console.log("intentDetails", intentDetails);
  console.log("disableNextStep", disableNextStep);
  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Step 2: Intent Management
          </h2>

          {/* Mode Toggle Slider */}
          <div className="flex items-center gap-4">
            <span
              className={`text-sm font-medium ${
                mode === SignalMode.ONRAMP ? "text-green-600" : "text-gray-500"
              }`}
            >
              💰 Onramp
            </span>
            <button
              onClick={() =>
                setMode(
                  mode === SignalMode.ONRAMP
                    ? SignalMode.OFFRAMP
                    : SignalMode.ONRAMP
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                mode === SignalMode.ONRAMP ? "bg-green-500" : "bg-orange-500"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  mode === SignalMode.ONRAMP ? "translate-x-1" : "translate-x-6"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                mode === SignalMode.OFFRAMP
                  ? "text-orange-600"
                  : "text-gray-500"
              }`}
            >
              🏦 Offramp
            </span>
          </div>
        </div>

        <p className="text-gray-600 mb-8">
          {mode === SignalMode.ONRAMP
            ? "Onramp mode: Deposit fiat and mint tokens"
            : "Offramp mode: Redeem tokens for fiat"}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Button
            onClick={() => {
              setMode(SignalMode.ONRAMP);
            }}
            className={`font-medium text-lg px-8 py-6 rounded-lg h-auto flex flex-col items-center gap-2 transition-all ${
              mode === SignalMode.ONRAMP
                ? "bg-green-500 hover:bg-green-600 text-white ring-2 ring-green-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
          >
            💰 Onramp (Deposit)
            <span className="text-sm opacity-90">
              Deposit fiat → Get tokens
            </span>
          </Button>

          <Button
            onClick={() => {
              setMode(SignalMode.OFFRAMP);
            }}
            className={`font-medium text-lg px-8 py-6 rounded-lg h-auto flex flex-col items-center gap-2 transition-all ${
              mode === SignalMode.OFFRAMP
                ? "bg-orange-500 hover:bg-orange-600 text-white ring-2 ring-orange-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
          >
            🏦 Offramp (Redeem)
            <span className="text-sm opacity-90">Redeem tokens → Get fiat</span>
          </Button>
        </div>

        {mode === "onramp" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              📋 Onramp: Intent Management
            </h3>
            <p className="text-gray-600 mb-4">
              Click <strong>Lookup</strong> for looking up your Intent.
              <br />
              If you don&apos;t have an Intent, click{" "}
              <strong>Create New</strong> for creating a new Intent.
              <br />
              And Click <strong>Lookup</strong> for refresh.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                🔍 My Intent
              </h3>
              {searchIntentId && (
                <div className="mt-4 space-y-3">
                  {intentDetails && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-3">
                        📋 Intent Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-blue-800">Id:</span>
                          <p className="text-blue-700 font-mono">{intentId}</p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">
                            Owner:
                          </span>
                          <p className="text-blue-700 font-mono">
                            {intentDetails.owner.slice(0, 6)}...
                            {intentDetails.owner.slice(-4)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">
                            Receiver:
                          </span>
                          <p className="text-blue-700 font-mono">
                            {intentDetails.to.slice(0, 6)}...
                            {intentDetails.to.slice(-4)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">
                            Amount:
                          </span>
                          <p className="text-blue-700">
                            {formatUnits(intentDetails.amount, 18)} KRW_TEST
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">
                            Created Time:
                          </span>
                          <p className="text-blue-700">
                            {new Date(
                              intentDetails.timestamp * 1000
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Receiver token balance*/}
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h5 className="font-medium text-yellow-800 mb-2">
                          💰 Receiver Info
                        </h5>

                        <div className="flex items-center gap-2">
                          <p className="text-blue-700 text-lg font-semibold">
                            {receiverTokenBalance
                              ? formatUnits(receiverTokenBalance, 18)
                              : "0"}{" "}
                            KRW_TEST
                          </p>

                          <button
                            onClick={() =>
                              readReceiverTokenBalance(intentDetails.to)
                            }
                            className="text-blue-700 hover:text-blue-900 transition-colors duration-200 p-2 rounded-full hover:bg-blue-50"
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
                              className="inline-block"
                            >
                              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                              <path d="M21 3v5h-5" />
                              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                              <path d="M3 21v-5h5" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-yellow-600 mt-1">
                          Address: {intentDetails.to}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Button
                onClick={handleRefreshMyIntentId}
                disabled={isLoading}
                className={`bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2 mt-4 rounded-lg flex items-center gap-2 ${
                  isLoading ? "bg-gray-400" : "bg-blue-500"
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                {isLoading ? "Loading..." : "Lookup"}
              </Button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ➕ Enroll Your Intent
              </h3>
              <p className="text-gray-600 mb-6">
                If you dont have an existing Intent or want to create a new one,
                please enter the information below.
              </p>

              <form onSubmit={handleSignalIntent} className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="toAddress"
                    className="text-lg font-medium text-gray-700"
                  >
                    Recipient Address
                  </Label>
                  <Input
                    id="toAddress"
                    type="text"
                    value={toAddress}
                    disabled={!!intentId}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="0x..."
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
                    disabled={!!intentId}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1.0"
                    className="h-14 text-base border-gray-300 rounded-lg px-4"
                  />
                </div>

                <Button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-medium text-lg px-8 py-4 rounded-lg h-auto"
                  disabled={
                    !toAddress || !amount || isSignalIntentLoading || !!intentId
                  }
                >
                  {isSignalIntentLoading
                    ? "Creating Intent..."
                    : "Create New Intent"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {mode === "offramp" && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">
              🏦 Offramp: Token Redemption
            </h3>
            <p className="text-gray-600 mb-4">
              In offramp mode, you can redeem your tokens for fiat currency.
              <br />
              Click the button below to proceed to the redemption process.
            </p>

            <Redeem
              setError={setError}
              setCurrentStep={setCurrentStep}
              freeError={freeError}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {mode === "onramp" && (
        <div className="text-left">
          {disableNextStep ? (
            <p className="text-gray-600 mb-4">
              Please lookup intent details first.
            </p>
          ) : (
            <p className="text-gray-600 mb-4">
              If you have an Intent, you can proceed to the next step.
            </p>
          )}

          <Button
            onClick={() => {
              setCurrentStep(WorkflowStep.TRANSFER);
              freeError();
            }}
            disabled={disableNextStep}
            variant="outline"
            className="font-medium text-lg px-6 py-3 rounded-lg"
          >
            Next →
          </Button>
        </div>
      )}
    </>
  );
}
