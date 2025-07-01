/* eslint-disable @typescript-eslint/no-explicit-any */
import { Label } from "@radix-ui/react-label";
import { WorkflowStep, FulfillmentResult, ProofResult } from "../Home";
import ProofResultComponent from "../ProofResult";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import FulfillmentResultComponent from "../FulfillmentResult";
import { decodeEventLog, encodeAbiParameters, keccak256, toBytes } from "viem";
import { useContractWrite } from "@/hooks/useContractWrite";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI } from "@/lib/wagmi";

export default function FulFill({
  issueDate,
  certificateNumber,
  intentId,
  setCurrentStep,
  fulfillmentResult,
  proofResult,
  setError,
  setFulfillmentResult,
}: {
  issueDate: string;
  certificateNumber: string;
  intentId: number | null;
  setCurrentStep: (step: WorkflowStep) => void;
  fulfillmentResult: FulfillmentResult | null;
  proofResult: ProofResult | null;
  setError: (error: string) => void;
  setFulfillmentResult: (result: FulfillmentResult | null) => void;
}) {
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

      <div className="space-y-3 my-6">
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
          onClick={() => setCurrentStep(WorkflowStep.PROOF)}
          variant="outline"
          className="font-medium text-lg px-6 py-3 rounded-lg"
        >
          ← Previous
        </Button>

        <Button
          onClick={handleFulfillIntent}
          className="font-medium text-lg px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
          disabled={
            isFulfillIntentLoading || !intentId || fulfillmentResult?.success
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
        <FulfillmentResultComponent fulfillmentResult={fulfillmentResult} />
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
}
