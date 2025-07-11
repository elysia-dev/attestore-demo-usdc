/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// Extend window object for Ethereum provider
declare global {
  interface Window {
    ethereum?: any;
  }
}

import React, { useEffect, useState, useRef, useContext } from "react";

import { useAccount, useChainId, useDisconnect, usePublicClient } from "wagmi";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI } from "@/lib/wagmi";
import { ErrorType } from "@/lib/errors";
import Connect from "./step/Connect";
import Signal from "./step/Signal/index";
import Redeem from "./step/Signal/Redeem";
import Transfer from "./step/Transfer";
import Proof from "./step/Proof";
import FulFill from "./step/FulFill";
import { Button } from "./ui/button";
import Image from "next/image";
import { ErrorContext } from "@/context/ErrorContext";
import { cn } from "@/lib/utils";

export enum WorkflowStep {
  CONNECT = "connect",
  SIGNAL = "signal",
  TRANSFER = "transfer",
  PROOF = "proof",
  FULFILL = "fulfill",
}
export type FulfillmentResult = {
  success: boolean;
  intentHash?: string;
  verifier?: string;
  owner?: string;
  to?: string;
  amount?: bigint;
  txHash?: string;
};
export type IntentDetails = {
  owner: string;
  to: string;
  amount: bigint;
  timestamp: number;
  verifier: string;
};

export type RedeemDetails = {
  owner: string;
  amount: bigint;
  timestamp: number;
};

export type RedeemResult = {
  success: boolean;
  redeemId?: number;
  txHash?: string;
};

