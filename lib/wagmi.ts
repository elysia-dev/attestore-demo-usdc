import { getDefaultConfig } from "@rainbow-me/rainbowkit";
// import { mainnet, sepolia } from "wagmi/chains";
import { rabbyWallet } from "@rainbow-me/rainbowkit/wallets";
import { rainbowWallet } from "@rainbow-me/rainbowkit/wallets";
import { metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";

export const holesky = {
  id: 17000,
  name: "Holesky Test Network",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://ethereum-holesky.publicnode.com"] },
  },
  testnet: true,
} as const;

// Anvil 로컬 네트워크 정의
export const anvil = {
  id: 31337,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
  blockExplorers: {
    default: { name: "Anvil", url: "http://127.0.0.1:8545" },
  },
  testnet: true,
} as const;

const isLocal = process.env.NEXT_PUBLIC_CHAIN_NETWORK === "local";

export const config = getDefaultConfig({
  appName: "Genie",
  projectId: "YOUR_PROJECT_ID",
  chains: isLocal ? [anvil] : [holesky],
  wallets: [
    {
      groupName: "Recommended",
      wallets: [rabbyWallet, rainbowWallet, metaMaskWallet],
    },
  ],
  // chains: [anvil, holsky, mainnet, sepolia],
  ssr: true, // Next.js에서 SSR 사용하는 경우
});

// Anvil 기본 계정들 (ANVIL_SETUP.md에서 가져옴)
export const ANVIL_ACCOUNTS = {
  OWNER: {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  ALICE: {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  },
  BOB: {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey:
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  },
} as const;

// 컨트랙트 ABI
export const ZK_MINTER_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "verifier", type: "address" },
    ],
    name: "signalIntent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "accountIntent",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "intentId", type: "uint256" }],
    name: "intents",
    outputs: [
      { name: "owner", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "timestamp", type: "uint256" },
      { name: "verifier", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "paymentProof", type: "bytes" },
      { name: "intentId", type: "uint256" },
    ],
    name: "fulfillIntent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Redeem Functions
  {
    inputs: [
      { name: "_accountNumber", type: "string" },
      { name: "_amount", type: "uint256" },
    ],
    name: "signalRedeem",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_redeemId", type: "uint256" }],
    name: "cancelRedeem",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_redeemId", type: "uint256" }],
    name: "fulfillRedeem",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "redeemCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "accountRedeemRequest",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "redeemRequests",
    outputs: [
      { name: "owner", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "timestamp", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "to", type: "address" },
      { indexed: false, name: "verifier", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "intentId", type: "uint256" },
    ],
    name: "IntentSignaled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "intentHash", type: "bytes32" },
      { indexed: false, name: "verifier", type: "address" },
      { indexed: false, name: "owner", type: "address" },
      { indexed: false, name: "to", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "IntentFulfilled",
    type: "event",
  },
  // Redeem Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "redeemId", type: "uint256" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "accountNumber", type: "string" },
    ],
    name: "RedeemRequestSignaled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "redeemId", type: "uint256" }],
    name: "RedeemRequestFulfilled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "redeemId", type: "uint256" }],
    name: "RedeemRequestCancelled",
    type: "event",
  },
  // Redeem Errors
  {
    inputs: [],
    name: "InvalidAccountNumber",
    type: "error",
  },
  {
    inputs: [],
    name: "RedeemRequestNotFound",
    type: "error",
  },
  {
    inputs: [],
    name: "RedeemAlreadyExists",
    type: "error",
  },
] as const;

// MockUSDT ABI (ERC20 표준 + 민팅 기능)
export const MOCK_USDT_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
