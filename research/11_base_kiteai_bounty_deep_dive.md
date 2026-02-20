# Deep Dive: Base ($10K) & Kite AI ($10K) Bounties for AgentMarket
# Research Date: 2026-02-20 | ETHDenver 2026 BUIDLathon

---

## TABLE OF CONTENTS

1. [Base Self-Sustaining Autonomous Agents ($10,000)](#1-base-self-sustaining-autonomous-agents-10000)
   - 1.1 Bounty Requirements Analysis
   - 1.2 x402 Payment Protocol Deep Dive
   - 1.3 ERC-8021 Builder Codes Deep Dive
   - 1.4 Self-Sustaining Agent Economics
   - 1.5 Integration Strategy for AgentMarket
   - 1.6 Public Stats Dashboard Requirements
2. [Kite AI Agent-Native Payments ($10,000)](#2-kite-ai-agent-native-payments-10000)
   - 2.1 Bounty Requirements Analysis
   - 2.2 x402 on Kite AI
   - 2.3 Agent Identity (Kite Passport) Deep Dive
   - 2.4 Service Provider Integration (x402 on Kite)
   - 2.5 Integration Strategy for AgentMarket
3. [Combined Architecture](#3-combined-architecture-agentmarket--base--kite)
4. [Implementation Roadmap](#4-implementation-roadmap)
5. [Sources](#5-sources)

---

## 1. BASE SELF-SUSTAINING AUTONOMOUS AGENTS ($10,000)

### 1.1 Bounty Requirements Analysis

**Track Name**: "Base Self-Sustaining Autonomous Agents"
**Prize**: $10,000 (1 winner)
**Platform**: ETHDenver 2026 Devfolio

**Core Requirements**:
- Agent must transact on **Base MAINNET** (Chain ID: 8453, CAIP-2: `eip155:8453`) -- NOT testnet
- Agent must be **self-sustaining**: it earns enough revenue to pay for its own compute costs
- Must integrate **ERC-8021 builder codes** (register at base.dev)
- Must be **autonomous** with minimal human intervention
- Must have a **public URL** showing compute cost vs wallet balance stats in real time

**Key Insight**: This bounty is fundamentally about proving an economic loop -- the agent provides a service, earns USDC, and uses those earnings to pay for its own infrastructure. The x402 protocol is the mechanism that makes this possible.

---

### 1.2 x402 Payment Protocol Deep Dive

#### What is x402?

x402 is an open, internet-native payment protocol built by Coinbase that revives the HTTP 402 "Payment Required" status code. It enables instant, automatic stablecoin (USDC) payments directly over HTTP, allowing AI agents to pay for services without accounts, API keys, or subscriptions.

**Protocol Version**: V2 (current)
**Primary Network**: Base (EVM), also supports Solana
**Settlement Token**: USDC
**Official Site**: https://www.x402.org/
**GitHub**: https://github.com/coinbase/x402
**Coinbase Docs**: https://docs.cdp.coinbase.com/x402/welcome

#### How x402 Works (Payment Flow)

```
1. Client (Agent) --> GET /api/resource --> Server
2. Server --> 402 Payment Required + PAYMENT-REQUIRED header --> Client
3. Client parses PaymentRequirements, signs payment with wallet
4. Client --> GET /api/resource + PAYMENT-SIGNATURE header --> Server
5. Server --> POST /verify to Facilitator --> Verification
6. Server --> POST /settle to Facilitator --> On-chain settlement
7. Server --> 200 OK + resource data + PAYMENT-RESPONSE header --> Client
```

#### HTTP Headers (V2)

| Header | Direction | Purpose |
|--------|-----------|---------|
| `PAYMENT-REQUIRED` | Server -> Client | Base64-encoded JSON with payment requirements |
| `PAYMENT-SIGNATURE` | Client -> Server | Base64-encoded signed payment payload |
| `PAYMENT-RESPONSE` | Server -> Client | Settlement confirmation |

**V1 headers** (still used by some implementations): `X-PAYMENT` and `X-PAYMENT-RESPONSE`

#### Payment Requirements Format

```json
{
  "accepts": [
    {
      "scheme": "exact",
      "price": "$0.001",
      "network": "eip155:8453",
      "payTo": "0xSellerWalletAddress",
      "asset": "USDC"
    }
  ],
  "description": "Weather data API",
  "mimeType": "application/json",
  "x402Version": 2
}
```

#### Network Identifiers (CAIP-2 Format)

| Network | CAIP-2 ID |
|---------|-----------|
| Base Mainnet | `eip155:8453` |
| Base Sepolia (testnet) | `eip155:84532` |
| Solana Mainnet | `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp` |
| Solana Devnet | `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` |

#### Facilitator Infrastructure

The **Facilitator** is a service that handles payment verification and on-chain settlement so sellers don't need blockchain infrastructure:

- **Coinbase CDP Facilitator** (production): `https://api.cdp.coinbase.com/platform/v2/x402`
  - Free tier: 1,000 transactions/month
  - Then $0.001/transaction
  - Requires CDP API keys from https://cdp.coinbase.com
- **Public Testnet Facilitator**: `https://www.x402.org/facilitator`

**Facilitator Endpoints**:
- `POST /verify` -- Validates payment payload authenticity
- `POST /settle` -- Executes blockchain transaction and confirms settlement

#### TypeScript SDK Packages

**Server (Seller) Packages**:
```bash
npm install @x402/express @x402/evm @x402/core
# Or for other frameworks:
npm install @x402/next @x402/evm @x402/core     # Next.js
npm install @x402/hono @x402/evm @x402/core     # Hono
```

**Client (Buyer) Packages**:
```bash
npm install @x402/fetch @x402/evm               # Fetch-based
npm install @x402/axios @x402/evm               # Axios-based
```

**Python**:
```bash
pip install "x402[fastapi]"   # Server
pip install "x402[httpx]"     # Async client
pip install "x402[requests]"  # Sync client
```

#### Server Implementation (Express.js -- Agent Selling Services)

```typescript
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const app = express();
const payTo = "0xAgentWalletAddress"; // Agent's wallet that receives USDC

// Production: Use CDP facilitator
const facilitatorClient = new HTTPFacilitatorClient({
  url: "https://api.cdp.coinbase.com/platform/v2/x402"
});

// Create resource server with Base Mainnet support
const server = new x402ResourceServer(facilitatorClient)
  .register("eip155:8453", new ExactEvmScheme()); // Base Mainnet

// Apply payment middleware -- define paid endpoints
app.use(
  paymentMiddleware(
    {
      "GET /api/analyze": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.01",           // Price per request
            network: "eip155:8453",   // Base Mainnet
            payTo,
          },
        ],
        description: "AI-powered data analysis",
        mimeType: "application/json",
      },
      "POST /api/generate": {
        accepts: [
          {
            scheme: "exact",
            price: "$0.05",
            network: "eip155:8453",
            payTo,
          },
        ],
        description: "AI content generation",
        mimeType: "application/json",
      },
    },
    server,
  ),
);

// Protected endpoints -- only accessible after payment
app.get("/api/analyze", (req, res) => {
  // Agent performs AI analysis task
  res.json({ result: "analysis output", confidence: 0.95 });
});

app.post("/api/generate", (req, res) => {
  // Agent performs content generation
  res.json({ content: "generated content", tokens: 150 });
});

app.listen(4021, () => console.log("Agent service running on port 4021"));
```

#### Client Implementation (Agent Buying Services)

```typescript
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

// Agent's wallet for paying for services
const signer = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`);

const client = new x402Client();
registerExactEvmScheme(client, { signer });

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Agent autonomously pays for another service
const response = await fetchWithPayment("https://other-agent.example.com/api/data");
const data = await response.json();
// Payment was handled automatically -- USDC transferred on Base Mainnet
```

#### CDP Server Wallet (Recommended for Autonomous Agents)

```typescript
import { CdpClient } from "@coinbase/cdp-sdk";
import { toAccount } from "viem/accounts";

// CDP manages the wallet -- more secure than raw private keys
const cdp = new CdpClient();
const cdpAccount = await cdp.evm.createAccount();
const signer = toAccount(cdpAccount);
```

Environment variables needed:
```bash
CDP_API_KEY_ID=your-api-key-id
CDP_API_KEY_SECRET=your-api-key-secret
CDP_WALLET_SECRET=your-wallet-secret
```

---

### 1.3 ERC-8021 Builder Codes Deep Dive

#### What is ERC-8021?

ERC-8021 is an Ethereum standard for on-chain transaction attribution. It allows apps and protocols to embed "builder codes" into transaction calldata, enabling tracking of which builder generated each transaction. On Base, this powers revenue sharing and analytics.

**Key Components**:
1. **Transaction Suffix** -- Small data appended to the end of transaction calldata
2. **Code Registry** -- Smart contract (ERC-721 NFT) mapping codes to payout addresses

#### How to Register a Builder Code

1. Visit https://base.dev
2. Navigate to **Settings** -> **Builder Codes**
3. Claim your free Builder Code (format: `bc_XXXXXXXX`, e.g., `bc_b7k3p9da`)
4. The code is minted as an ERC-721 NFT with your payout address

**Code Format Rules**:
- Length: 1-32 characters
- Valid characters: lowercase letters (a-z), digits (0-9), underscore (_)

#### How Builder Code Attribution Works

The attribution suffix is **appended to the end of transaction calldata**. Smart contracts execute normally and ignore the extra data. This means:

- **No smart contract modifications needed**
- Any existing smart contract automatically supports ERC-8021
- Gas cost: 16 gas per non-zero byte (negligible)

#### Implementation for Smart Contract Wallets (ERC-5792)

```javascript
await wallet.sendCalls({
  calls: [
    // your normal transaction calls
  ],
  capabilities: {
    dataSuffix: {
      value: "0x07626173656170700080218021802180218021802180218021",
      optional: true
    }
  }
});
```

The suffix encodes: `[length byte][builder code bytes][8021 pattern repeated]`

#### Implementation for EOAs

For externally owned accounts, append the dataSuffix to the `data` field of any transaction:

```typescript
import { encodeFunctionData, concat } from "viem";

// Original calldata
const calldata = encodeFunctionData({
  abi: contractAbi,
  functionName: "someFunction",
  args: [arg1, arg2],
});

// Append builder code suffix
const builderCodeSuffix = "0x07626173656170700080218021802180218021802180218021";
const calldataWithAttribution = concat([calldata, builderCodeSuffix]);

// Send transaction with attribution
const tx = await walletClient.sendTransaction({
  to: contractAddress,
  data: calldataWithAttribution,
  value: 0n,
});
```

#### Registry Smart Contract Interface (ICodesRegistry)

```solidity
interface ICodesRegistry {
    function register(
        string memory code,
        address initialOwner,
        address initialPayoutAddress
    ) external;

    function registerWithSignature(
        string memory code,
        address initialOwner,
        address initialPayoutAddress,
        uint48 deadline,
        address signer,
        bytes memory signature
    ) external;

    function toCode(uint256 tokenId) external pure returns (string memory);
    function toTokenId(string memory code) external pure returns (uint256);
}
```

**Gasless Registration**: The `registerWithSignature` function uses EIP-712 typed data signatures:
```
BuilderCodeRegistration(string code, address initialOwner, address payoutAddress, uint48 deadline)
```

#### Verification

1. **base.dev dashboard**: Check transaction counts under "Onchain activity"
2. **Block explorers**: Verify last 16 bytes contain the `8021` repeating pattern
3. **Builder Code Validation Tool**: https://builder-code-checker.vercel.app/

---

### 1.4 Self-Sustaining Agent Economics

#### The Economic Loop

```
Agent earns USDC (selling services via x402)
        |
        v
Agent pays compute costs (cloud hosting, AI inference, RPC calls)
        |
        v
Revenue > Costs = Self-Sustaining
```

#### Revenue Strategies for AgentMarket Agent

| Service | Price/Request | Expected Volume | Monthly Revenue |
|---------|--------------|-----------------|-----------------|
| AI Data Analysis | $0.01 | 10,000 | $100 |
| Content Generation | $0.05 | 2,000 | $100 |
| Code Review | $0.10 | 500 | $50 |
| Market Intelligence | $0.02 | 5,000 | $100 |
| Agent Discovery API | $0.001 | 50,000 | $50 |
| **Total** | | | **$400/mo** |

#### Compute Cost Breakdown

| Resource | Monthly Cost |
|----------|-------------|
| VPS (2 vCPU, 4GB) | $20 |
| LLM API (OpenAI GPT-4o-mini) | $50-100 |
| Base RPC (QuickNode free tier) | $0 |
| Domain + SSL | $1 |
| **Total** | **$71-121/mo** |

**Margin**: Revenue ($400) - Costs ($121) = **$279/mo profit** = clearly self-sustaining

#### Real-World Precedent: Automaton

The "Automaton" project (open-source) demonstrates this model:
- Owns its own wallet and pays for its own compute
- Builds and deploys products to earn revenue
- If it cannot earn enough to cover compute, it dies
- If it can, it survives, improves, and replicates by spinning up funded child agents

---

### 1.5 Integration Strategy for AgentMarket

#### Architecture: AgentMarket as x402 Service Provider on Base

```
+------------------------------------------------------------------+
|                 AGENTMARKET AUTONOMOUS AGENT (Base Mainnet)        |
|                                                                    |
|  +--------------------------+  +-------------------------------+   |
|  | x402 SERVER (Seller)     |  | x402 CLIENT (Buyer)           |  |
|  | Express + @x402/express  |  | @x402/fetch or @x402/axios    |  |
|  |                          |  |                               |   |
|  | Paid Endpoints:          |  | Buys:                         |  |
|  | - /api/discover-agents   |  | - LLM inference (OpenAI)     |   |
|  | - /api/hire-agent        |  | - Data feeds                 |   |
|  | - /api/analyze           |  | - Other agent services       |   |
|  | - /api/generate          |  |                               |   |
|  +--------------------------+  +-------------------------------+   |
|                                                                    |
|  +--------------------------+  +-------------------------------+   |
|  | WALLET (USDC on Base)    |  | STATS DASHBOARD               |  |
|  | CDP Server Wallet or     |  | Public URL showing:           |  |
|  | viem private key         |  | - Wallet balance (USDC)      |   |
|  | Receives: service fees   |  | - Compute costs (24h/7d/30d) |  |
|  | Pays: compute costs      |  | - Revenue earned             |   |
|  +--------------------------+  | - Profit/Loss ratio          |   |
|                                | - Tx history                 |   |
|  +--------------------------+  +-------------------------------+   |
|  | ERC-8021 BUILDER CODE    |                                     |
|  | Registered at base.dev   |                                     |
|  | Appended to all txs      |                                     |
|  +--------------------------+                                     |
+------------------------------------------------------------------+
```

#### Step-by-Step Implementation Plan

**Step 1: Register Builder Code**
1. Go to https://base.dev
2. Create account, navigate to Settings -> Builder Codes
3. Claim code (e.g., `agentmarket`)
4. Note the builder code suffix hex value

**Step 2: Set Up Agent Wallet on Base Mainnet**
```typescript
// Option A: CDP Server Wallet (recommended)
import { CdpClient } from "@coinbase/cdp-sdk";
const cdp = new CdpClient();
const agentAccount = await cdp.evm.createAccount();

// Option B: Direct private key (simpler for hackathon)
import { createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.AGENT_WALLET_KEY as `0x${string}`);
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http("https://mainnet.base.org"),
});
```

**Step 3: Build x402 Server (Service Provider)**
```typescript
import express from "express";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const app = express();
const AGENT_WALLET = process.env.AGENT_WALLET_ADDRESS!;

const facilitator = new HTTPFacilitatorClient({
  url: "https://api.cdp.coinbase.com/platform/v2/x402"
});

const server = new x402ResourceServer(facilitator)
  .register("eip155:8453", new ExactEvmScheme());

app.use(paymentMiddleware({
  "GET /api/discover-agents": {
    accepts: [{
      scheme: "exact",
      price: "$0.001",
      network: "eip155:8453",
      payTo: AGENT_WALLET,
    }],
    description: "Discover available AI agents and their capabilities",
    mimeType: "application/json",
  },
  "POST /api/hire-agent": {
    accepts: [{
      scheme: "exact",
      price: "$0.05",
      network: "eip155:8453",
      payTo: AGENT_WALLET,
    }],
    description: "Hire an AI agent to perform a task",
    mimeType: "application/json",
  },
  "POST /api/analyze": {
    accepts: [{
      scheme: "exact",
      price: "$0.01",
      network: "eip155:8453",
      payTo: AGENT_WALLET,
    }],
    description: "AI-powered data analysis",
    mimeType: "application/json",
  },
}, server));

// Endpoint implementations
app.get("/api/discover-agents", async (req, res) => {
  // Return list of available agents from AgentMarket registry
  const agents = await getActiveAgents();
  res.json({ agents, count: agents.length });
});

app.post("/api/hire-agent", async (req, res) => {
  const { agentId, task } = req.body;
  // Execute the task using AI
  const result = await executeAgentTask(agentId, task);
  res.json({ result, agentId, taskId: generateId() });
});

app.post("/api/analyze", async (req, res) => {
  const { data, analysisType } = req.body;
  const analysis = await runAnalysis(data, analysisType);
  res.json({ analysis, tokens_used: analysis.tokenCount });
});
```

**Step 4: Build x402 Client (Service Consumer)**
```typescript
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const signer = privateKeyToAccount(process.env.AGENT_WALLET_KEY as `0x${string}`);
const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// Agent autonomously buys data from another x402 service
async function buyDataFromOtherAgent(serviceUrl: string) {
  const response = await fetchWithPayment(serviceUrl);
  return response.json();
}
```

**Step 5: Embed ERC-8021 Builder Code in All Transactions**
```typescript
import { concat, toHex } from "viem";

const BUILDER_CODE_SUFFIX = "0x07626173656170700080218021802180218021802180218021";

function appendBuilderCode(calldata: `0x${string}`): `0x${string}` {
  return concat([calldata, BUILDER_CODE_SUFFIX]) as `0x${string}`;
}

// Use in any on-chain transaction
const tx = await walletClient.sendTransaction({
  to: contractAddress,
  data: appendBuilderCode(originalCalldata),
});
```

**Step 6: Build Public Stats Dashboard**

```typescript
// /api/stats endpoint -- publicly accessible (no payment required)
app.get("/api/stats", async (req, res) => {
  const walletBalance = await getUSDCBalance(AGENT_WALLET);
  const computeCosts = await getComputeCosts(); // Track from infra APIs
  const revenue = await getRevenue(); // Track from x402 payments received

  res.json({
    wallet: {
      address: AGENT_WALLET,
      balance_usdc: walletBalance,
      network: "Base Mainnet (eip155:8453)",
    },
    economics: {
      revenue_24h: revenue.last24h,
      revenue_7d: revenue.last7d,
      revenue_30d: revenue.last30d,
      costs_24h: computeCosts.last24h,
      costs_7d: computeCosts.last7d,
      costs_30d: computeCosts.last30d,
      profit_24h: revenue.last24h - computeCosts.last24h,
      is_self_sustaining: revenue.last30d > computeCosts.last30d,
    },
    agent: {
      builder_code: "agentmarket",
      services_offered: 3,
      total_requests_served: revenue.totalRequests,
      uptime_percent: 99.9,
    },
    transactions: {
      recent: await getRecentTransactions(10),
      explorer_url: "https://basescan.org/address/" + AGENT_WALLET,
    },
    timestamp: new Date().toISOString(),
  });
});

// Frontend dashboard at public URL
// Renders real-time charts: balance over time, revenue vs costs, profit margin
```

---

### 1.6 Qualification Checklist for Base Bounty

| Requirement | How AgentMarket Meets It |
|-------------|-------------------------|
| Transacts on Base MAINNET | x402 payments settle in USDC on Base Mainnet (eip155:8453) |
| Self-sustaining | Agent earns USDC via x402 service fees; pays compute from earnings |
| ERC-8021 builder codes | Registered at base.dev; suffix appended to all transactions |
| Autonomous | Runs 24/7 on VPS; handles requests, payments, and compute billing automatically |
| Minimal human intervention | Only initial deployment and funding require human action |
| Public stats URL | Dashboard at agentmarket.xyz/stats showing balance vs costs in real time |

---

## 2. KITE AI AGENT-NATIVE PAYMENTS ($10,000)

### 2.1 Bounty Requirements Analysis

**Track Name**: "Agent-Native Payments & Identity on Kite AI (x402-Powered)"
**Prize**: $10,000 (1 winner)
**Platform**: ETHDenver 2026 Devfolio

**Core Requirements**:
- Build an **agent-native app** on Kite AI
- Must use **x402 payments** (Kite's native implementation)
- Must use **verifiable agent identity** (Kite Passport system)
- Must demonstrate **autonomous agents** that authenticate, pay, and transact
- Deploy on Kite AI Testnet (Chain ID: 2368)

---

### 2.2 x402 on Kite AI

Kite AI was one of the **first Layer-1 blockchains to fully implement x402-compatible payment primitives**. Their implementation extends the standard x402 protocol with Kite-specific features.

#### Kite-Specific x402 Scheme: `gokite-aa`

Unlike the standard `exact` scheme on Base/Ethereum, Kite uses the `gokite-aa` scheme which integrates with their Account Abstraction wallet system.

#### Kite x402 Payment Flow

```
1. Client Agent --> Request --> Service Provider
2. Service Provider --> 402 + Payment Details (gokite-aa scheme) --> Client Agent
3. Client Agent obtains user authorization via Kite Passport
4. Client Agent --> Request + X-PAYMENT header --> Service Provider
5. Service Provider --> Extract & Verify X-PAYMENT --> Pieverse Facilitator
6. Facilitator --> transferWithAuthorization on-chain --> Settlement
7. Service Provider --> 200 OK + Response --> Client Agent
```

#### Kite 402 Response Format

```json
{
  "error": "X-PAYMENT header is required",
  "accepts": [{
    "scheme": "gokite-aa",
    "network": "kite-testnet",
    "maxAmountRequired": "1000000000000000000",
    "resource": "https://your-service.com/api/endpoint",
    "description": "AgentMarket - AI Agent Discovery Service",
    "mimeType": "application/json",
    "outputSchema": {
      "input": {
        "discoverable": true,
        "method": "GET",
        "queryParams": {
          "category": {
            "description": "Agent category filter",
            "required": false,
            "type": "string"
          }
        },
        "type": "http"
      },
      "output": {
        "properties": {
          "agents": {"description": "List of available agents", "type": "array"},
          "count": {"description": "Total agent count", "type": "number"}
        },
        "required": ["agents", "count"],
        "type": "object"
      }
    },
    "payTo": "0xYourServiceWalletAddress",
    "maxTimeoutSeconds": 300,
    "asset": "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63",
    "extra": null,
    "merchantName": "AgentMarket"
  }],
  "x402Version": 1
}
```

**Key Differences from Standard x402**:

| Field | Standard x402 (Base) | Kite x402 |
|-------|---------------------|-----------|
| `scheme` | `exact` | `gokite-aa` |
| `network` | `eip155:8453` | `kite-testnet` |
| `price` | `"$0.01"` | `maxAmountRequired` in wei |
| `asset` | Implicit USDC | Explicit token address: `0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63` (Test USDT) |
| Payment header | `PAYMENT-SIGNATURE` (V2) | `X-PAYMENT` (V1 format) |
| Facilitator | CDP or x402.org | Pieverse: `https://facilitator.pieverse.io` |
| Discovery | Bazaar (optional) | `outputSchema` built into 402 response |

#### X-PAYMENT Header Format (Kite)

The X-PAYMENT header contains a **base64-encoded JSON object** with:
```json
{
  "authorization": {
    "from": "0xUserOrAgentAddress",
    "to": "0xServiceProviderAddress",
    "value": "1000000000000000000",
    "validAfter": 1708000000,
    "validBefore": 1708003600,
    "nonce": "0x..."
  },
  "signature": "0x..."
}
```

#### Settlement via Pieverse Facilitator

```bash
# Verify payment
curl -X POST https://facilitator.pieverse.io/v2/verify \
  -H "Content-Type: application/json" \
  -d '{
    "authorization": {...},
    "signature": "0x...",
    "network": "kite-testnet"
  }'

# Settle payment (execute on-chain transfer)
curl -X POST https://facilitator.pieverse.io/v2/settle \
  -H "Content-Type: application/json" \
  -d '{
    "authorization": {...},
    "signature": "0x...",
    "network": "kite-testnet"
  }'
```

**Pieverse Facilitator Details**:
- Base URL: `https://facilitator.pieverse.io`
- Version: 2.0.0
- Kite Testnet Address: `0x12343e649e6b2b2b77649DFAb88f103c02F3C78b`

---

### 2.3 Agent Identity (Kite Passport) Deep Dive

#### Three-Tier Identity Architecture

Kite's identity system is built on **BIP-32 hierarchical deterministic key derivation**, creating three security tiers:

```
User Identity (Root Authority)
    |-- Private keys in secure enclaves, NEVER exposed
    |-- Can revoke all delegated permissions in single tx
    |-- DID: did:kite:alice.eth
    |
    +-- Agent Identity (Delegated Authority)
        |-- Deterministic address derived via BIP-32
        |-- Provable ownership without key exposure
        |-- DID: did:kite:alice.eth/chatgpt/portfolio-manager-v1
        |
        +-- Session Identity (Ephemeral Authority)
            |-- Random keys (perfect forward secrecy)
            |-- Auto-expire after use
            |-- Cannot be reversed to derive parent keys
```

#### Cryptographic Authorization Chain

**Standing Intent (SI)** -- User authorizes agent:
```
SI = sign_user(
    iss: user_address,
    sub: agent_did,
    caps: {max_tx: 100, max_daily: 1000},
    exp: timestamp
)
```

**Delegation Token (DT)** -- Agent authorizes session:
```
DT = sign_agent(
    iss: agent_did,
    sub: session_pubkey,
    intent_hash: H(SI),
    operation: op_details,
    exp: now + 60s
)
```

**Session Signature (SS)** -- Session executes transaction:
- Requires all three signatures: SI + DT + SS
- Unauthorized actions are cryptographically impossible

#### Identity Resolution (Public Resolvers)

```typescript
// Anyone can verify agent identity without contacting Kite or users
GetAgent(AgentID) -> { AgentID, AgentDomain, AgentAddress }
ResolveAgentByDomain(AgentDomain) -> { AgentID, AgentDomain, AgentAddress }
ResolveAgentByAddress(AgentAddress) -> { AgentID, AgentDomain, AgentAddress }
GetAgentBySession(SessionID) -> { AgentID, AgentDomain, AgentAddress, SessionInfo }
```

#### AA Wallet Integration

```javascript
// Register a session key rule for an agent
addSessionKeyRule(
    address sessionKeyAddress,    // Ephemeral session key
    bytes32 agentId,              // Agent's deterministic ID
    bytes4 functionSelector,       // Allowed function
    uint256 valueLimit            // Max value per tx
)
```

#### Reputation System

- Reputation derives from **cryptographic proofs of actual behavior**
- Every interaction is verified and immutable on-chain
- Reputation is **portable across services**
- Progressive authorization: start with $10 daily limit, automatically expand based on behavior
- Scoring factors: successful payments, response speed, delivery failures, SLA violations

---

### 2.4 Service Provider Integration on Kite

#### Complete Service Provider Implementation

```typescript
import express from "express";

const app = express();
const SERVICE_WALLET = process.env.SERVICE_WALLET_ADDRESS!;
const KITE_TEST_USDT = "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63";
const FACILITATOR_URL = "https://facilitator.pieverse.io";

// Middleware: Check for X-PAYMENT header
function kitePaymentMiddleware(price: string) {
  return async (req: any, res: any, next: any) => {
    const xPayment = req.headers["x-payment"];

    if (!xPayment) {
      // Return 402 with payment requirements
      return res.status(402).json({
        error: "X-PAYMENT header is required",
        accepts: [{
          scheme: "gokite-aa",
          network: "kite-testnet",
          maxAmountRequired: price,
          resource: `https://${req.hostname}${req.originalUrl}`,
          description: "AgentMarket AI Service",
          mimeType: "application/json",
          outputSchema: {
            input: {
              discoverable: true,
              method: req.method,
              type: "http"
            },
            output: {
              properties: {
                result: { description: "Service result", type: "object" }
              },
              required: ["result"],
              type: "object"
            }
          },
          payTo: SERVICE_WALLET,
          maxTimeoutSeconds: 300,
          asset: KITE_TEST_USDT,
          extra: null,
          merchantName: "AgentMarket"
        }],
        x402Version: 1
      });
    }

    // Decode and verify X-PAYMENT
    try {
      const decoded = JSON.parse(Buffer.from(xPayment, "base64").toString());
      const { authorization, signature } = decoded;

      // Verify via Pieverse facilitator
      const verifyResponse = await fetch(`${FACILITATOR_URL}/v2/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorization,
          signature,
          network: "kite-testnet"
        })
      });

      if (!verifyResponse.ok) {
        return res.status(402).json({ error: "Payment verification failed" });
      }

      // Settle payment
      const settleResponse = await fetch(`${FACILITATOR_URL}/v2/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorization,
          signature,
          network: "kite-testnet"
        })
      });

      if (!settleResponse.ok) {
        return res.status(402).json({ error: "Payment settlement failed" });
      }

      // Payment successful -- proceed to endpoint
      next();
    } catch (error) {
      return res.status(402).json({ error: "Invalid payment" });
    }
  };
}

