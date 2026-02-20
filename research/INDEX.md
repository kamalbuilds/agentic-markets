# ETHDenver 2026 Research Index
## Generated: 2026-02-14

---

## Agent -> Task Mapping

| # | File | Research Topic | Bounties Covered | Key Findings |
|---|------|---------------|-----------------|--------------|
| 1 | `01_openclaw_hedera_agents.md` | OpenClaw + Hedera + UCP + ERC-8004 | $10K Killer App for Agentic Society | OpenClaw = open-source AI agent platform (180K devs). UCP = agent commerce standard (Shopify/Visa/Mastercard). ERC-8004 = agent identity+reputation on-chain. Hedera Agent Kit v3 for SDK. |
| 2 | `02_hedera_schedule_service.md` | Hedera Schedule Service System Contracts | $5K On-Chain Automation | HSS at `0x16b`. scheduleCall/scheduleCallWithPayer for autonomous execution. Self-rescheduling loops. Capacity-aware scheduling with exponential backoff. |
| 3 | `03_adi_chain_foundation.md` | ADI Chain / ADI Foundation | $19K Open + $3K Payments + $3K Paymaster | ADI = MENA's first institutional L2 (ZKsync Airbender). DDSC dirham stablecoin launched Feb 12! BlackRock/Mastercard/FAB partnerships. Chain ID 36900 (mainnet), 99999 (testnet). |
| 4 | `04_base_kitenai_0glabs.md` | Base, Kite AI, 0G Labs, Canton, QuickNode | $10K Base + $10K Kite + $25K 0G + $15K Canton + $2K QN | Total pool = $124K. Kite AI = first AI payment chain (PoAI consensus). 0G Labs = iNFTs via ERC-7857. Base details TBA. Canton = Daml privacy chain. |
| 5 | `05_strategy_and_winning.md` | Winning strategies + cross-bounty analysis | ALL bounties | Best EV: ADI Open ($19K, 5 winners). One project can target 8+ bounties ($66K addressable). Day-by-day execution plan. Demo video structure. Past winner patterns. |
| 9a | `09_base_kiteai_bounty_deep_dive.md` | Base + Kite AI bounty deep dive | $10K Base Self-Sustaining + $10K Kite Agent-Native | x402 protocol (HTTP 402 payments), ERC-8021 builder codes, Kite Passport 3-tier identity, self-sustaining agent economics, gokite-aa scheme, Pieverse facilitator, complete implementation code. |
| 9b | `09_hcs10_hedera_agent_ecosystem.md` | HCS-10/11, Hedera Agent Kit, UCP, ERC-8004 | Hedera OpenClaw + Killer App | HCS-10 = agent P2P communication via HCS topics (4 topic types, 7 operations). HCS-11 = agent identity profiles (4 types). Standards SDK + Agent Kit (10 core plugins, 6 third-party). UCP = Google-backed agent commerce standard (REST + MCP). ERC-8004 fully deployable on Hedera EVM (3 registries: Identity/Reputation/Validation). |

---

## Quick Reference: All Bounties

| Sponsor | Prize | Winners | Our EV Tier |
|---------|-------|---------|-------------|
| ADI Open | $19,000 | 5 | TIER 1 (HIGHEST) |
| Hedera OpenClaw | $10,000 | 1 | TIER 1 |
| Kite AI | $10,000 | TBA | TIER 1 |
| 0G Labs (total) | $25,000 | 8+ | TIER 2 |
| Base | $10,000 | TBA | TIER 2 (high competition) |
| Canton Network | $15,000 | 2 | TIER 2 (niche: Daml) |
| Hedera Schedule | $5,000 | 2 | TIER 2 |
| Hedera SDKs Only | $5,000 | 3 | TIER 3 |
| Hedera Hiero CLI | $5,000 | 2 | TIER 3 |
| ADI Payments | $3,000 | 2 | TIER 3 |
| ADI Paymaster | $3,000 | 1-2 | TIER 3 |
| ETHDenver Main | $10,000 | 5 | TIER 3 |
| QuickNode | $2,000 | 2 | TIER 3 |
| Nouns Builder | $2,000 | TBA | TIER 3 |
| **TOTAL** | **$124,000** | | |

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
- Mainnet RPC: https://rpc.adifoundation.ai/ (Chain ID 36900)
- Explorer: https://explorer.adifoundation.ai/
- GitHub: https://github.com/ADI-Foundation-Labs

### HCS-10 / OpenConvAI
- HCS-10 Standard: https://hol.org/docs/standards/hcs-10/
- HCS-11 Profiles: https://hol.org/docs/standards/hcs-11/
- Standards SDK: https://github.com/hashgraph-online/standards-sdk
- Standards Agent Kit: https://github.com/hashgraph-online/standards-agent-kit
- OpenConvAI Portal: https://moonscape.tech/openconvai/learn
- npm: @hol-org/standards-sdk, @hashgraphonline/standards-agent-kit

### OpenClaw
- Docs: https://docs.openclaw.ai/start/getting-started
- Skills Hub: https://clawhub.com

### ERC-8004
- Spec: https://www.8004.org
- Contracts: https://github.com/erc-8004/erc-8004-contracts

### 0G Labs
- iNFT Docs: https://docs.0g.ai/build-with-0g/inft
- ERC-7857: https://docs.0g.ai/developer-hub/building-on-0g/inft/erc7857

### Kite AI
- Docs: https://docs.gokite.ai
- GitHub: https://github.com/gokite-ai

### Base
- AgentKit: https://github.com/coinbase/agentkit
- OnchainKit: https://docs.base.org/builderkits/onchainkit

### Submission
- Devfolio: https://ethdenver2026.devfolio.co/
- ENS Setup: https://app.ethdenver.com

---

## Recommended Project Concept: "AgentMarket"

Autonomous AI agents that discover, negotiate, and pay each other across chains.

**Primary targets**: ADI Open ($19K) + Hedera OpenClaw ($10K) + Kite AI ($10K)
**Secondary**: Hedera Schedule ($5K) + 0G iNFT ($7K)
**Bonus**: Base ($10K) + ADI Payments ($3K) + QuickNode ($2K)
**Max addressable**: ~$66,000
