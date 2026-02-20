// ---------------------------------------------------------------------------
// Multi-chain contract addresses
// ---------------------------------------------------------------------------

export interface ChainContracts {
  agentRegistry: `0x${string}`;
  paymentRouter: `0x${string}`;
  merchantVault: `0x${string}`;
  adiPaymaster: `0x${string}`;
  mockDDSC: `0x${string}`;
  subscriptionManager: `0x${string}`;
  entryPointV07: `0x${string}`;
}

/** Per-chain contract addresses keyed by chainId */
export const CONTRACT_ADDRESSES: Record<number, ChainContracts> = {
  // ADI Chain Testnet
  99999: {
    agentRegistry: "0x24fF5f6637A83CA7CA7B72b3Ad55275D669Ab7da",
    paymentRouter: "0x13e935CF88Fd5a967B621aDf0b331361E8aF76f3",
    merchantVault: "0x809039A3A6791bb734841E1B14405FF521BC6ddb",
    adiPaymaster: "0x804911e28D000695b6DD6955EEbF175EbB628A16",
    mockDDSC: "0x66bfba26d31e008dF0a6D40333e01bd1213CB109",
    subscriptionManager: "0xDB053ceb6CbD2BCb74A04278c6233a1bB22d2295",
    entryPointV07: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  },
  // Hedera Testnet
  296: {
    agentRegistry: "0xf53D927D6D19c7A67cF5126aA7EED0b4c0185850",
    paymentRouter: "0x4F1cD87A50C281466eEE19f06eB54f1BBd9aC536",
    merchantVault: "0x8D5940795eA47d43dEF13E3e8e59ECbdaA26Bc24",
    adiPaymaster: "0x0000000000000000000000000000000000000000",
    mockDDSC: "0xcD848BBfcE40332E93908D23A364C410177De876",
    subscriptionManager: "0x0BD999211004837B6F8bbFF8437340cBA6e8688b",
    entryPointV07: "0x0000000000000000000000000000000000000000",
  },
};

/** Default chain ID used when wallet is not connected */
export const DEFAULT_CHAIN_ID = 99999;

/** Backward-compatible CONTRACTS constant (defaults to ADI Testnet) */
export const CONTRACTS = CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID];

// ---------------------------------------------------------------------------
// Chain metadata helpers
// ---------------------------------------------------------------------------

export interface ChainMeta {
  name: string;
  currencySymbol: string;
  explorerUrl: string;
  /** Whether native-value payments (msg.value) work on this chain */
  supportsNativePayments: boolean;
}

export const CHAIN_META: Record<number, ChainMeta> = {
  99999: {
    name: "ADI Chain Testnet",
    currencySymbol: "ADI",
    explorerUrl: "https://explorer.ab.testnet.adifoundation.ai",
    supportsNativePayments: true,
  },
  296: {
    name: "Hedera Testnet",
    currencySymbol: "HBAR",
    explorerUrl: "https://hashscan.io/testnet",
    supportsNativePayments: false,
  },
};

export const DEFAULT_CHAIN_META: ChainMeta = CHAIN_META[DEFAULT_CHAIN_ID];

/**
 * Get contracts for a specific chain ID. Falls back to ADI Testnet.
 */
export function getContractsForChain(chainId: number | undefined): ChainContracts {
  if (chainId && CONTRACT_ADDRESSES[chainId]) {
    return CONTRACT_ADDRESSES[chainId];
  }
  return CONTRACT_ADDRESSES[DEFAULT_CHAIN_ID];
}

/**
 * Get chain metadata for a specific chain ID. Falls back to ADI Testnet.
 */
export function getChainMeta(chainId: number | undefined): ChainMeta {
  if (chainId && CHAIN_META[chainId]) {
    return CHAIN_META[chainId];
  }
  return DEFAULT_CHAIN_META;
}

/**
 * Check if connected chain is Hedera
 */
export function isHederaChain(chainId: number | undefined): boolean {
  return chainId === 296;
}

/** List of supported chain IDs */
export const SUPPORTED_CHAIN_IDS = Object.keys(CONTRACT_ADDRESSES).map(Number);

