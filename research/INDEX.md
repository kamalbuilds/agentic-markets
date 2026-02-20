# ETHDenver 2026 Research Index
## Updated: 2026-02-20

---

## Research Files

| # | File | Research Topic | Bounties Covered | Key Findings |
|---|------|---------------|-----------------|--------------|
| 1 | `01_openclaw_hedera_agents.md` | OpenClaw + Hedera + UCP + ERC-8004 | $10K Killer App for Agentic Society | OpenClaw = open-source AI agent platform. UCP = agent commerce standard. ERC-8004 = agent identity+reputation on-chain. Hedera Agent Kit v3 for SDK. |
| 2 | `02_hedera_schedule_service.md` | Hedera Schedule Service System Contracts | $5K On-Chain Automation | HSS at `0x16b`. scheduleCall/scheduleCallWithPayer. Self-rescheduling loops. Capacity-aware scheduling. |
| 3 | `03_adi_chain_foundation.md` | ADI Chain / ADI Foundation | $19K Open + $3K Payments + $3K Paymaster | ADI = MENA's first institutional L2. DDSC dirham stablecoin. Chain ID 99999 (testnet). |
| 4 | `04_base_kitenai_0glabs.md` | Base, Kite AI, 0G Labs, Canton, QuickNode | $10K Base + $10K Kite + $25K 0G | Initial overview of all sponsor bounties. |
| 5 | `05_strategy_and_winning.md` | Winning strategies + cross-bounty analysis | ALL bounties | Best EV: ADI Open ($19K, 5 winners). Day-by-day execution plan. Demo video structure. |
| 6 | `06_bounty_qualification_analysis.md` | **MASTER BOUNTY MAP** - All 19 bounties analyzed | ALL | Complete qualification matrix. $81K addressable, $57K realistic. Priority ranking. Gap analysis. |
| 7 | `07_openclaw_real_defi_on_hedera.md` | OpenClaw + Real DeFi on Hedera | $10K OpenClaw | SaucerSwap, Bonzo Finance, HCS-10, ERC-8004 deployment. New MCP tools needed. Architecture for real DeFi agents. |
| 8 | `08_codebase_status_audit.md` | What's built vs what's missing | ALL | 75-80% complete. All ADI contracts deployed. Missing: Hedera DeFi tools, Kite/Base/0G integrations. Priority implementation order. |
| 10 | `10_uniswap_0g_bounties.md` | Uniswap API + 0G Labs deep dive | $5K Uniswap + $25K 0G | Uniswap API (16 chains, UniswapX). 0G Compute SDK. iNFT = ERC-7857. DeFAI strategy. Integration code examples. |
| 11 | `11_base_kiteai_bounty_deep_dive.md` | Base + Kite AI bounty deep dive | $10K Base + $10K Kite | x402 protocol (HTTP 402 payments), ERC-8021 builder codes, Kite Passport 3-tier identity, self-sustaining agent economics, complete implementation code. |
| 12 | `12_hcs10_hedera_agent_ecosystem.md` | HCS-10/11, Hedera Agent Kit, UCP, ERC-8004 | $10K OpenClaw | HCS-10 agent communication (4 topic types, 7 ops). HCS-11 profiles. 10 core plugins + 6 third-party. UCP REST + MCP. ERC-8004 on Hedera EVM. |
| 13 | `13_hedera_defi_protocols_technical.md` | Hedera DeFi Protocols for AI Agents | $10K OpenClaw | SaucerSwap V1/V2 testnet contracts. Bonzo Finance lending. Pyth/Supra/Chainlink oracles. Agent Kit plugin ecosystem. |

---

## Quick Reference: All Bounties We Can Target

