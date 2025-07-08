import { IntentDetails } from "@/components/Home";
import { Button } from "@/components/ui/button";
import { TOKEN_SYMBOL } from "@/constant";
import ADDRESSES from "@/lib/addresses";
import { useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import { usePublicClient } from "wagmi";

const IntentManagement = ({
  intentId,
  searchIntentId,
  intentDetails,
  handleRefreshMyIntentId,
  isLoading,
}: {
  intentId: number | null;
  searchIntentId: number | null;
  intentDetails: IntentDetails | null;
  handleRefreshMyIntentId: () => void;
  isLoading: boolean;
}) => {
  const publicClient = usePublicClient();

  const [receiverTokenBalance, setReceiverTokenBalance] = useState<
    bigint | undefined
  >(undefined);

  const readReceiverTokenBalance = async (to: string) => {
    if (!to) return;

    const balance = await publicClient?.readContract({
      address: ADDRESSES.TOKEN,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [to as `0x${string}`],
    });
    setReceiverTokenBalance(balance);
  };

  return (
    <section className="mt-5 px-5 py-[30px] bg-white rounded-[10px] border border-gray-border">
      <section className="space-y-[5px]">
        <h3 className="body font-bold text-black">
          <span className="mr-1 w-4 inline-block text-blue-primary">◆</span>
          Intent Management
        </h3>
        <p className="text ml-5">
          Click Lookup for looking up your Intent.
          <br />
          If you don&apos;t have an Intent, click Create New for creating a new
          Intent.
          <br />
          And Click Lookup for refresh.
        </p>
      </section>

      <div className="mt-5 p-5 border border-gray-border rounded-[10px] bg-gray-300">
        <h3 className="font-semibold body">My Intent</h3>

        {searchIntentId && (
          <div className="mt-4 space-y-3">
            {intentDetails && (
              <div className="p-5 bg-white border border-gray-border rounded-[10px]">
                <h4 className="font-semibold text">· Intent Details</h4>
                <section className="mt-[15px] px-5 py-[15px] mb-[15px] border border-gray-border rounded-[10px] bg-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[15px] gap-y-[10px] text-sm">
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
                <div className="border border-gray-border rounded-[5px] mt-[5px] py-[10px] px-[15px] bg-blue-200">
                  <div className="flex items-center justify-between">
                    <p className="text text-blue-primary font-bold">
                      {receiverTokenBalance
                        ? formatUnits(receiverTokenBalance, 18)
                        : "0"}{" "}
                      {TOKEN_SYMBOL}
                    </p>

                    <button
                      onClick={() => readReceiverTokenBalance(intentDetails.to)}
                      className="text-blue-primary hover:text-blue-primary/50 transition-all duration-200"
                      title="Refresh balance"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="inline-block"
                      >
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                        <path d="M3 21v-5h5" />
                      </svg>
                    </button>
                  </div>
                  <p className="text text-gray-600 mt-[5px] font-chivo-mono">
                    Address: {intentDetails.to}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        <Button
          onClick={handleRefreshMyIntentId}
          disabled={isLoading}
          className="mt-5"
        >
          {isLoading ? "Loading..." : "Lookup"}
        </Button>
      </div>
    </section>
  );
};

export default IntentManagement;
