# Bounty Qualification Analysis - AgentMarket
## Updated: 2026-02-20

---

## COMPLETE BOUNTY MAP (All Sponsors from prizes.json)

| # | Sponsor | Bounty | Prize | Can We Qualify? | Effort | Priority |
|---|---------|--------|-------|-----------------|--------|----------|
| 1 | ADI Foundation | Open Project (DePIN/RWA/Tokenisation) | $19,000 | YES - Full commerce platform on ADI Chain | Already built | PRIMARY |
| 2 | ADI Foundation | ADI Payments Component for Merchants | $3,000 | YES - MerchantVault + Checkout Widget | Already built | PRIMARY |
| 3 | ADI Foundation | ERC-4337 Paymaster Devtools | $3,000 | YES - ADIPaymaster deployed | Already built | PRIMARY |
| 4 | Hedera | Killer App for Agentic Society (OpenClaw) | $10,000 | YES - OpenClaw agents + HTS/HCS | Needs DeFi integration | PRIMARY |
| 5 | Hedera | On-Chain Automation with HSS | $5,000 | YES - SubscriptionManager contract | Needs frontend wiring | SECONDARY |
| 6 | Hedera | "No Solidity Allowed" - SDK Only | $5,000 | POSSIBLE - Would need SDK-only component | Medium effort | STRETCH |
| 7 | Kite AI | Agent-Native Payments (x402) | $10,000 | YES - Agent marketplace + payments | Needs Kite integration | SECONDARY |
| 8 | Base | Self-Sustaining Autonomous Agents | $10,000 | YES - Self-paying agent on Base mainnet | Needs Base deployment | SECONDARY |
| 9 | 0G Labs | Best DeFAI Application | $7,000 | YES - AI + DeFi workflow | Needs 0G integration | TERTIARY |
| 10 | 0G Labs | Best Use of AI Inference (0G Compute) | $7,000 | POSSIBLE - Use 0G for agent inference | Medium effort | TERTIARY |
| 11 | 0G Labs | Best Use of On-Chain Agent (iNFT) | $7,000 | POSSIBLE - iNFT agent identity | Medium effort | TERTIARY |
| 12 | Uniswap Foundation | Integrate Uniswap API | $5,000 | YES - Agent swaps via Uniswap API | Low-medium effort | SECONDARY |
| 13 | QuickNode | Monad Streams | $1,000 | LOW - Requires Monad chain | High effort | SKIP |
| 14 | QuickNode | Hyperliquid Streams | $1,000 | LOW - Requires Hyperliquid | High effort | SKIP |
| 15 | Canton Network | Privacy dApp (Daml) | $8,000 | NO - Requires Daml language | Too different | SKIP |
| 16 | Canton Network | Dev Tooling | $7,000 | NO - Requires Canton expertise | Too different | SKIP |
| 17 | Blockade Labs | Solving Homeless Agent Problem | $2,000 | LOW - Spatial AI, different focus | Different domain | SKIP |
| 18 | ETHDenver | Futurllama Track (AI + Frontier) | $2,000 | YES - AI agent commerce fits perfectly | Already qualifies | BONUS |
| 19 | ETHDenver | New France Village (Future of Finance) | $2,000 | YES - DeFi + agent commerce | Already qualifies | BONUS |

---

## MAXIMUM REALISTIC BOUNTY POOL

### Tier 1 - Already Qualified (just polish + submit): $27,000
| Bounty | Prize | Status |
|--------|-------|--------|
| ADI Open Project | $19,000 | Contracts deployed, frontend working |
| ADI Payments | $3,000 | MerchantVault + Checkout deployed |
| ADI Paymaster | $3,000 | ADIPaymaster deployed + tested |
| ETHDenver Track (Futurllama) | $2,000 | AI agent commerce = direct fit |

### Tier 2 - High ROI Integration (1-2 days work): $30,000
| Bounty | Prize | What's Needed |
|--------|-------|---------------|
| Hedera OpenClaw | $10,000 | Wire OpenClaw agents to do REAL DeFi via HTS/HCS |
| Hedera HSS | $5,000 | Wire SubscriptionManager frontend + demo HSS lifecycle |
| Kite AI | $10,000 | Deploy on Kite testnet + x402 payment flows |
| Uniswap API | $5,000 | Integrate Uniswap API for agent cross-chain swaps |

