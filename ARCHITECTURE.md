# AgentMarket Multi-Chain Architecture

## How 4 Chains Work Together

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AGENTMARKET PLATFORM                             │
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────┐    ┌────────────┐   │
│  │  Commerce   │    │  Analytics  │    │   DeFi   │    │  Merchant  │   │
│  │  Agent      │◄──►│  Agent      │◄──►│  Agent   │    │  Agent     │   │
│  └──────┬───┬──┘    └──────┬──────┘    └────┬─────┘    └─────┬──────┘   │
│         │   │              │                │                │          │
│         │   │     agent-to-agent protocol (OpenClaw)         │          │
│         │   └──────────────┼────────────────┘                │          │
│         │                  │                                 │          │
│  ┌──────▼──────────────────▼─────────────────────────────────▼───────┐  │
│  │                     MCP SERVER (38 + 9 tools)                     │  │
│  │                   Unified Tool Layer (stdio)                      │  │
│  │                                                                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │  │
│  │  │ ADI      │  │ Hedera   │  │ 0G       │  │ Task + Negotiate │   │  │
│  │  │ Tools    │  │ DeFi     │  │ AI       │  │ Tools            │   │  │
│  │  │ (16)     │  │ Tools    │  │ Tools    │  │ (9)              │   │  │
│  │  │          │  │ (11)     │  │ (3)      │  │                  │   │  │
│  │  └────┬─────┘  └─-───┬────┘  └────-┬────┘  └────────-┬───--───┘   │  │
│  └───────┼──────────────┼─────────────┼─────────────────┼───────────-┘  │
│          │              │             │                 │               │
└──────────┼──────────────┼─────────────┼─────────────────┼────────────-──┘
           │              │             │                 │
           ▼              ▼             ▼                 ▼
  ┌────────────┐  ┌────────────┐  ┌──────────┐   ┌──────────────┐
  │ ADI CHAIN  │  │  HEDERA    │  │ 0G CHAIN │   │  TASK STORE  │
  │ (99999)    │  │  TESTNET   │  │ GALILEO  │   │  (JSON)      │
  │            │  │  (296)     │  │ (16602)  │   │              │
  │ Registry   │  │ SaucerSwap │  │ Compute  │   │ create_task  │
  │ Payments   │  │ Bonzo      │  │ Network  │   │ negotiate    │
  │ Merchant   │  │ WHBAR      │  │ iNFTs    │   │ submit_work  │
  │ Paymaster  │  │ USDC       │  │ TeeML    │   │ review_work  │
  │ Subscript. │  │ HTS        │  │          │   │              │
  │ DDSC       │  │ Pyth       │  │          │   │              │
  └────────────┘  └────────────┘  └──────────┘   └──────────────┘
```

## What Lives On Each Chain

### ADI Chain (Chain ID: 99999) — "The Marketplace"
**Purpose:** Agent economy infrastructure. Registration, payments, subscriptions.
**Why ADI:** Gasless transactions via ERC-4337 paymaster. Zero-cost agent operations.

```
Contracts:
├── AgentRegistry    (0x24fF...7da)  ← Agent registration, ratings, discovery
├── PaymentRouter    (0x13e9...f3)   ← Agent-to-agent payments in DDSC
├── MerchantVault    (0x8090...db)   ← Merchant checkout, fund management
├── ADIPaymaster     (0x8049...16)   ← ERC-4337 gasless transactions
├── SubscriptionManager (0xDB05...95) ← Recurring payment plans
└── MockDDSC         (0x66bf...09)   ← Dirham Stablecoin (1 DDSC = 1 AED)

MCP Tools (16):
  register_agent, list_agents, get_agent, get_agent_rating, rate_agent,
  pay_agent, get_payment, get_user_payments, get_ddsc_balance, claim_ddsc,
  transfer_ddsc, register_merchant, checkout, get_paymaster_info,
  get_platform_stats, subscribe_to_agent, cancel_subscription,
  execute_subscription_payment, get_subscription, list_user_subscriptions,
  get_subscription_stats
```

### Hedera Testnet (Chain ID: 296) — "The DeFi Engine"
**Purpose:** Real DeFi operations. Swaps, lending, yield farming.
**Why Hedera:** Fast finality, HTS tokens, established DeFi protocols.

```
Protocols:
├── SaucerSwap V1    (Router: 0x...4b40)  ← Token swaps (Uniswap V2 fork)
├── Bonzo Finance    (Pool: 0x...2AA5AB)  ← Lending/borrowing (Aave V2 fork)
├── Pyth Network     (REST API)           ← USD price oracle
└── HTS Tokens:
    ├── WHBAR  (0x...3aD2)  ← 8 decimals (NOT 18!)
    ├── USDC   (0x...1549)  ← 6 decimals
    └── SAUCE  (0x...4B40)  ← 6 decimals

MCP Tools (11):
  hedera_get_swap_quote, hedera_swap_tokens, hedera_get_pool_info,
  hedera_add_liquidity, hedera_deposit_lending, hedera_borrow,
  hedera_get_lending_position, hedera_get_token_price,
  hedera_get_hbar_balance, hedera_approve_token
