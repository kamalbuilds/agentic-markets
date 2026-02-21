import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, defineChain, formatEther } from "viem";

// Kite AI x402 Constants
const SERVICE_WALLET =
  process.env.KITE_SERVICE_WALLET ??
  "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
const KITE_TEST_USDT = "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63";
const FACILITATOR_URL = "https://facilitator.pieverse.io";

// ADI Testnet chain definition
const adiTestnet = defineChain({
  id: 99999,
  name: "ADI Testnet",
  nativeCurrency: { name: "ADI", symbol: "ADI", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.ab.testnet.adifoundation.ai/"] },
  },
});

// Agent Registry contract
const REGISTRY_ADDRESS = "0x24fF5f6637A83CA7CA7B72b3Ad55275D669Ab7da" as const;

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
  chain: adiTestnet,
  transport: http("https://rpc.ab.testnet.adifoundation.ai/"),
});

function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Parse an agent ID string and extract the numeric registry ID.
 * Accepts formats like "adi-agent-3", "3", "kite-agent-003", etc.
 */
function parseAgentId(agentId: string): number | null {
  // Try "adi-agent-N" format
  const adiMatch = agentId.match(/^adi-agent-(\d+)$/);
  if (adiMatch) return parseInt(adiMatch[1], 10);

  // Try "kite-agent-NNN" format (legacy)
  const kiteMatch = agentId.match(/^kite-agent-(\d+)$/);
  if (kiteMatch) return parseInt(kiteMatch[1], 10);

  // Try raw numeric
  const num = parseInt(agentId, 10);
  if (!isNaN(num) && num >= 0) return num;

  return null;
}

/**
 * POST /api/kite/hire
 *
 * x402-compatible agent hiring endpoint using Kite's gokite-aa scheme.
 * Returns 402 with payment requirements if no X-PAYMENT header is provided.
 * Verifies the agent exists and is active on-chain, then confirms the hire intent.
 * Actual payment execution happens via the pay_agent MCP tool.
 *
 * Body:
 *   - agentId (required) - the ID of the agent to hire
 *   - task (required) - description of the task to perform
 *   - maxBudget (optional) - maximum USDT budget for the task
 */
export async function POST(request: NextRequest) {
  const xPayment = request.headers.get("x-payment");

  // No payment header: return 402 with payment requirements
  if (!xPayment) {
    return NextResponse.json(
      {
        error: "X-PAYMENT header is required",
        accepts: [
          {
            scheme: "gokite-aa",
            network: "adi-testnet",
            maxAmountRequired: "5000000000000000000", // 5 USDT
            resource: `${request.url}`,
            description: "AgentMarket - Hire an AI Agent on ADI Chain",
            mimeType: "application/json",
            outputSchema: {
              input: {
                discoverable: true,
                method: "POST",
                body: {
                  agentId: {
                    description: "The ID of the agent to hire (e.g. adi-agent-0 or numeric)",
                    required: true,
                    type: "string",
                  },
                  task: {
                    description: "Description of the task to perform",
                    required: true,
                    type: "string",
                  },
                  maxBudget: {
                    description: "Maximum USDT budget for the task",
                    required: false,
                    type: "string",
                  },
                },
                type: "http",
              },
              output: {
                properties: {
                  taskId: {
                    description: "Unique task identifier",
                    type: "string",
                  },
                  agentId: { description: "Hired agent ID", type: "string" },
                  status: { description: "Task status", type: "string" },
                  agent: {
                    description: "On-chain agent data",
                    type: "object",
                  },
                },
                required: ["taskId", "agentId", "status"],
                type: "object",
              },
            },
            payTo: SERVICE_WALLET,
            maxTimeoutSeconds: 300,
            asset: KITE_TEST_USDT,
            extra: null,
            merchantName: "AgentMarket",
          },
        ],
        x402Version: 1,
      },
      {
        status: 402,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT",
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

  // Parse the agent ID to a numeric registry index
  const registryId = parseAgentId(agentId);
  if (registryId === null) {
    return NextResponse.json(
      { error: `Invalid agent ID format: ${agentId}. Use adi-agent-N or a numeric ID.` },
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

  // Build the confirmed agent response
  const agentResponse = {
    registryId,
    owner: agentData.owner,
    metadataURI: agentData.metadataURI,
    pricePerTask: agentData.pricePerTask.toString(),
    pricePerTaskFormatted: `${priceEth} ADI`,
    isActive: agentData.isActive,
    totalTasksCompleted: Number(agentData.totalTasksCompleted),
    averageRating: Math.round(avgRating * 10) / 10,
    ratingCount: Number(agentData.ratingCount),
    createdAt: new Date(Number(agentData.createdAt) * 1000).toISOString(),
  };

  // Verify payment via Pieverse facilitator
  try {
    const decoded = JSON.parse(Buffer.from(xPayment, "base64").toString());
    const { authorization, signature } = decoded;

    // Step 1: Verify payment
    const verifyResponse = await fetch(`${FACILITATOR_URL}/v2/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorization,
        signature,
        network: "adi-testnet",
      }),
    });

    if (!verifyResponse.ok) {
      throw new Error("Payment verification failed - falling through to demo mode");
    }

    // Step 2: Settle payment
    const settleResponse = await fetch(`${FACILITATOR_URL}/v2/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorization,
        signature,
        network: "adi-testnet",
      }),
    });

    if (!settleResponse.ok) {
      throw new Error("Payment settlement failed - falling through to demo mode");
    }

    // Payment verified - confirm hire with real agent data
    const taskId = generateTaskId();

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
          note: "Actual payment settlement via pay_agent MCP tool",
        },
        payment: {
          settled: true,
          network: "adi-testnet",
          chainId: 99999,
          amount: agentData.pricePerTask.toString(),
          asset: KITE_TEST_USDT,
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "X-PAYMENT-RESPONSE": Buffer.from(
            JSON.stringify({
              settled: true,
              network: "adi-testnet",
              taskId,
              timestamp: Date.now(),
            })
          ).toString("base64"),
        },
      }
    );
  } catch {
    // Hackathon demo mode: payment failed but agent data is real from on-chain
    const taskId = generateTaskId();

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
          note: "Demo mode - payment verification skipped. Use pay_agent MCP tool for real payment.",
        },
        payment: {
          settled: false,
          demo: true,
          note: "Demo mode - payment verification skipped, but agent data is real from on-chain registry",
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
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
      "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT",
    },
  });
}