export type ProofResult = {
  success?: boolean;
  error?: string;
  data?: {
    extractedParameters: {
      documentTitle: string;
      receivingBankAccount: string;
      recipientName: string;
      senderNickname: string;
      transactionAmount: string;
      transactionDate: string;
    };
    provider: string;
    receipt: {
      request: any;
      claim: {
        context: string;
        epoch: number;
        identifier: string;
        owner: string;
        parameters: string;
        provider: string;
        timestampS: number;
      };
      signatures: {
        attestorAddresS: string;
        claimSignature: any;
        resultSignature: any;
      };
    };
  };
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    handleRefreshMyIntentId();
  }, [isConnected, address]); // eslint-disable-line react-hooks/exhaustive-deps

  const [currentStep, setCurrentStep] = useState<WorkflowStep>(
    WorkflowStep.CONNECT
  );

  const [intentId, setIntentId] = useState<number | null>(null);
  const [searchIntentId, setSearchIntentId] = useState<number | null>(null);
  const [intentDetails, setIntentDetails] = useState<IntentDetails | null>(
    null
  );

  const [issueDate, setIssueDate] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const { error, setError, freeError } = useContext(ErrorContext);

  const [fulfillmentResult, setFulfillmentResult] =
    useState<FulfillmentResult | null>(null);

  const [proofResult, setProofResult] = useState<ProofResult | null>(null);

  // 에러가 생성되면 에러 메세지창으로 포커싱
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [error]);

  // 지갑 연결 상태가 변경될 때 단계 업데이트
  useEffect(() => {
    if (isConnected && currentStep === WorkflowStep.CONNECT) {
      setCurrentStep(WorkflowStep.SIGNAL);
    } else if (!isConnected) {
      setCurrentStep(WorkflowStep.CONNECT);
      setIntentId(null);
      setProofResult(null);
      setIssueDate("");
      setCertificateNumber("");
      setFulfillmentResult(null);
      setSearchIntentId(null);
      setIntentDetails(null);
    }
  }, [isConnected, currentStep]);

  // 내 intentId 조회 함수 (address 기반)
  const handleRefreshMyIntentId = async () => {
    if (!address) return;
    try {
      setIsLoading(true);
      // accountIntent 함수로 현재 사용자의 intentId 조회
      const userIntentId = await publicClient?.readContract({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "accountIntent",
        args: [address],
      });

      if (userIntentId && Number(userIntentId) > 0) {
        const newIntentId = Number(userIntentId);
        setSearchIntentId(newIntentId); // 검색 필드에도 표시
        setIntentId(newIntentId);
        handleSearchIntentDetails(newIntentId);
      } else {
        setIntentDetails(null);
      }
    } catch (error) {
      console.error("Failed to lookup Intent ID:", error);
      setError(ErrorType.INTENT_LOOKUP_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  // 임의의 Intent ID로 상세 정보 조회
  const handleSearchIntentDetails = async (targetIntentId: number) => {
    if (!targetIntentId) return;

    try {
      setIsLoading(true);
      const intentData = await publicClient?.readContract({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "intents",
        args: [BigInt(targetIntentId)],
      });

      if (
        intentData &&
        intentData[0] !== "0x0000000000000000000000000000000000000000"
      ) {
        const [owner, to, amount, timestamp, verifier] = intentData as [
          string,
          string,
          bigint,
          bigint,
          string
        ];
        setIntentDetails({
          owner,
          to,
          amount,
          timestamp: Number(timestamp),
          verifier,
        });
      } else {
        setIntentDetails(null);
        setError(ErrorType.INTENT_NOT_FOUND, { id: targetIntentId });
      }
    } catch (error) {
      console.error("Failed to lookup Intent ID:", error);
      setIntentDetails(null);
      setError(ErrorType.INTENT_NOT_FOUND, { id: targetIntentId });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case WorkflowStep.CONNECT:
        return <Connect />;
      case WorkflowStep.SIGNAL:
        return (
          <Signal
            intentId={intentId}
            searchIntentId={searchIntentId}
            intentDetails={intentDetails}
            setIntentId={setIntentId}
            setSearchIntentId={setSearchIntentId}
            handleRefreshMyIntentId={handleRefreshMyIntentId}
            setCurrentStep={setCurrentStep}
            chainId={chainId}
            isConnected={isConnected}
          />
        );

      case WorkflowStep.TRANSFER:
        return (
          <Transfer
            intentId={intentId}
            intentDetails={intentDetails}
            setCurrentStep={setCurrentStep}
          />
        );

      case WorkflowStep.PROOF:
        return (
          <Proof
            issueDate={issueDate}
            setIssueDate={setIssueDate}
            certificateNumber={certificateNumber}
            setCertificateNumber={setCertificateNumber}
            intentId={intentId}
            setCurrentStep={setCurrentStep}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            setProofResult={setProofResult}
            proofResult={proofResult}
          />
        );
      case WorkflowStep.FULFILL:
        return (
          <FulFill
            issueDate={issueDate}
            certificateNumber={certificateNumber}
            intentId={intentId}
            setCurrentStep={setCurrentStep}
            fulfillmentResult={fulfillmentResult}
            proofResult={proofResult}
            setFulfillmentResult={setFulfillmentResult}
          />
        );

      default:
    }
  };

  return (
    <main
      className={cn(
        "min-h-screen bg-white pb-20 pt-[110px] px-4 min-w-[320px]",
        "max-sm:pt-[64px] max-sm:pb-10 max-sm:px-0 max-sm:w-[90%] max-sm:mx-auto"
      )}
    >
      <div className="max-w-container mx-auto max-sm:w-full">
        <h1 className="title">ZK Escrow Transfer System</h1>
        <section
          className={cn(
            "mt-15 p-15 bg-gray-300 rounded-[10px] border min-w-[320px] border-gray-border",
            "max-sm:py-5 max-sm:px-2.5 max-sm:mt-8 max-sm:rounded-[5px]"
          )}
        >
          {renderStepContent()}
        </section>

        <ErrorMessage error={error} freeError={freeError} ref={errorRef} />
      </div>
    </main>
  );
}
const ErrorMessage = React.forwardRef<
  HTMLDivElement,
  { error: string | null; freeError: () => void }
>(function ErrorMessage({ error, freeError }, ref) {
  if (!error) return null;

  return (
    <section
      ref={ref}
      className="p-5 border border-red-primary rounded-[10px] bg-red-100 mt-2.5 max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5"
    >
      <div className="gap-[5px] flex items-center">
        <Image src="/error.svg" alt="error" width={20} height={20} />
        <p className="text-red-primary font-semibold body">Error Message</p>
      </div>
      <p className="mt-[5px] text ml-[25px]">{error}</p>

      <div className="flex w-full justify-end">
        <Button
          onClick={freeError}
          variant="outline"
          className="text-red-primary border-red-primary hover:text-white hover:bg-red-primary"
        >
          Close
        </Button>
      </div>
    </section>
  );
});
