# Uniswap Foundation & 0G Labs Bounty Research

## AgentMarket Integration Strategy for ETHDenver 2026

**Date**: 2026-02-20 | **Additional Addressable Prize Pool**: $30,000

---

## TABLE OF CONTENTS

1. [Uniswap Foundation Bounty ($5,000)](#1-uniswap-foundation-bounty-5000)
2. [0G Labs Bounties ($25,000)](#2-0g-labs-bounties-25000)
3. [Architecture Integration Plan](#3-architecture-integration-plan)
4. [Implementation Priority & Effort Estimates](#4-implementation-priority--effort-estimates)
5. [Updated Bounty Ledger](#5-updated-bounty-ledger)

---

## 1. UNISWAP FOUNDATION BOUNTY ($5,000)

### 1.1 Bounty Details

| Field | Value |
|-------|-------|
| **Sponsor** | Uniswap Foundation |
| **Prize** | $5,000 |
| **Category** | Feature Integration |
| **Requirement** | "Integrate the Uniswap API in your platform" - Build an application or agent that integrates the Uniswap API for swaps/liquidity |
| **Judging** | Meaningful integration depth, innovation, execution quality |

### 1.2 Uniswap API Technical Details

**Base URL**: Requires API key from [Developer Portal](https://developers.uniswap.org/dashboard)

#### Swap Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/quote` | GET | Get swap quote with routing options and gas estimates |
| `/swap` | POST | Generate calldata for standard swap transactions |
| `/swap_batch` | POST | EIP-5792 calldata for batched swaps |
| `/swap_7702` | POST | EIP-7702 calldata for delegated wallets |
| `/order` | POST | Submit UniswapX gasless intent orders |
| `/order` | GET | Retrieve gasless order status |
| `/swap` (status) | GET | Check swap/bridge transaction status |
| `/limit_quote` | GET | Get limit order quotes |
| `/approval` | GET | Check wallet token approval status |

#### Liquidity Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/create_position` | POST | Create new LP positions (V2/V3/V4) |
| `/increase_position` | POST | Add liquidity to existing positions |
| `/decrease_position` | POST | Remove liquidity from positions |
| `/migrate_position` | POST | Migrate positions between pool versions |
| `/claim_fees` | POST | Collect accrued LP fees |
| `/claim_rewards` | POST | Collect protocol rewards |

#### Supported Chains (16 Mainnets + 3 Testnets)

| Chain | Chain ID | UniswapX Support | Router Address |
|-------|----------|------------------|----------------|
| Ethereum | 1 | Yes (V2, V3) | `0x66a9893cc07d91d95644aedd05d03f95e1dba8af` |
| OP Mainnet | 10 | No | `0x851116d9223fabed8e56c0e6b8ad0c31d98b3507` |
| BNB Smart Chain | 56 | No | `0x1906c1d672b88cd1b9ac7593301ca990f94eae07` |
| Unichain | 130 | Yes (V2) | `0xef740bf23acae26f6492b10de645d6b98dc8eaf3` |
| Polygon | 137 | No | `0x1095692a6237d83c6a72f3f5efedb9a670c49223` |
| Monad | 143 | No | `0x0d97dc33264bfc1c226207428a79b26757fb9dc3` |
| X Layer | 196 | No | `0x5507749f2c558bb3e162c6e90c314c092e7372ff` |
| zkSync | 324 | No | `0x28731BCC616B5f51dD52CF2e4dF0E78dD1136C06` |
| World Chain | 480 | No | `0x8ac7bee993bb44dab564ea4bc9ea67bf9eb5e743` |
| Soneium | 1868 | No | `0x0e2850543f69f678257266e0907ff9a58b3f13de` |
| Base | 8453 | Yes (V2) | `0x6ff5693b99212da76ad316178a184ab56d299b43` |
| Arbitrum | 42161 | Yes (V2, V3) | `0xa51afafe0263b40edaef0df8781ea9aa03e381a3` |
| Celo | 42220 | No | `0x643770e279d5d0733f21d6dc03a8efbabf3255b4` |
| Avalanche | 43114 | No | `0x94b75331ae8d42c1b61065089b7d48fe14aa73b7` |
| Blast | 81457 | No | `0xeabbcb3e8e415306207ef514f660a3f820025be3` |
| Zora | 7777777 | No | `0x3315ef7ca28db74abadc6c44570efdf06b04b020` |

**Testnets**: Ethereum Sepolia (11155111), Unichain Sepolia (1301), Monad Testnet (10143)

**Key constraint**: UniswapX V2 only supports Mainnet (1), Arbitrum (42161), Base (8453), and Unichain (130). L2 UniswapX requests require minimum 1000 USDC equivalent value.

#### Routing Options

- **Classic**: Routes through Uniswap v2, v3, v4 pools on-chain
- **UniswapX (intent-based)**: Gasless, MEV-protected orders routed through filler network, returns `DUTCH_V2`, `DUTCH_V3`, or `PRIORITY` routing types
- **Preferences**: `BEST_PRICE` or `FASTEST` routing strategies

#### Key Technical Features

- **Permit2**: Simplified token approvals via Uniswap's Permit2 contract
- **MEV Protection**: Built-in through UniswapX RFQ access to public, private, and off-chain liquidity
- **Cross-chain bridging**: Supported through the swap API for cross-chain token transfers
- **Native ETH Support**: UniswapX routes support native ETH via EIP-7914
- **Fee Integration**: Optional output token fee collection for API integrators
- **Gas Simulation**: Optional `simulateTransaction` parameter for fee estimation

### 1.3 Uniswap AI Skills (for Agent Integration)

**Repository**: [github.com/Uniswap/uniswap-ai](https://github.com/Uniswap/uniswap-ai)
**Docs**: [ul-ai-docs.vercel.app](https://ul-ai-docs.vercel.app/)

Five installable plugins:

| Plugin | Purpose | Relevance to AgentMarket |
|--------|---------|--------------------------|
| `uniswap-trading` | Swap integration (3 approaches: Trading API, Universal Router SDK, direct contract calls) | HIGH - Core swap functionality |
| `uniswap-driver` | Plans and executes swaps and liquidity operations | HIGH - Agent autonomy for swaps |
| `uniswap-viem` | EVM integration using viem/wagmi | HIGH - Matches our tech stack |
| `uniswap-hooks` | V4 hook development with security | MEDIUM - Custom pool hooks |
| `uniswap-cca` | Coordinated Liquidity Auction deployment | LOW - Advanced feature |

**Installation**: `npx skills add Uniswap/uniswap-ai`

Language breakdown: Python (53.1%), JavaScript (24.1%), TypeScript (17.4%)

### 1.4 AgentMarket Integration Strategy for Uniswap

#### Core Concept: "Agent Payment Settlement via Cross-Chain Swaps"

When an AI agent on AgentMarket earns payment in one token (e.g., DDSC on ADI Chain), it may need to convert those earnings to a different token on a different chain. Uniswap API enables this autonomously.

#### Integration Points

**1. Agent Earnings Swap Service (`/api/uniswap/swap`)**

```typescript
// Agent requests a quote for converting earned tokens
POST /api/uniswap/quote
{
  "tokenIn": "0x...DDSC",    // Token agent received as payment
  "tokenOut": "0x...USDC",   // Token agent wants
  "amount": "1000000",       // Amount in smallest unit
  "chainId": 8453,           // Base chain
  "walletAddress": "0x...",  // Agent's wallet
  "routingPreference": "BEST_PRICE"
}

// Response includes quote, gas estimate, and routing type
// Agent can then execute the swap autonomously
```

**2. Cross-Chain Agent Commerce**

Agents on different chains can transact using Uniswap's cross-chain bridging:
- Agent A (on Base) hires Agent B (on Arbitrum)
- Payment is initiated in USDC on Base
- Uniswap API bridges and swaps to Agent B's preferred token on Arbitrum
- Settlement is automatic and verifiable on-chain

**3. Merchant Payment Flexibility**

Merchants can accept any token; Uniswap converts to their preferred settlement token:
- Customer pays in ETH
- Uniswap API auto-converts to USDC for the merchant
- Merchant always receives their preferred denomination

**4. AI Agent as Swap Optimizer**

The AI agent in AgentMarket uses the Uniswap API to:
- Compare `BEST_PRICE` vs `FASTEST` routing for each transaction
- Choose between Classic (on-chain) and UniswapX (gasless) routes
- Batch multiple small payments into single swap operations
- Set limit orders for non-urgent conversions to get better rates

#### Frontend Integration

New page: `/dashboard/swap` - Token Swap Interface
- Embedded within the AgentMarket dashboard
- Shows agent's multi-chain token balances
- One-click swap using Uniswap API
- History of all swaps with status tracking

#### API Route Implementation

```typescript
// frontend/src/app/api/uniswap/quote/route.ts
import { NextRequest, NextResponse } from 'next/server';

const UNISWAP_API_BASE = 'https://api.uniswap.org/v2';

export async function POST(req: NextRequest) {
  const { tokenIn, tokenOut, amount, chainId, walletAddress, routingPreference } = await req.json();

  const response = await fetch(`${UNISWAP_API_BASE}/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.UNISWAP_API_KEY!,
    },
    body: JSON.stringify({
      tokenIn,
      tokenOut,
      amount,
      chainId,
      swapper: walletAddress,
      type: 'EXACT_INPUT',
      routingPreference: routingPreference || 'BEST_PRICE',
    }),
  });

  const quote = await response.json();
  return NextResponse.json(quote);
}
```

```typescript
// frontend/src/app/api/uniswap/swap/route.ts
export async function POST(req: NextRequest) {
  const { quote, walletAddress } = await req.json();

  // For UniswapX orders (gasless)
  if (quote.routing === 'DUTCH_V2' || quote.routing === 'DUTCH_V3') {
    const response = await fetch(`${UNISWAP_API_BASE}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.UNISWAP_API_KEY!,
      },
      body: JSON.stringify({
        encodedOrder: quote.encodedOrder,
        signature: quote.signature,  // Signed by agent's wallet
        chainId: quote.chainId,
        orderType: quote.routing,
      }),
    });
    return NextResponse.json(await response.json());
  }

  // For classic on-chain swaps
  const response = await fetch(`${UNISWAP_API_BASE}/swap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.UNISWAP_API_KEY!,
    },
    body: JSON.stringify({
      quote: quote.quoteId,
      walletAddress,
    }),
  });
  return NextResponse.json(await response.json());
}
```

#### Qualification Checklist for Uniswap Bounty

- [ ] Obtain Uniswap API key from Developer Portal
- [ ] Implement `/api/uniswap/quote` route to fetch swap quotes
- [ ] Implement `/api/uniswap/swap` route to execute swaps (Classic + UniswapX)
- [ ] Build swap UI in dashboard showing token pair, quote, slippage, and route
- [ ] Handle Permit2 approval flow for ERC-20 tokens
- [ ] Demonstrate cross-chain swap (e.g., Base USDC -> Arbitrum ETH)
- [ ] Show AI agent autonomously choosing optimal routing (BEST_PRICE vs FASTEST)
- [ ] Track swap status with the `/swap` status endpoint
- [ ] Display swap history with links to block explorers
- [ ] Demo: Agent earns DDSC -> auto-converts to USDC via Uniswap on Base

---

## 2. 0G LABS BOUNTIES ($25,000)

### 2.1 Bounty Overview

| Track | Prize | Focus |
|-------|-------|-------|
| **Best DeFAI Application** | $7,000 | AI that meaningfully improves a DeFi workflow with structured decisions, guardrails, or automation |
| **Best Use of AI Inference or Fine Tuning (0G Compute)** | $7,000 | Leverage 0G's compute resources for AI inference or model fine-tuning |
| **Best Use of On-Chain Agent (iNFT)** | $7,000 | Intelligent NFT implementations with autonomous agent capabilities |
| **Best Developer Tooling or Education** | $4,000 | Tools or educational materials for the 0G ecosystem |

**Common Judging Criteria**: Innovation originality, implementation feasibility, execution quality, ecosystem integration depth, market validation evidence, impact on organizational success metrics.

**Key Requirement for DeFAI**: "AI must do more than chat: it should produce structured decisions, guardrails, or automation."

### 2.2 0G Technical Infrastructure

#### 0G Compute Network

A decentralized marketplace for AI inference and fine-tuning that settles on 0G Chain.

**Key Technical Details**:
- **Pricing**: Pay-per-use, ~90% cheaper than enterprise cloud services
- **Verification**: Supports TEEML, OPML, and ZKML for verifiable computation
- **Settlement**: ZK-proof settlement reducing transaction costs by 100x
- **Integration**: REST API and direct blockchain integration (Ethereum, Solana, others)
- **SDK**: `@0glabs/0g-ts-sdk` (TypeScript)

**SDK Integration Flow**:
```typescript
import { createZGComputeNetworkBroker } from '@0glabs/0g-ts-sdk';

// 1. Initialize broker
const broker = await createZGComputeNetworkBroker(wallet);

// 2. Acknowledge a provider (on-chain)
await broker.inference.acknowledgeProviderSigner(providerAddress);

// 3. Fund your account
await broker.ledger.depositFund("0.5");

// 4. Get service metadata
const { endpoint, model } = await broker.inference.getServiceMetadata(provider);

// 5. Generate auth headers for inference requests
const headers = await broker.inference.getRequestHeaders(provider, prompt);

// 6. Make inference request to provider's endpoint
const response = await fetch(endpoint, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    model,
    messages: [{ role: 'user', content: prompt }],
  }),
});

