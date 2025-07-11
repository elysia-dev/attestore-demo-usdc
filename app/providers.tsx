"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

import { config } from "@/lib/wagmi";
import { ErrorProvider } from "@/context/ErrorContext";
import { useSentryTracking } from "@/hooks/useSentryTracking";

const queryClient = new QueryClient();

function ProvidersWithTracking({ children }: { children: React.ReactNode }) {
  useSentryTracking();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ErrorProvider>
            <ProvidersWithTracking>
              {children}
            </ProvidersWithTracking>
          </ErrorProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