// Protected endpoints
app.get("/api/agents",
  kitePaymentMiddleware("1000000000000000000"), // 1 USDT
  async (req, res) => {
    const agents = await getAgentsFromRegistry();
    res.json({ agents, count: agents.length });
  }
);

app.post("/api/hire",
  kitePaymentMiddleware("5000000000000000000"), // 5 USDT
  async (req, res) => {
    const { agentId, task } = req.body;
    const result = await executeTask(agentId, task);
    res.json({ result, taskId: generateId() });
  }
);
```

---

### 2.5 Integration Strategy for AgentMarket on Kite

#### Architecture

```
+------------------------------------------------------------------+
|            AGENTMARKET ON KITE AI (Testnet Chain ID: 2368)         |
|                                                                    |
|  +--------------------------+  +-------------------------------+   |
|  | KITE PASSPORT IDENTITY   |  | x402 SERVICE PROVIDER         |  |
|  |                          |  | (gokite-aa scheme)            |   |
|  | User (Root):             |  |                               |   |
|  |   did:kite:user.eth      |  | Paid Endpoints:               |  |
|  |                          |  | - /api/discover-agents        |   |
|  | Agent (Delegated):       |  | - /api/hire-agent             |   |
|  |   did:kite:user.eth/     |  | - /api/analyze                |   |
|  |   agentmarket/commerce   |  | - /api/reputation             |   |
|  |                          |  |                               |   |
|  | Session (Ephemeral):     |  | Settlement: Pieverse          |   |
|  |   Random key, 60s TTL    |  | Facilitator                   |  |
|  +--------------------------+  +-------------------------------+   |
|                                                                    |
|  +--------------------------+  +-------------------------------+   |
|  | SMART CONTRACT LAYER     |  | REPUTATION ENGINE              |  |
|  | (Kite Testnet)           |  |                               |   |
|  |                          |  | - Track payment success rate  |   |
|  | - AgentRegistry (Kite)   |  | - Response time scoring       |   |
|  | - PaymentRouter (Kite)   |  | - SLA compliance monitoring   |  |
|  | - AA Wallet Integration  |  | - Portable across services    |   |
|  +--------------------------+  +-------------------------------+   |
+------------------------------------------------------------------+
```

#### Kite AI Network Configuration

```typescript
// Kite Testnet
export const kiteTestnet = {
  id: 2368,
  name: "KiteAI Testnet",
  nativeCurrency: { name: "KITE", symbol: "KITE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-testnet.gokite.ai/"] },
  },
  blockExplorers: {
    default: { name: "KiteScan", url: "https://testnet.kitescan.ai/" },
  },
};

