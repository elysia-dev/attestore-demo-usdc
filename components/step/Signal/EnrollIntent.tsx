/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContractWrite } from "@/hooks/useContractWrite";
import { TOKEN_SYMBOL } from "@/constant";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI } from "@/lib/abi";
import { decodeEventLog, keccak256, parseUnits, toBytes } from "viem";
import { useContext, useState } from "react";
import { ErrorType } from "@/lib/errors";
import { ErrorContext } from "@/context/ErrorContext";
import { extractErrorMessage } from "@/components/utils/extractErrorMessage";
import { cn } from "@/lib/utils";

const EnrollIntent = ({
  address,
  setIntentId,
  setSearchIntentId,
  handleRefreshMyIntentId,
  intentId,
}: {
  address: `0x${string}` | undefined;
  handleRefreshMyIntentId: () => void;
  setIntentId: (intentId: number) => void;
  setSearchIntentId: (searchIntentId: number) => void;
  intentId: number | null;
}) => {
  const { setError } = useContext(ErrorContext);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");

  const { writeAndWait: signalIntentWrite, isLoading: isSignalIntentLoading } =
    useContractWrite({
      onSuccess: (receipt) => {
        // signalIntent 성공 시 intentId 추출
        try {
          const intentSignaledEvent = receipt.logs.find((log: any) => {
            const intentSignaledTopic = keccak256(
              toBytes("IntentSignaled(address,address,uint256,uint256)")
            );
            return (
              log.topics[0] === intentSignaledTopic &&
              log.address.toLowerCase() === ADDRESSES.ZK_MINTER.toLowerCase()
            );
          });

          if (intentSignaledEvent) {
            const decodedLog = decodeEventLog({
              abi: ZK_MINTER_ABI,
              data: intentSignaledEvent.data,
              topics: intentSignaledEvent.topics,
            });

            const { intentId: newIntentId } = decodedLog.args as {
              to: string;
              verifier: string;
              amount: bigint;
              intentId: bigint;
            };

            const intentIdNumber = Number(newIntentId);
            setIntentId(intentIdNumber);
            setSearchIntentId(intentIdNumber);
            handleRefreshMyIntentId();
          }
        } catch (error) {
          console.error("Failed to parse IntentSignaled event:", error);
        }
      },
    });

  // signalIntent 호출
  const handleSignalIntent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!toAddress || !amount || !address) {
      setError(ErrorType.REQUIRED_FIELDS_MISSING);
      return;
    }
    try {
      await signalIntentWrite({
        address: ADDRESSES.ZK_MINTER,
        abi: ZK_MINTER_ABI,
        functionName: "signalIntent",
        args: [
          toAddress as `0x${string}`,
          parseUnits(amount, 18),
          ADDRESSES.TOSS_BANK_VERIFIER,
        ],
      });
      // 성공 시 onSuccess 콜백에서 자동으로 intentId 설정됨
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      setError(ErrorType.INTENT_SIGNAL_FAILED, {
        error: errorMessage,
      });
    }
  };

  return (
    <section className="space-y-6">
      <div className="bg-secondary/30 rounded-2xl p-5 border border-border/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl text-primary">◆</span>
          <div>
            <h3 className="text-base font-semibold">
              Enroll Your Intent
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Register who you want to send money to and how much.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSignalIntent} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="toAddress" className="text-sm font-medium text-muted-foreground">
            Recipient Address
          </label>
          <input
            id="toAddress"
            type="text"
            value={toAddress}
            disabled={!!intentId}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3.5 bg-secondary/30 rounded-2xl border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground/50 text-base disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium text-muted-foreground">
            Amount ({TOKEN_SYMBOL})
          </label>
          <input
            id="amount"
            type="text"
            value={amount}
            disabled={!!intentId}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1.0"
            className="w-full px-4 py-3.5 bg-secondary/30 rounded-2xl border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground/50 text-base disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-8 py-4 rounded-full font-semibold transition-all duration-200 hover:shadow-[0_0_30px_rgba(255,0,122,0.4)] shadow-[0_0_20px_rgba(255,0,122,0.3)] text-base mt-3"
          disabled={
            !toAddress || !amount || isSignalIntentLoading || !!intentId
          }
        >
          {isSignalIntentLoading ? "Creating Intent..." : "Create New Intent"}
        </button>
      </form>
    </section>
  );
};

export default EnrollIntent;
