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
  {
    inputs: [{ name: "_intentId", type: "uint256" }],
    name: "cancelIntent",
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
  {
    anonymous: false,
    inputs: [{ indexed: false, name: "intentId", type: "uint256" }],
    name: "IntentCancelled",
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
