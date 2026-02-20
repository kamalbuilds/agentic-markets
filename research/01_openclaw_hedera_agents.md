# Research: OpenClaw + Hedera Agents ($10K Bounty)
# Agent: a30a008 | Status: Complete

## Table of Contents

1. OpenClaw AI Agents Framework
2. Universal Commerce Protocol (UCP)
3. ERC-8004: Trustless Agents Standard
4. Hedera Services for Agents
5. Hedera Agent Kit and SDK Ecosystem
6. Tutorial-UCP-Hedera Repository Analysis
7. Hedera-Agent-Skills Repository Analysis
8. ETHDenver 2025 Winners and Judging Patterns
9. Complete API and SDK Reference Table
10. Code Patterns and Examples
11. Technical Architecture Options
12. Concrete Winning Project Ideas
13. Recommended Implementation Strategy

---

## 1. OpenClaw AI Agents Framework

### What is OpenClaw?

OpenClaw (formerly Clawdbot, then Moltbot) is a free, open-source AI agent platform created by Austrian developer Peter Steinberger. Launched late January 2026, over 180,000 developers. Enables persistent, autonomous AI agents on own hardware.

**Core characteristics:**
- **Local-first execution**: All data stays on user's machine unless configured otherwise
- **Persistent memory**: Retains context across sessions
- **Multi-channel messaging**: 20+ protocols (WhatsApp, Telegram, Discord, Slack, etc.)
- **Model-agnostic**: Claude, GPT-4, Gemini, Bedrock, OpenRouter, Ollama
- **Multi-platform**: macOS, iOS, Android, Linux, Windows (WSL2), WebChat

### Gateway Architecture

- Gateway Service on port 18789 - request routing, session management, agent orchestration
- Supports local, remote, and cloud deployment (Fly.io, GCP, Railway)
- Multi-Agent Routing for sophisticated orchestration
- System requirements: Node.js 22+

### Skills System (Primary Extension Mechanism)

Skills are directories with `SKILL.md` files (YAML frontmatter + instructions).

```markdown
---
name: skill-identifier
description: Brief explanation
homepage: https://example.com
user-invocable: true
metadata:
  openclaw: {"requires":{"bins":["node"],"env":["API_KEY"]},"primaryEnv":"API_KEY","emoji":"wrench"}
---
```

**Skill loading hierarchy** (highest to lowest):
1. Workspace skills: `<workspace>/skills/`
2. Managed/local: `~/.openclaw/skills/`
3. Bundled skills

