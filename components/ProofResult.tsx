import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProofResult } from "./Home";

export default function ProofResultComponent({
  proofResult,
}: {
  proofResult: ProofResult | null;
}) {
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
}
