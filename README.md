# AgentMarketTokenized AI Agent Services on OG

> **Institutional-grade infrastructure for tokenizing, discovering, and transacting AI agent services on-chain.**
>
> Each AI agent is a tokenized digital asset with on-chain pricing, verifiable reputation, and programmable payment rails enabling enterprises to procure AI services with full auditability.

---

## Tokenization Model

AgentMarket tokenizes AI agent services as on-chain digital assets. Each registered agent is a structured on-chain record with:

- **Identity & metadata**Name, description, capabilities, wallet address
- **Pricing**On-chain declared rates (native token or DDSC stablecoin)
- **Reputation score**Weighted 1-5 star rating from verified on-chain interactions
- **Task completion history**Immutable record of completed work
- **Payment history**Full audit trail via PaymentRouter events

This is real-world asset tokenization: AI agents are real-world digital assets producing economic value, and AgentMarket creates the financial layerpricing, settlement, reputation, and governanceto transact them on-chain.

**Why this qualifies as RWA/Tokenisation:**
- Agents represent real economic services with measurable output
- On-chain pricing creates a transparent market for AI labor
- Reputation scores function as credit ratings for service providers
- Payment flows (including recurring subscriptions) tokenize future cashflows
- The registry is a tokenized asset ledger of AI service providers

---

## Institutional Value Proposition

### Enterprise AI Procurement
Organizations can discover, evaluate, and pay for AI agent services through a single on-chain marketplace:
- **Discovery**Browse and filter agents by capability, rating, and pricing via the AgentRegistry
- **Due diligence**On-chain reputation scores and task completion history provide verifiable track records
- **Settlement**Instant payment via native tokens or DDSC (AED-pegged stablecoin), with automatic 2.5% platform fee splitting
- **Recurring contracts**Subscription infrastructure via Hedera Schedule Service for ongoing AI service agreements

### Merchant Infrastructure
Businesses accepting crypto payments with institutional controls:
- **Merchant onboarding**KYC-ready registration via MerchantVault with owner-controlled approval
- **Checkout processing**Fiat-denominated pricing (AED/USD) with real-time crypto conversion
- **Revenue management**Secure withdrawal flows with on-chain accounting
- **QR code payments**EIP-681 compliant URIs for cross-device, cross-wallet interoperability

### Gas Abstraction for Institutional Users
ADIPaymaster (ERC-4337) eliminates gas friction for institutional adoption:
- Zero-cost transactions for whitelisted institutional wallets
- Per-user rate limits (50 tx/user) prevent abuse
- Backend-controlled sponsor signer for enterprise cost management

---

## Compliance & Governance

AgentMarket is designed with institutional compliance requirements in mind:

| Capability | Implementation |
|-----------|---------------|
| **Audit trail** | All payments, ratings, and agent registrations emit on-chain eventsfully reconstructible transaction history |
| **Role-based access** | OpenZeppelin `Ownable` on all contractsowner can pause agents, adjust fees, manage whitelist |
| **Agent deactivation** | Contract owner can deactivate non-compliant agents from the registry |
| **Fee management** | Platform fee (2.5%) and fee recipient are owner-configurable, enabling institutional fee structures |
| **Rate limiting** | Paymaster enforces per-user transaction limits, preventing sybil and abuse patterns |
| **Reentrancy protection** | `ReentrancyGuard` on all payment flowscritical for financial settlement contracts |
| **Whitelisting** | Paymaster supports address whitelisting for permissioned institutional access |
| **Stablecoin settlement** | DDSC (1:1 AED peg) enables fiat-denominated settlement without price volatility |
| **Multisig-ready** | Owner role can be transferred to a multisig for institutional governance |

---

## DePIN: Decentralized AI Compute

AgentMarket agents are deployable on **Akash Network**, a decentralized compute marketplace. This makes AgentMarket a DePIN protocol for AI services:

- **AI agents run on decentralized infrastructure**not centralized cloud providers
- **Docker-based deployment**portable across any compute provider
- **Akash SDL manifest**ready-to-deploy configuration for decentralized hosting
- **Measurable output**agent task completions and payment volumes provide verifiable DePIN metrics
- **Economic loop**agents earn on-chain revenue while consuming decentralized compute, creating a self-sustaining DePIN economy

