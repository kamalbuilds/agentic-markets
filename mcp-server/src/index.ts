import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  parseEther,
  formatUnits,
  parseUnits,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Address,
  type Hex,
  encodePacked,
  keccak256,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ============================================================================
// Chain Definition
// ============================================================================

const adiTestnet: Chain = {
  id: 99999,
  name: "ADI Testnet",
  nativeCurrency: {
    name: "ADI",
    symbol: "ADI",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.ab.testnet.adifoundation.ai/"],
    },
  },
};

// ============================================================================
// Contract Addresses
// ============================================================================

const CONTRACTS = {
  agentRegistry: "0x24fF5f6637A83CA7CA7B72b3Ad55275D669Ab7da" as Address,
  paymentRouter: "0x13e935CF88Fd5a967B621aDf0b331361E8aF76f3" as Address,
  merchantVault: "0x809039A3A6791bb734841E1B14405FF521BC6ddb" as Address,
  adiPaymaster: "0x804911e28D000695b6DD6955EEbF175EbB628A16" as Address,
  mockDDSC: "0x66bfba26d31e008dF0a6D40333e01bd1213CB109" as Address,
  subscriptionManager: "0xDB053ceb6CbD2BCb74A04278c6233a1bB22d2295" as Address,
} as const;

// ============================================================================
// ABIs
// ============================================================================

