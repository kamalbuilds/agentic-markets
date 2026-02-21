import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, defineChain, formatEther } from "viem";

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

/**
 * Parse an agent ID string and extract the numeric registry ID.
 * Accepts formats like "adi-agent-3", "3", "kite-agent-003", etc.
 */
function parseAgentId(agentId: string): number | null {
  const adiMatch = agentId.match(/^adi-agent-(\d+)$/);
  if (adiMatch) return parseInt(adiMatch[1], 10);

  const kiteMatch = agentId.match(/^kite-agent-(\d+)$/);
  if (kiteMatch) return parseInt(kiteMatch[1], 10);

  const num = parseInt(agentId, 10);
  if (!isNaN(num) && num >= 0) return num;

  return null;
}

/**
 * Compute reputation dimensions from on-chain agent data.
 */
function computeReputation(agent: {
  pricePerTask: bigint;
  totalTasksCompleted: bigint;
  totalRating: bigint;
  ratingCount: bigint;
}) {
  const totalTasks = Number(agent.totalTasksCompleted);
  const avgRating =
    agent.ratingCount > BigInt(0)
      ? Number(agent.totalRating) / Number(agent.ratingCount)
      : 0;
  const priceInEth = parseFloat(formatEther(agent.pricePerTask));

  // Reliability: based on total tasks completed (caps at 50 tasks = 100%)
  const reliability = Math.min(totalTasks / 50, 1.0) * 100;

  // Quality: derived from average rating (0-5 scale mapped to 0-100)
  const quality = (avgRating / 5) * 100;

  // Speed: estimated from rating (base 75 + up to 25 bonus from rating)
  const speed = 75 + (avgRating / 5) * 25;

  // Value: cheaper = better value. If priceInEth > 0, value = min(1 / price * 10, 1.0) * 100
  const value =
    priceInEth > 0
      ? Math.min((1 / priceInEth) * 10, 1.0) * 100
      : 100; // Free agents get perfect value score

  const overallScore =
    agent.ratingCount > BigInt(0) ? Math.round(avgRating * 10) / 10 : 0;

  return {
    score: overallScore,
    averageRating: Math.round(avgRating * 100) / 100,
    totalTransactions: totalTasks,
    ratingCount: Number(agent.ratingCount),
    dimensions: {
      reliability: Math.round(reliability * 10) / 10,
      quality: Math.round(quality * 10) / 10,
      speed: Math.round(speed * 10) / 10,
      value: Math.round(value * 10) / 10,
    },
    successRate: totalTasks > 0 ? Math.round((reliability / 100) * 99 + 1) : 0,
  };
}

/**
 * GET /api/kite/reputation?agentId=X
 *
 * Returns agent reputation data derived from on-chain AgentRegistry data on ADI Testnet.
 * Reputation dimensions are computed from real contract state.
 *
 * Query params:
 *   - agentId (optional) - specific agent ID. If omitted, returns all agents.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");

  if (agentId) {
    // Single agent reputation lookup
    const registryId = parseAgentId(agentId);
    if (registryId === null) {
      return NextResponse.json(
        { error: `Invalid agent ID format: ${agentId}. Use adi-agent-N or a numeric ID.` },
        { status: 400 }
      );
    }

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
        { error: `Agent not found on-chain: ${agentId} (registry ID ${registryId})` },
        { status: 404 }
      );
    }

    const reputation = computeReputation(agentData);

    return NextResponse.json(
      {
        agentId,
        registryId,
        owner: agentData.owner,
        metadataURI: agentData.metadataURI,
        isActive: agentData.isActive,
        pricePerTask: agentData.pricePerTask.toString(),
        pricePerTaskFormatted: `${formatEther(agentData.pricePerTask)} ADI`,
        did: `did:adi:registry/${REGISTRY_ADDRESS}/agent/${registryId}`,
        identityTier: "Agent",
        reputation,
        createdAt: new Date(Number(agentData.createdAt) * 1000).toISOString(),
        network: "adi-testnet",
        chainId: 99999,
        registry: REGISTRY_ADDRESS,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }

  // Return all agents' reputation data
  let totalAgents: number;
  try {
    const nextId = await client.readContract({
      address: REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: "nextAgentId",
    });
    totalAgents = Number(nextId);
  } catch {
    return NextResponse.json(
      { error: "Failed to read agent count from on-chain registry" },
      { status: 502 }
    );
  }

  const allReputations = [];

  for (let i = 0; i < totalAgents; i++) {
    try {
      const agentData = await client.readContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: "getAgent",
        args: [BigInt(i)],
      });

      const reputation = computeReputation(agentData);

      allReputations.push({
        agentId: `adi-agent-${i}`,
        registryId: i,
        owner: agentData.owner,
        metadataURI: agentData.metadataURI,
        isActive: agentData.isActive,
        did: `did:adi:registry/${REGISTRY_ADDRESS}/agent/${i}`,
        identityTier: "Agent" as const,
        score: reputation.score,
        totalTransactions: reputation.totalTransactions,
        ratingCount: reputation.ratingCount,
        dimensions: reputation.dimensions,
      });
    } catch {
      // Agent at this index may not exist; skip
      continue;
    }
  }

  return NextResponse.json(
    {
      agents: allReputations,
      count: allReputations.length,
      network: "adi-testnet",
      chainId: 99999,
      registry: REGISTRY_ADDRESS,
      identitySystem: "ADI On-Chain Agent Registry",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

/**
 * OPTIONS handler for CORS preflight.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
