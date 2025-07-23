import { formatUnits } from "viem";
import { FulfillmentResult } from "./Home";
import { TOKEN_SYMBOL } from "@/constant";
import { cn } from "@/lib/utils";

export default function FulfillmentResultComponent({
  fulfillmentResult,
}: {
  fulfillmentResult: FulfillmentResult;
}) {
  if (!fulfillmentResult?.success) return null;
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-gradient">Minting Completed</h2>
      <section className="bg-card/50 rounded-[24px] p-6 backdrop-blur-xl border border-border/50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">🎉</span>
          Minting Info
        </h3>
        <section className="bg-secondary/30 rounded-2xl p-4 border border-border/50">
          <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">
                Intent Hash
              </span>
              <p className="text-sm font-mono break-all">
                {fulfillmentResult.intentHash}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Verifier</span>
              <p className="text-sm font-mono">
                {fulfillmentResult.verifier?.slice(0, 6)}...
                {fulfillmentResult.verifier?.slice(-4)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Owner</span>
              <p className="text-sm font-mono">
                {fulfillmentResult.owner?.slice(0, 6)}...
                {fulfillmentResult.owner?.slice(-4)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Receiver</span>
              <p className="text-sm font-mono">
                {fulfillmentResult.to?.slice(0, 6)}...
                {fulfillmentResult.to?.slice(-4)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Amount</span>
              <p className="text-sm font-mono font-medium text-primary">
                {fulfillmentResult.amount &&
                  formatUnits(fulfillmentResult.amount, 18)}{" "}
                {TOKEN_SYMBOL}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">
                Transaction
              </span>
              <p className="text-sm font-mono">
                {fulfillmentResult.txHash?.slice(0, 6)}...
                {fulfillmentResult.txHash?.slice(-4)}
              </p>
            </div>
          </div>
        </section>
      </section>
      <button
        onClick={() => {
          window.location.href = "/";
        }}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-semibold transition-all duration-200 hover:shadow-lg"
      >
        Go to Main
      </button>
    </section>
  );
}