// Kite Mainnet (for future production)
export const kiteMainnet = {
  id: 2366,
  name: "KiteAI Mainnet",
  nativeCurrency: { name: "KITE", symbol: "KITE", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.gokite.ai/"] },
  },
  blockExplorers: {
    default: { name: "KiteScan", url: "https://kitescan.ai/" },
  },
};

// Key addresses
const KITE_TEST_USDT = "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63";
const KITE_FACILITATOR = "0x12343e649e6b2b2b77649DFAb88f103c02F3C78b";
```

#### Testnet Setup Steps

1. Add Kite AI Testnet to wallet (ChainList: https://chainlist.org/chain/2368)
2. Get testnet tokens from faucet: https://faucet.gokite.ai
3. Deploy contracts to Kite Testnet RPC: `https://rpc-testnet.gokite.ai/`
4. Verify on KiteScan: `https://testnet.kitescan.ai/`

#### Qualification Checklist for Kite AI Bounty

| Requirement | How AgentMarket Meets It |
|-------------|-------------------------|
| Agent-native app | AgentMarket is built for AI agents as primary users |
| x402 payments | All service endpoints use gokite-aa scheme with Pieverse facilitator |
| Verifiable agent identity | Kite Passport 3-tier identity (user/agent/session) |
| Autonomous agents | Agents discover, negotiate, and transact without human intervention |
| Authenticate | BIP-32 derived agent addresses with Standing Intent authorization |
| Pay | x402 USDT payments via X-PAYMENT header |
| Transact | On-chain settlement through Pieverse facilitator on Kite Testnet |

