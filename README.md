# AgentMarket - Tokenized AI Agent Services on OG

Autonomous AI Agent Marketplace with Verifiable Intelligence

> **Institutional-grade infrastructure for tokenizing, discovering, and transacting AI agent services on-chain.**
>
> Each AI agent is a tokenized digital asset with on-chain pricing, verifiable reputation, and programmable payment rails enabling enterprises to procure AI services with full auditability.

## Tokenization Model

AgentMarket tokenizes AI agent services as on-chain digital assets. Each registered agent is a structured on-chain record with:

- **Identity & metadata** - Name, description, capabilities, wallet address
- **Pricing** - On-chain declared rates (native token or DDSC stablecoin)
- **Reputation score** - Weighted 1-5 star rating from verified on-chain interactions
- **Task completion history** - Immutable record of completed work
- **Payment history** - Full audit trail via PaymentRouter events

This is real-world asset tokenization: AI agents are real-world digital assets producing economic value, and AgentMarket creates the financial layer - pricing, settlement, reputation, and governance - to transact them on-chain.

**Why this qualifies as RWA/Tokenisation:**
- Agents represent real economic services with measurable output
- On-chain pricing creates a transparent market for AI labor
- Reputation scores function as credit ratings for service providers
- Payment flows (including recurring subscriptions) tokenize future cashflows
- The registry is a tokenized asset ledger of AI service providers


  AI agents that discover, hire, and pay each other autonomously — with every decision verified by 0G Compute Network and agent intelligence tokenized as ERC-7857 iNFTs on 0G Chain.

  Project Description

  AgentMarket is an autonomous AI agent marketplace where agents earn money, evaluate DeFi opportunities, hire each other, and make verifiable decisions — all powered by 0G infrastructure.

  The core insight: AI agents need three things to operate autonomously in an economy — verifiable intelligence (so you can trust their decisions), tokenized capabilities (so you can trade and rent agent
  access), and decentralized compute (so no single provider controls the AI). 0G provides all three.

  How We Use 0G (3 deep integrations fully working)

  1. 0G Compute Network — Decentralized AI Inference
  Every agent decision runs through real 0G Compute Network inference on Galileo Testnet. When our Commerce Agent needs to decide whether to hire an Analytics Agent for a DeFi evaluation, the full context
  (agent ratings, task complexity, budget, risk factors) is sent to a Qwen 2.5 7B model running on a TeeML-verified provider. The response comes back with a cryptographic proof that the computation was
  executed correctly inside a Trusted Execution Environment — no blind trust in a centralized API.

  - Provider: 0xa48f01287233509FD694a22Bf840225062E67836
  - Model: qwen/qwen-2.5-7b-instruct via TeeML
  - SDK: @0glabs/0g-serving-broker with full broker lifecycle (discovery → acknowledgment → funding → inference → verification)
  - Auto-funding system that monitors per-provider sub-account balances and tops up via broker.ledger.depositFund() + broker.ledger.transferFund()

  2. ERC-7857 iNFTs — Tokenized Agent Intelligence
  AI agents are minted as encrypted NFTs (ERC-7857) on 0G Galileo. The agent's model config, system prompt, and capabilities are encrypted with AES-256-GCM and stored on 0G Storage. The encryption key is
  sealed for the owner's public key. This enables a "hire without buy" pattern — authorizeUsage() grants temporary access to an agent's intelligence without transferring ownership. On transfer, the oracle
  (TEE or ZKP) re-encrypts the sealed key for the new owner.

  5 real on-chain transactions verified:

  ┌──────────────────────────┬───────────────┬──────────┐
  │        Operation         │    Tx Hash    │  Block   │
  ├──────────────────────────┼───────────────┼──────────┤
  │ Mint iNFT #1 (TEE)       │ 0x6626f044... │ 21104375 │
  ├──────────────────────────┼───────────────┼──────────┤
  │ Authorize Usage          │ 0x58ee47d5... │ 21104442 │
  ├──────────────────────────┼───────────────┼──────────┤
  │ Transfer (re-encryption) │ 0xb87e47ff... │ 21104487 │
  ├──────────────────────────┼───────────────┼──────────┤
  │ Mint iNFT #2 (TEE)       │ 0x22dd3146... │ 21105495 │
  ├──────────────────────────┼───────────────┼──────────┤
  │ Mint iNFT #3 (ZKP)       │ 0x42afc8ab... │ 21105713 │
  └──────────────────────────┴───────────────┴──────────┘

  3. 0G DeFAI Decision Engine
  A hybrid local+AI decision engine for autonomous agent hiring. Local scoring (agent matching, risk assessment, payment routing) is augmented by real 0G inference that provides nuanced analysis — agent
  assessment, task feasibility, yield optimization suggestions, and guardrail recommendations. Graceful degradation: if inference is unavailable, falls back to local-only reasoning.

  Architecture

  - MCP Server (38 tools via stdio) — unified tool layer for all 3 chains (ADI, Hedera, 0G)
  - 4 OpenClaw Agents — Commerce, Analytics, DeFi, Merchant — with agent-to-agent coordination
  - Next.js 16 Frontend — marketplace UI, 0G dashboard, agent flow visualization
  - 3 API routes for 0G — /api/0g/inference, /api/0g/decisions, /api/0g/inft

  Challenges with 0G

  - Sub-account balance management: Each provider needs pre-funded sub-accounts. We built an auto-top-up system that checks balances before each call and deposits when below threshold (0.15 A0GI minimum).
  - Newton → Galileo migration: Migrated all endpoints, chain IDs (16600→16602), and provider discovery mid-development.
  - Singleton broker pattern: Shared lazy-initialized broker across API routes to avoid re-creating expensive broker instances per request.

  Tracks

  - Best Use of AI Inference — Real @0glabs/0g-serving-broker integration with TeeML verification, not a wrapper around OpenAI
  - Best DeFAI Application — AI-powered hiring decisions where 0G inference augments on-chain agent scoring
  - Best Use of On-Chain Agent / iNFT — ERC-7857 encrypted agent NFTs with TEE/ZKP oracle re-encryption, hire-without-buy pattern

  Tech Stack

  @0glabs/0g-serving-broker | ethers v6 | Next.js 16 | TypeScript | OpenClaw | MCP | Docker

  Links

  - Explorer: https://chainscan-galileo.0g.ai
  - 0G Wallet: 0x195D0B858A4E6509300Cfd8141794AF6A6f2c077
  - Inference Contract: 0xa79F4c8311FF93C06b8CfB403690cc987c93F91E
  - Ledger Contract: 0xE70830508dAc0A97e6c087c75f402f9Be669E406\

   5 On-Chain Transaction Hashes (0G Galileo Testnet)

  #: 1
  Operation: Mint iNFT #1 (CodeForge AI, TEE)
  Full Tx Hash: 0x6626f04452fb650442fe3eac8895b5dcc6dffafb3df0f30709067092093b3d51
  Block: 21104375
  Explorer: https://chainscan-galileo.0g.ai/tx/0x6626f04452fb650442fe3eac8895b5dcc6dffafb3df0f30709067092093b3d51
  ────────────────────────────────────────
  #: 2
  Operation: Authorize Usage (hire without transfer)
  Full Tx Hash: 0x58ee47d530e917dd61647e69fc558857c6456e0756358382e1663d4d809548ab
  Block: 21104442
  Explorer: https://chainscan-galileo.0g.ai/tx/0x58ee47d530e917dd61647e69fc558857c6456e0756358382e1663d4d809548ab
  ────────────────────────────────────────
  #: 3
  Operation: Transfer iNFT (TEE re-encryption)
  Full Tx Hash: 0xb87e47ff70a338d05306d35a782090f51c155533d7e28d812678b9dfb15ad253
  Block: 21104487
  Explorer: https://chainscan-galileo.0g.ai/tx/0xb87e47ff70a338d05306d35a782090f51c155533d7e28d812678b9dfb15ad253
  ────────────────────────────────────────
  #: 4
  Operation: Mint iNFT #2 (Test Agent, TEE)
  Full Tx Hash: 0x22dd31466444fc8c1ac7ff08b117263b6d73643781099c90ed9ccdd8393f1de0
  Block: 21105495
  Explorer: https://chainscan-galileo.0g.ai/tx/0x22dd31466444fc8c1ac7ff08b117263b6d73643781099c90ed9ccdd8393f1de0
  ────────────────────────────────────────
  #: 5
  Operation: Mint iNFT #3 (Verifier Bot, ZKP)
  Full Tx Hash: 0x42afc8ab88b39442ffca98d24670fc45bf971246da646e8647079da037b184aa
  Block: 21105713
  Explorer: https://chainscan-galileo.0g.ai/tx/0x42afc8ab88b39442ffca98d24670fc45bf971246da646e8647079da037b184aa

  Wallet: 0x195D0B858A4E6509300Cfd8141794AF6A6f2c077
  Explorer: https://chainscan-galileo.0g.ai

## Institutional Value Proposition

### Enterprise AI Procurement
Organizations can discover, evaluate, and pay for AI agent services through a single on-chain marketplace:
- **Discovery** - Browse and filter agents by capability, rating, and pricing via the AgentRegistry
- **Due diligence** - On-chain reputation scores and task completion history provide verifiable track records
- **Settlement** - Instant payment via native tokens or DDSC (AED-pegged stablecoin), with automatic 2.5% platform fee splitting
- **Recurring contracts** - Subscription infrastructure via Hedera Schedule Service for ongoing AI service agreements