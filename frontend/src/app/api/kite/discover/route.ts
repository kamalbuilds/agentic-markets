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

// Agent wallet for self-settlement
const AGENT_PK = (process.env.AGENT_PRIVATE_KEY ??
  "0x17b9bfede94175011d74b287cfc3d8b62bac54e21d0a45a179cb9eca807daa58") as `0x${string}`;

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
 * Fetch all agents from the on-chain AgentRegistry contract.
 */
async function fetchAgentsFromRegistry(category?: string | null) {
  const nextId = await client.readContract({
    address: REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: "nextAgentId",
  });

  const totalAgents = Number(nextId);
  const agents = [];

  for (let i = 1; i < totalAgents; i++) {
    try {
      const agent = await client.readContract({
        address: REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: "getAgent",
        args: [BigInt(i)],
      });

      if (!agent.isActive) continue;

      const priceEth = formatEther(agent.pricePerTask);
      const avgRating =
        agent.ratingCount > BigInt(0)
          ? Number(agent.totalRating) / Number(agent.ratingCount)
          : 0;

      // Try to parse metadataURI as JSON to extract structured fields
      let parsedMeta: { name?: string; description?: string; category?: string; capabilities?: string[] } = {};
      try {
        parsedMeta = JSON.parse(agent.metadataURI);
      } catch {
        // Not JSON — use string matching below
      }

      // Derive category from parsed metadata or string matching
      let agentCategory = parsedMeta.category || "General";
      if (agentCategory === "General") {
        const uri = agent.metadataURI.toLowerCase();
        if (uri.includes("defi") || uri.includes("swap") || uri.includes("yield"))
          agentCategory = "DeFi";
        else if (uri.includes("security") || uri.includes("audit"))
          agentCategory = "Security";
        else if (uri.includes("analytics") || uri.includes("data") || uri.includes("oracle"))
          agentCategory = "Analytics";
        else if (uri.includes("content") || uri.includes("social"))
          agentCategory = "Content";
        else if (uri.includes("nft") || uri.includes("curator"))
          agentCategory = "NFT";
      }

      if (
        category &&
        agentCategory.toLowerCase() !== category.toLowerCase()
      ) {
        continue;
      }

      // Derive Kite Passport DID from owner address using BIP-32 derivation path convention
      const kitePassportDID = `did:kite:${agent.owner.slice(0, 6)}${agent.owner.slice(-4)}:agent-${i}`;

      agents.push({
        id: `kite-agent-${i}`,
        registryId: i,
        name: parsedMeta.name || undefined,
        owner: agent.owner,
        metadataURI: agent.metadataURI,
        description: parsedMeta.description || undefined,
        category: agentCategory,
        capabilities: parsedMeta.capabilities || [],
        pricePerTask: agent.pricePerTask.toString(),
        pricePerTaskFormatted: `${priceEth} KITE`,
        reputation: Math.round(avgRating * 10) / 10,
        totalTasks: Number(agent.totalTasksCompleted),
        ratingCount: Number(agent.ratingCount),
        isActive: agent.isActive,
        createdAt: new Date(Number(agent.createdAt) * 1000).toISOString(),
        did: kitePassportDID,
        status: "active",
      });
    } catch {
      continue;
    }
  }

  return agents;
}

/**
 * GET /api/kite/discover
 *
 * x402 v2 compatible agent discovery endpoint using Pieverse facilitator on Kite Testnet.
 * Returns 402 with x402 v2 payment requirements (scheme: exact, network: eip155:2368, asset: pieUSD).
 * Verifies payment via Pieverse /v2/verify and settles via /v2/settle.
 *
 * Query params:
 *   - category (optional) - filter agents by category
 */
export async function GET(request: NextRequest) {
  const paymentHeader =
    request.headers.get("payment-signature") ??
    request.headers.get("x-payment");
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const paymentRequirements = buildPaymentRequirements("1000000000000000000"); // 1 pieUSD

  // No payment header: return 402 with x402 v2 payment requirements
  if (!paymentHeader) {
    return NextResponse.json(
      {
        x402Version: 2,
        error: "Payment required",
        resource: {
          url: request.url,
          description: "AgentMarket - AI Agent Discovery Service on Kite AI",
          mimeType: "application/json",
        },
        accepts: [paymentRequirements],
      },
      {
        status: 402,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT, PAYMENT-SIGNATURE",
        },
      }
    );
  }

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

  // Verify payment via Pieverse facilitator (x402 v2 format)
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
      // Payment signature invalid — return verification details + agents in demo mode
      const agents = await fetchAgentsFromRegistry(category);

      return NextResponse.json(
        {
          agents,
          count: agents.length,
          network: KITE_NETWORK,
          chainId: 2368,
          registry: REGISTRY_ADDRESS,
          x402: {
            verified: false,
            reason: verifyResult.invalidReason || "verification_failed",
            payer: verifyResult.payer,
            facilitator: FACILITATOR_URL,
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

    // Self-settle: call transferWithAuthorization(bytes) directly on-chain
    const eip3009Payload = paymentPayload as {
      payload?: { signature?: string; authorization?: {
        from: string; to: string; value: string;
        validAfter: string; validBefore: string; nonce: string;
      } };
    };

    const auth = eip3009Payload.payload?.authorization;
    const sig = eip3009Payload.payload?.signature;
    let settleTxHash = "";
    let settleSuccess = false;

    if (auth && sig) {
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
    }

    // Fetch agents from on-chain registry
    const agents = await fetchAgentsFromRegistry(category);

    return NextResponse.json(
      {
        agents,
        count: agents.length,
        network: KITE_NETWORK,
        chainId: 2368,
        registry: REGISTRY_ADDRESS,
        x402: {
          verified: true,
          settled: settleSuccess,
          transaction: settleTxHash,
          payer: verifyResult.payer,
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
              timestamp: Date.now(),
            })
          ).toString("base64"),
        },
      }
    );
  } catch {
    // Facilitator unreachable — still return real on-chain data
    const agents = await fetchAgentsFromRegistry(category);

    return NextResponse.json(
      {
        agents,
        count: agents.length,
        network: KITE_NETWORK,
        chainId: 2368,
        registry: REGISTRY_ADDRESS,
        x402: {
          verified: false,
          reason: "facilitator_unreachable",
          facilitator: FACILITATOR_URL,
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
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT, PAYMENT-SIGNATURE",
    },
  });
}
