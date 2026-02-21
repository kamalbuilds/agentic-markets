import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, defineChain, formatEther } from "viem";

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

/**
 * Parse an agent ID string and extract the numeric registry ID.
 * Accepts formats like "kite-agent-3", "3", "kite-agent-003", etc.
 */
function parseAgentId(agentId: string): number | null {
  const adiMatch = agentId.match(/^kite-agent-(\d+)$/);
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

  const ratingCount = Number(agent.ratingCount);

  // Reliability: based on rating count (more ratings = more reliable, caps at 10 ratings = 100%)
  const reliability = ratingCount > 0
    ? Math.min(ratingCount / 10, 1.0) * 80 + (avgRating / 5) * 20
    : 0;

  // Quality: derived from average rating (0-5 scale mapped to 0-100)
  const quality = ratingCount > 0 ? (avgRating / 5) * 100 : 0;

  // Speed: based on rating quality (higher rated agents respond faster)
  const speed = ratingCount > 0 ? 70 + (avgRating / 5) * 30 : 0;

  // Value: cheaper = better value relative to quality
  const value = ratingCount > 0
    ? Math.min(quality / (priceInEth > 0 ? priceInEth * 5 : 1), 100)
    : 0;

  const overallScore =
    ratingCount > 0 ? Math.round(avgRating * 10) / 10 : 0;

  // Success rate: derived from rating (4+ rating = 90%+ success)
  const successRate = ratingCount > 0
    ? Math.round(Math.min((avgRating / 5) * 100, 99))
    : 0;

  return {
    score: overallScore,
    averageRating: Math.round(avgRating * 100) / 100,
    totalTransactions: Math.max(totalTasks, ratingCount),
    ratingCount,
    dimensions: {
      reliability: Math.round(reliability * 10) / 10,
      quality: Math.round(quality * 10) / 10,
      speed: Math.round(speed * 10) / 10,
      value: Math.round(Math.min(value, 100) * 10) / 10,
    },
    successRate,
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
        { error: `Invalid agent ID format: ${agentId}. Use kite-agent-N or a numeric ID.` },
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
    const singleKiteDID = `did:kite:${agentData.owner.slice(0, 6)}${agentData.owner.slice(-4)}:agent-${registryId}`;

    return NextResponse.json(
      {
        agentId,
        registryId,
        owner: agentData.owner,
        metadataURI: agentData.metadataURI,
        isActive: agentData.isActive,
        pricePerTask: agentData.pricePerTask.toString(),
        pricePerTaskFormatted: `${formatEther(agentData.pricePerTask)} ADI`,
        did: singleKiteDID,
        identityTier: "Agent",
        reputation,
        createdAt: new Date(Number(agentData.createdAt) * 1000).toISOString(),
        network: "kite-testnet",
        chainId: 2368,
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

  for (let i = 1; i < totalAgents; i++) {
    try {
      const agentData = await client.readContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: "getAgent",
        args: [BigInt(i)],
      });

      const reputation = computeReputation(agentData);

      // Parse metadataURI for agent name
      let agentName: string | undefined;
      try {
        const meta = JSON.parse(agentData.metadataURI);
        agentName = meta.name;
      } catch {
        // Not JSON
      }

      const kitePassportDID = `did:kite:${agentData.owner.slice(0, 6)}${agentData.owner.slice(-4)}:agent-${i}`;

      allReputations.push({
        agentId: `kite-agent-${i}`,
        registryId: i,
        name: agentName,
        owner: agentData.owner,
        metadataURI: agentData.metadataURI,
        isActive: agentData.isActive,
        did: kitePassportDID,
        identityTier: "Agent" as const,
        standingIntentActive: agentData.isActive && (reputation.totalTransactions > 0 || reputation.ratingCount > 0),
        score: reputation.score,
        totalTransactions: reputation.totalTransactions,
        ratingCount: reputation.ratingCount,
        successRate: reputation.successRate,
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
      network: "kite-testnet",
      chainId: 2368,
      registry: REGISTRY_ADDRESS,
      identitySystem: "Kite Passport (BIP-32 Derived)",
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