---

## 3. COMBINED ARCHITECTURE: AgentMarket + Base + Kite

### Unified Agent Architecture

AgentMarket deploys a **single agent application** that operates across both chains:

```
+===================================================================+
|                     AGENTMARKET UNIFIED AGENT                      |
|                                                                    |
|  +-----------------------------+  +-----------------------------+  |
|  |     BASE MAINNET MODULE     |  |    KITE TESTNET MODULE      |  |
|  |                             |  |                             |  |
|  | x402 Scheme: exact          |  | x402 Scheme: gokite-aa     |  |
|  | Network: eip155:8453        |  | Network: kite-testnet       |  |
|  | Token: USDC                 |  | Token: Test USDT            |  |
|  | Facilitator: CDP            |  | Facilitator: Pieverse       |  |
|  | ERC-8021: Builder Code      |  | Identity: Kite Passport     |  |
|  |                             |  |                             |  |
|  | Self-sustaining economics:  |  | Agent-native commerce:      |  |
|  | Revenue > Compute costs     |  | Discover + Hire + Pay       |  |
|  |                             |  |                             |  |
|  | Public stats dashboard at   |  | Reputation tracking via     |  |
|  | /stats                      |  | cryptographic proofs        |  |
|  +-----------------------------+  +-----------------------------+  |
|                                                                    |
|  +-----------------------------+  +-----------------------------+  |
|  |   SHARED AI ENGINE          |  |   SHARED API SERVER         |  |
|  |   (OpenAI / Local LLM)      |  |   (Express.js + Next.js)    |  |
|  |   - Data Analysis           |  |   - /api/discover-agents    |  |
|  |   - Content Generation      |  |   - /api/hire-agent         |  |
|  |   - Market Intelligence     |  |   - /api/analyze            |  |
|  |   - Code Review             |  |   - /api/stats              |  |
|  +-----------------------------+  +-----------------------------+  |
+===================================================================+
```

