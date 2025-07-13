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
      <section className="space-y-[15px]">
        <div className="space-y-[30px] text-center max-sm:space-y-4">
          <h2 className="header">Step 2: Register Your Intent</h2>
          <section
            className={cn(
              "px-5 py-[15px] bg-white border border-gray-border rounded-[10px] space-y-[15px]",
              "max-sm:p-3 max-sm:rounded-[5px] max-sm:space-y-2.5"
            )}
            >
            <WalletStatus isConnected={isConnected} chainId={chainId} />
            {
              isConnected && (
                <Button
                  onClick={() => setShowHistory(!showHistory)}
                  variant="outline"
                  size="max"
                  className="flex items-center justify-center"
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
                  {showHistory ? "Hide" : "Show" } Minting History
                </Button>
              )
            }
          </section>
        </div>
        <MintingHistory showHistory={showHistory} />
        <ToggleSignalMode isOnramp={isOnramp} toggleMode={toggleMode}>
          {renderSignalContent()}
        </ToggleSignalMode>
      </section>

      {isOnramp && !disableNextStep && (
        <div className="text-left mt-5">
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
            <div className="max-sm:scale-75">
              <ArrowIcon />
            </div>
          </Button>
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
      <section
        className={cn(
          "border border-gray-border rounded-[10px] px-5 py-[30px] bg-white space-y-[15px]",
          "max-sm:p-3 max-sm:rounded-[5px] max-sm:space-y-2.5"
        )}
      >
        <div className="flex justify-between items-start max-sm:flex-col max-sm:items-start max-sm:space-y-2.5">
          <section className="space-y-[5px]">
            <h3 className="body text-black">
              <span
                className={cn(
                  "mr-1 w-4 inline-block",
                  "max-sm:mr-0.5 max-sm:w-3",
                  isOnramp ? "text-blue-600" : "text-black"
                )}
              >
                ◆
              </span>
              <strong className="mr-1 font-bold max-sm:mr-0.5">
                {isOnramp ? "Onramp" : "Offramp"}
              </strong>
              <p className="text ml-5 max-sm:ml-3.5">
                {isOnramp ? "KRW WON → KRW tokens" : "KRW tokens → KRW WON"}
              </p>
            </h3>
          </section>
          {/* Mode Toggle Slider */}
          <button
            onClick={toggleMode}
            className={cn(
              "relative text-[14px] leading-[18px] inline-flex font-semibold p-[5px] items-center rounded-full border border-gray-border bg-white",
              "max-sm:w-full"
            )}
          >
            <span
              className={cn(
                "absolute inset-y-[5px] left-0 w-[calc(50%-5px)] rounded-full px-[7px] py-[3px]  transition-all duration-200 ease-out",
                isOnramp
                  ? "translate-x-[5px] bg-blue-600"
                  : "translate-x-[calc(100%+5px)] bg-black"
              )}
            />
            <div
              className={cn(
                "relative z-10 flex-1 text-center px-[7px] py-[3px] transition-all duration-200",
                isOnramp ? "text-white" : "text-[rgba(73,73,73,0.70)]"
              )}
            >
              Onramp
            </div>
            <div
              className={cn(
                "relative z-10 flex-1 text-center px-[7px] py-[3px] transition-all duration-200",
                !isOnramp ? "text-white" : "text-[rgba(73,73,73,0.70)]"
              )}
            >
              Offramp
            </div>
          </button>
        </div>

        {children}
      </section>
    </>
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
