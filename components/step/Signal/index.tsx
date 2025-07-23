import { Button } from "@/components/ui/button";
import {
  IntentDetails,
  RedeemDetails,
  RedeemResult,
  WorkflowStep,
} from "@/components/Home";
import { useContext, useEffect, useState, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import ADDRESSES from "@/lib/addresses";
import { cn } from "@/lib/utils";
import { ZK_MINTER_ABI } from "@/lib/abi";
import { ErrorType } from "@/lib/errors";
import EnrollIntent from "./EnrollIntent";
import IntentManagement from "./IntentManagement";
import Redeem from "./Redeem";
import RedeemRequest from "./RedeemRequest";
import WalletStatus from "@/components/step/Signal/WalletStatus";
import { ErrorContext } from "@/context/ErrorContext";
import MintingHistory from "@/components/MintingHistory";

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
  setCurrentStep,
  chainId,
  isConnected,
}: {
  intentId: number | null;
  searchIntentId: number | null;
  intentDetails: IntentDetails | null;
  setIntentId: (intentId: number) => void;
  setSearchIntentId: (searchIntentId: number) => void;
  handleRefreshMyIntentId: () => void;
  setCurrentStep: (step: WorkflowStep) => void;
  chainId: number;
  isConnected: boolean;
}) {
  const [mode, setMode] = useState<SignalMode>(SignalMode.ONRAMP);
  const { setError, freeError } = useContext(ErrorContext);
  const [redeemId, setRedeemId] = useState<number | null>(null);
  const [redeemDetails, setRedeemDetails] = useState<RedeemDetails | null>(
    null
  );
  const [redeemResult, setRedeemResult] = useState<RedeemResult | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [showHistory, setShowHistory] = useState(true);

  const { address } = useAccount();

  const publicClient = usePublicClient();

  const handleRefreshRedeemDetails = useCallback(
    async (targetRedeemId: number) => {
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
          setError(ErrorType.REDEEM_NOT_FOUND, { redeemId: targetRedeemId });
        }
      } catch (error) {
        console.error("Failed to lookup Redeem ID:", error);
        setRedeemDetails(null);
        setError(ErrorType.REDEEM_NOT_FOUND, { redeemId: targetRedeemId });
      }
    },
    [publicClient, setError]
  );

  const readRedeemRequest = useCallback(async () => {
    if (!address) return;

    try {
      const redeemRequestId = await publicClient?.readContract({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "accountRedeemRequest",
        args: [address],
      });

      if (redeemRequestId && Number(redeemRequestId) > 0) {
        setRedeemId(Number(redeemRequestId));
        await handleRefreshRedeemDetails(Number(redeemRequestId));
      }
    } catch (error) {
      console.error("Failed to read redeem request:", error);
    }
  }, [address, publicClient, handleRefreshRedeemDetails]);

  const disableNextStep = !intentId || !intentDetails?.amount;
  const isOnramp = mode === SignalMode.ONRAMP;
  const toggleMode = () => {
    setMode(
      mode === SignalMode.ONRAMP ? SignalMode.OFFRAMP : SignalMode.ONRAMP
    );
  };

  useEffect(() => {
    if (!isOnramp) {
      readRedeemRequest();
    }
  }, [address, isOnramp, readRedeemRequest]);

  const renderSignalContent = () => {
    if (isOnramp) {
      if (intentId) {
        return (
          <IntentManagement
            intentId={intentId}
            searchIntentId={searchIntentId}
            intentDetails={intentDetails}
            handleRefreshMyIntentId={handleRefreshMyIntentId}
            setIntentId={setIntentId}
            setSearchIntentId={setSearchIntentId}
          />
        );
      } else {
        return (
          <EnrollIntent
            address={address}
            setIntentId={setIntentId}
            setSearchIntentId={setSearchIntentId}
            handleRefreshMyIntentId={handleRefreshMyIntentId}
            intentId={intentId}
          />
        );
      }
    } else {
      if (redeemId) {
        return (
          <RedeemRequest
            redeemId={redeemId}
            redeemDetails={redeemDetails}
            setRedeemId={setRedeemId}
            setRedeemDetails={setRedeemDetails}
            setRedeemResult={setRedeemResult}
            setAccountNumber={setAccountNumber}
            setAmount={setAmount}
          />
        );
      } else {
        return (
          <Redeem
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
        );
      }
    }
  };

  return (
    <>
      <section className="space-y-6">
        <div className="text-center space-y-4">
          <div className="space-y-4">
            <WalletStatus isConnected={isConnected} chainId={chainId} />
            {isConnected && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full px-4 py-3 rounded-full bg-secondary/30 hover:bg-secondary/40 transition-all duration-200 border border-border/50 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  className={`transition-transform duration-200 ${
                    showHistory ? "" : "rotate-180"
                  }`}
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {showHistory ? "Hide" : "Show"} Minting History
              </button>
            )}
          </div>
        </div>
        <MintingHistory showHistory={showHistory} />
        <ToggleSignalMode isOnramp={isOnramp} toggleMode={toggleMode}>
          {renderSignalContent()}
        </ToggleSignalMode>
      </section>

      {isOnramp && !disableNextStep && (
        <div className="mt-6">
          <button
            onClick={() => {
              setCurrentStep(WorkflowStep.TRANSFER);
              freeError();
            }}
            disabled={disableNextStep}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-8 py-3 rounded-full font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
          >
            Next
            <ArrowIcon />
          </button>
        </div>
      )}
    </>
  );
}

const ToggleSignalMode = ({
  isOnramp,
  toggleMode,
  children,
}: {
  isOnramp: boolean;
  toggleMode: () => void;
  children: React.ReactNode;
}) => {
  return (
    <>
      <section className="space-y-6">
        <div className="bg-secondary/30 rounded-2xl p-5 border border-border/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-2xl",
                isOnramp ? "text-primary" : "text-foreground"
              )}>◆</span>
              <div>
                <h3 className="text-base font-semibold">
                  {isOnramp ? "Onramp" : "Offramp"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isOnramp ? "KRW WON → KRW tokens" : "KRW tokens → KRW WON"}
                </p>
              </div>
            </div>
            <div className="relative bg-secondary/50 rounded-full p-0.5">
              <button
                onClick={toggleMode}
                className="relative flex items-center"
              >
                <span
                  className={cn(
                    "absolute h-9 w-[88px] rounded-full bg-primary transition-all duration-300 ease-out shadow-[0_0_15px_rgba(255,0,122,0.4)]",
                    isOnramp
                      ? "translate-x-0"
                      : "translate-x-[88px]"
                  )}
                />
                <div
                  className={cn(
                    "relative z-10 px-6 py-2 text-sm font-medium transition-all duration-200 rounded-full",
                    isOnramp ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Onramp
                </div>
                <div
                  className={cn(
                    "relative z-10 px-6 py-2 text-sm font-medium transition-all duration-200 rounded-full",
                    !isOnramp ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Offramp
                </div>
              </button>
            </div>
          </div>
        </div>

        {children}
      </section>
    </>
  );
};

const ArrowIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M7.5 15L12.5 10L7.5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
