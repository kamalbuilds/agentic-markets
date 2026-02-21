import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, defineChain, formatEther, getAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Kite AI x402 v2 Constants
const SERVICE_WALLET =
  process.env.KITE_SERVICE_WALLET ??
  getAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18");
const PIE_USD = getAddress("0x105cE361E721aA4A604655debB0A7464C948E980"); // pieUSD on Kite Testnet
const FACILITATOR_URL = "https://facilitator.pieverse.io";
const KITE_NETWORK = "eip155:2368"; // CAIP-2 format

// Agent wallet for self-settlement (calls transferWithAuthorization on-chain)
const AGENT_PK = (process.env.AGENT_PRIVATE_KEY ??
  "0x17b9bfede94175011d74b287cfc3d8b62bac54e21d0a45a179cb9eca807daa58") as `0x${string}`;

// ERC-3009 transferWithAuthorization bytes overload ABI (the only overload our pieUSD supports)
const transferWithAuthBytesABI = [
  {
    type: "function",
    name: "transferWithAuthorization",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

// Kite AI Testnet chain definition
const kiteTestnet = defineChain({
  id: 2368,
  name: "Kite AI Testnet",
  nativeCurrency: { name: "KITE", symbol: "KITE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-testnet.gokite.ai/"] },
  },
  blockExplorers: {
    default: { name: "KiteScan", url: "https://testnet.kitescan.ai" },
  },
});

// Agent Registry contract deployed on Kite AI Testnet
const REGISTRY_ADDRESS = "0x5820dd377d88A2e331e935F85cD43D6e164c706E" as const;

