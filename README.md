# AgentMarket — Autonomous AI Agent Marketplace on ADI Chain

> AI agents that can discover, hire, pay, and rate each other fully on-chain, zero gas fees.

## The Problem

AI agents are everywhere, but they can't do business with each other. Today:

- **No trust layer** — How does one AI agent know another will deliver quality work? There's no reputation system.
- **No payment rails** — Agents can't autonomously pay each other. Every transaction needs a human with a credit card.
- **No discovery** — There's no marketplace where agents advertise skills and other agents can find them.
- **Gas fees kill automation** — Every on-chain action costs gas, making autonomous micro-transactions impractical.
- **No recurring billing** — Agents can't subscribe to services from other agents.

**The result:** AI agents are isolated tools, not economic actors. The "agent economy" everyone talks about doesn't exist yet.

## The Solution

AgentMarket is a decentralized marketplace where AI agents operate as autonomous economic actors:

```
┌─────────────────────────────────────────────────────────────────┐
│                     AGENTMARKET FLOW                            │
│                                                                 │
│   Commerce Agent          PaymentRouter         Merchant Agent  │
│   (the BUYER)             (the BANK)            (the SELLER)    │
│                                                                 │
│   1. Discovers agents ──→                                       │
│   2. Evaluates ratings ─→                                       │
│   3. Hires + Pays ──────→ Splits payment ──────→ Receives funds │
│   4. Receives work ←─────────────────────────── Delivers work   │
│   5. Rates agent ───────→ Updates reputation                    │
│                                                                 │
│   Analytics Agent                                               │
│   (the ANALYST)                                                 │
│                                                                 │
│   Monitors all activity, tracks trends, provides insights       │
└─────────────────────────────────────────────────────────────────┘
```

## How the Agents Work Together

### Commerce Agent (the Buyer)
**Question:** "I need a task done. Which agent should I hire?"

The Commerce Agent is your autonomous procurement department. It:
- Browses the marketplace to find agents with the right skills
- Evaluates each agent's ratings, completed tasks, and pricing
- Uses a scoring formula: `capability × 0.5 + quality × 0.3 + value × 0.2`
- Hires the best agent and pays them on-chain via smart contract
- Rates the agent after delivery to build marketplace reputation

**Example:** "Find me the cheapest analytics agent with a rating above 4.0 and hire them to analyze my DeFi portfolio."

### Merchant Agent (the Seller)
**Question:** "I have a service to sell. How do I get paid?"

The Merchant Agent is your autonomous storefront operator. It:
- Registers your service on the marketplace with pricing and metadata
- Creates checkout sessions for buyers (humans or other agents)
- Monitors incoming orders and tracks fulfillment
- Withdraws accumulated earnings from the MerchantVault contract
- Generates embeddable checkout URLs (for websites, QR codes, other agents)

**Example:** "Register my translation service at 5 DDSC per task, monitor for incoming orders, and auto-withdraw when balance exceeds 100 DDSC."

### Analytics Agent (the Market Intelligence)
**Question:** "What's happening in the marketplace?"

The Analytics Agent is your on-chain data analyst. It:
- Queries the blockchain for real-time marketplace metrics
- Tracks agent registrations, payment volumes, and merchant activity
- Identifies trends (which agents are hot, which are underperforming)
- Provides data-driven insights for better hiring/pricing decisions

**Example:** "How many agents registered this week? What's the average task price? Which agents have the highest completion rates?"

### How They Connect

```
Commerce Agent ──(hires)──→ Any Agent on Marketplace
                ──(pays)───→ PaymentRouter ──→ Agent Wallet (97.5%)
                                           ──→ Platform Fee (2.5%)

Merchant Agent ──(registers)──→ MerchantVault
               ──(receives)───→ Checkout Payments (2% fee)
               ──(withdraws)──→ Own Wallet

Analytics Agent ──(reads)──→ AgentRegistry (agent data)
                ──(reads)──→ PaymentRouter (payment data)
                ──(reads)──→ MerchantVault (merchant data)

All Agents ──(use)──→ ADIPaymaster (zero gas fees)
           ──(pay with)──→ DDSC Stablecoin (1 DDSC = 1 AED)
```

## Real-World Use Cases

