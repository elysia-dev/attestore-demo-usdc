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
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { useAccount, useChainId, useDisconnect, usePublicClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { faucetLink } from "@/constant";
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

  // KRW 토큰을 지갑에 추가하는 함수
  const handleAddTokenToWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        await window.ethereum.request({
          method: "wallet_watchAsset",
          params: {
            type: "ERC20",
            options: {
              address: ADDRESSES.TOKEN,
              symbol: "KRW",
              decimals: 18,
              image: "", // 토큰 이미지 URL이 있다면 추가
            },
          },
        });
      } else {
        alert("MetaMask or compatible wallet not found");
      }
    } catch (error) {
      console.error("Failed to add token to wallet:", error);
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
          {currentStep !== WorkflowStep.CONNECT && (
            <WalletStatus
              isConnected={isConnected}
              chainId={chainId}
              openFaucetLink={openFaucetLink}
              handleForceDisconnect={handleForceDisconnect}
              handleAddTokenToWallet={handleAddTokenToWallet}
            />
          )}

          {renderStepContent()}

          {/* <ErrorMessage error={error} freeError={freeError} /> */}
        </section>
      </div>
    </main>
  );
}

const WalletStatus = ({
  isConnected,
  chainId,
  openFaucetLink,
  handleForceDisconnect,
  handleAddTokenToWallet,
}: {
  isConnected: boolean;
  chainId: number;
  openFaucetLink: () => void;
  handleForceDisconnect: () => void;
  handleAddTokenToWallet: () => void;
}) => {
  return (
    <section className="mb-5 px-5 py-[15px] bg-white border border-gray-border rounded-[10px] space-y-[15px]">
      <section className="flex justify-between items-center">
        <ConnectButton />
        <div className="flex">
          <p className="label">
            <strong>· Connection Status:&nbsp;</strong>
            {isConnected ? "Connected" : "Disconnected"}
          </p>
          <span className="label mx-1">/</span>
          <div className="label flex items-center">
            <strong>· Network:&nbsp;</strong>
            <div
              onClick={openFaucetLink}
              className="cursor-pointer hover:underline transition-all duration-200"
            >
              {getNetworkName(chainId)}
            </div>
          </div>
        </div>
      </section>
      <section className="flex justify-between items-center">
        {isConnected && (
          <Button
            onClick={handleAddTokenToWallet}
            variant="outlineBlue"
            size="max"
          >
            <svg
              width="21"
              height="20"
              viewBox="0 0 21 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.5 7.5V12.5M13 10H8M18 10C18 10.9849 17.806 11.9602 17.4291 12.8701C17.0522 13.7801 16.4997 14.6069 15.8033 15.3033C15.1069 15.9997 14.2801 16.5522 13.3701 16.9291C12.4602 17.306 11.4849 17.5 10.5 17.5C9.51509 17.5 8.53982 17.306 7.62987 16.9291C6.71993 16.5522 5.89314 15.9997 5.1967 15.3033C4.50026 14.6069 3.94781 13.7801 3.5709 12.8701C3.19399 11.9602 3 10.9849 3 10C3 8.01088 3.79018 6.10322 5.1967 4.6967C6.60322 3.29018 8.51088 2.5 10.5 2.5C12.4891 2.5 14.3968 3.29018 15.8033 4.6967C17.2098 6.10322 18 8.01088 18 10Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Add KRW Token
          </Button>
        )}
      </section>
    </section>
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
