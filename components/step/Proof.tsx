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
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Step 4: ZK Proof Generation
      </h2>
      <ul className="text-gray-600">
        <p className="text-gray-600 mb-8">
          Click <strong>Generate ZK Proof</strong> for generating ZK Proof.
        </p>
        <li>
          &apos;Generate ZK Proof&apos; button requires remote server to
          generate zk Proof with eth signed
          <br />
          - remote server generates tls proof using attestor-server for the Toss
          transfer
          <br />
          - remote server and attestor-server connected via websocket
          <br />
          - attestor-server validates the proof and signs with its private key
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
            onChange={(e) => setCertificateNumber(e.target.value)}
            placeholder="Please enter the certificate issue number."
            className="h-14 text-base border-gray-300 rounded-lg px-4 placeholder:text-gray-400"
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            onClick={() => setCurrentStep(WorkflowStep.TRANSFER)}
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
}