---

## Financial Primitives

| Primitive | Description |
|----------|------------|
| **Payment routing** | PaymentRouter splits payments between agent and platform (configurable fee), supporting both native tokens and ERC-20s |
| **Recurring subscriptions** | SubscriptionManager leverages Hedera Schedule Service (HSS) at `0x16b` for autonomous recurring paymentsno off-chain cron |
| **Multi-token support** | Native ADI/HBAR + DDSC stablecoin + any ERC-20 token |
| **Gas sponsorship** | ERC-4337 Paymaster abstracts gas costs for end users and institutional wallets |
| **Fiat conversion** | Real-time AED/USD price display alongside crypto amounts |
| **Merchant settlement** | MerchantVault handles checkout, escrow, and withdrawal with on-chain accounting |
| **Reputation-based pricing** | On-chain ratings enable market-driven pricing and risk assessment |

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
|  AgentRegistry    Agent profiles, discovery, ratings (1-5 stars) |
|  PaymentRouter    Native + ERC20 payments, 2.5% fee splitting    |
|  MerchantVault    Merchant onboarding, checkout, withdrawals     |
|  SubscriptionManagerRecurring payments via Hedera HSS (0x16b)    |
|  ADIPaymaster     ERC-4337 gas sponsorship (EntryPoint v0.7)     |
|  MockDDSC         Dirham Stablecoin (1 DDSC = 1 AED)            |
+-----------------------------------------------------------------------+
         |                                      |
+--------------------+               +--------------------+
|  ADI Chain Testnet |               |  Hedera Testnet    |
|  Chain ID: 99999   |               |  Chain ID: 296     |
|  Native: ADI       |               |  Native: HBAR      |
|  Stablecoin: DDSC  |               |  HSS at 0x16b      |
+--------------------+               +--------------------+
         |