**ClawHub** (https://clawhub.com) is public skills registry:
```bash
clawhub install <skill-slug>
clawhub sync --all
```

### MCP Support

OpenClaw supports MCP servers as external tool providers. Hedera Agent Kit exposes an MCP server, enabling OpenClaw agents to interact with Hedera.

### Moltbook

Social network for AI agents. 1.2M+ autonomous agents active. Agents interact, post, comment, search, discover each other.

---

## 2. Universal Commerce Protocol (UCP)

### What is UCP?

Open-source standard for agentic commerce. Co-developed with Shopify, Etsy, Wayfair, Target, Walmart. Endorsed by 20+ partners including Adyen, AmEx, Best Buy, Mastercard, Stripe, Visa.

### Core Design
- **Server-selects model**: Merchant chooses protocol versions
- **Namespace governance**: Reverse-domain naming (e.g., `dev.ucp.shopping.checkout`)
- **Discovery**: `GET /.well-known/ucp` for merchant capabilities

### Transport Bindings
- **REST** (OpenAPI 3.x): Core transport
- **MCP** (OpenRPC): Wraps UCP as tools for LLMs
- **A2A** (Agent Card): Direct agent-to-agent commerce
- **Embedded Protocol**: User interaction events

### Shopping Flow
1. Discovery -> 2. Create Checkout -> 3. Add Items -> 4. Apply Discounts -> 5. Select Fulfillment -> 6. Payment -> 7. Complete Order

### Hedera-Specific Payment
- Payments in HBAR or HTS tokens
- Customer agent signs Hedera transfer via Hiero SDK
- Merchant verifies on Hedera network

---

## 3. ERC-8004: Trustless Agents Standard

Ethereum Improvement Proposal for discovering and establishing trust with autonomous agents. Live on mainnet January 29, 2026.

**Co-authors**: Marco De Rossi (MetaMask), Davide Crapis (EF), Jordan Ellis (Google), Erik Reppel (Coinbase)

### Three Registries

#### Identity Registry (ERC-721 Based)
Every agent gets NFT-based identity. Portable, browsable, transferable.

```solidity
register(string agentURI) returns (uint256 agentId)
setAgentURI(uint256 agentId, string newURI)
setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes signature)
```

#### Reputation Registry
Standardized feedback signals (signed fixed-point numbers).

```solidity
giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, ...)
getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2)
```

#### Validation Registry
Independent validator checks (still under development with TEE community).

### Deployed Addresses
- **Mainnet Identity**: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- **Mainnet Reputation**: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- **Testnet Identity**: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- **Testnet Reputation**: `0x8004B663056A597Dffe9eCcC1965A193B7388713`
- Deployed on Ethereum, Base, Arbitrum, Avalanche, Celo, Gnosis, Linea, Mantle, MegaETH, Optimism, Polygon, Scroll, Taiko, Monad, BSC, Abstract, and Hedera

---

## 4. Hedera Services for Agents

### HTS (Hedera Token Service)
- Create/mint/burn/transfer fungible & non-fungible tokens
- System contract API at EVM level
- Micro-payments for AI agents

### HCS (Hedera Consensus Service)
- Ordered, time-stamped message logging
- Immutable audit trails for agent actions
- HIP-991: Revenue-generating topic IDs

### Hedera EVM
- Full EVM compatibility
- Low costs, sub-second finality (3-5s)
- Carbon-negative network
- Deploy ERC-8004 contracts directly

### Hedera AI Studio
- Integrated dev environment with Agent Kit
- Next.js chat interface for testing

---

## 5. Hedera Agent Kit

### JavaScript/TypeScript SDK
**npm**: `hedera-agent-kit` (v3.x)

```javascript
import { HederaLangchainToolkit, AgentMode } from 'hedera-agent-kit';
const toolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    plugins: [],
    context: { mode: AgentMode.AUTONOMOUS },
  },
});
const tools = toolkit.getTools();
```

### Plugin Architecture
- Core Account, Consensus, Token, EVM, Transaction plugins
- Third-party: SaucerSwap, Bonzo, Memejob, Pyth, CoinCap, Chainlink

### Integration Paths
1. LangChain/LangGraph agents
2. MCP Server (OpenClaw connection)
3. ElizaOS plugin
4. Vercel AI SDK

---

## 6. Tutorial-UCP-Hedera

**Repo**: `hedera-dev/tutorial-ucp-hedera`

Complete UCP + Hedera HBAR payment demo. Python-based (FastAPI server + client).

Prerequisites: Python 3.10+, `uv`, Hedera testnet ECDSA account

Demo flow: Discovery -> Checkout -> Add Items -> Discount -> Fulfillment -> HBAR Payment -> Complete

---

## 7. Hedera-Agent-Skills

**Repo**: `hedera-dev/hedera-agent-skills`

OpenClaw-compatible skill packages:
- `agent-kit-plugin`: Dev guide for custom Hedera Agent Kit extensions
- `hts-system-contract`: HTS system contract API documentation

---

## 8. Architecture Options

### A: Full-Stack Agent Marketplace
OpenClaw Gateway -> Discovery/Payment/Reputation Agents -> Hedera (HTS+HCS+EVM)

### B: UCP Commerce Network
Consumer Agent <-> UCP Transport <-> Provider Agent, both on Hedera

### C: Agent DAO / Collective Intelligence
Multiple agents -> DAO Governance (HCS) + Treasury (HTS) + ERC-8004

### D: Trust Oracle Network
Service Agent -> HCS Evidence -> Validator Agents -> Validation Registry

---

## 9. Winning Project Ideas

### RECOMMENDED: "AgentBazaar" -- Agent Service Marketplace
Combines ALL technologies. Agents offer/discover services, pay via HTS, reputation via ERC-8004, audit via HCS.

### "AgentDAO" -- Self-Governing Agent Collective
Agents form DAO, vote on tasks, pool resources, distribute rewards.

### "TrustChain" -- Agent Reputation Oracle Network
Validator agents verify quality of other agents' work.

### "AgentCommerce" -- UCP Shopping Assistant Network
Shopping agents collaborate to find deals using UCP + Hedera.

---

## 10. Recommended Tech Stack

```
Frontend:         Next.js 14+ dashboard
Backend:          Node.js + Express; FastAPI (UCP)
Agent Platform:   OpenClaw with 3-4 specialized agents
Agent Framework:  Hedera Agent Kit v3
LLM:              Claude Sonnet or GPT-4o-mini via LangChain
Smart Contracts:  ERC-8004 on Hedera EVM testnet
Payments:         HTS + HBAR via UCP
Audit:            HCS topics
Testing:          Hedera testnet (free from portal.hedera.com)
```

## Key Sources
- https://docs.openclaw.ai/start/getting-started
- https://github.com/erc-8004/erc-8004-contracts
- https://www.8004.org
- https://github.com/hashgraph/hedera-agent-kit-js
- https://github.com/hedera-dev/hedera-agent-skills
- https://github.com/hedera-dev/tutorial-ucp-hedera
- https://ucp.dev/specs/shopping
- https://hedera.com/blog/deep-dive-into-the-hedera-agent-kit-plugins-tools-and-practical-workflows
