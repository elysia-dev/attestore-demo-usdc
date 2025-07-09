import { Button } from "@/components/ui/button";
import {
  IntentDetails,
  RedeemDetails,
  RedeemResult,
  WorkflowStep,
} from "@/components/Home";
import { useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import ADDRESSES from "@/lib/addresses";
import { cn } from "@/lib/utils";
import { ZK_MINTER_ABI } from "@/lib/wagmi";
import EnrollIntent from "./EnrollIntent";
import IntentManagement from "./IntentManagement";
import Redeem from "./Redeem";
import RedeemRequest from "./RedeemRequest";
import WalletStatus from "@/components/utils/WalletStatus";

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
  chainId,
  isConnected,
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
  chainId: number;
  isConnected: boolean;
}) {
  const [mode, setMode] = useState<SignalMode>(SignalMode.ONRAMP);

  const [redeemId, setRedeemId] = useState<number | null>(null);
  const [redeemDetails, setRedeemDetails] = useState<RedeemDetails | null>(
    null
  );
  const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");

  const { address } = useAccount();

  const publicClient = usePublicClient();

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

  const disableNextStep = !intentId || !intentDetails?.amount;
  const isOnramp = mode === SignalMode.ONRAMP;

  return (
    <>
      <section>
        <div className="space-y-[30px] text-center">
          <h2 className="header">Step 2: Intent Management</h2>
          <WalletStatus isConnected={isConnected} chainId={chainId} />
        </div>
        <ToggleSignalMode isOnramp={isOnramp} setMode={setMode}>
          {isOnramp && (
            <EnrollIntent
              address={address}
              setError={setError}
              setIntentId={setIntentId}
              setSearchIntentId={setSearchIntentId}
              handleRefreshMyIntentId={handleRefreshMyIntentId}
              intentId={intentId}
            />
          )}
          {!isOnramp && (
            <Redeem
              setError={setError}
              redeemId={redeemId}
              accountNumber={accountNumber}
              amount={amount}
              setRedeemId={setRedeemId}
              handleRefreshRedeemDetails={handleRefreshRedeemDetails}
              redeemResult={redeemResult}
              setRedeemResult={setRedeemResult}
              setAccountNumber={setAccountNumber}
              setAmount={setAmount}
            />
          )}
        </ToggleSignalMode>

        {isOnramp && (
          <IntentManagement
            intentId={intentId}
            searchIntentId={searchIntentId}
            intentDetails={intentDetails}
            handleRefreshMyIntentId={handleRefreshMyIntentId}
            isLoading={isLoading}
          />
        )}
        {!isOnramp && (
          <RedeemRequest
            isLoading={isLoading}
            address={address}
            redeemId={redeemId}
            redeemDetails={redeemDetails}
            setRedeemId={setRedeemId}
            handleRefreshRedeemDetails={handleRefreshRedeemDetails}
            setError={setError}
            setRedeemDetails={setRedeemDetails}
            setRedeemResult={setRedeemResult}
            setAccountNumber={setAccountNumber}
            setAmount={setAmount}
          />
        )}
      </section>

      {isOnramp && (
        <div className="text-left mt-5">
          {disableNextStep ? (
            <p className="text-gray-600 text">
              Please lookup intent details first.
            </p>
          ) : (
            <p className="text-gray-600 text">
              If you have an Intent, you can proceed to the next step.
            </p>
          )}

          <Button
            onClick={() => {
              setCurrentStep(WorkflowStep.TRANSFER);
              freeError();
            }}
            disabled={disableNextStep}
            size="max"
            className="mt-2.5 flex items-center gap-[5px]"
          >
            Next
            <ArrowIcon />
          </Button>
        </div>
      )}
    </>
  );
}

const ToggleSignalMode = ({
  isOnramp,
  setMode,
  children,
}: {
  isOnramp: boolean;
  setMode: (mode: SignalMode) => void;
  children: React.ReactNode;
}) => {
  return (
    <section className="border border-gray-border rounded-[10px] px-5 py-[30px] bg-white space-y-[15px]">
      <div className="flex justify-between items-start">
        <section className="space-y-[5px]">
          <h3 className="body text-black">
            <span
              className={`mr-1 w-4 inline-block ${
                isOnramp ? "text-blue-600" : "text-black"
              }`}
            >
              ◆
            </span>
            {isOnramp ? (
              <>
                <strong className="mr-1 font-bold">Onramp</strong>(Deposit)
                <p className="text ml-5">KRW WON &rarr; KRW tokens</p>
              </>
            ) : (
              <>
                <strong className="mr-1 font-bold">Offramp</strong>(Redeem)
                <p className="text ml-5">KRW tokens &rarr; KRW WON</p>
              </>
            )}
          </h3>
        </section>
        {/* Mode Toggle Slider */}
        <div className="relative text-[14px] leading-[18px] inline-flex font-semibold p-[5px] items-center rounded-full border border-gray-border bg-white">
          <span
            className={cn(
              "absolute inset-y-[5px] left-0 w-[calc(50%-5px)] rounded-full px-[7px] py-[3px]  transition-all duration-200 ease-out",
              isOnramp
                ? "translate-x-[5px] bg-blue-600"
                : "translate-x-[calc(100%+5px)] bg-black"
            )}
          />
          <button
            onClick={() => setMode(SignalMode.ONRAMP)}
            className={cn(
              "relative z-10 flex-1 text-center px-[7px] py-[3px] transition-all duration-200",
              isOnramp ? "text-white" : "text-[rgba(73,73,73,0.70)]"
            )}
          >
            Onramp
          </button>
          <button
            onClick={() => setMode(SignalMode.OFFRAMP)}
            className={cn(
              "relative z-10 flex-1 text-center px-[7px] py-[3px] transition-all duration-200",
              !isOnramp ? "text-white" : "text-[rgba(73,73,73,0.70)]"
            )}
          >
            Offramp
          </button>
        </div>
      </div>

      {children}
    </section>
  );
};

const ArrowIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="21"
      viewBox="0 0 21 21"
      fill="none"
    >
      <path
        d="M11.75 16.75L18 10.5M18 10.5L11.75 4.25M18 10.5H3"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
