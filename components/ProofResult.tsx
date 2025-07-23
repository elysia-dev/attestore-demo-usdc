// import { useState } from "react";
// import { Button } from "@/components/ui/button";
import { ProofResult } from "./Home";

export default function ProofResultComponent({
  proofResult,
}: {
  proofResult: ProofResult | null;
}) {
  // const [showAPIResponse, setShowAPIResponse] = useState(false);
  if (!proofResult) return null;
  if (proofResult.error) return null;

  return (
    <div>
      {proofResult.data?.extractedParameters && (
        <div className="p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="text-green-500">✅</span>
            Proof Generated
          </h3>
          <div className="mt-3">
            <pre className="bg-secondary/50 p-3 rounded-lg text-xs overflow-auto max-h-96 border border-border/50 text-muted-foreground font-mono">
              {JSON.stringify(proofResult.data.extractedParameters, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* {proofResult.data?.receipt?.claim && (
        <div className="bg-white p-4 rounded border mb-4">
          <h4 className="font-semibold text-gray-800 mb-3">Claim</h4>
          <div className="mt-3">
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-96 border">
              {JSON.stringify(proofResult.data.receipt.claim, null, 2)}
            </pre>
          </div>
        </div>
      )}

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
    */}
    </div>
  );
}