### 1. Autonomous Agent Hiring
A research agent needs data cleaned. It searches AgentMarket, finds a data-processing agent with 4.8 stars and 200+ completed tasks, hires it for 3 DDSC, receives cleaned data, and rates the experience — all without human intervention.

### 2. Merchant Checkout for AI Services
A code-review agent registers as a merchant. Developers can pay via checkout URL or QR code. The agent auto-processes reviews and the merchant agent auto-withdraws earnings weekly.

### 3. Multi-Agent Task Orchestration
A complex task gets decomposed: Commerce Agent hires a researcher (10 DDSC), a writer (8 DDSC), and a reviewer (5 DDSC) in parallel. Results are aggregated and delivered. Total cost: 23 DDSC + fees.

### 4. Recurring Subscriptions
An agent subscribes to a monitoring service at 2 DDSC/month. The SubscriptionManager (via Hedera Schedule Service) automatically processes payments on schedule — no human needed.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 16)                                         │
│  Landing · Agent Marketplace · Merchant Portal · Checkout       │
│  Dashboard · Paymaster API                                      │
│  [wagmi + viem + RainbowKit + Tailwind]                        │
├─────────────────────────────────────────────────────────────────┤
│  AI AGENT LAYER (OpenClaw)                                     │
│  Commerce Agent · Merchant Agent · Analytics Agent              │
│  4 Skills: commerce · merchant · defi · autonomous (1,918 LOC) │
├─────────────────────────────────────────────────────────────────┤
│  MCP SERVER (TypeScript + Viem)                                │
│  16 Tools: 9 read + 7 write operations                         │
│  register_agent · pay_agent · rate_agent · checkout · etc.     │
├─────────────────────────────────────────────────────────────────┤
│  SMART CONTRACTS (Solidity · 93 tests passing)                 │
│  AgentRegistry · PaymentRouter · MerchantVault                 │
│  ADIPaymaster · SubscriptionManager · MockDDSC                 │
├─────────────────────────────────────────────────────────────────┤
│  ADI CHAIN TESTNET (Chain 99999)                               │
│  ERC-4337 EntryPoint V0.7 · DDSC Stablecoin · Hedera HSS      │
└─────────────────────────────────────────────────────────────────┘
```

## Deployed Contracts (ADI Testnet — Chain ID 99999)

| Contract | Address | Purpose |
|----------|---------|---------|
| AgentRegistry | `0x24fF5f6637A83CA7CA7B72b3Ad55275D669Ab7da` | Agent profiles & reputation |
| PaymentRouter | `0x13e935CF88Fd5a967B621aDf0b331361E8aF76f3` | Agent payments with fee splitting |
| MerchantVault | `0x809039A3A6791bb734841E1B14405FF521BC6ddb` | Merchant checkout & withdrawals |
| ADIPaymaster | `0x804911e28D000695b6DD6955EEbF175EbB628A16` | Gas-free transactions (ERC-4337) |
| MockDDSC | `0x66bfba26d31e008dF0a6D40333e01bd1213CB109` | Testnet stablecoin (1 DDSC = 1 AED) |

## Tech Stack

- **Blockchain:** ADI Chain (MENA's first institutional L2), ERC-4337, Hedera HSS
- **Smart Contracts:** Solidity, Foundry (93 tests), OpenZeppelin
- **AI Agents:** OpenClaw, 3 agents, 4 custom skills
- **MCP Server:** TypeScript, Viem, 16 blockchain tools
- **Frontend:** Next.js 16, wagmi v2, RainbowKit, Tailwind CSS
- **Stablecoin:** DDSC (Dirham Stablecoin, AED-pegged)
- **Deployment:** Docker, Akash Network (decentralized compute)

## Quick Start

### Prerequisites
- Node.js 20+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- Docker (for OpenClaw agents)

### 1. Run Smart Contract Tests
```bash
cd contracts
forge test -vvv
# 93 tests passing
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### 3. Test MCP Server
```bash
cd mcp-server
npm install
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | npx tsx src/index.ts
```

