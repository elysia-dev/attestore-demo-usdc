import { IntentDetails } from "@/components/Home";
import { TOKEN_SYMBOL } from "@/constant";
import { useContractWrite } from "@/hooks/useContractWrite";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI } from "@/lib/abi";
import { ErrorType } from "@/lib/errors";
import { extractErrorMessage } from "@/components/utils/extractErrorMessage";
import { useCallback, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { erc20Abi, formatUnits } from "viem";
import { usePublicClient } from "wagmi";
import { ErrorContext } from "@/context/ErrorContext";

const IntentManagement = ({
  intentId,
  searchIntentId,
  intentDetails,
  handleRefreshMyIntentId,
  setIntentId,
  setSearchIntentId,
}: {
  intentId: number | null;
  searchIntentId: number | null;
  intentDetails: IntentDetails | null;
  handleRefreshMyIntentId: () => void;
  setIntentId: (intentId: number) => void;
  setSearchIntentId: (searchIntentId: number) => void;
}) => {
  const publicClient = usePublicClient();
  const { setError } = useContext(ErrorContext);

  const [receiverTokenBalance, setReceiverTokenBalance] = useState<
    bigint | undefined
  >(undefined);

  const readReceiverTokenBalance = useCallback(
    async (to: string) => {
      if (!to) return;

      const balance = await publicClient?.readContract({
        address: ADDRESSES.TOKEN,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [to as `0x${string}`],
      });
      setReceiverTokenBalance(balance);
    },
    [publicClient]
  );

  useEffect(() => {
    if (intentDetails) {
      readReceiverTokenBalance(intentDetails.to);
    }
  }, [intentDetails, readReceiverTokenBalance]);

  const { writeAndWait: cancelIntentWrite, isLoading: isCancelIntentLoading } =
    useContractWrite({
      onSuccess: () => {
        if (setIntentId) setIntentId(0);
        if (setSearchIntentId) setSearchIntentId(0);
        handleRefreshMyIntentId();
      },
    });

  const handleCancelIntent = async () => {
    if (!intentId) return;

    try {
      await cancelIntentWrite({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "cancelIntent",
        args: [BigInt(intentId)],
      });
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      setError(ErrorType.INTENT_CANCEL_FAILED, {
        error: errorMessage,
      });
    }
  };

  return (
    <>
      {searchIntentId && (
        <div className="mt-4 space-y-3">
          {intentDetails && (
            <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50">
              <h4 className="text-sm font-semibold mb-3">Intent Details</h4>
              <section className="bg-background/50 rounded-xl p-4 border border-border/30 mb-4">
                <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Id</span>
                    <p className="text-sm font-mono">{intentId}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Owner</span>
                    <p className="text-sm font-mono">
                      {intentDetails.owner.slice(0, 6)}...
                      {intentDetails.owner.slice(-4)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Receiver</span>
                    <p className="text-sm font-mono">
                      {intentDetails.to.slice(0, 6)}...
                      {intentDetails.to.slice(-4)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Amount</span>
                    <p className="text-sm font-mono font-medium text-primary">
                      {formatUnits(intentDetails.amount, 18)} {TOKEN_SYMBOL}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Created Time</span>
                    <p className="text-sm font-mono">
                      {new Date(
                        intentDetails.timestamp * 1000
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>
              {/* Receiver token balance*/}
              <h5 className="text-sm font-semibold mb-2">Receiver Info</h5>
              <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-primary">
                    {receiverTokenBalance
                      ? formatUnits(receiverTokenBalance, 18)
                      : "0"}{" "}
                    {TOKEN_SYMBOL}
                  </p>
                </div>
                <div className="flex items-center mt-2 gap-2">
                  <span className="text-xs text-muted-foreground">Address:</span>
                  <span className="text-xs font-mono max-sm:hidden">
                    {intentDetails.to}
                  </span>
                  <span className="text-xs font-mono hidden max-sm:inline">
                    {`${intentDetails.to.slice(
                      0,
                      8
                    )}...${intentDetails.to.slice(-6)}`}
                  </span>
                </div>
              </div>

              {/* Cancel Intent Button */}
              <div className="mt-4">
                <button
                  onClick={handleCancelIntent}
                  disabled={isCancelIntentLoading}
                  className="w-full px-4 py-2 rounded-full bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 border border-destructive/20 text-sm font-medium text-destructive"
                >
                  {isCancelIntentLoading ? "Cancelling..." : "Cancel Intent"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default IntentManagement;