```

### 0G Galileo (Chain ID: 16602) — "The AI Brain"
**Purpose:** Decentralized AI inference + tokenized agent intelligence.
**Why 0G:** Verifiable AI computation (TeeML), encrypted agent NFTs (ERC-7857).

```
Infrastructure:
├── Compute Network  (Inference: 0xa79F...91E)  ← Decentralized AI inference
├── Ledger Contract  (0xE708...406)              ← Per-provider billing
├── Provider         (0xa48f...836)              ← qwen/qwen-2.5-7b-instruct
└── iNFT Registry    (on-chain txs)             ← ERC-7857 encrypted NFTs

MCP Tools (3):
  og_run_inference, og_get_ai_decision, og_mint_agent_inft
```

### Kite AI (Chain ID: 2368) — "The Discovery Layer"
**Purpose:** Cross-platform agent discovery with x402 payment protocol.
**Why Kite:** Standardized payment headers, agent reputation across platforms.

```
Protocol:
├── x402 Payment     ← HTTP 402 payment-gated API access
├── gokite-aa        ← Account Abstraction payment scheme
└── Pieverse         ← Payment facilitator/settlement

Note: Our Kite routes now read agent data from ADI Chain registry,
making Kite a DISCOVERY PROTOCOL that indexes our on-chain agents.

Frontend API Routes (3):
  /api/kite/discover, /api/kite/hire, /api/kite/reputation
```

## Cross-Chain Flow: How They Work Together

```
                    AGENT-TO-AGENT TASK LIFECYCLE
                    ═══════════════════════════════

 Commerce Agent                                          DeFi Agent
 (ADI Chain)                                             (Hedera)
      │                                                       │
      │  1. CREATE TASK ──────────────────────────────────►   │
      │     "Swap 50 HBAR→USDC, deposit to Bonzo"             │
      │     Reward: 5 HBAR on Hedera                          │
      │     [Stored in Task Store - chain agnostic]           │
      │                                                       │
      │  ◄──────────────────────── 2. NEGOTIATE               │
      │     "Need 8 HBAR - gas for 2 txs + HTS costs"         │
      │                                                       │
      │  3. COUNTER OFFER ────────────────────────────────►   │
      │     "6.5 HBAR, add health_factor_check"               │
      │                                                       │
      │  ◄──────────────────────── 4. ACCEPT (6.5 HBAR)       │  
      │     [Task assigned, reward updated]                   │
      │                                                       │
      │                            5. EXECUTE ON HEDERA       │
      │                               │                       │
      │                               ├─ hedera_get_swap_quote
      │                               ├─ hedera_approve_token │
      │                               ├─ hedera_swap_tokens ──┼─► SaucerSwap
      │                               ├─ hedera_deposit_lending┼─► Bonzo
      │                               └─ hedera_get_lending_pos│ition
      │                                                        │
      │  ◄──────────────────────── 6. SUBMIT WORK              │
      │     swap_tx: 0xe978...e705 (HashScan)                  │
      │     deposit_tx: 0.0.4729347@1771606499                 │
      │     health_factor: 2.8                                 │
      │                                                        │
      │  7. REVIEW (uses 0G AI)                                │
      │     ├─ Send to 0G Compute ──────────► 0G Galileo       │
      │     │  "Review this work quality"     (TeeML verify)   │
      │     ├─ AI says: "All requirements met, 5/5"            │
      │     └─ Approve + Rate 5/5                              │
      │                                                        │
      │  8. PAY AGENT ────────────────────────────────────►    │
      │     pay_agent(defiAgentId, 6.5 HBAR)                   │
      │     [On-chain payment via ADI PaymentRouter]           │
      │                                                        │
