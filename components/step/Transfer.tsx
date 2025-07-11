import { Button } from "@/components/ui/button";
import { formatUnits } from "viem";
import { IntentDetails, WorkflowStep } from "../Home";
import { TOSS_ACCOUNT_NUMBER } from "@/constant";
import { useContext, useState } from "react";
import { ErrorContext } from "@/context/ErrorContext";
import QRCode from "react-qr-code";

import { VideoPopup } from "@/components/ui/VideoPopup";
import { cn } from "@/lib/utils";
import { useTossLauncher } from "../../hooks/useTossLauncher";
import ConfirmationModal from "../ui/ConfirmationModal";

export default function Transfer({
  intentId,
  intentDetails,
  setCurrentStep,
}: {
  intentId: number | null;
  intentDetails: IntentDetails | null;
  setCurrentStep: (step: WorkflowStep) => void;
}) {
  const { freeError } = useContext(ErrorContext);
  const [isVideoPopupOpen, setIsVideoPopupOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const checkAndGoNext = () => {
    setCurrentStep(WorkflowStep.PROOF);
    freeError();
    setIsConfirmationModalOpen(false);
  };

  const handleConfirmTransfer = () => {
    setIsConfirmationModalOpen(true);
  };

  const amount = formatUnits(intentDetails?.amount ?? BigInt(0), 18);
  const qrCodeUrl = `supertoss://send?amount=${amount}&bank=%ED%86%A0%EC%8A%A4%EB%B1%85%ED%81%AC&accountNo=${TOSS_ACCOUNT_NUMBER}&origin=qr`;

  const { launch, fallback, storeURL, reset } = useTossLauncher(qrCodeUrl);

  // 계좌번호 복사 함수
  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(TOSS_ACCOUNT_NUMBER);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy account number:", err);
    }
  };

  const BackAccountCopyButton = () => {
    return (
      <button
        onClick={handleCopyAccountNumber}
        className={cn(
          "flex items-center gap-[5px] text-blue-primary bg-white border border-blue-primary rounded-full px-5 py-1.5 transition-colors duration-200 hover:bg-blue-primary hover:text-white",
          "max-sm:rounded-full max-sm:px-3 max-sm:py-1.5 max-sm:w-full max-sm:justify-center ",
          isCopied && "bg-blue-primary text-white"
        )}
        title="Click to copy account number"
      >
        {isCopied ? (
          <strong className="text-inherit text">Copied!</strong>
        ) : (
          <>
            <strong className="text-inherit text">
              토스뱅크 {TOSS_ACCOUNT_NUMBER}
            </strong>
            <CopyButtonIcon />
          </>
        )}
      </button>
    );
  };

  return (
    <section className="space-y-[20px]">
      <h2 className="header text-center">Step 3: Toss Transfer</h2>

      {/* 토스 송금 데모 비디오 */}
      <section
        className={cn(
          "py-[30px] px-5 rounded-[10px] bg-white border border-gray-border",
          "max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5"
        )}
      >
        <Button
          onClick={() => setIsVideoPopupOpen(true)}
          variant="outlineBlue"
          size="max"
          className="flex items-center gap-2 justify-center sm:hidden"
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
            <polygon points="5,3 19,12 5,21" />
          </svg>
          Play Tutorial Video
        </Button>

        <div
          className="flex justify-center items-center rounded-[10px] border border-gray-border overflow-hidden max-sm:hidden"
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
      </section>

      {/* Video Popup */}
      <VideoPopup
        isOpen={isVideoPopupOpen}
        onClose={() => setIsVideoPopupOpen(false)}
        videoSrc="/tossbank_transfer_korean_.mp4"
        posterSrc="/tossbank_transfer_korean_thumbnail.jpg"
        title="Toss Transfer Demo"
      />

      {/* 토스 송금 안내 - Intent ID가 있을 때만 표시 */}
      {intentId && intentDetails?.amount && (
        <section
          className={cn(
            "bg-white border border-gray-border rounded-[10px] py-[30px] px-[20px] space-y-[5px] pl-4",
            "max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5"
          )}
        >
          <p className="body font-bold">
            <strong className="text-blue-primary w-4 mr-1 max-sm:mr-0.5 max-sm:w-3">
              ◆
            </strong>{" "}
            Send money via Toss app
          </p>
          <div className="space-y-[5px] text text-gray-600 pl-4 mt-[15px] max-sm:pl-3.5 max-sm:mt-2.5">
            <p>
              1. Send KRW WON to the recipient via <strong>Toss app.</strong>
            </p>
            <p>
              2. You <strong>must use Toss</strong> as the sending bank.
            </p>
          </div>
          {/* QR Code for Toss payment */}
          <div className="flex justify-center mt-5 mb-5 max-sm:hidden">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
              <QRCode value={qrCodeUrl} size={200} level="H" />
            </div>
          </div>
          <Button
            onClick={launch}
            size="max"
            className="flex items-center gap-2 justify-center sm:hidden mt-5"
          >
            Send via Toss App
            <ExternalLinkIcon />
          </Button>
          {fallback && (
            <Button
              onClick={() => {
                window.open(storeURL, "_blank");
                reset();
              }}
              size="max"
              variant="outline"
              className="flex items-center gap-2 justify-center sm:hidden mt-2"
            >
              Install Toss App
              <ExternalLinkIcon />
            </Button>
          )}

          <section
            className={cn(
              "border border-gray-border rounded-[10px] p-5 space-y-2.5 bg-gray-300 mt-5",
              "max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5"
            )}
          >
            <div className="flex items-center gap-1 max-sm:flex-col max-sm:items-start max-sm:space-y-1">
              <p className="text mr-1">· Recipient Name :</p>
              <p className="text flex-1 flex justify-center sm:justify-start max-sm:w-full max-sm:border max-sm:border-gray-border max-sm:rounded-[5px] max-sm:p-[5px]">
                <strong className="mr-1">이 현 민</strong>(Modori Tossbank
                account)
              </p>
            </div>
            <div className="flex items-center gap-1 max-sm:flex-col max-sm:items-start max-sm:space-y-1">
              <p className="text mr-1">· Bank Account :</p>
              <div className="flex-1 flex justify-end sm:justify-start max-sm:w-full">
                <BackAccountCopyButton />
              </div>
            </div>
            <div className="flex items-center gap-1 max-sm:flex-col max-sm:items-start max-sm:space-y-1">
              <p className="text mr-1">· Transfer Memo :</p>
              <p className="text flex-1 flex justify-center sm:justify-start max-sm:w-full max-sm:border max-sm:border-gray-border max-sm:rounded-[5px] max-sm:p-[5px]">
                <strong className="text-blue-primary">{intentId}</strong>
              </p>
            </div>
            <div className="flex items-center gap-1 max-sm:flex-col max-sm:items-start max-sm:space-y-1">
              <p className="text mr-1">· Amount :</p>
              <p className="text flex-1 flex justify-center sm:justify-start max-sm:w-full max-sm:border max-sm:border-gray-border max-sm:rounded-[5px] max-sm:p-[5px]">
                <strong>{formatUnits(intentDetails?.amount, 18)} KRW</strong>
              </p>
            </div>
          </section>
        </section>
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
          size="max"
          className="flex-1"
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
          onClick={() => {
            handleConfirmTransfer();
          }}
          disabled={!intentId}
          variant="default"
          size="max"
          className="flex-1"
        >
          Next
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
        </Button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={checkAndGoNext}
        name={`이현민(모임통장)`}
        amount={amount}
        memo={intentId ?? ""}
        address={`토스뱅크 ${TOSS_ACCOUNT_NUMBER}`}
      />
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

const ExternalLinkIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="inline-block align-text-bottom"
    >
      <path
        d="M7 3H5.5C4.11929 3 3 4.11929 3 5.5V12.5C3 13.8807 4.11929 15 5.5 15H12.5C13.8807 15 15 13.8807 15 12.5V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 3H15V7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 10L15 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