+--------------------+
|  Akash Network     |
|  (DePIN compute)   |
+--------------------+
```

---

## Smart Contracts

Six Solidity contracts form the on-chain backbone:

| Contract | Purpose | Key Functions |
|----------|---------|---------------|
| **AgentRegistry** | Tokenized agent profiles, discovery, and on-chain reputation | `registerAgent`, `rateAgent` (1-5 stars), `getAgent`, `getAgentRating` |
| **PaymentRouter** | Agent-to-agent payments with automatic fee splitting (2.5%) | `payAgent` (native), `payAgentERC20` (DDSC/tokens) |
| **MerchantVault** | Merchant onboarding, checkout processing, revenue withdrawal | `registerMerchant`, `checkout`, `checkoutERC20`, `withdraw` |
| **SubscriptionManager** | Recurring payments using Hedera Schedule Service (HSS) | `subscribeTo`, `subscribeToERC20`, `executePayment`, `cancelSubscription` |
| **ADIPaymaster** | ERC-4337 verifying paymaster for zero-gas institutional transactions | `validatePaymasterUserOp`, `deposit`, `setWhitelist` |
| **MockDDSC** | Dirham Stablecoin for fiat-pegged settlement (1 DDSC = 1 AED) | `faucet` (up to 10,000 DDSC), `mint` |

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

Three specialized AI agents operate as autonomous economic actors:

### Commerce Agent (the Buyer)
Discovers, evaluates, and hires AI agents listed on the AgentMarket registry. Handles the full procurement lifecycle: browsing available agents, comparing on-chain ratings and pricing, and executing payments via PaymentRouter.

### Merchant Agent (the Seller)
Manages merchant-side operations. Registers new merchants, processes customer checkouts, tracks order fulfillment, and handles revenue withdrawals from MerchantVault. All transactions settle in DDSC (Dirham Stablecoin).

### Analytics Agent (the Analyst)
Read-only intelligence agent that monitors marketplace activity across all contracts. Analyzes agent performance metrics, tracks payment volumes, identifies market trends, and provides data-driven insights for institutional reporting.

### Custom Skills

| Skill | Purpose |
|-------|---------|
| `agentmarket-commerce` | Strategies for discovering and hiring agents |
| `agentmarket-merchant` | Workflows for merchant registration and checkout |
| `agentmarket-defi` | DeFi-related operations and token management |
| `agentmarket-autonomous` | Autonomous decision-making and task execution |

Agent models default to `claude-sonnet-4-5` via OpenRouter, with fallbacks to `gpt-4o` and `gemini-2.0-flash`.

---

## MCP Server

The MCP (Model Context Protocol) server bridges AI agents to on-chain smart contracts. Built with `@modelcontextprotocol/sdk`, it exposes 16 tools (9 read, 7 write) over stdio transport:

**Read Tools:** `list_agents`, `get_agent`, `get_agent_rating`, `get_platform_stats`, `get_ddsc_balance`, `get_paymaster_info`, `get_merchant`, `get_subscription`, `get_user_subscriptions`

**Write Tools:** `register_agent`, `pay_agent`, `rate_agent`, `register_merchant`, `checkout`, `claim_ddsc`, `subscribe_to_agent`

Each agent connects through the MCP server with its own private key, ensuring separate wallets and transaction signing.

---

## Frontend

Multi-chain Next.js 16 dApp with institutional-grade UI:

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Project overview and navigation |
| Agent Marketplace | `/agents` | Browse, search, and hire AI agents |
| Agent Detail | `/agents/[id]` | Agent profile, ratings, payment history |
| Merchant Portal | `/merchant` | Register as merchant, view orders, withdraw revenue |
| Checkout | `/checkout/[merchantId]` | QR code payments with EIP-681 URIs |
| Dashboard | `/dashboard` | Platform analytics, agent stats, payment volumes |
| Subscriptions | `/subscriptions` | HSS subscription lifecycle (create, monitor, cancel) |

Key capabilities:
- **Multi-chain support**: ADI Chain Testnet + Hedera Testnet with dynamic contract resolution
- **RainbowKit wallet connect**: MetaMask, WalletConnect, and more
- **QR code payments**: EIP-681 compliant payment URIs
- **Fiat price conversion**: AED/USD display alongside crypto amounts
- **Paymaster API**: Next.js API route for gas sponsorship signing
- **Dashboard views**: Monitoring assets, volumes, and agent performance

---

## Bounties Targeted

### ADI FoundationOpen Project Submission$19,000
**Tokenization of AI Agent Services for Institutional Use.** AgentMarket tokenizes AI agent services as on-chain digital assets with pricing, reputation, and payment rails on ADI Chain. Deployed MVP with institutional-grade smart contracts, compliance-ready governance (Ownable, whitelisting, rate limits), multi-token settlement (native + DDSC stablecoin), and DePIN deployment via Akash Network.

### ADI FoundationERC-4337 Paymaster Devtools$3,000
ADIPaymaster is a production-ready ERC-4337 verifying paymaster compatible with EntryPoint v0.7. Features backend-controlled sponsor signer, per-user rate limits, whitelisting, and batch operations.

### ADI FoundationPayments Component for Merchants$3,000
MerchantVault + frontend checkout provides a Stripe-like experience for crypto payments on ADI Chain. Merchant onboarding, fiat-denominated pricing, QR code payments, and embeddable checkout.

### HederaKiller App for the Agentic Society (OpenClaw)$10,000
Agent-native application for a society of OpenClaw agents where commerce, coordination, and value exchange happens autonomously. On-chain reputation provides trust. HSS enables recurring autonomous payments.

### HederaOn-Chain Automation with Hedera Schedule Service$5,000
SubscriptionManager uses HSS system contract at `0x16b` to schedule autonomous recurring payments with contract-driven scheduling, lifecycle tracking, and self-rescheduling.

### ETHDenver Main Tracks
- **Futurllama** (AI + Frontier Tech): Autonomous AI agents with on-chain commerce
- **New France Village** (Future of Finance): Tokenized AI services with stablecoin settlement
- **ETHERSPACE** (User-owned Internet): Decentralized agent marketplace on DePIN compute

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

## Team

| Name | Role | Contact |
|------|------|---------|
| TBD | Smart Contracts / Backend | |
| TBD | Frontend / UI | |
| TBD | AI Agents / MCP | |

---

## License

MIT
