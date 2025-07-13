"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { ErrorProvider } from "@/context/ErrorContext";
import { useSentryTracking } from "@/hooks/useSentryTracking";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { anvil, holesky } from "@/lib/network";

const queryClient = new QueryClient();

// Create config directly without dynamic imports
const isLocal = process.env.NEXT_PUBLIC_CHAIN_NETWORK === "local";

const config = createConfig({
  chains: isLocal ? [anvil] : [holesky],
  connectors: [
    injected(), // MetaMask, Rabby 등 브라우저 확장 지갑
  ],
  transports: {
    [anvil.id]: http(anvil.rpcUrls.default.http[0]),
    [holesky.id]: http(holesky.rpcUrls.default.http[0]),
  },
  ssr: false, // SSR 비활성화
});

function ProvidersWithTracking({ children }: { children: React.ReactNode }) {
  useSentryTracking();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // SSR 중에는 아무것도 렌더링하지 않음
  if (!mounted) {
    return null;
  }

  return (
    <ErrorProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <ProvidersWithTracking>{children}</ProvidersWithTracking>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorProvider>
  );
}
