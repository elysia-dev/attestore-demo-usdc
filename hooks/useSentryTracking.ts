import { useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { setWalletContext, trackUserAction } from "@/lib/sentry-utils";
import * as Sentry from "@sentry/nextjs";

export function useSentryTracking() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // 지갑 연결 상태 추적
  useEffect(() => {
    if (isConnected && address) {
      setWalletContext(address, chainId);

      // 사용자 식별 (익명화된 주소 사용)
      Sentry.setUser({
        id: address.toLowerCase(),
        username: `${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } else {
      setWalletContext();
      Sentry.setUser(null);
    }
  }, [address, isConnected, chainId]);

  // 체인 변경 추적
  useEffect(() => {
    if (chainId) {
      trackUserAction("Chain switched", {
        chainId: chainId,
      });
    }
  }, [chainId]);
}
