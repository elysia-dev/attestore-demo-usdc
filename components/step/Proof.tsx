import { Label } from "@radix-ui/react-label";
import { ProofResult, WorkflowStep } from "../Home";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import axios from "axios";
import { BASE_URL } from "@/constant";
import { useState } from "react";
import ProofResultComponent from "../ProofResult";

export default function Proof({
  intentId,
  issueDate,
  setIssueDate,
  certificateNumber,
  setCertificateNumber,
  setCurrentStep,
  isLoading,
  setError,
  freeError,
  setIsLoading,
  setProofResult,
  proofResult,
}: {
  intentId: number | null;
  issueDate: string;
  setIssueDate: (issueDate: string) => void;
  certificateNumber: string;
  setCertificateNumber: (certificateNumber: string) => void;
  setCurrentStep: (step: WorkflowStep) => void;
  isLoading: boolean;
  setError: (error: string) => void;
  freeError: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setProofResult: (proofResult: ProofResult) => void;
  proofResult: ProofResult | null;
}) {
  const [showMore, setShowMore] = useState(false);

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
      freeError();
    } catch (error) {
      console.error("API Error:", error);
      setError("Failed to generate ZK Proof. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentStep(WorkflowStep.FULFILL);
    freeError();
  };

  return (
    <section>
      <h2 className="header text-center">Step 4: ZK Proof Generation</h2>
      <section className="mt-[30px] bg-white border border-gray-border rounded-[10px] py-[30px] px-[20px]">
        <p className="body font-bold">
          <strong className="text-blue-primary w-4">◆</strong> Click
          &apos;Generate Transfer Proof&apos;.
        </p>
        <div className="space-y-[5px] text text-gray-600 pl-4 mt-[15px]">
          <p>1. Generate ZK Proof of your transfer.</p>
          <p>
            2. Using this proof, anyone can verify that your transfer is valid.
          </p>

          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="text-blue-primary underline text-sm mt-2"
          >
            {showMore ? "less" : "more (for devs)"}
          </button>

          {showMore && (
            <div className="pt-3 border-t border-gray-200 space-y-2">
              <p className="text-sm">
                · remote server generates tls proof using attestor-server for
                the Toss transfer
              </p>
              <p className="text-sm">
                · remote server and attestor-server connected via websocket
              </p>
              <p className="text-sm">
                · attestor-server validates the proof and signs with its private
                key
              </p>
              <p className="text-sm">
                · remote server sends the proof to the attestor-server
              </p>
            </div>
          )}
        </div>
      </section>
      <form onSubmit={handleGenerateProof} className="space-y-6">
        <section className="mt-5 p-5 bg-white border border-gray-border rounded-[10px] space-y-2.5">
          {/* intentId */}
          <p className="text font-semibold">· Intent ID</p>
          <div className="mt-[5px] border border-gray-border rounded-[10px] py-2.5 px-[15px] bg-gray-200">
            <p className="text">{intentId}</p>
          </div>
          <Label htmlFor="issueDate" className="text font-semibold">
            · Issue Date
          </Label>
          <Input
            id="issueDate"
            type="text"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            placeholder="Enter certificate issue date (e.g., 20250618)"
            className="mt-[5px] h-auto text border border-gray-border rounded-[10px] py-2.5 px-[15px] bg-white placeholder:text-gray-400"
          />
          <Label htmlFor="certificateNumber" className="text font-semibold">
            · Certificate Issue Number
          </Label>
          <Input
            id="certificateNumber"
            type="text"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            placeholder="Please enter the certificate issue number."
            className="mt-[5px] h-auto text border border-gray-border rounded-[10px] py-2.5 px-[15px] bg-white placeholder:text-gray-400"
          />
        </section>

        {proofResult && (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-lg mb-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ✅ Proof Generated
              </h3>
              <ProofResultComponent proofResult={proofResult} />
            </div>
          </>
        )}

        <div className="flex gap-2.5">
          <Button
            type="button"
            onClick={() => setCurrentStep(WorkflowStep.TRANSFER)}
            variant="outline"
            className="flex-1"
          >
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
            Previous
          </Button>

          {proofResult ? (
            <Button
              type="button"
              onClick={handleNext}
              variant="default"
              className="flex-1"
            >
              Next
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
            </Button>
          ) : (
            <Button
              type="submit"
              variant="default"
              className="flex-1"
              disabled={!issueDate || !certificateNumber || isLoading}
            >
              Generate Transfer Proof
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
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