export const AGENT_REGISTRY_ABI = [
  {
    type: "function",
    name: "registerAgent",
    inputs: [
      { name: "metadataURI", type: "string" },
      { name: "pricePerTask", type: "uint256" },
    ],
    outputs: [{ name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateAgent",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "metadataURI", type: "string" },
      { name: "pricePerTask", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivateAgent",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "activateAgent",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rateAgent",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "rating", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getAgent",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "metadataURI", type: "string" },
          { name: "pricePerTask", type: "uint256" },
          { name: "isActive", type: "bool" },
          { name: "totalTasks", type: "uint256" },
          { name: "totalRating", type: "uint256" },
          { name: "ratingCount", type: "uint256" },
          { name: "createdAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextAgentId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getOwnerAgents",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAgentRating",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "avgRating", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getActiveAgentCount",
    inputs: [],
    outputs: [{ name: "count", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "AgentRegistered",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "metadataURI", type: "string", indexed: false },
      { name: "pricePerTask", type: "uint256", indexed: false },
    ],
  },
] as const;

export const PAYMENT_ROUTER_ABI = [
  {
    type: "function",
    name: "payAgent",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "paymentId", type: "bytes32" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "payAgentERC20",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "paymentId", type: "bytes32" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPayment",
    inputs: [{ name: "paymentId", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "payer", type: "address" },
          { name: "payee", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "token", type: "address" },
          { name: "agentId", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserPayments",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bytes32[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalPayments",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalVolume",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "PaymentCreated",
    inputs: [
      { name: "paymentId", type: "bytes32", indexed: true },
      { name: "payer", type: "address", indexed: true },
      { name: "payee", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "token", type: "address", indexed: false },
      { name: "agentId", type: "uint256", indexed: false },
    ],
  },
] as const;

export const MERCHANT_VAULT_ABI = [
  {
    type: "function",
    name: "registerMerchant",
    inputs: [
      { name: "name", type: "string" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [{ name: "merchantId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "checkout",
    inputs: [
      { name: "merchantId", type: "uint256" },
      { name: "orderId", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "checkoutERC20",
    inputs: [
      { name: "merchantId", type: "uint256" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "orderId", type: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getMerchant",
    inputs: [{ name: "merchantId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "name", type: "string" },
          { name: "metadataURI", type: "string" },
          { name: "isActive", type: "bool" },
          { name: "totalRevenue", type: "uint256" },
          { name: "totalOrders", type: "uint256" },
          { name: "createdAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "merchantByAddress",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMerchantBalance",
    inputs: [
      { name: "merchantId", type: "uint256" },
      { name: "token", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextMerchantId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalMerchants",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalOrderCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "MerchantRegistered",
    inputs: [
      { name: "merchantId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CheckoutCompleted",
    inputs: [
      { name: "merchantId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: true },
      { name: "token", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "orderId", type: "bytes32", indexed: false },
    ],
  },
] as const;

export const MOCK_DDSC_ABI = [
  {
    type: "function",
    name: "faucet",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const SUBSCRIPTION_MANAGER_ABI = [
  {
    type: "function",
    name: "subscribeTo",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "interval", type: "uint256" },
    ],
    outputs: [{ name: "subscriptionId", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "cancelSubscription",
    inputs: [{ name: "subscriptionId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executePayment",
    inputs: [{ name: "subscriptionId", type: "uint256" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "subscribeToERC20",
    inputs: [
      { name: "agentId", type: "uint256" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "interval", type: "uint256" },
    ],
    outputs: [{ name: "subscriptionId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "executeERC20Payment",
    inputs: [{ name: "subscriptionId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getSubscription",
    inputs: [{ name: "subscriptionId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "subscriber", type: "address" },
          { name: "agentId", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "interval", type: "uint256" },
          { name: "nextPayment", type: "uint256" },
          { name: "isActive", type: "bool" },
          { name: "totalPaid", type: "uint256" },
          { name: "paymentCount", type: "uint256" },
          { name: "token", type: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserSubscriptions",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getActiveSubscriptionCount",
    inputs: [],
    outputs: [{ name: "count", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "nextSubscriptionId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformFeeBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "subscriptionScheduleIds",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "setFee",
    inputs: [{ name: "_feeBps", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setFeeRecipient",
    inputs: [{ name: "_feeRecipient", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "SubscriptionCreated",
    inputs: [
      { name: "subscriptionId", type: "uint256", indexed: true },
      { name: "subscriber", type: "address", indexed: true },
      { name: "agentId", type: "uint256", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "interval", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PaymentExecuted",
    inputs: [
      { name: "subscriptionId", type: "uint256", indexed: true },
      { name: "subscriber", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
      { name: "paymentCount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SubscriptionCancelled",
    inputs: [
      { name: "subscriptionId", type: "uint256", indexed: true },
    ],
  },
] as const;

export const ADI_PAYMASTER_ABI = [
  {
    type: "function",
    name: "getDeposit",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSponsorshipInfo",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "count", type: "uint256" },
      { name: "remaining", type: "uint256" },
      { name: "whitelisted", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalSponsored",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "verifyingSigner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;
