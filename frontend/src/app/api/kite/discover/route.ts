import { NextRequest, NextResponse } from "next/server";

// Kite AI x402 Constants
const SERVICE_WALLET = process.env.KITE_SERVICE_WALLET ?? "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
const KITE_TEST_USDT = "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63";
const FACILITATOR_URL = "https://facilitator.pieverse.io";

// Mock agent registry for discovery
const KITE_AGENTS = [
  {
    id: "kite-agent-001",
    name: "DataOracle",
    category: "Analytics",
    description: "Real-time on-chain data analysis and market intelligence across Kite AI ecosystem",
    capabilities: ["market-analysis", "on-chain-data", "portfolio-tracking"],
    pricePerTask: "1000000000000000000", // 1 USDT
    reputation: 4.8,
    totalTasks: 1247,
    did: "did:kite:dataoracle.eth/analytics/v1",
    status: "active",
  },
  {
    id: "kite-agent-002",
    name: "ContractAuditor",
    category: "Security",
    description: "AI-powered smart contract auditing and vulnerability detection on Kite AI",
    capabilities: ["audit", "vulnerability-scan", "gas-optimization"],
    pricePerTask: "5000000000000000000", // 5 USDT
    reputation: 4.9,
    totalTasks: 342,
    did: "did:kite:auditor.eth/security/v2",
    status: "active",
  },
  {
    id: "kite-agent-003",
    name: "ContentForge",
    category: "Content",
    description: "Autonomous content generation and social media management for Web3 projects",
    capabilities: ["content-generation", "social-media", "copywriting"],
    pricePerTask: "2000000000000000000", // 2 USDT
    reputation: 4.5,
    totalTasks: 891,
    did: "did:kite:contentforge.eth/content/v1",
    status: "active",
  },
  {
    id: "kite-agent-004",
    name: "DeFiNavigator",
    category: "DeFi",
    description: "Yield optimization and DeFi strategy agent operating on Kite AI chain",
    capabilities: ["yield-farming", "liquidity-provision", "swap-routing"],
    pricePerTask: "3000000000000000000", // 3 USDT
    reputation: 4.7,
    totalTasks: 564,
    did: "did:kite:definavigator.eth/defi/v1",
    status: "active",
  },
  {
    id: "kite-agent-005",
    name: "NFTCurator",
    category: "NFT",
    description: "NFT valuation, curation, and marketplace intelligence on Kite ecosystem",
    capabilities: ["nft-valuation", "collection-analysis", "rarity-scoring"],
    pricePerTask: "1500000000000000000", // 1.5 USDT
    reputation: 4.3,
    totalTasks: 723,
    did: "did:kite:nftcurator.eth/nft/v1",
    status: "active",
  },
];

/**
 * GET /api/kite/discover
 *
 * x402-compatible agent discovery endpoint using Kite's gokite-aa scheme.
 * Returns 402 with payment requirements if no X-PAYMENT header is provided.
 * Returns available agents if payment is verified.
 *
 * Query params:
 *   - category (optional) - filter agents by category
 */
export async function GET(request: NextRequest) {
  const xPayment = request.headers.get("x-payment");
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  // No payment header: return 402 with payment requirements
  if (!xPayment) {
    return NextResponse.json(
      {
        error: "X-PAYMENT header is required",
        accepts: [
          {
            scheme: "gokite-aa",
            network: "kite-testnet",
            maxAmountRequired: "1000000000000000000", // 1 USDT
            resource: `${request.url}`,
            description: "AgentMarket - AI Agent Discovery Service on Kite AI",
            mimeType: "application/json",
            outputSchema: {
              input: {
                discoverable: true,
                method: "GET",
                queryParams: {
                  category: {
                    description: "Filter agents by category (Analytics, Security, Content, DeFi, NFT)",
                    required: false,
                    type: "string",
                  },
                },
                type: "http",
              },
              output: {
                properties: {
                  agents: { description: "List of available agents", type: "array" },
                  count: { description: "Total agent count", type: "number" },
                },
                required: ["agents", "count"],
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
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT",
        },
      }
    );
  }

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
        network: "kite-testnet",
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
        network: "kite-testnet",
      }),
    });

    if (!settleResponse.ok) {
      throw new Error("Payment settlement failed - falling through to demo mode");
    }

    // Payment successful - return agents
    let agents = KITE_AGENTS;
    if (category) {
      agents = agents.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    }

    return NextResponse.json(
      {
        agents,
        count: agents.length,
        network: "kite-testnet",
        chainId: 2368,
        paymentSettled: true,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "X-PAYMENT-RESPONSE": Buffer.from(
            JSON.stringify({
              settled: true,
              network: "kite-testnet",
              timestamp: Date.now(),
            })
          ).toString("base64"),
        },
      }
    );
  } catch (error) {
    // For demo purposes, allow access without actual payment verification
    // This allows the frontend to show data while demonstrating the x402 flow
    let agents = KITE_AGENTS;
    if (category) {
      agents = agents.filter(
        (a) => a.category.toLowerCase() === category.toLowerCase()
      );
    }

    return NextResponse.json(
      {
        agents,
        count: agents.length,
        network: "kite-testnet",
        chainId: 2368,
        paymentSettled: false,
        demo: true,
        note: "Demo mode - payment verification skipped",
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT",
    },
  });
}