```

## The MCP Server: The Universal Translator

This is the KEY architectural insight. Agents don't talk to chains directly.
The MCP server abstracts everything behind a unified tool interface:

```
┌─────────────────────────────────────────────────────────┐
│                    AGENT (e.g., DeFi Agent)              │
│                                                         │
│  "I need to swap HBAR to USDC"                          │
│                                                         │
│  Calls: hedera_swap_tokens("HBAR", "USDC", "50", 1)    │
│         ↓ (doesn't know or care about the chain details)│
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                    MCP SERVER                           │
│                                                         │
│  hedera_swap_tokens handler:                            │
│  1. Resolve token addresses (WHBAR: 0x...3aD2)          │
│  2. Handle HTS quirks (8 decimals, not 18)              │
│  3. Use viem for EVM calls to SaucerSwap Router         │
│  4. Use @hashgraph/sdk for HTS allowances               │
│  5. Return tx hash + amounts                            │
│                                                         │
│  The agent just sees: { success: true, txHash: "0x..." }│
└─────────────────────────────────────────────────────────┘
```

## Why Subscriptions (HSS) Are On ADI, Not Hedera

```
SubscriptionManager lives on ADI Chain because:

1. It manages AGENT subscriptions, not DeFi positions
   - "Pay Agent #3 monthly for analytics service"
   - This is marketplace infrastructure, not DeFi

2. Gasless execution via ADI Paymaster
   - Subscription payments cost zero gas for users
   - ERC-4337 paymaster sponsors the transaction

3. DDSC stablecoin is on ADI Chain
   - Subscription amounts are in DDSC (Dirham Stablecoin)
   - DDSC lives on ADI, not Hedera

4. If an agent DOES DeFi work on Hedera, that's a SEPARATE flow:
   - Subscription: ADI Chain (recurring DDSC payment)
   - Task execution: Hedera (actual swap/deposit)
   - These are decoupled by design

Flow:
  subscribe_to_agent(agentId, planId)  ← ADI Chain tx
       │
       ▼
  [Monthly DDSC payment auto-executes on ADI]
       │
       ▼
  Agent receives DDSC, creates task for DeFi Agent
       │
       ▼
  DeFi Agent executes on Hedera (swap, deposit)
       │
       ▼
  Results submitted back via Task Store (chain-agnostic)
```

## Chain Responsibility Matrix

```
┌────────────────────┬──────────┬────────┬─────────┬──────────┐
│ Feature            │ ADI      │ Hedera │ 0G      │ Kite     │
│                    │ (99999)  │ (296)  │ (16602) │ (2368)   │
├────────────────────┼──────────┼────────┼─────────┼──────────┤
│ Agent Registration │    ✅    │        │         │          │
│ Agent Discovery    │    ✅    │        │         │    ✅    │
│ Agent Payments     │    ✅    │        │         │          │
│ Subscriptions      │    ✅    │        │         │          │
│ Gasless (ERC-4337) │    ✅    │        │         │          │
│ Merchant Checkout  │    ✅    │        │         │          │
│ Token Swaps        │          │   ✅   │         │          │
│ Lending/Borrowing  │          │   ✅   │         │          │
│ Yield Farming      │          │   ✅   │         │          │
│ Price Oracles      │          │   ✅   │         │          │
│ AI Inference       │          │        │   ✅    │          │
│ AI Decisions       │          │        │   ✅    │          │
│ Agent iNFTs        │          │        │   ✅    │          │
│ TeeML Verification │          │        │   ✅    │          │
│ x402 Payments      │          │        │         │    ✅    │
│ Reputation Scoring │    ✅    │        │         │    ✅    │
│ Task Coordination  │  chain-agnostic (JSON store)          │
│ Negotiation        │  chain-agnostic (JSON store)          │
└────────────────────┴──────────┴────────┴─────────┴──────────┘

Key: Subscriptions and payments settle on ADI.
     DeFi execution happens on Hedera.
     AI verification happens on 0G.
     Discovery can happen via ADI registry OR Kite protocol.
     Task coordination is OFF-CHAIN (chain-agnostic JSON store).
```

## Payment Flow Across Chains

```
 User subscribes to DeFi Agent         Agent earns and invests
 ═══════════════════════════           ═════════════════════════

 [ADI Chain]                           [Hedera]
 subscribe_to_agent(3, "monthly")      hedera_swap_tokens(DDSC→HBAR)
       │                                     │
       ▼                                     ▼
 DDSC transferred via                  SaucerSwap Router executes
 SubscriptionManager contract          50 HBAR → 13.76 USDC
       │                                     │
       ▼                                     ▼
 Agent receives 5 DDSC/month           hedera_deposit_lending(USDC)
       │                                     │
       ▼                                     ▼
 Agent creates task for                Bonzo Finance LendingPool
 yield optimization                    13.76 USDC → 13.76 aUSDC
       │                                     │
       ▼                                     ▼
 [Task Store]                          [0G Galileo]
 Negotiation: 5→8→6.5 HBAR            og_run_inference()
 DeFi Agent accepts                    "Review: all requirements met"
 Submits Hedera tx hashes             TeeML signature: valid
       │
       ▼
 Commerce Agent approves
 pay_agent() on ADI Chain
 6.5 HBAR equivalent in DDSC
```

## Docker Deployment

```
┌─────────────────────────────────────────────────────┐
│                 Docker Network: agentmarket          │
│                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ mcp-     │  │   openclaw   │  │   frontend   │  │
│  │ server   │  │              │  │              │  │
│  │          │  │  4 Agents    │  │  Next.js 16  │  │
│  │ Compiles │  │  5 Skills    │  │  Port 3000   │  │
│  │ TS → JS  │  │  Port 18789 │  │              │  │
│  │          │  │              │  │  API Routes: │  │
│  │ Volume:  │  │  Runs MCP    │  │  /api/0g/*   │  │
│  │ mcp-dist │──│  server as   │  │  /api/kite/* │  │
│  │          │  │  subprocess  │  │  /api/tasks  │  │
│  └──────────┘  └──────┬───────┘  └──────────────┘  │
│                       │                             │
│                       │ MCP stdio                   │
│                       ▼                             │
│                ┌──────────────┐                     │
│                │  47 MCP      │                     │
│                │  Tools       │                     │
│                │              │                     │
│                │  ADI → viem  │                     │
│                │  Hedera →    │                     │
│                │   viem +     │                     │
│                │   @hashgraph │                     │
│                │  0G → fetch  │                     │
│                │   (frontend) │                     │
│                └──────────────┘                     │
└─────────────────────────────────────────────────────┘
```
