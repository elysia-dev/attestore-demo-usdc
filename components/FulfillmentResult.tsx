import { formatUnits } from "viem";
import { FulfillmentResult } from "./Home";
import { TOKEN_SYMBOL } from "@/constant";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export default function FulfillmentResultComponent({
  fulfillmentResult,
}: {
  fulfillmentResult: FulfillmentResult;
}) {
  if (!fulfillmentResult?.success) return null;
  return (
    <section className="space-y-[20px]">
      <h2 className="header text-center">Minting Completed</h2>
      <section
        className={cn(
          "mt-[30px] bg-white border border-gray-border rounded-[10px] py-[30px] px-[20px]",
          "max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5"
        )}
      >
        <p className="body font-bold">🎉 Minting Info</p>
        <section
          className={cn(
            "px-5 py-[15px] border mt-2.5 border-gray-border rounded-[10px] bg-gray-200",
            "max-sm:rounded-[5px] max-sm:p-3 max-sm:mt-2.5"
          )}
        >
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-x-[15px] gap-y-[10px]">
            <div className="text">
              <span className="text-gray-600 font-chivo-mono">
                Intent Hash :
              </span>
              <p className="font-chivo-mono break-all">
                {fulfillmentResult.intentHash}
              </p>
            </div>
            <div className="text">
              <span className="text-gray-600 font-chivo-mono">Verifier :</span>
              <p className="font-chivo-mono">
                {fulfillmentResult.verifier?.slice(0, 6)}...
                {fulfillmentResult.verifier?.slice(-4)}
              </p>
            </div>
            <div className="text">
              <span className="text-gray-600 font-chivo-mono">Owner :</span>
              <p className="font-chivo-mono">
                {fulfillmentResult.owner?.slice(0, 6)}...
                {fulfillmentResult.owner?.slice(-4)}
              </p>
            </div>
            <div className="text">
              <span className="text-gray-600 font-chivo-mono">Receiver :</span>
              <p className="font-chivo-mono">
                {fulfillmentResult.to?.slice(0, 6)}...
                {fulfillmentResult.to?.slice(-4)}
              </p>
            </div>
            <div className="text">
              <span className="text-gray-600 font-chivo-mono">Amount :</span>
              <p className="font-chivo-mono">
                {fulfillmentResult.amount &&
                  formatUnits(fulfillmentResult.amount, 18)}{" "}
                {TOKEN_SYMBOL}
              </p>
            </div>
            <div className="text">
              <span className="text-gray-600 font-chivo-mono">
                Transaction :
              </span>
              <p className="font-chivo-mono">
                {fulfillmentResult.txHash?.slice(0, 6)}...
                {fulfillmentResult.txHash?.slice(-4)}
              </p>
            </div>
          </div>
        </section>
      </section>
      <Button
        onClick={() => {
          window.location.href = "/";
        }}
        className="mt-5"
        size="max"
      >
        Go to History
      </Button>
    </section>
  );
}
