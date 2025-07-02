import { useState } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { Abi, Address, TransactionReceipt } from "viem";

interface UseContractWriteOptions {
  onSuccess?: (receipt: TransactionReceipt) => void;
  onError?: (error: Error) => void;
}

export function useContractWrite(options?: UseContractWriteOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const writeAndWait = async ({
    address,
    abi,
    functionName,
    args,
  }: {
    address: Address;
    abi: Abi;
    functionName: string;
    args?: readonly unknown[];
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`🚀 Calling ${functionName}...`);

      // 1. 트랜잭션 전송
      const hash = await writeContractAsync({
        address,
        abi,
        functionName,
        args,
      });

      console.log(`📝 Transaction submitted: ${hash}`);

      // 2. 트랜잭션 완료 대기
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });

      console.log(`✅ Transaction confirmed in block: ${receipt?.blockNumber}`);

      if (receipt?.status === "success") {
        options?.onSuccess?.(receipt);
        return { hash, receipt };
      } else {
        throw new Error("Transaction failed");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error(`❌ Transaction failed:`, err);
      setError(errorMessage);
      options?.onError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    writeAndWait,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