### Tier 3 - Stretch Goals (if time permits): $24,000
| Bounty | Prize | What's Needed |
|--------|-------|---------------|
| Base Autonomous | $10,000 | Deploy self-sustaining agent on Base mainnet |
| 0G DeFAI | $7,000 | Deploy on 0G Chain + use 0G Compute |
| 0G iNFT | $7,000 | Deploy iNFT agent identity on 0G |

### TOTAL ADDRESSABLE: $81,000
### REALISTIC TARGET: $57,000 (Tier 1 + Tier 2)

---

## CRITICAL GAPS IN CURRENT CODEBASE

### 1. OpenClaw Agents Don't Do Real DeFi (BIGGEST GAP)
**Current state:** OpenClaw agents have skills defined in SKILL.md files that describe commerce/merchant workflows, but they only interact with our own AgentRegistry/PaymentRouter/MerchantVault contracts on ADI Chain.

**What judges want:** Agents that autonomously discover, rank, and TRADE with each other using Hedera tokens. The example is agents in prediction markets evaluating probabilities and placing trades.

**What's needed:**
- New MCP tools wrapping `@hashgraph/sdk` or `hedera-agent-kit` for Hedera operations
- SaucerSwap integration for token swaps (via `hak-saucerswap-plugin`)
- Bonzo Finance integration for lending/borrowing
- HCS-10 agent-to-agent communication
- HTS token creation and trading
- ERC-8004 reputation contracts deployed on Hedera

### 2. No Kite AI Integration
**What's needed:** Deploy contracts on Kite testnet (Chain ID 2368), implement x402 payment flows, verifiable agent identity

### 3. No Uniswap API Integration
**What's needed:** API keys from developers.uniswap.org, swap execution flow, integrate into agent decision-making

### 4. No Base Mainnet Deployment
**What's needed:** Deploy on Base mainnet (not testnet), ERC-8021 builder codes, self-sustaining revenue model, public stats dashboard

### 5. HSS Frontend Not Wired
**What's needed:** Frontend page showing schedule lifecycle (created -> pending -> executed/failed), transaction links on HashScan

---

## BOUNTY-SPECIFIC QUALIFICATION CHECKLIST

### Hedera OpenClaw ($10,000) - THE BIG ONE
- [x] App is agent-first (OpenClaw agents configured)
- [x] Agent-to-agent architecture exists
- [ ] Agents use Hedera EVM, Token Service, or Consensus Service
- [ ] Agents do REAL DeFi (swaps, lending, prediction markets)
- [ ] Agents discover and rank each other autonomously
- [ ] HCS attestations for trust/reputation
- [ ] ERC-8004 reputation indicators
- [ ] UCP for standardized agent commerce
- [ ] Live demo URL with agent flow visualization
- [ ] 3-min demo video

### ADI Open Project ($19,000)
- [x] Deployed on ADI Chain
- [x] Public code repository
- [x] Clear institutional use case (tokenized agent services)
- [x] Smart contracts with governance controls
- [x] DDSC stablecoin integration
- [ ] Live demo accessible without manual setup
- [ ] Documentation completeness
- [ ] 3-min demo video

### Hedera HSS ($5,000)
- [x] SubscriptionManager.sol written
- [ ] Deployed on Hedera testnet
- [ ] Contract-driven scheduling (not backend script)
- [ ] Schedule lifecycle UI (created -> pending -> executed/failed)
- [ ] Edge case handling (insufficient balance, expired schedules)
- [ ] Transaction links to HashScan
- [ ] 3-min demo video

### Uniswap API ($5,000)
- [ ] Uniswap API integration for swap execution
- [ ] API keys from developers.uniswap.org
- [ ] Working swap functionality on testnet/mainnet
- [ ] Publicly available interface
- [ ] Open source
- [ ] Creative API usage (agent-driven swaps)
