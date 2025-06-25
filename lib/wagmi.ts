import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, sepolia, hardhat } from "wagmi/chains";

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

export const config = getDefaultConfig({
  appName: "ZK Escrow Demo",
  projectId: "YOUR_PROJECT_ID", // WalletConnect Project ID (선택사항)
  chains: [anvil, mainnet, sepolia],
  ssr: true, // Next.js에서 SSR 사용하는 경우
});

// 컨트랙트 주소들
export const CONTRACT_ADDRESSES = {
  MOCK_USDT: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  NULLIFIER_REGISTRY: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  ZK_MINTER: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  TOSS_BANK_VERIFIER: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
} as const;

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
