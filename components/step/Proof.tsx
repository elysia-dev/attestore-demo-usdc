/* eslint-disable @typescript-eslint/no-explicit-any */
import { Label } from "@radix-ui/react-label";
import { ProofResult, WorkflowStep } from "../Home";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import axios from "axios";
import { BASE_URL } from "@/constant";
import { useContext, useState } from "react";
import ProofResultComponent from "../ProofResult";
import { ErrorType } from "@/lib/errors";
import { ErrorContext } from "@/context/ErrorContext";
import { trackUserAction } from "@/lib/sentry-utils";
import * as Sentry from "@sentry/nextjs";
import { cn } from "@/lib/utils";
import { VideoPopup } from "../ui/VideoPopup";

// Certificate number formatting function
const formatCertificateNumber = (value: string): string => {
  // Remove all non-alphanumeric characters and convert to uppercase
  const cleanValue = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  // Format: XXXX-XXXX-XXXXXXXX (4-4-8 format)
  if (cleanValue.length > 8) {
    return (
      cleanValue.slice(0, 4) +
      "-" +
      cleanValue.slice(4, 8) +
      "-" +
      cleanValue.slice(8, 16)
    );
  } else if (cleanValue.length > 4) {
    return cleanValue.slice(0, 4) + "-" + cleanValue.slice(4, 8);
  }

  return cleanValue;
};

// Validation functions
const validateIssueDate = (date: string): string | undefined => {
  if (!date) return "Issue date is required";

  // Check if it's exactly 8 digits (YYYYMMDD format)
  if (!/^\d{8}$/.test(date)) {
    return "Issue date must be in YYYYMMDD format (e.g., 20250626)";
  }

  const year = parseInt(date.substring(0, 4));
  const month = parseInt(date.substring(4, 6));
  const day = parseInt(date.substring(6, 8));

  // Basic date validation
  if (year !== 2025) {
    return "Year must be 2025";
  }

  if (month < 1 || month > 12) {
    return "Month must be between 01 and 12";
  }

  if (day < 1 || day > 31) {
    return "Day must be between 01 and 31";
  }

  return undefined;
};

const validateCertificateNumber = (certNumber: string): string | undefined => {
  if (!certNumber) return "Certificate number is required";

  // Check if it matches the format: XXXX-XXXX-XXXXXXXX
  if (!/^\d{4}-[A-Z]{4}-[A-Z]{8}$/.test(certNumber)) {
    return "Certificate number must be in format: XXXX-XXXX-XXXXXXXX (e.g., 1234-ABCD-ABCDABCD)";
  }

  return undefined;
};

