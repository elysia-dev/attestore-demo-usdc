import { IntentDetails } from "@/components/Home";
import { Button } from "@/components/ui/button";
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
        <div className="mt-4 space-y-3 max-sm:space-y-0 max-sm:mt-0">
          {intentDetails && (
            <div
              className={cn(
                "p-5 bg-white border border-gray-border rounded-[10px]",
                "max-sm:p-3 max-sm:rounded-none max-sm:px-0 max-sm:border-x-0 max-sm:border-b-0 max-sm:pb-0 max-sm:mt-2"
              )}
            >
              <h4 className="font-semibold text">· Intent Details</h4>
              <section
                className={cn(
                  "mt-[15px] px-5 py-[15px] mb-[15px] border border-gray-border rounded-[10px] bg-gray-200",
                  "max-sm:mt-2.5 max-sm:px-3 max-sm:py-2.5 max-sm:rounded-[5px]"
                )}
              >
                <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-x-[15px] gap-y-[10px]">
                  <div className="text">
                    <span className="text-gray-600 font-chivo-mono">Id:</span>
                    <p className="font-chivo-mono">{intentId}</p>
                  </div>
                  <div className="text">
                    <span className="text-gray-600 font-chivo-mono">
                      Owner:
                    </span>
                    <p className="font-chivo-mono">
                      {intentDetails.owner.slice(0, 6)}...
                      {intentDetails.owner.slice(-4)}
                    </p>
                  </div>
                  <div className="text">
                    <span className="text-gray-600 font-chivo-mono">
                      Receiver:
                    </span>
                    <p className="font-chivo-mono">
                      {intentDetails.to.slice(0, 6)}...
                      {intentDetails.to.slice(-4)}
                    </p>
                  </div>
                  <div className="text">
                    <span className="text-gray-600 font-chivo-mono">
                      Amount:
                    </span>
                    <p className="font-chivo-mono">
                      {formatUnits(intentDetails.amount, 18)} {TOKEN_SYMBOL}
                    </p>
                  </div>
                  <div className="text">
                    <span className="text-gray-600 font-chivo-mono">
                      Created Time:
                    </span>
                    <p className="font-chivo-mono">
                      {new Date(
                        intentDetails.timestamp * 1000
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </section>
              {/* Receiver token balance*/}
              <h5 className="font-semibold text">· Receiver Info</h5>
              <div
                className={cn(
                  "border border-gray-border rounded-[5px] mt-[5px] py-[10px] px-[15px] bg-blue-200",
                  "max-sm:rounded-[5px] max-sm:mt-2.5 max-sm:py-2.5 max-sm:px-3"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text text-blue-primary font-bold">
                    {receiverTokenBalance
                      ? formatUnits(receiverTokenBalance, 18)
                      : "0"}{" "}
                    {TOKEN_SYMBOL}
                  </p>
                </div>
                <div className="flex items-center mt-[5px]">
                  <p className="text text-gray-600 font-chivo-mono">Address:</p>
                  <span className="text text-gray-600 font-chivo-mono max-sm:hidden">
                    {intentDetails.to}
                  </span>
                  <span className="text text-gray-600 font-chivo-mono hidden max-sm:inline">
                    {`${intentDetails.to.slice(
                      0,
                      8
                    )}...${intentDetails.to.slice(-6)}`}
                  </span>
                </div>
              </div>

              {/* Cancel Intent Button */}
              <div className="mt-4">
                <Button
                  onClick={handleCancelIntent}
                  disabled={isCancelIntentLoading}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-600 hover:text-white"
                >
                  {isCancelIntentLoading ? "Cancelling..." : "Cancel Intent"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default IntentManagement;
