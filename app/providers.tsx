"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { ErrorProvider } from "@/context/ErrorContext";
import { useSentryTracking } from "@/hooks/useSentryTracking";
import { config } from "@/lib/wagmi";

const queryClient = new QueryClient();

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
