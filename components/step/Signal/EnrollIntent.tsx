/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContractWrite } from "@/hooks/useContractWrite";
import { TOKEN_SYMBOL } from "@/constant";
import ADDRESSES from "@/lib/addresses";
import { ZK_MINTER_ABI } from "@/lib/wagmi";
import { decodeEventLog, keccak256, parseUnits, toBytes } from "viem";
import { useContext, useState } from "react";
import { ErrorType } from "@/lib/errors";
import { ErrorContext } from "@/context/ErrorContext";
import { extractErrorMessage } from "@/components/utils/extractErrorMessage";

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
    <section className="mt-5 p-5 bg-gray-300 rounded-[10px] border border-gray-border">
      <p className="body font-bold">
        <strong className="text-blue-primary w-4">◆</strong> Enroll Your Intent
      </p>
      <div className="space-y-[5px] text text-gray-600 pl-4 mt-[15px]">
        <p>1. Register who you want to send money to and how much.</p>
      </div>

      <form onSubmit={handleSignalIntent}>
        <section className="space-y-2.5 mt-5 p-5 border border-gray-border rounded-[10px] bg-white">
          <div className="space-y-[5px]">
            <Label htmlFor="toAddress" className="text font-semibold">
              · Recipient Address
            </Label>
            <Input
              id="toAddress"
              type="text"
              value={toAddress}
              disabled={!!intentId}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="0x..."
              className="text border-gray-border rounded-[5px] py-2.5 px-[15px]"
            />
          </div>

          <div className="space-y-[5px]">
            <Label htmlFor="amount" className="text font-semibold">
              · Amount ({TOKEN_SYMBOL})
            </Label>
            <Input
              id="amount"
              type="text"
              value={amount}
              disabled={!!intentId}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1.0"
              className="text border-gray-border rounded-[5px] py-2.5 px-[15px]"
            />
          </div>
        </section>

        <Button
          type="submit"
          className="mt-2.5 flex items-center gap-[5px]"
          disabled={
            !toAddress || !amount || isSignalIntentLoading || !!intentId
          }
        >
          {isSignalIntentLoading ? "Creating Intent..." : "Create New Intent"}
        </Button>
      </form>
    </section>
  );
};

export default EnrollIntent;