| # | Sponsor | Bounty | Prize | Status | Priority |
|---|---------|--------|-------|--------|----------|
| 1 | ADI Foundation | Open Project (DePIN/RWA/Tokenisation) | $19,000 | READY - Contracts deployed | PRIMARY |
| 2 | ADI Foundation | Payments Component for Merchants | $3,000 | READY - MerchantVault deployed | PRIMARY |
| 3 | ADI Foundation | ERC-4337 Paymaster Devtools | $3,000 | READY - ADIPaymaster deployed | PRIMARY |
| 4 | Hedera | Killer App for Agentic Society (OpenClaw) | $10,000 | NEEDS WORK - Real DeFi integration | PRIMARY |
| 5 | Hedera | On-Chain Automation (HSS) | $5,000 | PARTIAL - Contract written, needs deploy | SECONDARY |
| 6 | Hedera | "No Solidity Allowed" - SDK Only | $5,000 | POSSIBLE - Needs SDK-only component | STRETCH |
| 7 | Kite AI | Agent-Native Payments (x402) | $10,000 | NEEDS WORK - Kite deployment + x402 | SECONDARY |
| 8 | Base | Self-Sustaining Autonomous Agents | $10,000 | NEEDS WORK - Base mainnet + ERC-8021 | SECONDARY |
| 9 | Uniswap | Integrate Uniswap API | $5,000 | NEEDS WORK - API integration | SECONDARY |
| 10 | 0G Labs | Best DeFAI Application | $7,000 | NEEDS WORK - 0G deployment | TERTIARY |
| 11 | 0G Labs | Best Use of AI Inference (0G Compute) | $7,000 | NEEDS WORK - 0G Compute SDK | TERTIARY |
| 12 | 0G Labs | Best Use of On-Chain Agent (iNFT) | $7,000 | NEEDS WORK - iNFT deployment | TERTIARY |
| 13 | ETHDenver | Futurllama Track (AI + Frontier) | $2,000 | READY - AI agent commerce = direct fit | BONUS |
| 14 | ETHDenver | New France Village (Future of Finance) | $2,000 | READY - DeFi + commerce | BONUS |
| | | **TOTAL ADDRESSABLE** | **$95,000** | | |
| | | **REALISTIC TARGET** | **$57,000** | Tier 1 + Tier 2 | |

---

## Key Technical Links

### Hedera
- Docs: https://docs.hedera.com
- Portal/Faucet: https://portal.hedera.com
- HSS Docs: https://docs.hedera.com/hedera/core-concepts/smart-contracts/system-smart-contracts/hedera-schedule-service
- Agent Kit: https://github.com/hashgraph/hedera-agent-kit-js
- Agent Skills: https://github.com/hedera-dev/hedera-agent-skills
- UCP Tutorial: https://github.com/hedera-dev/tutorial-ucp-hedera
- Testnet RPC: https://testnet.hashio.io/api (Chain ID 296)

### ADI Chain
- Docs: https://docs.adi.foundation
- Testnet Faucet: https://faucet.ab.testnet.adifoundation.ai/
- Testnet RPC: https://rpc.ab.testnet.adifoundation.ai/ (Chain ID 99999)
- Explorer: https://explorer.ab.testnet.adifoundation.ai/
- GitHub: https://github.com/ADI-Foundation-Labs

### HCS-10 / OpenConvAI
- HCS-10 Standard: https://hol.org/docs/standards/hcs-10/
- HCS-11 Profiles: https://hol.org/docs/standards/hcs-11/
- Standards SDK: https://github.com/hashgraph-online/standards-sdk
- npm: @hol-org/standards-sdk, @hashgraphonline/standards-agent-kit

### OpenClaw
- Docs: https://docs.openclaw.ai/start/getting-started
- Skills Hub: https://clawhub.com

### ERC-8004
- Spec: https://www.8004.org
- Contracts: https://github.com/erc-8004/erc-8004-contracts

### Kite AI
- Docs: https://docs.gokite.ai
- Testnet RPC: https://rpc-testnet.gokite.ai/ (Chain ID 2368)
- Faucet: https://faucet.gokite.ai
- Explorer: https://testnet.kitescan.ai/
- Pieverse Facilitator: https://facilitator.pieverse.io

### Base
- Docs: https://docs.base.org
- x402 Agents: https://docs.base.org/base-app/agents/x402-agents
- Builder Codes: https://base.dev (Settings -> Builder Codes)
- x402 GitHub: https://github.com/coinbase/x402

### Hedera DeFi
- SaucerSwap: https://docs.saucerswap.finance/
- SaucerSwap Plugin: https://github.com/jmgomezl/hak-saucerswap-plugin
- Bonzo Finance: https://docs.bonzo.finance/hub/
- Bonzo Plugin: https://github.com/Bonzo-Labs/bonzoPlugin
- Pyth Plugin: https://github.com/jmgomezl/hak-pyth-plugin

### Uniswap
- API Docs: https://api-docs.uniswap.org/introduction
- Developer Portal: https://developers.uniswap.org/dashboard
- AI Skills: https://github.com/Uniswap/uniswap-ai

### 0G Labs
- Docs: https://docs.0g.ai/
- iNFT: https://docs.0g.ai/concepts/inft
- Compute: https://docs.0g.ai/concepts/compute
- Builder Hub: https://build.0g.ai/
- Faucet: https://faucet.0g.ai/

### Submission
- Devfolio: https://ethdenver2026.devfolio.co/
- ENS Setup: https://app.ethdenver.com
