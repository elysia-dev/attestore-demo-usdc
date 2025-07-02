import { formatUnits } from "viem";
import { FulfillmentResult } from "./Home";
import { TOKEN_SYMBOL } from "@/constant";

export default function FulfillmentResultComponent({
  fulfillmentResult,
}: {
  fulfillmentResult: FulfillmentResult;
}) {
  if (!fulfillmentResult?.success) return null;
  return (
    <div
      className={`p-6 border rounded-lg my-6 ${
        fulfillmentResult.success
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      {fulfillmentResult.success && (
        <div className="space-y-3 text-sm">
          <h4 className="font-semibold text-gray-800 mb-3">
            ✅ Minting Completed
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="font-medium text-green-800">Intent Hash:</span>
              <p className="text-green-700 font-mono break-all">
                {fulfillmentResult.intentHash}
              </p>
            </div>
            <div>
              <span className="font-medium text-green-800">Verifier:</span>
              <p className="text-green-700 font-mono">
                {fulfillmentResult.verifier?.slice(0, 6)}...
                {fulfillmentResult.verifier?.slice(-4)}
              </p>
            </div>
            <div>
              <span className="font-medium text-green-800">Owner:</span>
              <p className="text-green-700 font-mono">
                {fulfillmentResult.owner?.slice(0, 6)}...
                {fulfillmentResult.owner?.slice(-4)}
              </p>
            </div>
            <div>
              <span className="font-medium text-green-800">Receiver:</span>
              <p className="text-green-700 font-mono">
                {fulfillmentResult.to?.slice(0, 6)}...
                {fulfillmentResult.to?.slice(-4)}
              </p>
            </div>
            <div>
              <span className="font-medium text-green-800">Amount:</span>
              <p className="text-green-700">
                {fulfillmentResult.amount &&
                  formatUnits(fulfillmentResult.amount, 18)}{" "}
                {TOKEN_SYMBOL}
              </p>
            </div>
            <div>
              <span className="font-medium text-green-800">Transaction:</span>
              <p className="text-green-700 font-mono">
                {fulfillmentResult.txHash?.slice(0, 6)}...
                {fulfillmentResult.txHash?.slice(-4)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
