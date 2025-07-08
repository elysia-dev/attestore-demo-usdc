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
    <section className="space-y-[20px]">
      <h2 className="header text-center">Step 3: Toss Transfer</h2>

      {/* 토스 송금 데모 비디오 */}
      <section className="py-[30px] mt-[30px] px-5 rounded-[10px] bg-white border border-gray-border">
        <div
          className="flex justify-center items-center rounded-[10px] border border-gray-border overflow-hidden"
          style={{
            backgroundImage: "url('/video_background.png')",
          }}
        >
          <video
            controls
            className="w-full rounded-lg h-[640px]"
            poster="/tossbank_transfer_korean_thumbnail.jpg"
          >
            <source src="/tossbank_transfer_korean_.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <p className="text-gray-600 mt-[20px] text">
          1. Send fiat money to the recipient via <strong>Toss app.</strong>
          <br />
          2. Click Next for proceeding to the next step.
          <br />
          3. The transfer must be made to the Toss account.
        </p>
      </section>

      {/* 토스 송금 안내 - Intent ID가 있을 때만 표시 */}
      {intentId && intentDetails?.amount && (
        <section className="bg-white border border-gray-border rounded-[10px] py-[30px] px-[20px]">
          <h3 className="body">
            <span className="text-blue-primary">◆</span> Send money via Toss app
          </h3>
          <section className="border border-gray-border rounded-[10px] p-5 space-y-2.5 bg-gray-300 mt-5">
            <p className="text">
              · Recipient Name : <strong>이 현 민</strong> (Modori Tossbank
              account)
            </p>
            <p className="flex items-center gap-[5px] text">
              · Bank Account :
              <button
                onClick={handleCopyAccountNumber}
                className="flex items-center gap-[5px] text-blue-primary bg-white border border-blue-primary rounded-full px-5 py-1.5 transition-colors duration-200 hover:bg-blue-primary hover:text-white"
                title="Click to copy account number"
              >
                <strong className="text-inherit">토스뱅크 100202642943</strong>
                <CopyButtonIcon />
              </button>
            </p>
            <p className="text">
              · Transfer Memo :{" "}
              <strong className="text-blue-primary">{intentId}</strong>
            </p>
            <p className="text">
              · Amount :{" "}
              <strong>{formatUnits(intentDetails?.amount, 18)} KRW</strong>
            </p>
          </section>
        </section>
      )}

      {intentId && (
        <p className="text-gray-600 text mb-2.5">After transfer, click Next</p>
      )}

      {!intentId && (
        <p className="text-gray-600 text mb-2.5">
          Please lookup Intent ID first. (click previous)
        </p>
      )}

      <div className="flex gap-2.5">
        <Button
          onClick={() => setCurrentStep(WorkflowStep.SIGNAL)}
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
          onClick={() => {
            setCurrentStep(WorkflowStep.PROOF);
            freeError();
          }}
          disabled={!intentId}
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
      </div>
    </section>
  );
}

const CopyButtonIcon = () => {
  return (
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
  );
};
