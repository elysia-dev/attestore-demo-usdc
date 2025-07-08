import { Label } from "@radix-ui/react-label";
import { ProofResult, WorkflowStep } from "../Home";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import axios from "axios";
import { BASE_URL } from "@/constant";

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
}) {
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
      setCurrentStep(WorkflowStep.FULFILL);
      freeError();
    } catch (error) {
      console.error("API Error:", error);
      setError("Failed to generate ZK Proof. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <section>
      <h2 className="header text-center">Step 4: ZK Proof Generation</h2>
      <section className="mt-[30px] bg-white border border-gray-border rounded-[10px] py-[30px] px-[20px]">
        <p className="body font-bold">
          <strong className="text-blue-primary w-4">◆</strong> Click Generate ZK
          Proof for generating ZK Proof.
        </p>
        <div className="space-y-[5px] text text-gray-600 pl-4 mt-[15px]">
          <p>
            &apos;Generate ZK Proof&apos; button requires remote server to
            generate zk Proof with eth signed
          </p>
          <p>
            · remote server generates tls proof using attestor-server for the
            Toss transfer
            <br />
            · remote server and attestor-server connected via websocket
            <br />
            · attestor-server validates the proof and signs with its private key
            <br />· remote server sends the proof to the attestor-server
          </p>
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

          <Button
            type="submit"
            variant="default"
            className="flex-1"
            disabled={!issueDate || !certificateNumber || isLoading}
          >
            Generate ZK Proof
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
        </div>
      </form>
    </section>
  );
}