export default function Proof({
  intentId,
  issueDate,
  setIssueDate,
  certificateNumber,
  setCertificateNumber,
  setCurrentStep,
  isLoading,
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
  setIsLoading: (isLoading: boolean) => void;
  setProofResult: (proofResult: ProofResult) => void;
  proofResult: ProofResult | null;
}) {
  const { setError, freeError } = useContext(ErrorContext);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Validation states
  const [validationErrors, setValidationErrors] = useState<{
    issueDate?: string;
    certificateNumber?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { issueDate?: string; certificateNumber?: string } = {};

    const issueDateError = validateIssueDate(issueDate);
    if (issueDateError) errors.issueDate = issueDateError;

    const certificateNumberError = validateCertificateNumber(certificateNumber);
    if (certificateNumberError)
      errors.certificateNumber = certificateNumberError;

    setValidationErrors(errors);

    return Object.keys(errors).length === 0;
  };
  // ZK Proof 생성
  const handleGenerateProof = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!validateForm()) {
      return; // Stop if validation fails
    }

    setIsLoading(true);
    freeError();

    // 사용자 액션 추적
    trackUserAction("Generate Transfer Proof clicked", {
      intentId,
      issueDate,
      certificateNumber,
    });

    try {
      const formattedDate = issueDate.replace(
        /(\d{4})(\d{2})(\d{2})/,
        "$1-$2-$3"
      );

      // Sentry 스팬으로 API 호출 추적
      const response = await Sentry.startSpan(
        {
          name: "Generate Transfer Proof",
          op: "http.client",
          attributes: {
            "http.method": "POST",
            "http.url": `${BASE_URL}/api/generate-receipt`,
            issueDate: formattedDate,
            issueNumber: certificateNumber,
          },
        },
        async () => {
          return await axios.post(
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
        }
      );

      setProofResult(response.data);
      trackUserAction("Transfer Proof generated successfully", {
        proof: response.data || "unknown",
      });
      freeError();
    } catch (error) {
      console.error("API Error:", error);

      // 상세한 에러 정보 Sentry로 전송
      Sentry.captureException(error, {
        tags: {
          type: "proof_generation_error",
          step: "4_proof_generation",
        },
        contexts: {
          proof_generation: {
            intentId,
            issueDate,
            certificateNumber,
            apiUrl: `${BASE_URL}/api/generate-receipt`,
            errorResponse: (error as any)?.response?.data,
            errorStatus: (error as any)?.response?.status,
          },
        },
      });

      setError(ErrorType.PROOF_GENERATION_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentStep(WorkflowStep.FULFILL);
    freeError();
  };

  return (
    <section className="space-y-[20px]">
      <h2 className="header text-center">Step 4: ZK Proof Generation</h2>
      <section
        className={cn(
          "mt-[30px] bg-white border border-gray-border rounded-[10px] py-[30px] px-[20px]",
          "max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5"
        )}
      >
        <div className="flex items-center justify-between">
          <p className="body font-bold">
            <strong className="text-blue-primary w-4 mr-1 max-sm:mr-0.5 max-sm:w-3">
              ◆
            </strong>{" "}
            Click &apos;Generate Transfer Proof&apos;.
          </p>
          <div className="relative inline-block">
            <button
              type="button"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-primary text-white text-xs font-bold hover:bg-blue-600 transition-colors"
            >
              ?
            </button>
            <span className="text-blue-primary text-xs ml-1 max-sm:hidden">
              (for devs)
            </span>

            {showTooltip && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-white text-gray-800 text-xs rounded-lg shadow-lg z-10 w-64 border border-gray-200">
                <div className="font-semibold text-blue-primary mb-2">
                  for devs
                </div>
                <div className="space-y-1">
                  <p>
                    · remote server generates tls proof using attestor-server
                    for the Toss transfer
                  </p>
                  <p>· remote server sends the proof to the attestor-server</p>
                  <p>
                    · attestor-server validates the proof and signs data with
                    its private key
                  </p>
                  <p>· signed data is sent to the client</p>
                </div>
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-[5px] text text-gray-600 pl-4 mt-[15px] max-sm:pl-3.5 max-sm:mt-2.5">
          <p>1. Generate ZK Proof of your transfer.</p>
          <p>
            2. Using this proof, anyone can verify that your transfer is valid.
          </p>
        </div>
        <Button
          onClick={() => setShowGuide(true)}
          variant="outlineBlue"
          className="flex items-center gap-2 justify-center bg-white mx-auto max-sm:w-full mt-8"
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
          Show Guide
        </Button>
      </section>
      {/* 토스 송금 데모 비디오 */}
      <VideoPopup
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        videoSrc="/tossbank_transfer_korean_.mp4"
        title="Toss Transfer Demo"
      />
      <form onSubmit={handleGenerateProof} className="space-y-6">
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
            onChange={(e) => {
              setIssueDate(e.target.value);
              // Clear validation error when user starts typing
              if (validationErrors.issueDate) {
                setValidationErrors((prev) => ({
                  ...prev,
                  issueDate: undefined,
                }));
              }
            }}
            placeholder="Enter certificate issue date (e.g., 20250618)"
            className={cn(
              "text max-sm:label border rounded-[5px] py-2.5 px-[15px] max-sm:py-[5px] max-sm:px-2 bg-white",
              validationErrors.issueDate
                ? "border-red-500"
                : "border-gray-border"
            )}
            maxLength={8}
          />
          {validationErrors.issueDate && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.issueDate}
            </p>
          )}
          <Label htmlFor="certificateNumber" className="text font-semibold">
            · Certificate Issue Number
          </Label>
          <Input
            id="certificateNumber"
            type="text"
            value={certificateNumber}
            disabled={!!proofResult}
            onChange={(e) => {
              const formatted = formatCertificateNumber(e.target.value);
              setCertificateNumber(formatted);
              // Clear validation error when user starts typing
              if (validationErrors.certificateNumber) {
                setValidationErrors((prev) => ({
                  ...prev,
                  certificateNumber: undefined,
                }));
              }
            }}
            placeholder="Enter certificate number (e.g., 1234-ABCD-ABCDABCD)"
            className={cn(
              "text max-sm:label border rounded-[5px] py-2.5 px-[15px] max-sm:py-[5px] max-sm:px-2 bg-white",
              validationErrors.certificateNumber
                ? "border-red-500"
                : "border-gray-border"
            )}
            maxLength={18} // 4-4-8 format: 4+1+4+1+8 = 18
          />
          {validationErrors.certificateNumber && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.certificateNumber}
            </p>
          )}
        </section>

        {proofResult && (
          <>
            <div className="bg-gray-50 border border-gray-200 rounded-[10px] mb-2">
              <ProofResultComponent proofResult={proofResult} />
            </div>
          </>
        )}

        <div className="flex gap-2.5">
          <Button
            type="button"
            onClick={() => setCurrentStep(WorkflowStep.TRANSFER)}
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

          {proofResult ? (
            <Button
              type="button"
              onClick={handleNext}
              variant="default"
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
          ) : (
            <Button
              type="submit"
              variant="default"
              className="flex-1"
              disabled={!issueDate || !certificateNumber || isLoading}
            >
              Generate Transfer Proof
              <div className="max-sm:hidden">
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
          )}
        </div>
      </form>
    </section>
  );
}