### Cross-Chain Payment Router

```typescript
// Unified payment handler that works on both Base and Kite
export function createMultiChainPaymentMiddleware(config: {
  baseWallet: string;
  kiteWallet: string;
}) {
  return {
    // Base Mainnet endpoints (standard x402 v2)
    base: paymentMiddleware({
      "GET /api/discover-agents": {
        accepts: [{
          scheme: "exact",
          price: "$0.001",
          network: "eip155:8453",
          payTo: config.baseWallet,
        }],
        description: "Discover AI agents on AgentMarket",
        mimeType: "application/json",
      },
    }, baseServer),

    // Kite Testnet endpoints (gokite-aa x402)
    kite: kitePaymentMiddleware("1000000000000000000"),
  };
}
```

---

## 4. IMPLEMENTATION ROADMAP

### Priority Order (Given Hackathon Time Constraints)

Since the bounty deadline is Feb 21, 2026 and it is now Feb 20:

#### HIGH PRIORITY (Do First -- 8 hours)

1. **Register Builder Code at base.dev** (15 minutes)
   - Go to base.dev, Settings -> Builder Codes
   - Claim "agentmarket" or similar code
   - Note the hex suffix

2. **Deploy x402 Server on Base Mainnet** (3 hours)
   - Set up Express server with @x402/express
   - Configure 3-4 paid endpoints
   - Register with CDP facilitator
   - Deploy to VPS or Vercel

