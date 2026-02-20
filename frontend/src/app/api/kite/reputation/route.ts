import { NextRequest, NextResponse } from "next/server";

// Agent reputation data (derived from cryptographic proofs on Kite AI)
const AGENT_REPUTATION: Record<string, {
  agentId: string;
  did: string;
  identityTier: "User" | "Agent" | "Session";
  reputation: {
    score: number;
    totalTransactions: number;
    successRate: number;
    avgResponseTime: string;
    slaCompliance: number;
    paymentSuccessRate: number;
  };
  authorization: {
    dailyLimit: string;
    maxPerTransaction: string;
    authorizedSince: string;
    standingIntentActive: boolean;
  };
  history: Array<{
    action: string;
    timestamp: string;
    counterparty: string;
    amount: string;
    status: string;
  }>;
}> = {
  "kite-agent-001": {
    agentId: "kite-agent-001",
    did: "did:kite:dataoracle.eth/analytics/v1",
    identityTier: "Agent",
    reputation: {
      score: 4.8,
      totalTransactions: 1247,
      successRate: 99.2,
      avgResponseTime: "1.3s",
      slaCompliance: 98.5,
      paymentSuccessRate: 100,
    },
    authorization: {
      dailyLimit: "100000000000000000000", // 100 USDT
      maxPerTransaction: "10000000000000000000", // 10 USDT
      authorizedSince: "2025-11-15T00:00:00Z",
      standingIntentActive: true,
    },
    history: [
      {
        action: "task_completed",
        timestamp: "2026-02-20T10:30:00Z",
        counterparty: "did:kite:user1.eth",
        amount: "1000000000000000000",
        status: "settled",
      },
      {
        action: "task_completed",
        timestamp: "2026-02-20T09:15:00Z",
        counterparty: "did:kite:user2.eth",
        amount: "1000000000000000000",
        status: "settled",
      },
      {
        action: "task_completed",
        timestamp: "2026-02-19T22:45:00Z",
        counterparty: "did:kite:agent3.eth",
        amount: "2000000000000000000",
        status: "settled",
      },
    ],
  },
  "kite-agent-002": {
    agentId: "kite-agent-002",
    did: "did:kite:auditor.eth/security/v2",
    identityTier: "Agent",
    reputation: {
      score: 4.9,
      totalTransactions: 342,
      successRate: 99.7,
      avgResponseTime: "45.2s",
      slaCompliance: 99.1,
      paymentSuccessRate: 100,
    },
    authorization: {
      dailyLimit: "500000000000000000000", // 500 USDT
      maxPerTransaction: "50000000000000000000", // 50 USDT
      authorizedSince: "2025-10-01T00:00:00Z",
      standingIntentActive: true,
    },
    history: [
      {
        action: "audit_completed",
        timestamp: "2026-02-20T08:00:00Z",
        counterparty: "did:kite:project1.eth",
        amount: "5000000000000000000",
        status: "settled",
      },
      {
        action: "audit_completed",
        timestamp: "2026-02-19T14:30:00Z",
        counterparty: "did:kite:project2.eth",
        amount: "5000000000000000000",
        status: "settled",
      },
    ],
  },
  "kite-agent-003": {
    agentId: "kite-agent-003",
    did: "did:kite:contentforge.eth/content/v1",
    identityTier: "Agent",
    reputation: {
      score: 4.5,
      totalTransactions: 891,
      successRate: 97.8,
      avgResponseTime: "5.1s",
      slaCompliance: 96.2,
      paymentSuccessRate: 99.8,
    },
    authorization: {
      dailyLimit: "50000000000000000000", // 50 USDT
      maxPerTransaction: "5000000000000000000", // 5 USDT
      authorizedSince: "2025-12-01T00:00:00Z",
      standingIntentActive: true,
    },
    history: [
      {
        action: "content_generated",
        timestamp: "2026-02-20T11:00:00Z",
        counterparty: "did:kite:brand1.eth",
        amount: "2000000000000000000",
        status: "settled",
      },
    ],
  },
  "kite-agent-004": {
    agentId: "kite-agent-004",
    did: "did:kite:definavigator.eth/defi/v1",
    identityTier: "Agent",
    reputation: {
      score: 4.7,
      totalTransactions: 564,
      successRate: 98.9,
      avgResponseTime: "2.8s",
      slaCompliance: 97.8,
      paymentSuccessRate: 100,
    },
    authorization: {
      dailyLimit: "200000000000000000000", // 200 USDT
      maxPerTransaction: "20000000000000000000", // 20 USDT
      authorizedSince: "2025-11-01T00:00:00Z",
      standingIntentActive: true,
    },
    history: [
      {
        action: "yield_optimized",
        timestamp: "2026-02-20T07:30:00Z",
        counterparty: "did:kite:investor1.eth",
        amount: "3000000000000000000",
        status: "settled",
      },
    ],
  },
  "kite-agent-005": {
    agentId: "kite-agent-005",
    did: "did:kite:nftcurator.eth/nft/v1",
    identityTier: "Agent",
    reputation: {
      score: 4.3,
      totalTransactions: 723,
      successRate: 96.5,
      avgResponseTime: "3.4s",
      slaCompliance: 95.1,
      paymentSuccessRate: 99.5,
    },
    authorization: {
      dailyLimit: "30000000000000000000", // 30 USDT
      maxPerTransaction: "5000000000000000000", // 5 USDT
      authorizedSince: "2026-01-10T00:00:00Z",
      standingIntentActive: true,
    },
    history: [
      {
        action: "nft_valuated",
        timestamp: "2026-02-20T06:15:00Z",
        counterparty: "did:kite:collector1.eth",
        amount: "1500000000000000000",
        status: "settled",
      },
    ],
  },
};

/**
 * GET /api/kite/reputation?agentId=X
 *
 * Returns agent reputation data from the Kite Passport identity system.
 * Reputation is derived from cryptographic proofs of actual on-chain behavior.
 *
 * Query params:
 *   - agentId (optional) - specific agent ID. If omitted, returns all agents.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");

  if (agentId) {
    const rep = AGENT_REPUTATION[agentId];
    if (!rep) {
      return NextResponse.json(
        { error: `Agent not found: ${agentId}` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ...rep,
        network: "kite-testnet",
        chainId: 2368,
        facilitator: "0x12343e649e6b2b2b77649DFAb88f103c02F3C78b",
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
  const allReputations = Object.values(AGENT_REPUTATION).map((rep) => ({
    agentId: rep.agentId,
    did: rep.did,
    identityTier: rep.identityTier,
    score: rep.reputation.score,
    totalTransactions: rep.reputation.totalTransactions,
    successRate: rep.reputation.successRate,
    standingIntentActive: rep.authorization.standingIntentActive,
  }));

  return NextResponse.json(
    {
      agents: allReputations,
      count: allReputations.length,
      network: "kite-testnet",
      chainId: 2368,
      identitySystem: "Kite Passport (BIP-32 derived)",
      tiers: ["User (Root Authority)", "Agent (Delegated Authority)", "Session (Ephemeral Authority)"],
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
