import { RedeemDetails, RedeemResult } from "@/components/Home";
import { Button } from "@/components/ui/button";
import { TOKEN_SYMBOL } from "@/constant";
import { useContractWrite } from "@/hooks/useContractWrite";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI } from "@/lib/wagmi";
import { Dispatch, SetStateAction } from "react";
import { formatUnits } from "viem";
import { usePublicClient } from "wagmi";

const RedeemRequest = ({
  isLoading,
  address,
  redeemId,
  redeemDetails,
  setRedeemId,
  handleRefreshRedeemDetails,
  setError,
  setRedeemDetails,
  setRedeemResult,
  setAccountNumber,
  setAmount,
}: {
  isLoading: boolean;
  address: `0x${string}` | undefined;
  redeemId: number | null;
  redeemDetails: RedeemDetails | null;
  setRedeemId: Dispatch<SetStateAction<number | null>>;
  handleRefreshRedeemDetails: (targetRedeemId: number) => Promise<void>;
  setError: (error: string) => void;
  setRedeemDetails: Dispatch<SetStateAction<RedeemDetails | null>>;
  setRedeemResult: Dispatch<SetStateAction<RedeemResult | null>>;
  setAccountNumber: Dispatch<SetStateAction<string>>;
  setAmount: Dispatch<SetStateAction<string>>;
}) => {
  const publicClient = usePublicClient();

  const handleRefreshMyRedeemId = async () => {
    console.log("address", address);
    if (!address) return;
    try {
      const userRedeemId = await publicClient?.readContract({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "accountRedeemRequest",
        args: [address],
      });
      console.log("userRedeemId", userRedeemId);

      if (userRedeemId && Number(userRedeemId) > 0) {
        const newRedeemId = Number(userRedeemId);
        setRedeemId(newRedeemId);
        handleRefreshRedeemDetails(newRedeemId);
      } else {
        setError("No Redeem request found");
        setRedeemDetails(null);
      }
    } catch (error) {
      console.error("Failed to lookup Redeem ID:", error);
      setError("Failed to lookup Redeem ID");
    }
  };

  const { writeAndWait: cancelRedeemWrite, isLoading: isCancelRedeemLoading } =
    useContractWrite({
      onSuccess: () => {
        setRedeemId(null);
        setRedeemDetails(null);
        setRedeemResult(null);
        setAccountNumber("");
        setAmount("");
      },
    });

  const handleCancelRedeem = async () => {
    if (!redeemId) return;

    try {
      await cancelRedeemWrite({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "cancelRedeem",
        args: [BigInt(redeemId)],
      });
    } catch (error) {
      setError(
        `Cancel redeem failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div>
      {redeemId && redeemDetails && (
        <section className="p-5 border border-gray-border rounded-[10px] bg-white mt-5">
          <h4 className="font-semibold text">· Redeem Request Details</h4>
          <section className="border border-gray-border rounded-[10px] p-5 mt-5 bg-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[15px] gap-y-[10px]">
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">
                  Redeem ID:
                </span>
                <p className="font-chivo-mono">{redeemId}</p>
              </div>
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">Amount:</span>
                <p className="font-chivo-mono">
                  {formatUnits(redeemDetails.amount, 18)} {TOKEN_SYMBOL}
                </p>
              </div>
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">Status:</span>
                <p className="font-chivo-mono">
                  Pending (Awaiting fulfillment)
                </p>
              </div>
              <div className="text">
                <span className="text-gray-600 font-chivo-mono">
                  Created Time:
                </span>
                <p className="font-chivo-mono">
                  {new Date(redeemDetails.timestamp * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          </section>
          <div className="mt-4">
            <Button
              onClick={handleCancelRedeem}
              disabled={isCancelRedeemLoading}
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-600 hover:text-white"
            >
              {isCancelRedeemLoading ? "Cancelling..." : "Cancel Request"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default RedeemRequest;
