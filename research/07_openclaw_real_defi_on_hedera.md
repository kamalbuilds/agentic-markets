# OpenClaw Agents - Real DeFi on Hedera
## Deep Technical Research - 2026-02-20

---

## 1. OpenClaw Framework Overview

**What it is:** OpenClaw is a free, open-source autonomous AI agent framework. It runs locally and integrates with external LLMs (Claude, GPT, DeepSeek).

**How agents work:**
- Configured via `openclaw.json` with model preferences, workspace paths, skill loading
- Skills = markdown instruction files (`SKILL.md`) with structured metadata
- External services via MCP (Model Context Protocol) servers
- Multi-channel: WhatsApp, Telegram, Slack, Discord, WebChat
- Agent-to-agent communication built-in via `agentToAgent` tool

**Our existing setup:**
- Three agents: Commerce, Merchant, Analytics
- MCP server with 16 blockchain tools for ADI Chain
- Skills for commerce, merchant, DeFi, autonomous ops
- Uses `openrouter/anthropic/claude-sonnet-4-5`

**CRITICAL GAP:** No existing OpenClaw skill for Hedera. Existing crypto skills (like BankrBot's `openclaw-skills`) only support EVM chains (Ethereum, Polygon, BSC, Arbitrum, Base). **We must build custom Hedera skills.**

**Key resources:**
- https://docs.openclaw.ai/start/getting-started
- https://github.com/openclaw/openclaw
- https://github.com/BankrBot/openclaw-skills (reference for DeFi skill patterns)

---

## 2. Hedera Token Service (HTS) - Agent Token Operations

HTS provides native token support WITHOUT deploying smart contracts. Primary mechanism for agent DeFi.

### Available Operations via `@hashgraph/sdk`:

```javascript
import {
  TokenCreateTransaction, TokenMintTransaction,
  TransferTransaction, TokenAssociateTransaction,
  Client, PrivateKey
} from "@hashgraph/sdk";

// Create fungible token
const tx = new TokenCreateTransaction()
  .setTokenName("Agent Service Token")
  .setTokenSymbol("AGNT")
  .setDecimals(8)
  .setInitialSupply(1000000)
  .setTreasuryAccountId(agentAccountId)
  .setSupplyKey(agentKey);

// Transfer tokens between agents
const transfer = new TransferTransaction()
  .addTokenTransfer(tokenId, fromAgent, -amount)
  .addTokenTransfer(tokenId, toAgent, amount);

// Associate token (required before receiving)
const associate = new TokenAssociateTransaction()
  .setAccountId(agentAccountId)
  .setTokenIds([tokenId]);
```

### Hedera Agent Kit Tools (npm: `hedera-agent-kit`):

| Tool | Function |
|------|----------|
| `CREATE_FUNGIBLE_TOKEN_TOOL` | Deploy fungible tokens |
| `CREATE_NON_FUNGIBLE_TOKEN_TOOL` | Deploy NFTs |
| `MINT_FUNGIBLE_TOKEN_TOOL` | Increase supply |
| `ASSOCIATE_TOKEN_TOOL` | Link tokens to accounts |
| `AIRDROP_FUNGIBLE_TOKEN_TOOL` | Distribute to recipients |
| `APPROVE_TOKEN_ALLOWANCE_TOOL` | Set spending limits |
| `TRANSFER_FUNGIBLE_TOKEN_WITH_ALLOWANCE_TOOL` | Move tokens via allowance |
| `CREATE_ERC20_TOOL` | Deploy ERC-20 via factory |
| `TRANSFER_ERC20_TOOL` | Transfer ERC-20 tokens |

**Status: PRODUCTION-READY** - Mature SDK, works on testnet with free test HBAR.

---

## 3. Hedera Consensus Service (HCS) - Agent Attestations

Distributed message ordering service. Agents post immutable, timestamped, ordered messages to topics.

### Agent Kit Tools:

| Tool | Function |
|------|----------|
| `CREATE_TOPIC_TOOL` | Create HCS topics |
| `SUBMIT_TOPIC_MESSAGE_TOOL` | Post attestations to topics |
| `DELETE_TOPIC_TOOL` | Remove topics |
| `GET_TOPIC_INFO_QUERY_TOOL` | Get topic metadata |
| `GET_TOPIC_MESSAGES_QUERY_TOOL` | Fetch messages from topics |

### HCS-10 OpenConvAI Standard (CRITICAL for agent communication):

**Agent Registration:**
1. Agent creates 3 topics: outbound, inbound, profile
2. Registers on a registry topic
3. Other agents discover via HCS-2 registry

**Connection Protocol:**
1. Agent A sends `connection_request` to Agent B's inbound topic
2. Agent B creates shared connection topic
3. Agent B responds with `connection_created`
4. Agents communicate through connection topics

**npm packages:**
- `@hashgraphonline/standards-sdk` - HCS-10/11 implementation
- `@hashgraphonline/conversational-agent` - Higher-level agent framework

### HCS-11 Profile Standard:
```json
{
  "version": "1.0",
  "display_name": "DeFi Trading Agent",
  "inboundTopicId": "0.0.789101",
  "outboundTopicId": "0.0.789102",
  "aiAgent": {
    "type": 0,
    "capabilities": [0, 1],
    "model": "claude-sonnet"
  }
}
```

### HIP-991 Revenue-Generating Topics:
Agents can charge HTS tokens or HBAR for executing commands via topic submissions. Enables agents to monetize services directly through HCS.

---

## 4. Real DeFi Protocols on Hedera (What Agents CAN Actually Use)

### SaucerSwap (PRIMARY DEX)
- **V1**: AMM (Uniswap V2 fork) - simple swap and liquidity
- **V2**: Concentrated liquidity (Uniswap V3 fork) - tick-based positions
- **Agent Kit Plugin**: `hak-saucerswap-plugin@1.0.1` (npm)
  - `saucerswap_get_swap_quote` - Get price quotes
  - `saucerswap_swap_tokens` - Execute swaps
  - `saucerswap_get_pools` - List pools
  - `saucerswap_add_liquidity` - Provide liquidity
  - `saucerswap_remove_liquidity` - Remove liquidity
  - `saucerswap_get_farms` - Check yield farming
- **Testnet contracts**: Factory `0.0.3946833`, QuoterV2 `0.0.3949424`
- **REST API**: `api.saucerswap.finance`
- GitHub: `github.com/saucerswaplabs`
- Source: `github.com/jmgomezl/hak-saucerswap-plugin`

### Bonzo Finance (LENDING)
- Based on Aave V3, adapted for Hedera EVM + HTS
- **Agent Kit Plugin**: `github.com/Bonzo-Labs/bonzoPlugin`
  - `deposit` - Supply assets as collateral
  - `withdraw` - Remove supplied assets
  - `borrow` - Borrow against collateral
  - `repay` - Repay borrowed amounts
- Chainlink price feeds integrated
- Bonzo Vaults for automated yield strategies

### Price Oracles
- **Pyth Network** - Real-time price oracle (Hedera Agent Kit has Pyth plugin)
- **Chainlink** - Used by Bonzo for collateral pricing

---

## 5. ERC-8004 for Agent Reputation/Trust

Went live on Ethereum mainnet Jan 29, 2026. Co-authored by MetaMask, Ethereum Foundation, Google, Coinbase.

### Three On-Chain Registries:

**Identity Registry (ERC-721 based):**
```solidity
function register(string agentURI, MetadataEntry[] calldata metadata)
  external returns (uint256 agentId);
function setAgentWallet(uint256 agentId, address newWallet,
  uint256 deadline, bytes calldata signature) external;
```

**Reputation Registry:**
```solidity
function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals,
  string tag1, string tag2, string endpoint, string feedbackURI,
  bytes32 feedbackHash) external;
function getSummary(uint256 agentId, address[] clientAddresses,
  string tag1, string tag2) external view
  returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals);
```

**Validation Registry:**
```solidity
function validationRequest(address validatorAddress, uint256 agentId,
  string requestURI, bytes32 requestHash) external;
function validationResponse(bytes32 requestHash, uint8 response,
  string responseURI, bytes32 responseHash, string tag) external;
```

**Hedera compatibility:** YES - Hedera is EVM-compatible, contracts can be deployed on Hedera testnet. The bounty specifically mentions: "Reputation / trust indicators (maybe using ERC-8004) are nice to have."

---

## 6. UCP (Universal Commerce Protocol)

Open standard by Google, Shopify, Etsy, Wayfair, Target, Walmart for AI agent commerce.

**Key capabilities:**
- Product/service discovery through structured APIs
- Checkout handling (shipping, taxes, terms)
- Transport-agnostic: REST APIs, MCP, or A2A protocols

**Hedera UCP integration:** `github.com/hedera-dev/tutorial-ucp-hedera`
- Shows how to use UCP with Hedera for payments
- Directly addresses bounty: "Bonus points if you use UCP to standardise agent-to-agent commerce"

**How it fits:**
- Agents advertise services as UCP "products"
- Agent A discovers Agent B's services via UCP
- Negotiates terms, pays via HTS tokens
- Creates standardized agent-to-agent marketplace protocol

---

## 7. Architecture for Real DeFi Agents

```
OpenClaw Agent (commerce/defi/merchant)
    |
    |-- SKILL.md (Hedera DeFi instructions)
    |
    v
MCP Server (EXTENDED with Hedera tools)
    |
    |-- @hashgraph/sdk (direct Hedera SDK)
    |-- hedera-agent-kit (LangChain tools)
    |-- hak-saucerswap-plugin (DEX ops)
    |-- bonzoPlugin (lending/borrowing)
    |-- @hashgraphonline/standards-sdk (HCS-10 comms)
    |
    v
Hedera Testnet
    |-- HTS: Create/transfer/trade tokens
    |-- HCS: Attestations, agent discovery (HCS-10)
    |-- EVM: ERC-8004 reputation, SaucerSwap/Bonzo
    |-- HSS: Scheduled transactions (subscriptions)
```

### New MCP Tools Needed for Hedera DeFi:

**Token Operations:**
- `hedera_create_token` - Create HTS fungible token
- `hedera_transfer_token` - Transfer tokens between agents
- `hedera_get_balance` - Check token balances
- `hedera_associate_token` - Associate token to account

**DEX Operations (SaucerSwap):**
- `hedera_swap_tokens` - Execute token swap
- `hedera_get_swap_quote` - Get price quote
- `hedera_add_liquidity` - Provide liquidity
- `hedera_get_pools` - List available pools

**Lending (Bonzo):**
- `hedera_deposit_collateral` - Supply collateral
- `hedera_borrow` - Borrow against collateral
- `hedera_repay` - Repay loan

**Agent Communication (HCS-10):**
- `hedera_register_agent` - Register on HCS-10
- `hedera_discover_agents` - Find other agents
- `hedera_connect_agent` - Establish connection
- `hedera_send_message` - Send message to agent

**Reputation (ERC-8004):**
- `hedera_register_identity` - Register agent identity
- `hedera_give_feedback` - Rate another agent
- `hedera_get_reputation` - Check agent reputation

---

## 8. Concrete Implementation Plan for OpenClaw Real DeFi

### Step 1: Extend MCP Server
Add Hedera-specific tools using `@hashgraph/sdk`:
```bash
cd mcp-server
npm install @hashgraph/sdk hedera-agent-kit hak-saucerswap-plugin
```

### Step 2: Create Hedera DeFi Skill
Write `openclaw/skills/agentmarket-hedera-defi/SKILL.md`:
- Instructions for token trading on SaucerSwap
- Lending/borrowing on Bonzo
- Agent discovery via HCS-10
- Reputation management via ERC-8004

### Step 3: Deploy ERC-8004 on Hedera Testnet
Deploy Identity, Reputation, Validation registries on Hedera EVM.

### Step 4: Wire Agent-to-Agent Communication
Implement HCS-10 standard for agent registration and messaging.

### Step 5: Build Prediction Market (Bounty Example)
Create custom contracts for:
- Market creation (HTS tokens for YES/NO shares)
- HCS attestations for outcome resolution
- Automated settlement

---

## 9. Key Hedera Advantages for Agent DeFi

- **No MEV/sandwich attacks** - Fair ordering eliminates front-running
- **Low, fixed USD-denominated fees** - Predictable costs for agents
- **3-5 second finality** - Fast enough for real-time decisions
- **15M gas/second throughput**
- **Native token service** - No smart contracts needed for basic token ops
- **Schedule Service** - On-chain automation without keepers

---

## 10. npm Packages Reference

| Package | Version | Purpose |
|---------|---------|---------|
| `@hashgraph/sdk` | latest | Core Hedera SDK |
| `hedera-agent-kit` | v3.x | AI agent toolkit |
| `hak-saucerswap-plugin` | v1.0.1 | SaucerSwap DEX |
| `@hashgraphonline/standards-sdk` | latest | HCS-10/11 standards |
| `@hashgraphonline/conversational-agent` | latest | Agent framework |
| `@openzeppelin/contracts` | latest | ERC-8004 base |
