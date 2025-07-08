/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// Extend window object for Ethereum provider
declare global {
  interface Window {
    ethereum?: any;
  }
}

import React, { useEffect, useState } from "react";

import { useAccount, useChainId, useDisconnect, usePublicClient } from "wagmi";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI } from "@/lib/wagmi";
import Connect from "./step/Connect";
import Signal from "./step/Signal/index";
import Redeem from "./step/Signal/Redeem";
import Transfer from "./step/Transfer";
import Proof from "./step/Proof";
import FulFill from "./step/FulFill";

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

  useEffect(() => {
    handleRefreshMyIntentId();
  }, [isConnected, address]);

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
  const [error, setError] = useState<string | null>(null);

  const [fulfillmentResult, setFulfillmentResult] =
    useState<FulfillmentResult | null>(null);

  const [proofResult, setProofResult] = useState<ProofResult | null>(null);

  const freeError = () => {
    setError(null);
  };

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
        setError("No Intent found");
        setIntentDetails(null);
      }
    } catch (error) {
      console.error("Failed to lookup Intent ID:", error);
      setError("Failed to lookup Intent ID");
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
        setError(`Intent ID ${targetIntentId} not found`);
      }
    } catch (error) {
      console.error("Failed to lookup Intent ID:", error);
      setIntentDetails(null);
      setError(`Intent ID ${targetIntentId} not found`);
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
            setError={setError}
            setCurrentStep={setCurrentStep}
            freeError={freeError}
            isLoading={isLoading}
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
            freeError={freeError}
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
            setError={setError}
            freeError={freeError}
            setIsLoading={setIsLoading}
            setProofResult={setProofResult}
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
            setError={setError}
            setFulfillmentResult={setFulfillmentResult}
          />
        );

      default:
    }
  };

  return (
    <main className="min-h-screen bg-white pb-12 pt-[110px] px-4">
      <div className="max-w-container mx-auto">
        <h1 className="title">ZK Escrow Transfer System</h1>
        <section className="mt-15 p-15 bg-gray-300 rounded-[10px] border border-gray-border">
          {renderStepContent()}

          {/* <ErrorMessage error={error} freeError={freeError} /> */}
        </section>
      </div>
    </main>
  );
}

const ErrorMessage = ({
  error,
  freeError,
}: {
  error: string | null;
  freeError: () => void;
}) => {
  if (!error) return null;
  return (
    <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Error
        <button className="cursor-pointer ml-2" onClick={freeError}>
          <p className="text-red-700">{error}</p>
        </button>
      </h3>
    </div>
  );
};