// 7. Withdraw unused funds
await broker.ledger.retrieveFund("inference", "0.1");
```

#### 0G iNFT (ERC-7857)

Intelligent Non-Fungible Tokens that tokenize AI agents with encrypted on-chain intelligence.

**Standard**: ERC-7857 (extends ERC-721)

**Core Interface Functions**:

| Function | Purpose |
|----------|---------|
| `mint()` | Create new iNFT with encrypted metadata and hash verification |
| `transfer()` | Secure transfer with oracle re-encryption for new owner |
| `authorizeUsage()` | Grant usage permissions without ownership transfer (AI-as-a-Service) |
| `getMetadataHash()` | Retrieve token metadata hash for verification |
| `getEncryptedURI()` | Get encrypted metadata location |

**Key Events**:
- `MetadataUpdated` - Emitted when metadata hash changes during transfers
- `UsageAuthorized` - Triggered when executor permissions are granted
- `OracleUpdated` - Logs oracle configuration changes

**Oracle Implementations**:
- **TEE (Trusted Execution Environment)**: Hardware-level security for decryption/re-encryption
- **ZKP (Zero-Knowledge Proof)**: Verifies re-encryption correctness without exposing keys

**Deployment Requirements**:
```bash
npm install @0glabs/0g-ts-sdk ethers hardhat
```

**Environment Variables**:
```
PRIVATE_KEY=...
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_STORAGE_URL=...
OG_COMPUTE_URL=...
```

**iNFT Creation Flow**:
1. Encrypt AI agent data (model, weights, config) with random key
2. Store encrypted data on 0G Storage -> get URI
3. Seal encryption key for owner using public-key cryptography
4. Generate metadata hash via keccak256
5. Call `mint()` with encrypted URI and metadata hash
6. iNFT is now on-chain, tradeable, and usable

**Transfer Flow**:
1. Retrieve current encrypted metadata
2. Request oracle re-encryption for new owner's public key
3. Execute contract transfer with sealed key and proof
4. New owner can now access the AI agent's intelligence

### 2.3 AgentMarket Integration Strategy for 0G Bounties

#### Strategy A: Best DeFAI Application ($7,000)

**Concept**: "AI-Powered Agent Hiring Optimizer"

AgentMarket's AI uses structured decision-making to optimize DeFi interactions for agent commerce:

1. **Automated Payment Routing**: AI analyzes gas costs, token prices, and liquidity across chains to determine optimal payment route for hiring an agent
2. **Risk Assessment Guardrails**: Before an agent accepts a task, AI evaluates:
   - Payer's on-chain reputation and balance
   - Historical task completion rates
   - Optimal escrow parameters (amount, timeout)
3. **Dynamic Pricing Automation**: AI agents adjust their service prices based on:
   - Current demand (number of pending tasks)
   - Gas costs on the settlement chain
   - Token price volatility
   - Competitor agent pricing
4. **Yield Optimization for Idle Funds**: Agent earnings sitting in MerchantVault can be automatically deployed to Uniswap LP positions, then withdrawn when the agent needs funds

**Why This Qualifies**: The AI does NOT just chat -- it produces structured JSON decisions for payment routing, risk scores for guardrails, and automated yield strategies. User maintains control via approval thresholds.

**Implementation**:
```typescript
// AI produces structured decisions, not just chat
interface AgentHiringDecision {
  recommendedAgent: number;          // agentId
  paymentRoute: {
    sourceChain: number;
    destChain: number;
    tokenPath: string[];
    estimatedCost: bigint;
    routingType: 'CLASSIC' | 'UNISWAPX';
  };
  riskScore: number;                 // 0-100
  guardrails: {
    maxSlippage: number;
    escrowTimeout: number;
    requiresApproval: boolean;       // true if risk > threshold
  };
  reasoning: string;                 // Explainable AI output
}
```

#### Strategy B: Best Use of AI Inference (0G Compute) ($7,000)

**Concept**: "Decentralized Agent Intelligence on 0G Compute"

Instead of relying on centralized OpenAI/Anthropic APIs for agent intelligence, AgentMarket uses 0G Compute for:

1. **Agent Task Processing**: When an agent is hired to perform a task, the inference runs on 0G Compute
   - Verifiable computation proofs ensure the agent actually did the work
   - Cost is ~90% less than centralized alternatives
   - No data retention by providers (privacy for sensitive tasks)

2. **Agent Quality Scoring**: Fine-tune a model on 0G Compute that scores agent outputs
   - Train on historical task completions and ratings
   - Run inference to predict quality before accepting a task
   - Publicly verifiable scoring (TEEML/ZKML proofs)

3. **Natural Language Task Matching**: Run inference on 0G to match task descriptions to agent capabilities
   - Semantic similarity between task requirements and agent skills
   - Decentralized, no single point of failure

**Implementation**:
```typescript
// frontend/src/app/api/0g/inference/route.ts
import { createZGComputeNetworkBroker } from '@0glabs/0g-ts-sdk';