const REGISTRY_ABI = [
  {
    type: "function",
    name: "nextAgentId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAgent",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "metadataURI", type: "string" },
          { name: "pricePerTask", type: "uint256" },
          { name: "isActive", type: "bool" },
          { name: "totalTasksCompleted", type: "uint256" },
          { name: "totalRating", type: "uint256" },
          { name: "ratingCount", type: "uint256" },
          { name: "createdAt", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

const client = createPublicClient({
  chain: kiteTestnet,
  transport: http("https://rpc-testnet.gokite.ai/"),
});

function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Build x402 v2 PaymentRequirements for Pieverse on Kite Testnet.
 */
function buildPaymentRequirements(amount: string) {
  return {
    scheme: "exact",
    network: KITE_NETWORK,
    amount,
    asset: PIE_USD,
    payTo: SERVICE_WALLET,
    maxTimeoutSeconds: 300,
    extra: { name: "pieUSD", version: "1" },
  };
}

/**
 * Parse an agent ID string and extract the numeric registry ID.
 */
function parseAgentId(agentId: string): number | null {
  const match = agentId.match(/^kite-agent-(\d+)$/);
  if (match) return parseInt(match[1], 10);

  const num = parseInt(agentId, 10);
  if (!isNaN(num) && num >= 0) return num;

  return null;
}

/**
 * POST /api/kite/hire
 *
 * x402 v2 compatible agent hiring endpoint using Pieverse facilitator on Kite Testnet.
 * Returns 402 with x402 v2 payment requirements (scheme: exact, network: eip155:2368, asset: pieUSD).
 * Verifies the agent exists on-chain, then verifies and settles payment via Pieverse.
 *
 * Body:
 *   - agentId (required) - the ID of the agent to hire
 *   - task (required) - description of the task to perform
 *   - maxBudget (optional) - maximum pieUSD budget for the task
 */
export async function POST(request: NextRequest) {
  const paymentHeader =
    request.headers.get("payment-signature") ??
    request.headers.get("x-payment");

  const paymentRequirements = buildPaymentRequirements("5000000000000000000"); // 5 pieUSD

  // No payment header: return 402 with x402 v2 payment requirements
  if (!paymentHeader) {
    return NextResponse.json(
      {
        x402Version: 2,
        error: "Payment required",
        resource: {
          url: request.url,
          description: "AgentMarket - Hire an AI Agent on Kite AI",
          mimeType: "application/json",
        },
        accepts: [paymentRequirements],
      },
      {
        status: 402,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT, PAYMENT-SIGNATURE",
        },
      }
    );
  }

  // Parse request body
  let body: { agentId?: string; task?: string; maxBudget?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Required: { agentId, task }" },
      { status: 400 }
    );
  }

  const { agentId, task } = body;

  if (!agentId || !task) {
    return NextResponse.json(
      { error: "Missing required fields: agentId and task" },
      { status: 400 }
    );
  }

  const registryId = parseAgentId(agentId);
  if (registryId === null) {
    return NextResponse.json(
      { error: `Invalid agent ID format: ${agentId}. Use kite-agent-N or a numeric ID.` },
      { status: 400 }
    );
  }

  // Verify the agent exists on-chain and is active
  let agentData: {
    owner: string;
    metadataURI: string;
    pricePerTask: bigint;
    isActive: boolean;
    totalTasksCompleted: bigint;
    totalRating: bigint;
    ratingCount: bigint;
    createdAt: bigint;
  };

  try {
    agentData = await client.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "getAgent",
      args: [BigInt(registryId)],
    });
  } catch {
    return NextResponse.json(
      { error: `Agent ${agentId} (registry ID ${registryId}) not found on-chain` },
      { status: 404 }
    );
  }

  if (!agentData.isActive) {
    return NextResponse.json(
      {
        error: `Agent ${agentId} exists but is not currently active`,
        owner: agentData.owner,
        registryId,
      },
      { status: 400 }
    );
  }

  const priceEth = formatEther(agentData.pricePerTask);
  const avgRating =
    agentData.ratingCount > BigInt(0)
      ? Number(agentData.totalRating) / Number(agentData.ratingCount)
      : 0;

  const agentResponse = {
    registryId,
    owner: agentData.owner,
    metadataURI: agentData.metadataURI,
    pricePerTask: agentData.pricePerTask.toString(),
    pricePerTaskFormatted: `${priceEth} KITE`,
    isActive: agentData.isActive,
    totalTasksCompleted: Number(agentData.totalTasksCompleted),
    averageRating: Math.round(avgRating * 10) / 10,
    ratingCount: Number(agentData.ratingCount),
    createdAt: new Date(Number(agentData.createdAt) * 1000).toISOString(),
  };

  // Decode x402 v2 PaymentPayload from header
  let paymentPayload: Record<string, unknown>;
  try {
    paymentPayload = JSON.parse(Buffer.from(paymentHeader, "base64").toString());
  } catch {
    return NextResponse.json(
      { error: "Invalid payment header encoding" },
      { status: 400 }
    );
  }

  // Verify and settle payment via Pieverse facilitator (x402 v2 format)
  const taskId = generateTaskId();

  try {
    const verifyResponse = await fetch(`${FACILITATOR_URL}/v2/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentPayload,
        paymentRequirements,
      }),
    });

    const verifyResult = await verifyResponse.json();

    if (!verifyResult.isValid) {
      // Verification failed — return agent data with verification details
      return NextResponse.json(
        {
          taskId,
          agentId,
          registryId,
          task,
          status: "accepted",
          agent: agentResponse,
          result: {
            message: `Agent ${agentId} (owner: ${agentData.owner}) has been hired. Task assigned.`,
            estimatedCompletion: new Date(Date.now() + 60000).toISOString(),
          },
          x402: {
            verified: false,
            reason: verifyResult.invalidReason || "verification_failed",
            payer: verifyResult.payer,
            facilitator: FACILITATOR_URL,
          },
          timestamp: new Date().toISOString(),
        },
        {
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // Self-settle: call transferWithAuthorization(bytes) directly on-chain
    // The Pieverse facilitator uses v,r,s overload which our pieUSD doesn't support,
    // so we settle ourselves using the bytes overload after Pieverse verification passes.
    const eip3009Payload = paymentPayload as {
      payload?: { signature?: string; authorization?: {
        from: string; to: string; value: string;
        validAfter: string; validBefore: string; nonce: string;
      } };
    };

    const auth = eip3009Payload.payload?.authorization;
    const sig = eip3009Payload.payload?.signature;

    if (!auth || !sig) {
      return NextResponse.json(
        { error: "Missing authorization or signature in payment payload" },
        { status: 400 }
      );
    }

    let settleTxHash = "";
    let settleSuccess = false;

    try {
      const settlerAccount = privateKeyToAccount(AGENT_PK);
      const walletClient = createWalletClient({
        account: settlerAccount,
        chain: kiteTestnet,
        transport: http("https://rpc-testnet.gokite.ai/"),
      });

      const txHash = await walletClient.writeContract({
        address: PIE_USD,
        abi: transferWithAuthBytesABI,
        functionName: "transferWithAuthorization",
        args: [
          getAddress(auth.from),
          getAddress(auth.to),
          BigInt(auth.value),
          BigInt(auth.validAfter),
          BigInt(auth.validBefore),
          auth.nonce as `0x${string}`,
          sig as `0x${string}`,
        ],
        gas: BigInt(200000), // Fixed gas to bypass estimation timing issues
      });

      const receipt = await client.waitForTransactionReceipt({ hash: txHash });
      settleTxHash = txHash;
      settleSuccess = receipt.status === "success";
    } catch (settleErr: unknown) {
      const msg = settleErr instanceof Error ? settleErr.message.substring(0, 200) : "unknown";
      console.error("Self-settle failed:", msg);
    }

    return NextResponse.json(
      {
        taskId,
        agentId,
        registryId,
        task,
        status: "accepted",
        agent: agentResponse,
        result: {
          message: `Agent ${agentId} (owner: ${agentData.owner}) has been hired. Task assigned.`,
          estimatedCompletion: new Date(Date.now() + 60000).toISOString(),
        },
        x402: {
          verified: true,
          settled: settleSuccess,
          transaction: settleTxHash,
          payer: verifyResult.payer,
          network: KITE_NETWORK,
          facilitator: FACILITATOR_URL,
          settlementMethod: "direct-on-chain",
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "PAYMENT-RESPONSE": Buffer.from(
            JSON.stringify({
              success: settleSuccess,
              transaction: settleTxHash,
              network: KITE_NETWORK,
              taskId,
              timestamp: Date.now(),
            })
          ).toString("base64"),
        },
      }
    );
  } catch {
    // Facilitator unreachable — still return agent data
    return NextResponse.json(
      {
        taskId,
        agentId,
        registryId,
        task,
        status: "accepted",
        agent: agentResponse,
        result: {
          message: `Agent ${agentId} (owner: ${agentData.owner}) has been hired. Task assigned.`,
          estimatedCompletion: new Date(Date.now() + 60000).toISOString(),
        },
        x402: {
          verified: false,
          reason: "facilitator_unreachable",
          facilitator: FACILITATOR_URL,
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT, PAYMENT-SIGNATURE",
    },
  });
}