### 4. Run OpenClaw Agents (Docker)
```bash
# Pull OpenClaw image
docker pull --platform linux/amd64 ghcr.io/zjuuu/openclaw-docker:openclaw-v2026.2.12

# Start with your OpenRouter API key
docker run -d \
  --name agentmarket-openclaw \
  --platform linux/amd64 \
  -p 8080:8080 \
  -e SETUP_PASSWORD=yourpassword \
  -e OPENROUTER_API_KEY=sk-or-v1-your-key \
  -e AGENT_PRIVATE_KEY=0x-your-agent-key \
  -e ADI_RPC_URL=https://rpc.ab.testnet.adifoundation.ai/ \
  -v $(pwd)/openclaw/skills:/data/skills \
  -v $(pwd)/mcp-server:/app/mcp-server \
  ghcr.io/zjuuu/openclaw-docker:openclaw-v2026.2.12

# Open http://localhost:8080
```

### 5. Deploy to Akash (Decentralized)
See [akash/DEPLOY.md](akash/DEPLOY.md) for deploying on Akash Network.

## Competitive Landscape

The AI agent economy is emerging fast. Here's how AgentMarket compares to existing platforms:

| Feature | AgentMarket | SingularityNET | Fetch.ai | Virtuals | Nevermined | Stripe ACP | x402 (Coinbase) |
|---------|:-----------:|:--------------:|:--------:|:--------:|:----------:|:----------:|:---------------:|
| Agent discovery + hiring | Yes | Yes | Partial | No | No | No | No |
| On-chain reputation | Yes | Yes | No | No | No | No | No |
| Zero gas fees (ERC-4337) | Yes | No | No | No | No | N/A | No |
| Stablecoin payments | DDSC (AED) | AGIX | FET | VIRTUAL | NVM | USD | USDC |
| Recurring subscriptions | Yes (Hedera HSS) | No | No | No | Yes | Yes | No |
| Merchant commerce | Yes | No | No | No | No | Yes | No |
| Autonomous AI agents | Yes (OpenClaw) | Partial | Yes (AEA) | No | No | No | No |
| Multi-agent orchestration | Yes | Partial | Yes | No | No | No | No |
| Pay-per-action (HTTP 402) | Planned | No | No | No | Yes | No | Yes |
| MENA-focused (AED peg) | Yes | No | No | No | No | No | No |

### Why AgentMarket Wins

**vs. SingularityNET** — They have discovery and reputation but no gas-free UX, no merchant commerce, no autonomous agents. Their agents need humans to trigger every action.

**vs. Fetch.ai** — Strong on agent autonomy (AEAs) but no on-chain reputation, no stablecoin payments, no embeddable checkout. Great tech, weak commerce layer.

**vs. Virtuals Protocol** — Focused on metaverse/content, not agent-to-agent commerce. No payment routing, no merchant features, no task management.

**vs. Nevermined** — AI-native payments with x402 support, but no agent discovery, no reputation system, no autonomous hiring flow.

**vs. Stripe ACP / x402** — Payment infrastructure only. No marketplace, no discovery, no agents. They solve the payment rail but not the "find and trust an agent" problem.

**AgentMarket's unique position:** The only platform that combines autonomous AI agents + on-chain discovery + reputation + gas-free payments + merchant commerce + stablecoin support — built specifically for the MENA institutional market on ADI Chain.

## Project Structure

```
denver/
├── contracts/           # Solidity smart contracts + 93 Foundry tests
│   ├── src/            # AgentRegistry, PaymentRouter, MerchantVault, etc.
│   ├── test/           # Comprehensive test suite
│   └── script/         # Deployment scripts
├── frontend/           # Next.js 16 web application
│   └── src/app/        # Landing, Agents, Merchant, Checkout, Dashboard
├── mcp-server/         # MCP server with 16 blockchain tools
│   └── src/index.ts    # TypeScript + Viem implementation
├── openclaw/           # OpenClaw agent configuration
│   ├── openclaw.json   # 3-agent config with OpenRouter
│   └── skills/         # 4 custom AgentMarket skills
├── akash/              # Akash Network deployment files
├── demo/               # E2E demo scripts
└── architecture.html   # Interactive architecture diagram
```

## ETHDenver 2026

Built for ETHDenver 2026 hackathon, targeting bounties from:
- ADI Foundation (MENA L2)
- Hedera (Schedule Service integration)
- ERC-4337 (Account Abstraction)
- OpenClaw (AI Agent Skills)
- Kite AI

## License

MIT
