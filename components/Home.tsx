/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { useAccount, useChainId, useDisconnect, usePublicClient } from "wagmi";
import {
  formatUnits,
  keccak256,
  toBytes,
  decodeEventLog,
  parseUnits,
  encodeAbiParameters,
} from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BASE_URL, faucetLink } from "@/constant";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI, MOCK_USDT_ABI } from "@/lib/wagmi";
import { useContractWrite } from "@/hooks/useContractWrite";
import FulfillmentResult from "./FulfillmentResult";
import ProofResultComponent from "./ProofResult";
import Connect from "./step/Connect";
import Signal from "./step/Signal";
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

const openFaucetLink = () => {
  window.open(faucetLink, "_blank");
};
const getNetworkName = (chainId: number) => {
  switch (chainId) {
    case 1:
      return "Ethereum Mainnet";
    case 11155111:
      return "Sepolia Testnet";
    case 31337:
      return "Anvil Local";
    case 17000:
      return "Holsky Testnet";
    default:
      return `Chain ID: ${chainId}`;
  }
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
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

  // 강제 연결 해제 함수
  const handleForceDisconnect = () => {
    disconnect();
    setCurrentStep(WorkflowStep.CONNECT);
    setIntentId(null);
    setProofResult(null);
    setIssueDate("");
    setCertificateNumber("");
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900">
              ZK Escrow Transfer System
            </h1>
            <a
              href="https://modoripage.notion.site/Genie-Guide-223f2ffdc30a803eb50eef01f2a43a33?source=copy_link"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              📖 User Guide
            </a>
          </div>

          {currentStep !== WorkflowStep.CONNECT && (
            <WalletStatus
              isConnected={isConnected}
              chainId={chainId}
              openFaucetLink={openFaucetLink}
              handleForceDisconnect={handleForceDisconnect}
            />
          )}

          {renderStepContent()}

          {/* <ErrorMessage error={error} freeError={freeError} /> */}
        </div>
      </div>
    </div>
  );
}

const WalletStatus = ({
  isConnected,
  chainId,
  openFaucetLink,
  handleForceDisconnect,
}: {
  isConnected: boolean;
  chainId: number;
  openFaucetLink: () => void;
  handleForceDisconnect: () => void;
}) => {
  return (
    <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <p className="text-blue-800">
              <strong>Connection Status:</strong>{" "}
              {isConnected ? "Connected" : "Disconnected"}
            </p>
            <div
              className="text-blue-800 cursor-pointer hover:bg-blue-50 transition-colors duration-200 px-2 py-1 rounded-lg"
              onClick={openFaucetLink}
            >
              <strong>Network:</strong> {getNetworkName(chainId)}
            </div>
          </div>
          <div className="flex gap-2">
            <ConnectButton />
            {isConnected && (
              <Button
                onClick={handleForceDisconnect}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50 h-10"
              >
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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
