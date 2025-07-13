/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { rabbyWallet } from "@rainbow-me/rainbowkit/wallets";
import { rainbowWallet } from "@rainbow-me/rainbowkit/wallets";
import { metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { anvil, holesky } from "./network";

// Dynamic import to avoid SSR issues
let config: any;

if (typeof window !== "undefined") {
  const isLocal = process.env.NEXT_PUBLIC_CHAIN_NETWORK === "local";

  config = getDefaultConfig({
    appName: "Zenie",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    chains: isLocal ? [anvil] : [holesky],
    wallets: [
      {
        groupName: "Recommended",
        wallets: [rabbyWallet, rainbowWallet, metaMaskWallet],
      },
    ],
    ssr: true,
  });
}

export { config };
