/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorkflowStep, FulfillmentResult, ProofResult } from "../Home";
// import ProofResultComponent from "../ProofResult";
import { Button } from "../ui/button";
import FulfillmentResultComponent from "../FulfillmentResult";
import { decodeEventLog, encodeAbiParameters, keccak256, toBytes } from "viem";
import { useContractWrite } from "@/hooks/useContractWrite";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI } from "@/lib/wagmi";
import { ErrorType } from "@/lib/errors";
import { useContext } from "react";
import { ErrorContext } from "@/context/ErrorContext";
import { extractErrorMessage } from "../utils/extractErrorMessage";
import { trackUserAction } from "@/lib/sentry-utils";
import * as Sentry from "@sentry/nextjs";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-label";

export default function FulFill({
  issueDate,
  certificateNumber,
  intentId,
  setCurrentStep,
  fulfillmentResult,
  proofResult,
  setFulfillmentResult,
}: {
  issueDate: string;
  certificateNumber: string;
  intentId: number | null;
  setCurrentStep: (step: WorkflowStep) => void;
  fulfillmentResult: FulfillmentResult | null;
  proofResult: ProofResult | null;
  setFulfillmentResult: (result: FulfillmentResult | null) => void;
}) {
  const { setError } = useContext(ErrorContext);
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

          // 성공 추적
          trackUserAction("Token minting successful", {
            intentHash,
            amount: amount.toString(),
            receiver: to,
            txHash: receipt.transactionHash,
          });

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
      setError(ErrorType.MISSING_INTENT_OR_PROOF);
      return;
    }

    try {
      setFulfillmentResult(null); // 이전 결과 초기화

      // result 데이터를 컨트랙트가 요구하는 형태로 변환
      const formattedProof = formatProofForContract(proofResult);

      // proof 객체를 바이트로 인코딩
      const encodedProof = encodeProofToBytes(formattedProof);
      // 사용자 액션 추적
      trackUserAction("Mint Tokens clicked", {
        intentId,
        encodedProof,
      });

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
      const errorMessage = extractErrorMessage(error);
      console.error("Failed to fulfillIntent:", error);

      // 포맷팅/인코딩 에러 추적
      Sentry.captureException(error, {
        tags: {
          type: "proof_formatting_error",
          step: "5_token_minting",
        },
        contexts: {
          proof_formatting: {
            intentId,
            proofIdentifier: proofResult?.data,
            errorMessage,
            errorPhase: "pre_transaction",
            proofResultKeys: Object.keys(proofResult || {}),
          },
        },
      });

      setError(`Token minting failed: ${errorMessage}`);
      setFulfillmentResult({ success: false });
    }
  };
  return (
    <>
      {fulfillmentResult?.success && (
        <FulfillmentResultComponent fulfillmentResult={fulfillmentResult} />
      )}
      {!fulfillmentResult?.success && (
        <section className="space-y-[20px]">
          <h2 className="header text-center">Step 5: Token Minting</h2>

          <section
            className={cn(
              "bg-white border border-gray-border rounded-[10px] py-[30px] px-[20px]",
              "max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5"
            )}
          >
            <p className="body font-bold">
              <strong className="text-blue-primary w-4 mr-1 max-sm:mr-0.5 max-sm:w-3">
                ◆
              </strong>{" "}
              Click &apos;Mint Tokens&apos;.
            </p>
            <div className="space-y-[5px] text text-gray-600 pl-4 mt-[15px] max-sm:pl-3.5 max-sm:mt-[5px]">
              <p>Mint tokens to the recipient wallet.</p>
            </div>
          </section>

          <section className="mt-5 p-5 bg-white border border-gray-border rounded-[10px] space-y-2.5">
            {/* intentId */}
            <p className="text font-semibold">· Intent ID</p>
            <Input
              id="intentId"
              type="text"
              value={intentId?.toString() || ""}
              disabled={true}
              className="text max-sm:label border rounded-[5px] py-2.5 px-[15px] max-sm:py-[5px] max-sm:px-2 bg-white"
            />
            <Label htmlFor="issueDate" className="text font-semibold">
              · Issue Date
            </Label>
            <Input
              id="issueDate"
              type="text"
              value={issueDate}
              disabled={!!proofResult}
              className={cn(
                "text max-sm:label border rounded-[5px] py-2.5 px-[15px] max-sm:py-[5px] max-sm:px-2 bg-white"
              )}
            />
            <Label htmlFor="certificateNumber" className="text font-semibold">
              · Certificate Issue Number
            </Label>
            <Input
              id="certificateNumber"
              type="text"
              value={certificateNumber}
              disabled={!!proofResult}
              className={cn(
                "text max-sm:label border rounded-[5px] py-2.5 px-[15px] max-sm:py-[5px] max-sm:px-2 bg-white"
              )}
            />
          </section>

          <div className="flex gap-2.5 mt-5">
            <Button
              onClick={() => setCurrentStep(WorkflowStep.PROOF)}
              variant="outline"
              className="flex-1 bg-white"
            >
              <div className="max-sm:scale-75">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="21"
                  height="21"
                  viewBox="0 0 21 21"
                  fill="none"
                >
                  <path
                    d="M9.25 16.75L3 10.5M3 10.5L9.25 4.25M3 10.5H18"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              Previous
            </Button>

            <Button
              onClick={handleFulfillIntent}
              className="flex-1"
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
              {!isFulfillIntentLoading && !fulfillmentResult?.success && (
                <div className="max-sm:scale-75">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="21"
                    height="21"
                    viewBox="0 0 21 21"
                    fill="none"
                  >
                    <path
                      d="M11.75 16.75L18 10.5M18 10.5L11.75 4.25M18 10.5H3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </Button>
          </div>
        </section>
      )}
    </>
  );
}