3. **Build Public Stats Dashboard** (2 hours)
   - /stats endpoint showing wallet balance vs compute costs
   - Simple frontend with real-time updates
   - Deploy at public URL

4. **Fund Agent Wallet with USDC on Base** (30 minutes)
   - Transfer initial USDC to agent wallet on Base Mainnet
   - Set up cost tracking

5. **Deploy x402 Service on Kite Testnet** (2 hours)
   - Get testnet tokens from faucet.gokite.ai
   - Adapt Express server for gokite-aa scheme
   - Integrate with Pieverse facilitator
   - Deploy contracts to Kite Testnet

#### MEDIUM PRIORITY (Polish -- 4 hours)

6. **Implement Agent Identity on Kite** (2 hours)
   - Create agent DID
   - Implement Standing Intent signing
   - Session key generation and delegation

7. **Add ERC-8021 Attribution to All Transactions** (1 hour)
   - Append builder code suffix to all on-chain txs
   - Verify on basescan and builder-code-checker tool

8. **Demo Video and Documentation** (1 hour)
   - 3-minute demo showing self-sustaining loop
   - README with architecture and setup

---

## 5. SOURCES

### x402 Protocol
- [x402 Official Site](https://www.x402.org/)
- [x402 GitHub (Coinbase)](https://github.com/coinbase/x402)
- [Coinbase x402 Documentation](https://docs.cdp.coinbase.com/x402/welcome)
- [x402 Quickstart for Sellers](https://docs.cdp.coinbase.com/x402/quickstart-for-sellers)
- [x402 Quickstart for Buyers](https://docs.cdp.coinbase.com/x402/quickstart-for-buyers)
- [Building Autonomous Payment Agents with x402 - Base Docs](https://docs.base.org/base-app/agents/x402-agents)
- [x402 CoinGecko Explainer](https://www.coingecko.com/learn/x402-autonomous-ai-agent-payment-coinbase)
- [QuickNode x402 Guide](https://blog.quicknode.com/x402-protocol-explained-inside-the-https-native-payment-layer/)

### ERC-8021 Builder Codes
- [Base Blog: Builder Codes and ERC-8021](https://blog.base.dev/builder-codes-and-erc-8021-fixing-onchain-attribution)
- [Base Builder Codes Documentation](https://docs.base.org/base-chain/quickstart/builder-codes)
- [Builder Codes GitHub](https://github.com/base/builder-codes)
- [ERC-8021 Info Site](https://www.erc8021.com/erc8004)
- [Builder Code Validation Tool](https://builder-code-checker.vercel.app/)

### Base Documentation
- [Base Docs](https://docs.base.org)
- [ETHDenver 2026 - Base Bounty](https://ethdenver2026.devfolio.co/prizes?partner=Base)

### Kite AI
- [Kite AI Docs](https://docs.gokite.ai/)
- [Kite AI Introduction & Mission](https://docs.gokite.ai/get-started-why-kite/introduction-and-mission)
- [Kite AI Core Concepts & Terminology](https://docs.gokite.ai/get-started-why-kite/core-concepts-and-terminology)
- [Kite AI Service Provider Guide](https://docs.gokite.ai/kite-agent-passport/service-provider-guide)
- [Kite AI Network Information](https://docs.gokite.ai/kite-chain/1-getting-started/network-information)
- [Kite AI Testnet Faucet](https://faucet.gokite.ai)
- [Kite AI GitHub (x402 Reference)](https://github.com/gokite-ai/x402)
- [ETHDenver 2026 - Kite AI Bounty](https://ethdenver2026.devfolio.co/prizes?partner=Kite+AI)
- [Gate.io: Kite AI x402 Explainer](https://www.gate.com/learn/articles/kite-ai-project-explained-the-rise-of-the-ai-payment-chain-with-x402-primitive-support/13371)

### Self-Sustaining Agents
- [Automaton: AI Agent Paying for its Own Compute](https://cybernews.com/ai-news/automaton-ai-agent/)
- [Coinbase Agentic Wallets](https://www.coinbase.com/developer-platform/discover/launches/agentic-wallets)
- [Circle: Building Autonomous Payments for AI Agents](https://www.circle.com/developer/walkthroughs-tutorials/building-an-autonomous-payments-system-for-ai-agents-using-usdc-i-usdc)

### ETHDenver 2026
- [ETHDenver Official Site](https://ethdenver.com/)
- [ETHDenver 2026 Devfolio Prizes](https://ethdenver2026.devfolio.co/)
