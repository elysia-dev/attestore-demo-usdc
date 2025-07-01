import { Button } from "@/components/ui/button";
import { formatUnits } from "viem";
import { IntentDetails, WorkflowStep } from "../Home";
import { TOSS_ACCOUNT_NUMBER } from "@/constant";

// 계좌번호 복사 함수
const handleCopyAccountNumber = async () => {
  try {
    await navigator.clipboard.writeText(TOSS_ACCOUNT_NUMBER);
    window.alert("Copied");
  } catch (err) {
    console.error("Failed to copy account number:", err);
  }
};

export default function Transfer({
  intentId,
  intentDetails,
  setCurrentStep,
  freeError,
}: {
  intentId: number | null;
  intentDetails: IntentDetails | null;
  setCurrentStep: (step: WorkflowStep) => void;
  freeError: () => void;
}) {
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
              <strong>Recipient Name:</strong> 이현민 (Modori Tossbank account)
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
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
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
              <strong>Amount:</strong> {formatUnits(intentDetails?.amount, 18)}{" "}
              KRW
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
          onClick={() => setCurrentStep(WorkflowStep.SIGNAL)}
          variant="outline"
          className="font-medium text-lg px-6 py-3 rounded-lg"
        >
          ← Previous
        </Button>

        <Button
          onClick={() => {
            setCurrentStep(WorkflowStep.PROOF);
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
}
