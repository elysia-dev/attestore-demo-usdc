import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { rabbyWallet } from "@rainbow-me/rainbowkit/wallets";
import { rainbowWallet } from "@rainbow-me/rainbowkit/wallets";
import { metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { anvil, holesky } from "./network";
import { isLocal } from "@/constant";

export const config = getDefaultConfig({
  appName: "Zenie",
  projectId: "YOUR_PROJECT_ID",
  chains: isLocal ? [anvil] : [holesky],
  wallets: [
    {
      groupName: "Recommended",
      wallets: [rabbyWallet, rainbowWallet, metaMaskWallet],
    },
  ],
  ssr: true, // Next.js에서 SSR 사용하는 경우
});