const AGENT_REGISTRY_ABI = [
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

const PAYMENT_ROUTER_ABI = [
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

const MERCHANT_VAULT_ABI = [
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

const MOCK_DDSC_ABI = [
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
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

const SUBSCRIPTION_MANAGER_ABI = [
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
] as const;

const ADI_PAYMASTER_ABI = [
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

// ============================================================================
// Clients
// ============================================================================

const publicClient = createPublicClient({
  chain: adiTestnet,
  transport: http(),
});

function getWalletClient() {
  const privateKey = process.env.AGENT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "AGENT_PRIVATE_KEY environment variable is required for write operations"
    );
  }
  const account = privateKeyToAccount(
    privateKey.startsWith("0x") ? (privateKey as Hex) : (`0x${privateKey}` as Hex)
  );
  return createWalletClient({
    account,
    chain: adiTestnet,
    transport: http(),
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

interface SubscriptionData {
  subscriber: Address;
  agentId: bigint;
  amount: bigint;
  interval: bigint;
  nextPayment: bigint;
  isActive: boolean;
  totalPaid: bigint;
  paymentCount: bigint;
  token: Address;
}

interface AgentData {
  owner: Address;
  metadataURI: string;
  pricePerTask: bigint;
  isActive: boolean;
  totalTasks: bigint;
  totalRating: bigint;
  ratingCount: bigint;
  createdAt: bigint;
}

interface PaymentData {
  payer: Address;
  payee: Address;
  amount: bigint;
  token: Address;
  agentId: bigint;
  status: number;
  timestamp: bigint;
}

interface MerchantData {
  owner: Address;
  name: string;
  metadataURI: string;
  isActive: boolean;
  totalRevenue: bigint;
  totalOrders: bigint;
  createdAt: bigint;
}

function formatSubscriptionData(subscription: SubscriptionData) {
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const isNativePayment = subscription.token === ZERO_ADDRESS;
  return {
    subscriber: subscription.subscriber,
    agentId: Number(subscription.agentId),
    amount: formatEther(subscription.amount),
    interval: Number(subscription.interval),
    nextPayment: new Date(Number(subscription.nextPayment) * 1000).toISOString(),
    isActive: subscription.isActive,
    totalPaid: formatEther(subscription.totalPaid),
    paymentCount: Number(subscription.paymentCount),
    token: subscription.token,
    paymentType: isNativePayment ? "native" : "ERC20",
  };
}

function formatAgentData(agent: AgentData) {
  const avgRating =
    agent.ratingCount > 0n
      ? Number(agent.totalRating) / Number(agent.ratingCount)
      : 0;
  return {
    owner: agent.owner,
    metadataURI: agent.metadataURI,
    pricePerTask: formatEther(agent.pricePerTask),
    isActive: agent.isActive,
    totalTasks: Number(agent.totalTasks),
    totalRating: Number(agent.totalRating),
    ratingCount: Number(agent.ratingCount),
    averageRating: avgRating,
    createdAt: new Date(Number(agent.createdAt) * 1000).toISOString(),
  };
}

function formatPaymentData(payment: PaymentData) {
  const statusMap: Record<number, string> = {
    0: "Pending",
    1: "Completed",
    2: "Refunded",
    3: "Cancelled",
  };
  return {
    payer: payment.payer,
    payee: payment.payee,
    amount: formatEther(payment.amount),
    token: payment.token,
    agentId: Number(payment.agentId),
    status: statusMap[payment.status] ?? `Unknown(${payment.status})`,
    timestamp: new Date(Number(payment.timestamp) * 1000).toISOString(),
  };
}

function formatMerchantData(merchant: MerchantData) {
  return {
    owner: merchant.owner,
    name: merchant.name,
    metadataURI: merchant.metadataURI,
    isActive: merchant.isActive,
    totalRevenue: formatEther(merchant.totalRevenue),
    totalOrders: Number(merchant.totalOrders),
    createdAt: new Date(Number(merchant.createdAt) * 1000).toISOString(),
  };
}

// ============================================================================
// MCP Server
// ============================================================================

const server = new McpServer({
  name: "openclaw-contracts",
  version: "1.0.0",
});

// ============================================================================
// READ TOOLS
// ============================================================================

// 1. get_agent - Get agent details by ID
server.tool(
  "get_agent",
  "Get detailed information about a registered AI agent by its ID. Returns owner address, metadata URI, price per task, active status, total tasks completed, ratings, and creation date.",
  {
    agentId: z.string().describe("The numeric ID of the agent to look up"),
  },
  async ({ agentId }) => {
    try {
      const agent = await publicClient.readContract({
        address: CONTRACTS.agentRegistry,
        abi: AGENT_REGISTRY_ABI,
        functionName: "getAgent",
        args: [BigInt(agentId)],
      });

      const formatted = formatAgentData(agent);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ agentId, ...formatted }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 2. list_agents - List all active agents
server.tool(
  "list_agents",
  "List all registered AI agents on the OpenClaw platform. Reads the total agent count and iterates through each one, returning active agents with their details.",
  {},
  async () => {
    try {
      const nextId = await publicClient.readContract({
        address: CONTRACTS.agentRegistry,
        abi: AGENT_REGISTRY_ABI,
        functionName: "nextAgentId",
      });

      const agents: Array<Record<string, unknown>> = [];

      for (let i = 1n; i < nextId; i++) {
        try {
          const agent = await publicClient.readContract({
            address: CONTRACTS.agentRegistry,
            abi: AGENT_REGISTRY_ABI,
            functionName: "getAgent",
            args: [i],
          });
          const formatted = formatAgentData(agent);
          if (formatted.isActive) {
            agents.push({ agentId: Number(i), ...formatted });
          }
        } catch {
          // Skip agents that don't exist or error
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                totalRegistered: Number(nextId) - 1,
                activeAgents: agents.length,
                agents,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error listing agents: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 3. get_agent_rating - Get agent's average rating
server.tool(
  "get_agent_rating",
  "Get the average rating for a specific AI agent. Rating is on a scale of 1-5.",
  {
    agentId: z.string().describe("The numeric ID of the agent"),
  },
  async ({ agentId }) => {
    try {
      const avgRating = await publicClient.readContract({
        address: CONTRACTS.agentRegistry,
        abi: AGENT_REGISTRY_ABI,
        functionName: "getAgentRating",
        args: [BigInt(agentId)],
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                agentId,
                averageRating: Number(avgRating),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching rating for agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 4. get_merchant - Get merchant details
server.tool(
  "get_merchant",
  "Get detailed information about a registered merchant by ID. Returns owner, name, metadata, active status, total revenue, total orders, and creation date.",
  {
    merchantId: z.string().describe("The numeric ID of the merchant"),
  },
  async ({ merchantId }) => {
    try {
      const merchant = await publicClient.readContract({
        address: CONTRACTS.merchantVault,
        abi: MERCHANT_VAULT_ABI,
        functionName: "getMerchant",
        args: [BigInt(merchantId)],
      });

      const formatted = formatMerchantData(merchant);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ merchantId, ...formatted }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching merchant ${merchantId}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 5. get_payment - Get payment details by ID
server.tool(
  "get_payment",
  "Get details of a specific payment by its bytes32 payment ID. Returns payer, payee, amount, token, agent ID, status, and timestamp.",
  {
    paymentId: z
      .string()
      .describe(
        "The bytes32 payment ID (hex string starting with 0x)"
      ),
  },
  async ({ paymentId }) => {
    try {
      const payment = await publicClient.readContract({
        address: CONTRACTS.paymentRouter,
        abi: PAYMENT_ROUTER_ABI,
        functionName: "getPayment",
        args: [paymentId as Hex],
      });

      const formatted = formatPaymentData(payment);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ paymentId, ...formatted }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching payment ${paymentId}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 6. get_user_payments - Get all payments for an address
server.tool(
  "get_user_payments",
  "Get all payment IDs associated with a specific user address. Returns an array of bytes32 payment IDs.",
  {
    address: z
      .string()
      .describe("The Ethereum address of the user (0x...)"),
  },
  async ({ address }) => {
    try {
      const paymentIds = await publicClient.readContract({
        address: CONTRACTS.paymentRouter,
        abi: PAYMENT_ROUTER_ABI,
        functionName: "getUserPayments",
        args: [address as Address],
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                address,
                totalPayments: paymentIds.length,
                paymentIds: paymentIds.map(String),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching payments for ${address}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 7. get_ddsc_balance - Get DDSC token balance for address
server.tool(
  "get_ddsc_balance",
  "Get the DDSC (test stablecoin) token balance for a given address. Returns balance in human-readable format (18 decimals).",
  {
    address: z
      .string()
      .describe("The Ethereum address to check the balance of (0x...)"),
  },
  async ({ address }) => {
    try {
      const balance = await publicClient.readContract({
        address: CONTRACTS.mockDDSC,
        abi: MOCK_DDSC_ABI,
        functionName: "balanceOf",
        args: [address as Address],
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                address,
                token: "DDSC",
                tokenAddress: CONTRACTS.mockDDSC,
                balance: formatUnits(balance, 18),
                balanceRaw: balance.toString(),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching DDSC balance for ${address}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 8. get_platform_stats - Get total payments, volume, merchants, agents
server.tool(
  "get_platform_stats",
  "Get overall platform statistics including total payments, volume, merchant count, active agent count, and total orders.",
  {},
  async () => {
    try {
      const [
        totalPayments,
        totalVolume,
        totalMerchants,
        activeAgentCount,
        totalOrders,
        nextAgentId,
      ] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.paymentRouter,
          abi: PAYMENT_ROUTER_ABI,
          functionName: "totalPayments",
        }),
        publicClient.readContract({
          address: CONTRACTS.paymentRouter,
          abi: PAYMENT_ROUTER_ABI,
          functionName: "totalVolume",
        }),
        publicClient.readContract({
          address: CONTRACTS.merchantVault,
          abi: MERCHANT_VAULT_ABI,
          functionName: "totalMerchants",
        }),
        publicClient.readContract({
          address: CONTRACTS.agentRegistry,
          abi: AGENT_REGISTRY_ABI,
          functionName: "getActiveAgentCount",
        }),
        publicClient.readContract({
          address: CONTRACTS.merchantVault,
          abi: MERCHANT_VAULT_ABI,
          functionName: "totalOrderCount",
        }),
        publicClient.readContract({
          address: CONTRACTS.agentRegistry,
          abi: AGENT_REGISTRY_ABI,
          functionName: "nextAgentId",
        }),
      ]);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                platform: "OpenClaw",
                chain: "ADI Testnet (99999)",
                totalAgentsRegistered: Number(nextAgentId) - 1,
                activeAgents: Number(activeAgentCount),
                totalMerchants: Number(totalMerchants),
                totalPayments: Number(totalPayments),
                totalVolume: formatEther(totalVolume),
                totalOrders: Number(totalOrders),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching platform stats: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 9. get_paymaster_info - Get paymaster sponsorship info for a user
server.tool(
  "get_paymaster_info",
  "Get gas sponsorship information from the ADI Paymaster for a specific user. Shows how many transactions have been sponsored, remaining quota, and whitelist status.",
  {
    address: z
      .string()
      .describe("The Ethereum address of the user (0x...)"),
  },
  async ({ address }) => {
    try {
      const [sponsorshipInfo, totalSponsored, deposit] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.adiPaymaster,
          abi: ADI_PAYMASTER_ABI,
          functionName: "getSponsorshipInfo",
          args: [address as Address],
        }),
        publicClient.readContract({
          address: CONTRACTS.adiPaymaster,
          abi: ADI_PAYMASTER_ABI,
          functionName: "totalSponsored",
        }),
        publicClient.readContract({
          address: CONTRACTS.adiPaymaster,
          abi: ADI_PAYMASTER_ABI,
          functionName: "getDeposit",
        }),
      ]);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                address,
                sponsoredTransactions: Number(sponsorshipInfo[0]),
                remainingQuota: Number(sponsorshipInfo[1]),
                isWhitelisted: sponsorshipInfo[2],
                paymasterTotalSponsored: Number(totalSponsored),
                paymasterDeposit: formatEther(deposit),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching paymaster info for ${address}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// WRITE TOOLS
// ============================================================================

// 10. register_agent - Register a new AI agent on-chain
server.tool(
  "register_agent",
  "Register a new AI agent on the OpenClaw platform. Requires AGENT_PRIVATE_KEY env var. The agent will be assigned an ID and can start receiving tasks and payments.",
  {
    metadataURI: z
      .string()
      .describe(
        "URI pointing to agent metadata (e.g., IPFS hash or URL with name, description, capabilities)"
      ),
    pricePerTask: z
      .string()
      .describe(
        "Price per task in ETH/ADI (e.g., '0.01' for 0.01 ETH). Will be converted to wei."
      ),
  },
  async ({ metadataURI, pricePerTask }) => {
    try {
      const wallet = getWalletClient();
      const priceWei = parseEther(pricePerTask);

      const hash = await wallet.writeContract({
        address: CONTRACTS.agentRegistry,
        abi: AGENT_REGISTRY_ABI,
        functionName: "registerAgent",
        args: [metadataURI, priceWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                transactionHash: hash,
                blockNumber: Number(receipt.blockNumber),
                status: receipt.status,
                message: `Agent registered successfully. Transaction: ${hash}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error registering agent: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 11. pay_agent - Pay an agent to execute a task
server.tool(
  "pay_agent",
  "Pay an AI agent with native currency (ADI/ETH) to execute a task. This creates a payment record on-chain. Requires AGENT_PRIVATE_KEY env var.",
  {
    agentId: z.string().describe("The numeric ID of the agent to pay"),
    value: z
      .string()
      .describe(
        "Amount to pay in ETH/ADI (e.g., '0.1' for 0.1 ETH). Must match or exceed agent's pricePerTask."
      ),
  },
  async ({ agentId, value }) => {
    try {
      const wallet = getWalletClient();
      const valueWei = parseEther(value);

      const hash = await wallet.writeContract({
        address: CONTRACTS.paymentRouter,
        abi: PAYMENT_ROUTER_ABI,
        functionName: "payAgent",
        args: [BigInt(agentId)],
        value: valueWei,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                transactionHash: hash,
                blockNumber: Number(receipt.blockNumber),
                status: receipt.status,
                message: `Paid agent ${agentId} with ${value} ADI. Transaction: ${hash}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error paying agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 12. rate_agent - Rate an agent (1-5)
server.tool(
  "rate_agent",
  "Rate an AI agent on a scale of 1-5. This updates the agent's on-chain rating. Requires AGENT_PRIVATE_KEY env var.",
  {
    agentId: z.string().describe("The numeric ID of the agent to rate"),
    rating: z
      .number()
      .min(1)
      .max(5)
      .describe("Rating from 1 (worst) to 5 (best)"),
  },
  async ({ agentId, rating }) => {
    try {
      const wallet = getWalletClient();

      const hash = await wallet.writeContract({
        address: CONTRACTS.agentRegistry,
        abi: AGENT_REGISTRY_ABI,
        functionName: "rateAgent",
        args: [BigInt(agentId), BigInt(rating)],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                transactionHash: hash,
                blockNumber: Number(receipt.blockNumber),
                status: receipt.status,
                message: `Rated agent ${agentId} with ${rating}/5. Transaction: ${hash}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error rating agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 13. register_merchant - Register a merchant
server.tool(
  "register_merchant",
  "Register a new merchant on the OpenClaw platform. Merchants can receive payments via checkout. Requires AGENT_PRIVATE_KEY env var.",
  {
    name: z.string().describe("The merchant's business name"),
    metadataURI: z
      .string()
      .describe("URI pointing to merchant metadata (description, logo, etc.)"),
  },
  async ({ name, metadataURI }) => {
    try {
      const wallet = getWalletClient();

      const hash = await wallet.writeContract({
        address: CONTRACTS.merchantVault,
        abi: MERCHANT_VAULT_ABI,
        functionName: "registerMerchant",
        args: [name, metadataURI],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                transactionHash: hash,
                blockNumber: Number(receipt.blockNumber),
                status: receipt.status,
                message: `Merchant "${name}" registered successfully. Transaction: ${hash}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error registering merchant: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 14. checkout - Execute a merchant checkout
server.tool(
  "checkout",
  "Execute a checkout payment to a merchant with native currency (ADI/ETH). Creates an order on-chain. Requires AGENT_PRIVATE_KEY env var.",
  {
    merchantId: z.string().describe("The numeric ID of the merchant"),
    amount: z
      .string()
      .describe("Payment amount in ETH/ADI (e.g., '0.5')"),
    orderId: z
      .string()
      .describe(
        "A unique order identifier string. Will be hashed to bytes32 on-chain."
      ),
  },
  async ({ merchantId, amount, orderId }) => {
    try {
      const wallet = getWalletClient();
      const valueWei = parseEther(amount);
      // Hash the orderId string to bytes32
      const orderIdBytes = keccak256(
        encodePacked(["string"], [orderId])
      );

      const hash = await wallet.writeContract({
        address: CONTRACTS.merchantVault,
        abi: MERCHANT_VAULT_ABI,
        functionName: "checkout",
        args: [BigInt(merchantId), orderIdBytes],
        value: valueWei,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                transactionHash: hash,
                blockNumber: Number(receipt.blockNumber),
                status: receipt.status,
                orderId,
                orderIdBytes,
                message: `Checkout completed for merchant ${merchantId}, amount ${amount} ADI. Transaction: ${hash}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error during checkout: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 15. claim_ddsc - Claim test DDSC from faucet
server.tool(
  "claim_ddsc",
  "Claim test DDSC (stablecoin) tokens from the faucet. Useful for testing payments. Requires AGENT_PRIVATE_KEY env var. Tokens are minted to the specified address.",
  {
    to: z
      .string()
      .describe(
        "The address to receive DDSC tokens (0x...). If omitted, uses the wallet's own address."
      )
      .optional(),
    amount: z
      .string()
      .describe(
        "Amount of DDSC to claim (e.g., '100' for 100 DDSC). Defaults to '1000'."
      )
      .optional(),
  },
  async ({ to, amount }) => {
    try {
      const wallet = getWalletClient();
      const account = wallet.account;
      if (!account) {
        throw new Error("No account found on wallet client");
      }
      const recipient = (to ?? account.address) as Address;
      const amountWei = parseUnits(amount ?? "1000", 18);

      const hash = await wallet.writeContract({
        address: CONTRACTS.mockDDSC,
        abi: MOCK_DDSC_ABI,
        functionName: "faucet",
        args: [recipient, amountWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                transactionHash: hash,
                blockNumber: Number(receipt.blockNumber),
                status: receipt.status,
                recipient,
                amount: amount ?? "1000",
                message: `Claimed ${amount ?? "1000"} DDSC to ${recipient}. Transaction: ${hash}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error claiming DDSC: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 16. transfer_ddsc - Transfer DDSC tokens
server.tool(
  "transfer_ddsc",
  "Transfer DDSC tokens to another address. Requires AGENT_PRIVATE_KEY env var and sufficient DDSC balance.",
  {
    to: z
      .string()
      .describe("The recipient address (0x...)"),
    amount: z
      .string()
      .describe("Amount of DDSC to transfer (e.g., '50' for 50 DDSC)"),
  },
  async ({ to, amount }) => {
    try {
      const wallet = getWalletClient();
      const amountWei = parseUnits(amount, 18);

      const hash = await wallet.writeContract({
        address: CONTRACTS.mockDDSC,
        abi: MOCK_DDSC_ABI,
        functionName: "transfer",
        args: [to as Address, amountWei],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                transactionHash: hash,
                blockNumber: Number(receipt.blockNumber),
                status: receipt.status,
                to,
                amount,
                message: `Transferred ${amount} DDSC to ${to}. Transaction: ${hash}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error transferring DDSC: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// SUBSCRIPTION MANAGER - READ TOOLS
// ============================================================================

// 17. get_subscription - Get subscription details by ID
server.tool(
  "get_subscription",
  "Get detailed information about a subscription by its ID. Returns subscriber address, agent ID, amount, interval, next payment date, active status, total paid, and payment count.",
  {
    subscriptionId: z.string().describe("The numeric ID of the subscription to look up"),
  },
  async ({ subscriptionId }) => {
    try {
      const subscription = await publicClient.readContract({
        address: CONTRACTS.subscriptionManager,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: "getSubscription",
        args: [BigInt(subscriptionId)],
      });

      const formatted = formatSubscriptionData(subscription);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ subscriptionId, ...formatted }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching subscription ${subscriptionId}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 18. list_user_subscriptions - List all subscription IDs for an address
server.tool(
  "list_user_subscriptions",
  "List all subscription IDs associated with a specific user address. Returns an array of numeric subscription IDs.",
  {
    address: z
      .string()
      .describe("The Ethereum address of the user (0x...)"),
  },
  async ({ address }) => {
    try {
      const subscriptionIds = await publicClient.readContract({
        address: CONTRACTS.subscriptionManager,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: "getUserSubscriptions",
        args: [address as Address],
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                address,
                totalSubscriptions: subscriptionIds.length,
                subscriptionIds: subscriptionIds.map(Number),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching subscriptions for ${address}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 19. get_subscription_stats - Get active count, next ID, etc.
server.tool(
  "get_subscription_stats",
  "Get overall subscription statistics including active subscription count and next subscription ID.",
  {},
  async () => {
    try {
      const [activeCount, nextId] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.subscriptionManager,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: "getActiveSubscriptionCount",
        }),
        publicClient.readContract({
          address: CONTRACTS.subscriptionManager,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: "nextSubscriptionId",
        }),
      ]);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                activeSubscriptions: Number(activeCount),
                totalSubscriptionsCreated: Number(nextId) - 1,
                nextSubscriptionId: Number(nextId),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error fetching subscription stats: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// SUBSCRIPTION MANAGER - WRITE TOOLS
// ============================================================================

// 20. subscribe_to_agent - Create a new subscription
server.tool(
  "subscribe_to_agent",
  "Create a new subscription to an AI agent with recurring payments. The first payment is sent immediately. Requires AGENT_PRIVATE_KEY env var.",
  {
    agentId: z.string().describe("The numeric ID of the agent to subscribe to"),
    amount: z
      .string()
      .describe(
        "Payment amount per interval in ETH/ADI (e.g., '0.1' for 0.1 ETH). Will be converted to wei."
      ),
    interval: z
      .string()
      .describe(
        "Payment interval in seconds (e.g., '86400' for daily, '604800' for weekly, '2592000' for ~monthly)"
      ),
  },
  async ({ agentId, amount, interval }) => {
    try {
      const wallet = getWalletClient();
      const amountWei = parseEther(amount);

      const hash = await wallet.writeContract({
        address: CONTRACTS.subscriptionManager,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: "subscribeTo",
        args: [BigInt(agentId), amountWei, BigInt(interval)],
        value: amountWei,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                transactionHash: hash,
                blockNumber: Number(receipt.blockNumber),
                status: receipt.status,
                message: `Subscribed to agent ${agentId} with ${amount} ADI every ${interval} seconds. Transaction: ${hash}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error subscribing to agent ${agentId}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 21. cancel_subscription - Cancel a subscription by ID
server.tool(
  "cancel_subscription",
  "Cancel an active subscription by its ID. Only the subscriber can cancel their own subscription. Requires AGENT_PRIVATE_KEY env var.",
  {
    subscriptionId: z.string().describe("The numeric ID of the subscription to cancel"),
  },
  async ({ subscriptionId }) => {
    try {
      const wallet = getWalletClient();

      const hash = await wallet.writeContract({
        address: CONTRACTS.subscriptionManager,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: "cancelSubscription",
        args: [BigInt(subscriptionId)],
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                transactionHash: hash,
                blockNumber: Number(receipt.blockNumber),
                status: receipt.status,
                message: `Subscription ${subscriptionId} cancelled successfully. Transaction: ${hash}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error cancelling subscription ${subscriptionId}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 22. execute_subscription_payment - Execute an overdue payment
server.tool(
  "execute_subscription_payment",
  "Execute a payment for an active subscription that is due. Sends the subscription amount as value. Requires AGENT_PRIVATE_KEY env var.",
  {
    subscriptionId: z.string().describe("The numeric ID of the subscription to execute payment for"),
  },
  async ({ subscriptionId }) => {
    try {
      const wallet = getWalletClient();

      // Fetch the subscription to get the payment amount
      const subscription = await publicClient.readContract({
        address: CONTRACTS.subscriptionManager,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: "getSubscription",
        args: [BigInt(subscriptionId)],
      });

      const hash = await wallet.writeContract({
        address: CONTRACTS.subscriptionManager,
        abi: SUBSCRIPTION_MANAGER_ABI,
        functionName: "executePayment",
        args: [BigInt(subscriptionId)],
        value: subscription.amount,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: true,
                transactionHash: hash,
                blockNumber: Number(receipt.blockNumber),
                status: receipt.status,
                amountPaid: formatEther(subscription.amount),
                message: `Payment executed for subscription ${subscriptionId}. Amount: ${formatEther(subscription.amount)} ADI. Transaction: ${hash}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error executing payment for subscription ${subscriptionId}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OpenClaw MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