export async function POST(req: NextRequest) {
  const { agentId, taskDescription, prompt } = await req.json();

  const broker = await createZGComputeNetworkBroker(serverWallet);

  // Get best available provider
  const providers = await broker.inference.listProviders();
  const provider = providers[0]; // Select best by price/latency

  const { endpoint, model } = await broker.inference.getServiceMetadata(provider);
  const headers = await broker.inference.getRequestHeaders(provider, prompt);

  // Execute inference on 0G Compute
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an AI agent on AgentMarket. Agent ID: ${agentId}. Complete the following task.`
        },
        { role: 'user', content: taskDescription }
      ],
    }),
  });

  const result = await response.json();

  return NextResponse.json({
    result: result.choices[0].message.content,
    provider: provider.address,
    model,
    // Verification proof can be checked on-chain
    verificationProof: result.proof,
  });
}
```

**Why This Qualifies**: Uses 0G Compute SDK for real LLM inference, pays providers on-chain, and the results are verifiable. This is not a mock -- it's real decentralized AI inference powering an agent marketplace.

#### Strategy C: Best Use of On-Chain Agent / iNFT ($7,000)

**Concept**: "Tradeable AI Agents as iNFTs"

Every AI agent registered on AgentMarket can be minted as an iNFT on 0G Chain:

1. **Agent as iNFT**: Each agent's intelligence (fine-tuned model weights, system prompt, tool configurations, conversation history patterns) is encrypted and stored as an iNFT
2. **Agent Marketplace Becomes an NFT Marketplace**: Users can buy/sell AI agents. When ownership transfers, the new owner gets the actual AI intelligence, not just a pointer
3. **AI-as-a-Service via `authorizeUsage()`**: Agent owners can license their iNFT agent to others without transferring ownership -- perfect for AgentMarket's "hire an agent" model
4. **Provable Agent Ownership**: Disputes about agent copying/theft are resolved by on-chain iNFT ownership records

**Implementation**:
```solidity
// contracts/src/AgentINFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@0glabs/contracts/IERC7857.sol";
import "@0glabs/contracts/IOracle.sol";

contract AgentINFT is IERC7857 {
    struct AgentMetadata {
        uint256 agentMarketId;       // Links to AgentRegistry
        bytes32 metadataHash;        // keccak256 of encrypted agent data
        string encryptedURI;         // 0G Storage URI for encrypted intelligence
        address oracle;              // TEE or ZKP oracle for transfers
    }

    mapping(uint256 => AgentMetadata) public agentMetadata;
    mapping(uint256 => mapping(address => bool)) public authorizedUsers;

    // Mint a new agent as iNFT
    function mintAgent(
        uint256 agentMarketId,
        bytes32 metadataHash,
        string calldata encryptedURI,
        address oracle
    ) external returns (uint256 tokenId) {
        tokenId = _mint(msg.sender);
        agentMetadata[tokenId] = AgentMetadata({
            agentMarketId: agentMarketId,
            metadataHash: metadataHash,
            encryptedURI: encryptedURI,
            oracle: oracle
        });
    }

    // Authorize someone to USE the agent without owning it
    // This is the core of AgentMarket's "hire an agent" flow
    function authorizeUsage(uint256 tokenId, address user) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        authorizedUsers[tokenId][user] = true;
        emit UsageAuthorized(tokenId, user);
    }

    // Transfer with oracle re-encryption
    function transferAgent(
        uint256 tokenId,
        address to,
        bytes calldata oracleProof,
        string calldata newEncryptedURI,
        bytes32 newMetadataHash
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        // Verify oracle proof
        require(IOracle(agentMetadata[tokenId].oracle).verify(oracleProof), "Invalid proof");

        // Update metadata for new owner
        agentMetadata[tokenId].encryptedURI = newEncryptedURI;
        agentMetadata[tokenId].metadataHash = newMetadataHash;

        _transfer(msg.sender, to, tokenId);
    }
}
```

**Frontend Integration**:
```typescript
// New page: /agents/[id]/inft
// Shows:
// - iNFT status (minted/not minted)
// - Owner information
// - Authorized users list
// - "Mint as iNFT" button (for agent owners)
// - "Buy Agent" button (transfers iNFT ownership)
// - "Hire Agent" button (calls authorizeUsage, does NOT transfer ownership)
// - Transfer history with oracle verification proofs
```

**Why This Qualifies**: Uses ERC-7857 standard, stores encrypted AI on 0G Storage, uses oracle verification for transfers, and implements `authorizeUsage()` for the AI-as-a-Service model. This is the exact use case iNFTs were designed for.

#### Strategy D: Best Developer Tooling ($4,000)

**Concept**: "AgentMarket SDK - Build AI Agent Commerce in Minutes"

While not the primary focus, we could package AgentMarket's integration patterns as a reusable SDK:
- 0G Compute inference wrapper for agent task execution
- iNFT minting and trading utilities
- Agent registration and payment flow abstractions

**Priority**: LOW - only pursue if time permits. The $4K prize is the smallest and the effort/reward ratio is less favorable than the other three tracks.

### 2.4 Qualification Checklist for 0G Bounties

#### DeFAI ($7K)
- [ ] Implement structured AI decision engine for payment routing
- [ ] Build risk assessment guardrails with configurable thresholds
- [ ] Show AI producing JSON decisions, not just chat
- [ ] Demonstrate automated yield optimization for idle agent funds
- [ ] User approval flow for high-risk decisions (guardrails)

#### AI Inference / 0G Compute ($7K)
- [ ] Install `@0glabs/0g-ts-sdk`
- [ ] Initialize 0G Compute broker with wallet
- [ ] Deposit funds to 0G ledger
- [ ] Acknowledge at least one compute provider
- [ ] Execute real LLM inference for agent tasks via 0G Compute
- [ ] Display provider info and verification proof in UI
- [ ] Show cost comparison vs centralized alternatives

#### iNFT / On-Chain Agent ($7K)
- [ ] Deploy ERC-7857 contract on 0G testnet
- [ ] Implement `mintAgent()` to create iNFT from AgentRegistry agent
- [ ] Implement `authorizeUsage()` for hire-without-transfer model
- [ ] Store encrypted agent metadata on 0G Storage
- [ ] Build iNFT management UI on agent detail page
- [ ] Demo: mint agent -> authorize user -> user hires agent -> agent executes task

---

## 3. ARCHITECTURE INTEGRATION PLAN

### 3.1 Updated System Architecture

```
+------------------------------------------------------------------+
|                        FRONTEND (Next.js 14+)                     |
|  +------------------+  +------------------+  +------------------+ |
|  | Agent Dashboard  |  | Merchant Portal  |  | Checkout Widget  | |
|  | - Browse agents  |  | - Register store |  | - Embeddable     | |
|  | - Hire agents    |  | - Set prices     |  | - QR code pay    | |
|  | - View history   |  | - View analytics |  | - Gas-free       | |
|  | + iNFT status    |  | + Token swap     |  | + Any-token pay  | |
|  | + Swap earnings  |  | + Auto-settle    |  | + Uniswap route  | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
           |                      |                     |
+------------------------------------------------------------------+
|                     WEB3 LAYER (viem + wagmi)                     |
|  +----------+  +----------+  +----------+  +----------+  +-----+ |
|  | ADI Chain|  | Hedera   |  | Kite AI  |  | 0G Chain |  |Base | |
|  | (99999)  |  | (296)    |  | (Ozone)  |  |(testnet) |  |(8453| |
|  +----------+  +----------+  +----------+  +----------+  +-----+ |
+------------------------------------------------------------------+
           |                      |                     |
+------------------------------------------------------------------+
|                      SMART CONTRACTS                              |
|  +-------------------+  +------------------+  +-----------------+ |
|  | ADI Chain         |  | Hedera           |  | 0G Chain        | |
|  | - AgentRegistry   |  | - HSS Scheduler  |  | - AgentINFT     | |
|  | - PaymentRouter   |  | - Subscription   |  |   (ERC-7857)    | |
|  | - ADIPaymaster    |  |   Manager        |  +-----------------+ |
|  | - MerchantVault   |  +------------------+                      |
|  +-------------------+                                            |
+------------------------------------------------------------------+
           |                      |                     |
+------------------------------------------------------------------+
|                     EXTERNAL SERVICES                             |
|  +-------------------+  +------------------+  +-----------------+ |
|  | Uniswap API       |  | 0G Compute       |  | 0G Storage      | |
|  | - /quote          |  | - LLM Inference  |  | - Encrypted     | |
|  | - /swap           |  | - Task execution |  |   agent data    | |
|  | - /order          |  | - Quality scoring|  | - iNFT metadata | |
|  | - Cross-chain     |  | - Verifiable AI  |  |                 | |
|  +-------------------+  +------------------+  +-----------------+ |
+------------------------------------------------------------------+
```

### 3.2 New API Routes

| Route | Method | Purpose | Bounty |
|-------|--------|---------|--------|
| `/api/uniswap/quote` | POST | Get swap quote from Uniswap API | Uniswap |
| `/api/uniswap/swap` | POST | Execute swap (Classic or UniswapX) | Uniswap |
| `/api/uniswap/status` | GET | Check swap/bridge status | Uniswap |
| `/api/0g/inference` | POST | Run AI inference via 0G Compute | 0G Compute |
| `/api/0g/score` | POST | Score agent quality via 0G Compute | 0G DeFAI |
| `/api/0g/inft/mint` | POST | Mint agent as iNFT on 0G Chain | 0G iNFT |
| `/api/0g/inft/authorize` | POST | Authorize user to use iNFT agent | 0G iNFT |

### 3.3 New Frontend Pages/Components

| Page/Component | Purpose | Bounty |
|----------------|---------|--------|
| `/dashboard/swap` | Token swap interface using Uniswap | Uniswap |
| `/agents/[id]/inft` | iNFT management for individual agents | 0G iNFT |
| `<SwapWidget />` | Embeddable swap component in checkout | Uniswap |
| `<INFTBadge />` | Shows iNFT status on agent cards | 0G iNFT |
| `<AIDecisionPanel />` | Shows structured AI decisions for hiring | 0G DeFAI |
| `<ComputeProof />` | Displays 0G verification proofs | 0G Compute |

### 3.4 New Dependencies

```json
{
  "@0glabs/0g-ts-sdk": "latest",
  "ethers": "^6.x"
}
```

**Uniswap API**: No SDK dependency needed -- pure REST API calls with API key.

---

## 4. IMPLEMENTATION PRIORITY & EFFORT ESTIMATES

| Bounty | Prize | Effort (hours) | Complexity | Priority | ROI |
|--------|-------|----------------|------------|----------|-----|
| Uniswap API | $5,000 | 6-8h | Medium | HIGH | $625-833/hr |
| 0G iNFT | $7,000 | 8-12h | High | HIGH | $583-875/hr |
| 0G DeFAI | $7,000 | 6-10h | Medium | HIGH | $700-1167/hr |
| 0G Compute | $7,000 | 6-8h | Medium | HIGH | $875-1167/hr |
| 0G Dev Tools | $4,000 | 8-12h | Medium | LOW | $333-500/hr |

**Recommended Implementation Order**:
1. **0G Compute Inference** (6h) - Easiest 0G integration, replace OpenAI with 0G Compute
2. **Uniswap API Swap** (6h) - Add `/api/uniswap/*` routes + swap UI
3. **0G DeFAI Decisions** (6h) - Add structured AI decision engine using 0G Compute
4. **0G iNFT Agents** (8h) - Deploy ERC-7857 contract + iNFT UI
5. **0G Dev Tools** (skip unless time permits)

**Total Additional Effort**: ~26 hours for $26,000 in additional bounties

---

## 5. UPDATED BOUNTY LEDGER

| # | Bounty | Prize | Status | Priority |
|---|--------|-------|--------|----------|
| 1 | ADI Open | $19,000 | In Progress | PRIMARY |
| 2 | ADI Payments | $3,000 | In Progress | PRIMARY |
| 3 | ADI Paymaster | $3,000 | In Progress | PRIMARY |
| 4 | OpenClaw + Hedera | $10,000 | In Progress | SECONDARY |
| 5 | Hedera Schedule | $5,000 | In Progress | SECONDARY |
| 6 | Kite AI | $10,000 | In Progress | SECONDARY |
| 7 | Base | $10,000 | Planned | TERTIARY |
| 8 | QuickNode | $2,000 | Planned | TERTIARY |
| **9** | **Uniswap API** | **$5,000** | **NEW** | **HIGH** |
| **10** | **0G DeFAI** | **$7,000** | **NEW** | **HIGH** |
| **11** | **0G Compute** | **$7,000** | **NEW** | **HIGH** |
| **12** | **0G iNFT** | **$7,000** | **NEW** | **HIGH** |

**Previous Total**: ~$62,000 across 8 bounties
**New Total**: ~$88,000 across 12 bounties (+$26,000)

---

## APPENDIX: KEY LINKS & RESOURCES

### Uniswap
- API Docs: https://api-docs.uniswap.org/introduction
- Supported Chains: https://api-docs.uniswap.org/guides/supported_chains
- Developer Portal (API Keys): https://developers.uniswap.org/dashboard
- AI Skills Repo: https://github.com/Uniswap/uniswap-ai
- AI Skills Docs: https://ul-ai-docs.vercel.app/
- LLM-friendly API Docs: https://api-docs.uniswap.org/llms.txt
- API Support: apisupport@uniswap.org

### 0G Labs
- Main Docs: https://docs.0g.ai/
- iNFT Concepts: https://docs.0g.ai/concepts/inft
- ERC-7857 Standard: https://docs.0g.ai/developer-hub/building-on-0g/inft/erc7857
- iNFT Integration Guide: https://docs.0g.ai/developer-hub/building-on-0g/inft/integration
- Compute Network: https://docs.0g.ai/concepts/compute
- Compute SDK: https://docs.0g.ai/developer-hub/building-on-0g/compute-network/sdk
- Testnet RPC: https://evmrpc-testnet.0g.ai
- ETHDenver Bounties: https://ethdenver2026.devfolio.co/prizes?partner=0g+Labs

### ETHDenver 2026
- Devfolio: https://ethdenver2026.devfolio.co/
- All Prizes: https://ethdenver2026.devfolio.co/prizes
