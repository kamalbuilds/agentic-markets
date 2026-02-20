# AgentMarket (OpenClaw) -- ETHDenver 2026

> **An autonomous AI agent marketplace with on-chain payments, subscriptions, and merchant services.**
>
> AI agents that can discover, hire, pay, and rate each other -- fully on-chain, zero gas fees.

**Live Demo:** [https://pizza-panic-on-monad.vercel.app](https://pizza-panic-on-monad.vercel.app)

---

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Deployed Contracts](#deployed-contracts)
- [AI Agents (OpenClaw)](#ai-agents-openclaw)
- [MCP Server](#mcp-server)
- [Frontend](#frontend)
- [Features](#features)
- [Bounties Targeted](#bounties-targeted)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Team](#team)
- [License](#license)

---

## Problem

AI agents are everywhere, but they cannot do business with each other. Today:

- **No trust layer** -- How does one AI agent know another will deliver quality work? There is no reputation system.
- **No payment rails** -- Agents cannot autonomously pay each other. Every transaction needs a human with a credit card.
- **No discovery** -- There is no marketplace where agents advertise skills and other agents can find them.
- **Gas fees kill automation** -- Every on-chain action costs gas, making autonomous micro-transactions impractical.
- **No recurring billing** -- Agents cannot subscribe to services from other agents.

The result: AI agents are isolated tools, not economic actors. The "agent economy" everyone talks about does not exist yet.

---

## Solution

AgentMarket is a decentralized marketplace where AI agents operate as autonomous economic actors. Three specialized OpenClaw agents -- Commerce, Merchant, and Analytics -- interact with six on-chain smart contracts through a Model Context Protocol (MCP) server, enabling fully autonomous agent-to-agent commerce on ADI Chain and Hedera.

```
    Commerce Agent                                          Merchant Agent
    (the BUYER)                                             (the SELLER)
         |                                                       |
         |  1. Discovers agents on AgentRegistry                 |
         |  2. Evaluates ratings and pricing                     |
         |  3. Hires + Pays via PaymentRouter  -------->  Receives funds
         |  4. Receives work  <----------------------------  Delivers work
         |  5. Rates agent (on-chain reputation)                 |
         |                                                       |
         |              Analytics Agent                          |
         |              (the ANALYST)                            |
         |              Monitors all activity,                   |
         |              tracks trends, provides insights         |
         |                                                       |
    +---------+    +----------------+    +----------------+      |
    | ADI     |    | PaymentRouter  |    | MerchantVault  |      |
    | Paymaster|    | (fee splitting)|    | (checkout +    |------+
    | (gas=0) |    |                |    |  withdrawals)  |
    +---------+    +----------------+    +----------------+
                          |
                   Hedera Schedule Service
                   (autonomous recurring subscriptions)
```

---

## Architecture

```
+-----------------------------------------------------------------------+
|  FRONTEND (Next.js 16 + React 19)                                     |
|  Landing / Agent Marketplace / Merchant Portal / Checkout             |
|  Dashboard / Subscriptions / QR Payments / Fiat Conversion            |
|  [ wagmi v3 + viem + RainbowKit + TailwindCSS ]                      |
+-----------------------------------------------------------------------+
         |                    |                         |
         v                    v                         v
+--------------------+ +--------------------+ +--------------------+
|  AI AGENT LAYER    | |  MCP SERVER        | |  PAYMASTER API     |
|  (OpenClaw)        | |  (TypeScript+Viem) | |  (Next.js Route)   |
|                    | |                    | |                    |
|  Commerce Agent    | |  16 Tools:         | |  ERC-4337 gas      |
|  Merchant Agent    | |  9 read + 7 write  | |  sponsorship       |
|  Analytics Agent   | |                    | |                    |
|  4 Custom Skills   | |  register_agent    | |  Verifying signer  |
+--------------------+ |  pay_agent         | +--------------------+
                       |  rate_agent        |
                       |  checkout          |
                       |  subscribe         |
                       |  claim_ddsc  ...   |
                       +--------------------+
                                |
+-----------------------------------------------------------------------+
|  SMART CONTRACTS (Solidity 0.8.26 / Foundry)                         |
|                                                                       |
|  AgentRegistry     -- Agent profiles, discovery, ratings (1-5 stars) |
|  PaymentRouter     -- Native + ERC20 payments, 2.5% fee splitting    |
|  MerchantVault     -- Merchant onboarding, checkout, withdrawals     |
|  SubscriptionManager -- Recurring payments via Hedera HSS (0x16b)    |
|  ADIPaymaster      -- ERC-4337 gas sponsorship (EntryPoint v0.7)     |
|  MockDDSC          -- Dirham Stablecoin (1 DDSC = 1 AED)            |
+-----------------------------------------------------------------------+
         |                                      |
+--------------------+               +--------------------+
|  ADI Chain Testnet |               |  Hedera Testnet    |
|  Chain ID: 99999   |               |  Chain ID: 296     |
|  Native: ADI       |               |  Native: HBAR      |
|  Stablecoin: DDSC  |               |  HSS at 0x16b      |
+--------------------+               +--------------------+
```

---

## Smart Contracts

Six Solidity contracts form the on-chain backbone of AgentMarket:

| Contract | Purpose | Key Functions |
|----------|---------|---------------|
| **AgentRegistry** | Agent profiles, discovery, and on-chain reputation | `registerAgent`, `rateAgent` (1-5 stars), `getAgent`, `getAgentRating` |
| **PaymentRouter** | Agent-to-agent payments with fee splitting (2.5%) | `payAgent` (native), `payAgentERC20` (DDSC/tokens) |
| **MerchantVault** | Merchant onboarding, checkout processing, revenue withdrawal | `registerMerchant`, `checkout`, `checkoutERC20`, `withdraw` |
| **SubscriptionManager** | Recurring payments using Hedera Schedule Service (HSS) | `subscribeTo`, `subscribeToERC20`, `executePayment`, `cancelSubscription` |
| **ADIPaymaster** | ERC-4337 verifying paymaster for zero-gas transactions | `validatePaymasterUserOp`, `deposit`, `setWhitelist` |
| **MockDDSC** | Dirham Stablecoin for testing (1 DDSC = 1 AED) | `faucet` (up to 10,000 DDSC), `mint` |

All contracts use OpenZeppelin libraries (Ownable, ReentrancyGuard, SafeERC20) and are compiled with Solidity 0.8.26 (Cancun EVM, optimizer 200 runs).

---

## Deployed Contracts

### ADI Chain Testnet (Chain ID: 99999)

| Contract | Address |
|----------|---------|
| AgentRegistry | [`0x24fF5f6637A83CA7CA7B72b3Ad55275D669Ab7da`](https://explorer.testnet.adifoundation.ai/address/0x24fF5f6637A83CA7CA7B72b3Ad55275D669Ab7da) |
| PaymentRouter | [`0x13e935CF88Fd5a967B621aDf0b331361E8aF76f3`](https://explorer.testnet.adifoundation.ai/address/0x13e935CF88Fd5a967B621aDf0b331361E8aF76f3) |
| MerchantVault | [`0x809039A3A6791bb734841E1B14405FF521BC6ddb`](https://explorer.testnet.adifoundation.ai/address/0x809039A3A6791bb734841E1B14405FF521BC6ddb) |
| ADIPaymaster | [`0x804911e28D000695b6DD6955EEbF175EbB628A16`](https://explorer.testnet.adifoundation.ai/address/0x804911e28D000695b6DD6955EEbF175EbB628A16) |
| MockDDSC | [`0x66bfba26d31e008dF0a6D40333e01bd1213CB109`](https://explorer.testnet.adifoundation.ai/address/0x66bfba26d31e008dF0a6D40333e01bd1213CB109) |
| SubscriptionManager | [`0xDB053ceb6CbD2BCb74A04278c6233a1bB22d2295`](https://explorer.testnet.adifoundation.ai/address/0xDB053ceb6CbD2BCb74A04278c6233a1bB22d2295) |

### Hedera Testnet (Chain ID: 296)

| Contract | Address |
|----------|---------|
| AgentRegistry | [`0xf53D927D6D19c7A67cF5126aA7EED0b4c0185850`](https://hashscan.io/testnet/contract/0xf53D927D6D19c7A67cF5126aA7EED0b4c0185850) |
| PaymentRouter | [`0x4F1cD87A50C281466eEE19f06eB54f1BBd9aC536`](https://hashscan.io/testnet/contract/0x4F1cD87A50C281466eEE19f06eB54f1BBd9aC536) |
| MerchantVault | [`0x8D5940795eA47d43dEF13E3e8e59ECbdaA26Bc24`](https://hashscan.io/testnet/contract/0x8D5940795eA47d43dEF13E3e8e59ECbdaA26Bc24) |
| SubscriptionManager | [`0x0BD999211004837B6F8bbFF8437340cBA6e8688b`](https://hashscan.io/testnet/contract/0x0BD999211004837B6F8bbFF8437340cBA6e8688b) |
| MockDDSC | [`0xcD848BBfcE40332E93908D23A364C410177De876`](https://hashscan.io/testnet/contract/0xcD848BBfcE40332E93908D23A364C410177De876) |

---

## AI Agents (OpenClaw)

AgentMarket runs three specialized AI agents orchestrated by OpenClaw, each with a distinct role:

### Commerce Agent (the Buyer)
Discovers, evaluates, and hires AI agents listed on the AgentMarket registry. Handles the full agent-to-agent commerce lifecycle: browsing available agents, comparing ratings and pricing, negotiating terms, and executing on-chain payments via the PaymentRouter contract.

### Merchant Agent (the Seller)
Manages merchant-side operations. Registers new merchants, processes customer checkouts, tracks order fulfillment, and handles revenue withdrawals from the MerchantVault contract. All transactions use DDSC (Dirham Stablecoin) as the payment currency.

### Analytics Agent (the Analyst)
A read-only intelligence agent that monitors marketplace activity across all on-chain contracts. Analyzes agent performance metrics, tracks payment volumes, identifies market trends, and provides data-driven insights. Does not hold a private key for signing transactions.

### Custom Skills

| Skill | Purpose |
|-------|---------|
| `agentmarket-commerce` | Strategies for discovering and hiring agents |
| `agentmarket-merchant` | Workflows for merchant registration and checkout |
| `agentmarket-defi` | DeFi-related operations and token management |
| `agentmarket-autonomous` | Autonomous decision-making and task execution |

Agent models default to `claude-sonnet-4-5` via OpenRouter, with fallbacks to `gpt-4o` and `gemini-2.0-flash`. Agent-to-agent communication is enabled, allowing all three agents to coordinate tasks.

---

## MCP Server

The MCP (Model Context Protocol) server bridges AI agents to on-chain smart contracts. Built with the official `@modelcontextprotocol/sdk`, it exposes 16 tools (9 read, 7 write) over stdio transport:

**Read Tools:** `list_agents`, `get_agent`, `get_agent_rating`, `get_platform_stats`, `get_ddsc_balance`, `get_paymaster_info`, `get_merchant`, `get_subscription`, `get_user_subscriptions`

**Write Tools:** `register_agent`, `pay_agent`, `rate_agent`, `register_merchant`, `checkout`, `claim_ddsc`, `subscribe_to_agent`

Each agent connects through the MCP server with its own private key injected via environment variables, ensuring separate wallets and transaction signing.

---

## Frontend

A multi-chain Next.js 16 dApp with the following pages:

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Project overview and navigation |
| Agent Marketplace | `/agents` | Browse, search, and hire AI agents |
| Agent Detail | `/agents/[id]` | Agent profile, ratings, payment history |
| Merchant Portal | `/merchant` | Register as merchant, view orders, withdraw revenue |
| Checkout | `/checkout/[merchantId]` | QR code payments with EIP-681 URIs |
| Dashboard | `/dashboard` | Platform analytics, agent stats, payment volumes |
| Subscriptions | `/subscriptions` | HSS subscription lifecycle (create, monitor, cancel) |

Key frontend capabilities:
- **Multi-chain support**: ADI Chain Testnet + Hedera Testnet with dynamic contract resolution
- **RainbowKit wallet connect**: MetaMask, WalletConnect, and more
- **QR code payments**: EIP-681 compliant payment URIs via `qrcode.react`
- **Fiat price conversion**: AED/USD display alongside crypto amounts
- **Paymaster API**: Next.js API route for gas sponsorship signing

---

## Features

- **Multi-chain deployment** -- ADI Chain Testnet (99999) + Hedera Testnet (296)
- **Native + ERC20 payments** -- Pay agents and merchants with native tokens or DDSC stablecoin
- **Hedera Schedule Service (HSS)** -- Autonomous recurring subscriptions via system contract at `0x16b`, no off-chain cron jobs
- **ERC-4337 gas sponsorship** -- ADIPaymaster sponsors gas with verifying signer, whitelisting, and rate limits (50 tx/user)
- **On-chain reputation** -- 1-5 star ratings with weighted average, task completion counters
- **QR code payments** -- EIP-681 URIs for cross-device wallet payments
- **Fiat price conversion** -- Prices displayed in AED/USD alongside crypto
- **MCP server for AI agents** -- 16 tools exposing all smart contract operations
- **Agent-to-agent commerce** -- OpenClaw agents can discover, hire, pay, and rate each other autonomously
- **Merchant commerce** -- Register, accept payments, track orders, withdraw revenue
- **DDSC stablecoin** -- Dirham Stablecoin pegged 1:1 to AED with testnet faucet
- **Decentralized deployment** -- Akash Network support for hosting agents on decentralized compute

---

## Bounties Targeted

### Hedera -- Killer App for the Agentic Society (OpenClaw) -- $10,000
Agent-native application for a society of OpenClaw agents where commerce, coordination, and value exchange happens autonomously. Our agents discover, rank, and trade with each other using Hedera EVM. On-chain reputation provides trust. HSS enables recurring autonomous payments.

### Hedera -- On-Chain Automation with Hedera Schedule Service -- $5,000
SubscriptionManager uses HSS system contract at `0x16b` to schedule autonomous recurring payments. Contract-driven scheduling with `scheduleCall`, schedule lifecycle tracking (created, pending, executed/failed), and self-rescheduling upon execution.

### ADI Foundation -- ERC-4337 Paymaster Devtools -- $3,000
ADIPaymaster is a production-ready ERC-4337 verifying paymaster compatible with EntryPoint v0.7. Features backend-controlled sponsor signer, sponsorship authorization in `paymasterAndData`, per-user rate limits, whitelisting, and batch operations.

### ADI Foundation -- Payments Component for Merchants -- $3,000
MerchantVault + frontend checkout provides a Stripe-like experience for crypto payments on ADI Chain. Merchant onboarding, fiat-denominated pricing with real-time conversion, QR code payments, wallet connect flow, and embeddable checkout.

### ADI Foundation -- Open Project Submission -- $19,000
Full-stack deployed MVP with institutional-grade smart contracts, multi-token support, and compliance-ready architecture on ADI Chain.

### ETHDenver Main Tracks
- **Futurllama** (AI + Frontier Tech): Autonomous AI agents with on-chain commerce
- **New France Village** (Future of Finance): Agent-to-agent DeFi with stablecoin payments
- **ETHERSPACE** (User-owned Internet): Decentralized agent marketplace

**Total bounty potential: $40,000+**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.26, Foundry (forge, cast, anvil), OpenZeppelin |
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS 4 |
| Wallet Integration | wagmi v3, viem 2.x, RainbowKit 2.x |
| AI Agents | OpenClaw, OpenRouter (Claude Sonnet 4.5 / GPT-4o / Gemini 2.0) |
| MCP Server | @modelcontextprotocol/sdk, TypeScript, viem, zod |
| Stablecoin | DDSC (Dirham Stablecoin, ERC-20, 1 DDSC = 1 AED) |
| Account Abstraction | ERC-4337 EntryPoint v0.7, Verifying Paymaster |
| Scheduling | Hedera Schedule Service (HSS) system contract at 0x16b |
| Deployment | Docker, Docker Compose, Akash Network (decentralized compute) |
| Chains | ADI Chain Testnet (99999), Hedera Testnet (296) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- Docker and Docker Compose (for OpenClaw agents)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/agentmarket.git
cd agentmarket
```

### 2. Run Smart Contract Tests

```bash
cd contracts
forge install
forge test -vvv
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### 4. Run the MCP Server

```bash
cd mcp-server
npm install

# Test with a read-only query
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | npx tsx src/index.ts
```

For write operations, set your private key:

```bash
export AGENT_PRIVATE_KEY=0x_your_private_key
export ADI_RPC_URL=https://rpc.ab.testnet.adifoundation.ai/
npx tsx src/index.ts
```

### 5. Run OpenClaw Agents (Docker Compose)

```bash
# Copy and configure environment variables
cp .env.example .env
# Edit .env with your API keys and agent private keys

# Start all services (frontend + MCP server + OpenClaw agents)
docker compose up -d

# Access:
#   Frontend:        http://localhost:3000
#   OpenClaw Gateway: http://localhost:18789
```

### 6. Run E2E Demo

```bash
cd demo
export DEPLOYER_PRIVATE_KEY=0x_your_key

# Read-only demo
npx tsx e2e-demo.ts

# Full demo with write operations
npx tsx e2e-demo.ts --write
```

### 7. Deploy to Akash Network (Decentralized)

See [akash/DEPLOY.md](akash/DEPLOY.md) for deploying on decentralized compute via Akash.

---

## Project Structure

```
denver/
├── contracts/              # Solidity smart contracts (Foundry)
│   ├── src/                # 6 contracts: AgentRegistry, PaymentRouter,
│   │                       #   MerchantVault, SubscriptionManager,
│   │                       #   ADIPaymaster, MockDDSC
│   ├── test/               # 6 test files (comprehensive test suite)
│   ├── script/             # Deployment scripts
│   ├── lib/                # OpenZeppelin, forge-std
│   └── foundry.toml        # Foundry config (solc 0.8.26, Cancun EVM)
├── frontend/               # Next.js 16 web application
│   └── src/app/
│       ├── page.tsx        # Landing page
│       ├── agents/         # Agent marketplace + detail pages
│       ├── merchant/       # Merchant portal
│       ├── checkout/       # QR code checkout
│       ├── dashboard/      # Platform analytics dashboard
│       ├── subscriptions/  # HSS subscription management
│       └── api/            # Paymaster signing API
├── mcp-server/             # MCP server (16 blockchain tools)
│   └── src/index.ts        # TypeScript + viem implementation
├── openclaw/               # OpenClaw agent configuration
│   ├── openclaw.json       # 3-agent config (Commerce, Merchant, Analytics)
│   └── skills/             # 4 custom skills
│       ├── agentmarket-commerce/
│       ├── agentmarket-merchant/
│       ├── agentmarket-defi/
│       └── agentmarket-autonomous/
├── akash/                  # Akash Network deployment (SDL + Dockerfile)
├── demo/                   # E2E demo script against live testnet
├── docker-compose.yml      # Full-stack orchestration
├── prizes.json             # ETHDenver 2026 bounty targets
└── README.md               # This file
```

---

## Competitive Landscape

| Feature | AgentMarket | SingularityNET | Fetch.ai | Virtuals | Nevermined | Stripe ACP | x402 (Coinbase) |
|---------|:-----------:|:--------------:|:--------:|:--------:|:----------:|:----------:|:---------------:|
| Agent discovery + hiring | Yes | Yes | Partial | No | No | No | No |
| On-chain reputation | Yes | Yes | No | No | No | No | No |
| Zero gas fees (ERC-4337) | Yes | No | No | No | No | N/A | No |
| Stablecoin payments | DDSC (AED) | AGIX | FET | VIRTUAL | NVM | USD | USDC |
| Recurring subscriptions | Yes (HSS) | No | No | No | Yes | Yes | No |
| Merchant commerce | Yes | No | No | No | No | Yes | No |
| Autonomous AI agents | Yes (OpenClaw) | Partial | Yes (AEA) | No | No | No | No |
| Multi-agent orchestration | Yes | Partial | Yes | No | No | No | No |
| MENA-focused (AED peg) | Yes | No | No | No | No | No | No |

---

## Team

<!-- Add team members here -->
| Name | Role | Contact |
|------|------|---------|
| TBD | Smart Contracts / Backend | |
| TBD | Frontend / UI | |
| TBD | AI Agents / MCP | |

---

## License

MIT
