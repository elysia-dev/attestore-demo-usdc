/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import {
  useAccount,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
  useChainId,
  useDisconnect,
  useBalance,
  useSendTransaction,
  usePublicClient,
} from "wagmi";
import {
  parseEther,
  formatEther,
  encodeFunctionData,
  encodeAbiParameters,
  parseAbiParameters,
  parseUnits,
  formatUnits,
  keccak256,
  toBytes,
  decodeEventLog,
} from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { testData } from "../data";
import { BASE_URL } from "@/constant";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI, MOCK_USDT_ABI, ANVIL_ACCOUNTS } from "@/lib/wagmi";
import { useContractWrite } from "@/hooks/useContractWrite";

type WorkflowStep = "connect" | "signal" | "transfer" | "proof" | "fulfill";

type ProofResult = {
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
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();

  const handleFaucet = () => {
    window.open("https://www.alchemy.com/faucets/ethereum-holesky", "_blank");
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

  const {
    writeAndWait: fulfillIntentWrite,
    isLoading: isFulfillIntentLoading,
  } = useContractWrite({
    onSuccess: (receipt) => {
      // fulfillIntent 성공 시 처리
      try {
        const intentFulfilledEvent = receipt.logs.find((log: any) => {
          const intentFulfilledTopic = keccak256(
            toBytes("IntentFulfilled(bytes32,address,address,address,uint256)")
          );
          return (
            log.topics[0] === intentFulfilledTopic &&
            log.address.toLowerCase() === ADDRESSES.ZK_MINTER.toLowerCase()
          );
        });

        if (intentFulfilledEvent) {
          const decodedLog = decodeEventLog({
            abi: ZK_MINTER_ABI,
            data: intentFulfilledEvent.data,
            topics: intentFulfilledEvent.topics,
          });

          const { intentHash, verifier, owner, to, amount } =
            decodedLog.args as {
              intentHash: string;
              verifier: string;
              owner: string;
              to: string;
              amount: bigint;
            };

          setFulfillmentResult({
            success: true,
            intentHash,
            verifier,
            owner,
            to,
            amount,
            txHash: receipt.transactionHash,
          });
        }
      } catch (error) {
        console.error("Failed to parse IntentFulfilled event:", error);
      }
    },
  });

  useEffect(() => {
    handleRefreshMyIntentId();
  }, [isConnected, address]);
  // 워크플로우 상태
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("connect");

  // signalIntent 관련
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [intentId, setIntentId] = useState<number | null>(null);
  const [searchIntentId, setSearchIntentId] = useState<number | null>(null);
  const [receiverTokenBalance, setReceiverTokenBalance] = useState<
    bigint | undefined
  >(undefined);
  const [intentDetails, setIntentDetails] = useState<{
    owner: string;
    to: string;
    amount: bigint;
    timestamp: number;
    verifier: string;
  } | null>(null);

  // Receiver의 USDT 잔고 조회
  // const { data: receiverUsdtBalance } = useReadContract({
  //   address: ADDRESSES.MOCK_USDT,
  //   abi: MOCK_USDT_ABI,
  //   functionName: "balanceOf",
  //   args: intentDetails?.to ? [intentDetails.to as `0x${string}`] : undefined,
  //   query: { enabled: !!intentDetails?.to && chainId === 31337 },
  // });

  const readReceiverTokenBalance = async (to: string) => {
    if (!to) return;

    const balance = await publicClient?.readContract({
      address: ADDRESSES.TOKEN,
      abi: MOCK_USDT_ABI,
      functionName: "balanceOf",
      args: [to as `0x${string}`],
    });
    setReceiverTokenBalance(balance);
  };

  // 기존 proof 생성 관련
  const [issueDate, setIssueDate] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");

  // 로딩 및 결과 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fulfillmentResult, setFulfillmentResult] = useState<{
    success: boolean;
    intentHash?: string;
    verifier?: string;
    owner?: string;
    to?: string;
    amount?: bigint;
    txHash?: string;
  } | null>(null);

  const [proofResult, setProofResult] = useState<ProofResult | null>(null);

  const freeError = () => {
    setError(null);
  };

  // 지갑 연결 상태가 변경될 때 단계 업데이트
  React.useEffect(() => {
    if (isConnected && currentStep === "connect") {
      setCurrentStep("signal");
    } else if (!isConnected) {
      setCurrentStep("connect");
      setIntentId(null);
    }
  }, [isConnected, currentStep]);

  const disableNextStep = !intentId || !intentDetails?.amount;

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

  // ZK Proof 생성
  const handleGenerateProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    freeError();

    try {
      const formattedDate = issueDate.replace(
        /(\d{4})(\d{2})(\d{2})/,
        "$1-$2-$3"
      );

      const response = await axios.post(
        `${BASE_URL}/api/generate-receipt`,
        {
          issuedDate: formattedDate,
          issueNumber: certificateNumber,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setProofResult(response.data);
      setCurrentStep("fulfill");
      freeError();
    } catch (error) {
      console.error("API Error:", error);
      setError("Failed to generate ZK Proof. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatProofForContract = (receiptData: any) => {
    if (!receiptData) {
      throw new Error("Invalid receipt data");
    }

    const receipt = receiptData.data.receipt;
    const claim = receipt.claim;
    const signatures = receipt.signatures;

    let claimSignatureHex = signatures.claimSignature;
    if (
      signatures.claimSignature &&
      typeof signatures.claimSignature === "object"
    ) {
      claimSignatureHex =
        "0x" + Buffer.from(signatures.claimSignature).toString("hex");
    }

    const proofObject = {
      claimInfo: {
        provider: claim.provider,
        parameters: claim.parameters,
        context: claim.context,
      },
      signedClaim: {
        claim: {
          identifier: claim.identifier,
          owner: claim.owner,
          timestampS: claim.timestampS,
          epoch: claim.epoch,
        },
        signatures: [claimSignatureHex],
      },
      isAppclipProof: false,
    };

    return proofObject;
  };

  // proof 객체를 바이트로 인코딩하는 함수 (ABI 인코딩 사용)
  const encodeProofToBytes = (proofObject: any) => {
    try {
      // ReclaimProof 구조체에 맞게 ABI 인코딩
      const encodedProof = encodeAbiParameters(
        [
          {
            type: "tuple",
            components: [
              {
                type: "tuple",
                name: "claimInfo",
                components: [
                  { type: "string", name: "provider" },
                  { type: "string", name: "parameters" },
                  { type: "string", name: "context" },
                ],
              },
              {
                type: "tuple",
                name: "signedClaim",
                components: [
                  {
                    type: "tuple",
                    name: "claim",
                    components: [
                      { type: "bytes32", name: "identifier" },
                      { type: "address", name: "owner" },
                      { type: "uint32", name: "timestampS" },
                      { type: "uint32", name: "epoch" },
                    ],
                  },
                  { type: "bytes[]", name: "signatures" },
                ],
              },
              { type: "bool", name: "isAppclipProof" },
            ],
          },
        ],
        [
          {
            claimInfo: {
              provider: proofObject.claimInfo.provider,
              parameters: proofObject.claimInfo.parameters,
              context: proofObject.claimInfo.context,
            },
            signedClaim: {
              claim: {
                identifier: proofObject.signedClaim.claim
                  .identifier as `0x${string}`,
                owner: proofObject.signedClaim.claim.owner as `0x${string}`,
                timestampS: proofObject.signedClaim.claim.timestampS,
                epoch: proofObject.signedClaim.claim.epoch,
              },
              signatures: proofObject.signedClaim.signatures,
            },
            isAppclipProof: false,
          },
        ]
      );

      return encodedProof;
    } catch (error) {
      console.error("ABI encoding error:", error);
      throw new Error("Failed to ABI encode proof: " + error);
    }
  };

  // fulfillIntent 호출
  const handleFulfillIntent = async () => {
    if (!intentId || !proofResult) {
      console.error("Missing intentId or proofResult");
      setError("Missing intentId or proofResult");
      return;
    }
    try {
      setFulfillmentResult(null); // 이전 결과 초기화

      // result 데이터를 컨트랙트가 요구하는 형태로 변환
      const formattedProof = formatProofForContract(proofResult);

      // proof 객체를 바이트로 인코딩
      const encodedProof = encodeProofToBytes(formattedProof);

      console.log("Encoded proof:", encodedProof);
      console.log("intentId", intentId);

      await fulfillIntentWrite({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "fulfillIntent",
        args: [
          encodedProof, // _paymentProof as bytes
          BigInt(intentId), // intentId
        ],
      });
    } catch (error) {
      console.error("Failed to fulfillIntent:", error);
      setError(
        `Token minting failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setFulfillmentResult({ success: false });
    }
  };

  const handleTestDataSelect = (data: {
    issueDate: string;
    certificateNumber: string;
  }) => {
    setIssueDate(data.issueDate);
    setCertificateNumber(data.certificateNumber);
  };

  // 네트워크 이름 가져오기
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

  // 강제 연결 해제 함수
  const handleForceDisconnect = () => {
    disconnect();
    setCurrentStep("connect");
    setIntentId(null);
    setProofResult(null);
    setIssueDate("");
    setCertificateNumber("");
    setToAddress("");
    setAmount("");
  };

  // 계좌번호 복사 함수
  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText("100202642943");
      window.alert("Copied");
    } catch (err) {
      console.error("Failed to copy account number:", err);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "connect":
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Step 1: Connect Wallet
            </h2>

            <p className="text-gray-600 mb-8">
              Connect your wallet to get started with secure, private, and
              verifiable cross-chain transfers.
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
            {/* Application Description */}

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 mb-8 max-w-4xl mx-auto mt-8">
              <div className="text-left space-y-4 text-gray-700">
                <p className="text-lg leading-relaxed">
                  A revolutionary blockchain application that bridges
                  traditional banking with decentralized finance using
                  Zero-Knowledge proofs.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-blue-600 mb-2">
                      🔒 Privacy-First
                    </h4>
                    <p className="text-sm">
                      Generate cryptographic proofs of your Toss bank transfers
                      without revealing sensitive transaction details.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-green-600 mb-2">
                      🔄 Seamless Bridge
                    </h4>
                    <p className="text-sm">
                      Convert your traditional bank transfers into blockchain
                      tokens through automated escrow mechanisms.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-purple-600 mb-2">
                      ⚡ Instant Verification
                    </h4>
                    <p className="text-sm">
                      Real-time validation of bank transfers using TLS
                      attestation and zero-knowledge cryptography.
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-semibold text-orange-600 mb-2">
                      🌐 Cross-Chain Ready
                    </h4>
                    <p className="text-sm">
                      Built for interoperability across multiple blockchain
                      networks and traditional financial systems.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-100 p-4 rounded-lg mt-6">
                  <p className="text-sm text-blue-800">
                    <strong>How it works:</strong> Create an intent → Transfer
                    via Toss → Generate ZK proof → Mint tokens
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "signal":
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Step 2: Intent Management
            </h2>
            {/* 나의 Intent Id */}

            <p className="text-gray-600 mb-8">
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

            {/* 다음 단계로 건너뛰기 */}
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
                  setCurrentStep("transfer");
                  freeError();
                }}
                disabled={disableNextStep}
                variant="outline"
                className="font-medium text-lg px-6 py-3 rounded-lg"
              >
                Next →
              </Button>
            </div>
          </div>
        );

      case "transfer":
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Step 3: Toss Transfer
            </h2>

            {/* 토스 송금 데모 비디오 */}
            <div className="mb-8">
              <video
                controls
                className="w-full max-w-2xl mx-auto rounded-lg shadow-lg h-[640px]"
                poster="/tossbank_transfer_korean_thumbnail.jpg"
              >
                <source src="/tossbank_transfer_korean_.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <p className="text-gray-600 mb-8">
              1. Send fiat money to the recipient via Toss app.
              <br />
              2. Click <strong>Next</strong> for proceeding to the next step.
            </p>

            {/* 토스 송금 안내 - Intent ID가 있을 때만 표시 */}
            {intentId && intentDetails?.amount && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                  📱 Send money via Toss app
                </h3>
                <div className="space-y-2 text-yellow-700">
                  <p>
                    <strong>Recipient Name:</strong> 이현민 (Modori Tossbank
                    account)
                  </p>
                  <p className="flex items-center gap-2">
                    <strong>Bank Account:</strong>{" "}
                    <button
                      onClick={handleCopyAccountNumber}
                      className="text-blue-600 hover:text-blue-800 font-mono bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors duration-200 flex items-center gap-2"
                      title="Click to copy account number"
                    >
                      <span>100202642943</span>
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
                        <rect
                          width="14"
                          height="14"
                          x="8"
                          y="8"
                          rx="2"
                          ry="2"
                        />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    </button>
                    (토스뱅크)
                  </p>
                  <p>
                    <strong>Transfer Memo:</strong>{" "}
                    <code className="bg-yellow-100 px-2 py-1 rounded">
                      {intentId}
                    </code>
                  </p>
                  <p>
                    <strong>Amount:</strong>{" "}
                    {formatUnits(intentDetails?.amount, 18)} KRW
                  </p>
                </div>
              </div>
            )}

            {intentId && (
              <p className="text-gray-600 mb-8">
                After transfer, click <strong>Next</strong>
              </p>
            )}

            {!intentId && (
              <p className="text-gray-600 mb-6">
                Please lookup Intent ID first. (click previous)
              </p>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep("signal")}
                variant="outline"
                className="font-medium text-lg px-6 py-3 rounded-lg"
              >
                ← Previous
              </Button>

              <Button
                onClick={() => {
                  setCurrentStep("proof");
                  freeError();
                }}
                disabled={!intentId}
                variant="outline"
                className="font-medium text-lg px-6 py-3 rounded-lg"
              >
                Next →
              </Button>
            </div>
          </div>
        );

      case "proof":
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Step 4: ZK Proof Generation
            </h2>
            <ul className="text-gray-600">
              <p className="text-gray-600 mb-8">
                Click <strong>Generate ZK Proof</strong> for generating ZK
                Proof.
              </p>
              <li>
                &apos;Generate ZK Proof&apos; button requires remote server to
                generate zk Proof with eth signed
                <br />
                - remote server generates tls proof using attestor-server for
                the Toss transfer
                <br />
                - remote server and attestor-server connected via websocket
                <br />
                - attestor-server validates the proof and signs with its private
                key
                <br />- remote server sends the proof to the attestor-server
              </li>
            </ul>

            {/* intentId */}
            <div className="space-y-3 my-6">
              <p className="text-gray-600 mb-4 bg-gray-100 p-4 rounded-lg">
                <strong>Intent ID :</strong> {intentId}
              </p>
            </div>

            <form onSubmit={handleGenerateProof} className="space-y-6">
              <div className="space-y-3">
                <Label
                  htmlFor="issueDate"
                  className="text-lg font-medium text-gray-700"
                >
                  Issue Date
                </Label>
                <Input
                  id="issueDate"
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  placeholder="Enter certificate issue date (e.g., 20250618)"
                  className="h-14 text-base border-gray-300 rounded-lg px-4 placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="certificateNumber"
                  className="text-lg font-medium text-gray-700"
                >
                  Certificate Issue Number
                </Label>
                <Input
                  id="certificateNumber"
                  type="text"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  placeholder="Please enter the certificate issue number."
                  className="h-14 text-base border-gray-300 rounded-lg px-4 placeholder:text-gray-400"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={() => setCurrentStep("transfer")}
                  variant="outline"
                  className="font-medium text-lg px-6 py-3 rounded-lg"
                >
                  ← Previous
                </Button>

                <Button
                  type="submit"
                  className={`bg-blue-500 hover:bg-blue-600 text-white font-medium text-lg px-8 py-3 rounded-lg ${
                    isLoading ? "bg-gray-400" : "bg-blue-500"
                  }`}
                  disabled={!issueDate || !certificateNumber || isLoading}
                >
                  Generate ZK Proof
                </Button>
              </div>
            </form>
          </div>
        );

      case "fulfill":
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Step 5: Token Minting
            </h2>
            <p className="text-gray-600 ">ZK Proof has been generated.</p>
            <p className="text-gray-600 mb-8">
              Click <strong>Mint Tokens</strong> for minting tokens.
            </p>

            <div className="space-y-3">
              <Label
                htmlFor="issueDate"
                className="text-lg font-medium text-gray-700"
              >
                Issue Date
              </Label>
              <Input
                id="issueDate"
                type="text"
                value={issueDate}
                disabled={true}
                placeholder="Enter certificate issue date (e.g., 20250618)"
                className="h-14 text-base border-gray-300 rounded-lg px-4 placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="certificateNumber"
                className="text-lg font-medium text-gray-700"
              >
                Certificate Issue Number
              </Label>
              <Input
                id="certificateNumber"
                type="text"
                value={certificateNumber}
                disabled={true}
                placeholder="Please enter the certificate issue number.(e.g, 1234-ABCD-EFGHIJKL)"
                className="h-14 text-base border-gray-300 rounded-lg px-4 placeholder:text-gray-400"
              />
            </div>

            {/* intentId */}
            <div className="space-y-3 my-6">
              <p className="text-gray-600 mb-4 bg-gray-100 p-4 rounded-lg">
                <strong>Intent ID :</strong> {intentId}
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep("proof")}
                variant="outline"
                className="font-medium text-lg px-6 py-3 rounded-lg"
              >
                ← Previous
              </Button>

              <Button
                onClick={handleFulfillIntent}
                className="font-medium text-lg px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
                disabled={
                  isFulfillIntentLoading ||
                  !intentId ||
                  fulfillmentResult?.success
                }
              >
                {isFulfillIntentLoading
                  ? "Minting Tokens..."
                  : fulfillmentResult?.success
                  ? "Minting Complete"
                  : "Mint Tokens"}
              </Button>
            </div>

            {fulfillmentResult && (
              <FulfillmentResult fulfillmentResult={fulfillmentResult} />
            )}

            {proofResult && (
              <>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 my-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    ✅ Proof Generation Completed
                  </h3>
                  <ProofResultComponent proofResult={proofResult} />
                </div>
              </>
            )}
          </div>
        );

      default:
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-12">
            ZK Escrow Transfer System
          </h1>

          {currentStep !== "connect" && (
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
                      onClick={handleFaucet}
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
          )}

          {/* 단계별 콘텐츠 */}
          {renderStepContent()}

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Error
                <button className="cursor-pointer ml-2" onClick={freeError}>
                  ❌
                </button>
              </h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* {currentStep === "proof" && (
            <TestProofs
              testData={testData}
              handleTestDataSelect={handleTestDataSelect}
            />
          )} */}
        </div>
      </div>
    </div>
  );
}

const ProofResultComponent = ({
  proofResult,
}: {
  proofResult: ProofResult | null;
}) => {
  const [showAPIResponse, setShowAPIResponse] = useState(false);
  if (!proofResult) return null;
  if (proofResult.error) return null;

  return (
    <div>
      {proofResult.data?.extractedParameters && (
        <div className="bg-white p-4 rounded border mb-4">
          <h4 className="font-semibold text-gray-800 mb-3">
            📋 Extracted Transaction Data
          </h4>
          <div className="mt-3">
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96 border">
              {JSON.stringify(proofResult.data.extractedParameters, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Proof Verification Info */}
      {proofResult.data?.receipt?.claim && (
        <div className="bg-white p-4 rounded border mb-4">
          <h4 className="font-semibold text-gray-800 mb-3">Claim</h4>
          <div className="mt-3">
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96 border">
              {JSON.stringify(proofResult.data.receipt.claim, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Attestor Info */}
      {proofResult.data?.receipt?.signatures && (
        <div className="bg-white p-4 rounded border mb-4">
          <h4 className="font-semibold text-gray-800 mb-3">
            Attestor Signature
          </h4>
          <span className="font-medium text-gray-600">Attestor Address:</span>
          <div className="mt-3">
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96 border">
              {JSON.stringify(proofResult.data.receipt.signatures, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Toggle for Full Data */}
      <div className="mt-4">
        <Button
          onClick={() => setShowAPIResponse(!showAPIResponse)}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          {showAPIResponse ? "Hide Full JSON" : "Show Full JSON"}
        </Button>
        {showAPIResponse && (
          <div className="mt-3">
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96 border">
              {JSON.stringify(proofResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

const TestProofs = ({
  testData,
  handleTestDataSelect,
}: {
  testData: {
    note: number;
    issueDate: string;
    certificateNumber: string;
  }[];
  handleTestDataSelect: (data: {
    issueDate: string;
    certificateNumber: string;
  }) => void;
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Data</h2>
      <p className="text-gray-600 mb-6">
        Click the data below to automatically fill in the form.
      </p>

      <div className="grid gap-4">
        {testData.map(
          (
            data: {
              note: number;
              issueDate: string;
              certificateNumber: string;
            },
            index: number
          ) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleTestDataSelect(data)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">NOTE: {data.note}</p>
                  <p className="font-medium text-gray-900">
                    Issue Date: {data.issueDate}
                  </p>
                  <p className="text-gray-600">
                    Certificate Issue Number: {data.certificateNumber}
                  </p>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

const FulfillmentResult = ({
  fulfillmentResult,
}: {
  fulfillmentResult: {
    success: boolean;
    intentHash?: string;
    verifier?: string;
    owner?: string;
    to?: string;
    amount?: bigint;
    txHash?: string;
  };
}) => {
  if (!fulfillmentResult?.success) return null;
  return (
    <div
      className={`p-6 border rounded-lg my-6 ${
        fulfillmentResult.success
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      {fulfillmentResult.success && (
        <div className="space-y-3 text-sm">
          <h4 className="font-semibold text-gray-800 mb-3">
            ✅ Minting Completed
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="font-medium text-green-800">Intent Hash:</span>
              <p className="text-green-700 font-mono break-all">
                {fulfillmentResult.intentHash}
              </p>
            </div>
            <div>
              <span className="font-medium text-green-800">Verifier:</span>
              <p className="text-green-700 font-mono">
                {fulfillmentResult.verifier?.slice(0, 6)}...
                {fulfillmentResult.verifier?.slice(-4)}
              </p>
            </div>
            <div>
              <span className="font-medium text-green-800">Owner:</span>
              <p className="text-green-700 font-mono">
                {fulfillmentResult.owner?.slice(0, 6)}...
                {fulfillmentResult.owner?.slice(-4)}
              </p>
            </div>
            <div>
              <span className="font-medium text-green-800">Receiver:</span>
              <p className="text-green-700 font-mono">
                {fulfillmentResult.to?.slice(0, 6)}...
                {fulfillmentResult.to?.slice(-4)}
              </p>
            </div>
            <div>
              <span className="font-medium text-green-800">Amount:</span>
              <p className="text-green-700">
                {fulfillmentResult.amount &&
                  formatUnits(fulfillmentResult.amount, 18)}{" "}
                KRW_TEST
              </p>
            </div>
            <div>
              <span className="font-medium text-green-800">Transaction:</span>
              <p className="text-green-700 font-mono">
                {fulfillmentResult.txHash?.slice(0, 6)}...
                {fulfillmentResult.txHash?.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
