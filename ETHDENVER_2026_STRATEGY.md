# ETHDenver 2026 -- Comprehensive Hackathon Strategy Guide

## Table of Contents

1. [Event Logistics](#1-ethdenver-2026-logistics)
2. [Past Winners Analysis](#2-past-ethdenver-winners--patterns)
3. [Judging Criteria Deep Dive](#3-judging-criteria--how-to-maximize-points)
4. [Multi-Bounty Strategy](#4-multi-bounty-strategy)
5. [Submission Best Practices](#5-submission-best-practices-demo-video--readme)
6. [Tech Stack Recommendations](#6-tech-stack-recommendations)
7. [Cross-Bounty Analysis & Expected Value](#7-cross-bounty-analysis--expected-value)
8. [Day-by-Day Execution Plan](#8-day-by-day-execution-plan)

---

## 1. ETHDenver 2026 Logistics

### Key Dates
| Phase | Dates | Details |
|-------|-------|---------|
| Virtual BUIDLathon Start | **Wed Feb 11** | Bounties announced; start building remotely |
| Camp BUIDL | **Sun Feb 15** | CSU Spur Hydro Building, 9:00 AM |
| Hedera DevDay | **Tue Feb 17** | Side event alongside ETHDenver |
| Main Event | **Feb 17-21** | Full conference at new venue |
| Onsite BUIDLing | **Wed Feb 18 - Sat Feb 21** | BUIDLHub open (4 days onsite) |
| Submission Deadline | **Sat Feb 21, 6:00 PM** | BUIDLathon project submission 9AM-6PM |
| Judging | **Sat Feb 21, 10AM-2:30PM** | During submission window |
| Closing Ceremony | **Sat Feb 21, 5PM-7:30PM** | Awards announced |
| SporkDAO Mountain Retreat | **Feb 22-27** | Post-event community retreat |

### Venue
- **NEW venue for 2026**: National Western Center (LVC), 4850 National Western Dr, Denver, CO 80216
- Built across an entire campus dedicated to builders
- Themed "villages" spread across the venue

### Registration & ENS Requirement
- Create an ETHDenver account at **app.ethdenver.com**
- You MUST create an **ENS subdomain** (e.g., `yourname.ethdenver.eth`)
- This ENS address is required for your ticket AND project submission
- Join the **SporkDAO Discord** for announcements and team formation

### Submissions via Devfolio
- Submit at **ethdenver2026.devfolio.co**
- Each team can submit to **up to 10 sponsor bounties** simultaneously
- Submissions require: project description, GitHub repo, demo video (<3 min), and team info
- Sponsor bounties are judged by the issuing sponsor, NOT the Open Track judges

### Five Themed Tracks
1. **ETHERSPACE** -- Wallet identity, creator economies, social platforms, NFTs, legal frameworks
2. **DEVTOPIA** -- Infrastructure, L2s, developer tooling, security, zk, modular systems
3. **NEW FRANCE VILLAGE** -- RWAs, stablecoins, DeFi/TradFi, policy, compliance
4. **FUTURLLAMA** -- AI, DePIN, frontier tech, emerging tech x Ethereum
5. **PROSPERIA** -- Privacy, governance, DAOs, regenerative finance, public goods

---

## 2. Past ETHDenver Winners & Patterns

### ETHDenver 2024 Winners (from 200+ projects)

| Project | Track | Description | Why It Won |
|---------|-------|-------------|------------|
| **HoneyPause** | Security | Onchain mechanism letting white hats pause protocols on exploit discovery and claim bounties | Real security problem, clever smart contract design |
| **Egg Wars** | DeFi/NFT/Gaming | Chicken-and-egg NFT game with $EGG token | Fun, engaging, gamification of DeFi |
| **ODIN** | Security | Marketplace for dapps to pause contracts before malicious transactions execute | Novel approach to MEV/security |
| **BeFit** | Impact/Public Goods | Fitness social media rewarding pushup challenges with NFTs (BeReal meets fitness) | Fun consumer app, real engagement, simple concept |
| **Sekai** | AI | AI-interactive story-building platform | Creative AI x crypto intersection |

**Key Pattern**: Security + AI + Gaming dominated. $1M+ total distributed across ETHDenver and 50 sponsors.

### ETHDenver 2025 Winners (Hedera Bounties)

| Project | Track | Prize |
|---------|-------|-------|
| **InfoFi** | AI & Agents | $15,000 (1st) |
| **Index Token -- DAO Governance** | AI & Agents | $6,000 (2nd) |
| **Pixie AI** | AI & Agents | $3,000 (3rd) |
| **ChargeHive** | EVM Builder | $10,000 (1st) |
| **Robolingo** | EVM Builder | $6,000 (2nd) |
| **TrustDAI** | EVM Builder | $3,000 (3rd) |
| **DreamFi, Thyr, Ava MultiChain DeFAI Agent, NFTs With Benefits, Stitch AI** | Explorers | $1,000 each |

**Key Pattern**: AI agents and DeFAI (DeFi + AI) dominated 2025. Every winning project had an AI angle.

### Winning Patterns Across Years

1. **AI Integration is now table stakes** -- In 2025, AI agents were everywhere. Projects without an AI angle struggled to stand out.
2. **Fun beats complex** -- BeFit won with a simple pushup challenge. Egg Wars won with a silly game. Judges respond to delight.
3. **Solve a real problem** -- HoneyPause and ODIN addressed genuine security vulnerabilities.
4. **Cross-domain innovation** -- The best projects combine two unexpected domains (fitness + NFTs, AI + storytelling, security + marketplace).
5. **Consumer-friendly UX** -- Winners have polished UIs that non-crypto users can understand.
6. **Working demo is essential** -- Every winner had a functional prototype, not just slides.

---

## 3. Judging Criteria & How to Maximize Points

### Open Track Judging Categories

ETHDenver judges rate projects on these dimensions:

| Criteria | What Judges Look For | How to Maximize |
|----------|---------------------|-----------------|
| **Most Innovative** | Originality, creativity, novelty, usefulness | Combine two domains nobody has combined before. Frame it as "X for Y" where the combination is surprising. |
| **Best Engineering** | Technical implementation quality, code quality | Clean code, proper architecture, tests, meaningful comments. Use established frameworks (Scaffold-ETH 2). Show contract verification on-chain. |
| **Best User Experience** | Ease of use for both experts and amateurs | Invest heavily in UI. Use Tailwind + shadcn/ui. Onboard users in <30 seconds. Minimize wallet friction. |
| **Highest WOW Factor** | Excitement, impressiveness | Build something visually striking. Live demos with real transactions. Real-time AI responses. "Holy sh*t" moments. |
| **Best for Blockchain** | Ecosystem improvement, adoption, developer tools, architecture | Explain why this MUST be on-chain. Show how you improve the ecosystem. Contribute to open source. |

### Sponsor Bounty Judging
- Sponsors use their OWN criteria (listed in each bounty description)
- Often more focused: "Did you integrate our SDK correctly? Did you use our specific service?"
- Sponsor judges are typically employees of the sponsoring company -- they want to see their tech used well

### Point-Maximizing Framework (FIVE-S-P)

**F** -- Feasibility: Can this actually work? Show deployed contracts, working backend.
**I** -- Innovation: What's new here? What hasn't been done?
**V** -- Validation: Did anyone actually use it? Show metrics, user feedback, or at minimum a user flow.
**E** -- Execution: How polished is the code and UI? Does it look production-ready?
**S** -- Success potential: Could this become a real product? What's the roadmap?
**P** -- Pitch: Can you explain it in 30 seconds? Is the demo compelling?

---

## 4. Multi-Bounty Strategy

### Rules
- Teams can submit to **up to 10 sponsor bounties** simultaneously
- You can ALSO compete in the **Open Track** (5 themed tracks)
- Sponsor bounties are judged by sponsors independently
- Open Track is judged by ETHDenver's panel
- **One project can win multiple bounties** -- this is the key leverage point

### The Proven "Bounty Stacking" Strategy

From a team that won 5/5 bounties at ETHDenver (earning $7,250):

1. **Brainstorm bounty compatibility FIRST** -- Before building, analyze which bounties can be satisfied by the same core project
2. **Predict competition** -- Popular bounties (big names, high prizes) attract more teams. Niche bounties have less competition.
3. **Design modular architecture** -- Build a core app that naturally integrates multiple sponsor technologies
4. **Write targeted descriptions** -- For each bounty submission, emphasize the specific integration that sponsor cares about
5. **Test each integration thoroughly** -- Sponsors will try your app with their specific tech. Broken integrations = instant disqualification.

### How to Stack Bounties with One Project

The ideal project has a **core use case** that naturally requires:
- A blockchain platform (Hedera, Base, ADI)
- An AI component (OpenClaw, Kite AI)
- A data/storage layer (0G Labs)
- Specific features (scheduled transactions, payments)

Example architecture:
```
[AI Agent Layer] -- OpenClaw + Kite AI
       |
[Application Layer] -- Your core app logic
       |
[Blockchain Layer] -- Hedera / Base / ADI
       |
[Data Layer] -- 0G Labs decentralized storage
```

---

## 5. Submission Best Practices: Demo Video & README

### Demo Video (<3 minutes) -- Critical Checklist

**Structure (follow this exact order):**
1. **0:00-0:20 -- The Hook**: State the problem in one sentence. Show why it matters.
2. **0:20-0:45 -- The Solution**: "We built [X], which does [Y] for [Z]"
3. **0:45-2:15 -- The Demo**: Screen-record a LIVE walkthrough. Show real transactions, real AI responses.
4. **2:15-2:45 -- The Tech**: Quick architecture diagram. Name the sponsor tech you used.
5. **2:45-3:00 -- The Ask**: "We're targeting [bounty names]. Check our GitHub at [link]."

**Production Tips:**
- Use **OBS Studio** for screen recording (free, reliable)
- Add intro graphics/text overlays with **Canva** or **CapCut**
- Record narration separately for clarity (don't rely on live audio)
- Show the deployed contract address and block explorer link on screen
- Include face cam in a corner (builds trust with judges)
- Export at 1080p minimum

**Critical Don'ts:**
- Do NOT go over 3 minutes (judges will stop watching)
- Do NOT show code for more than 10 seconds
- Do NOT start with "Hi, we're team X" -- start with the problem
- Do NOT show loading screens or errors

### README -- What Judges Actually Read

```markdown
# [Project Name] -- [One-line description]

## The Problem
[2-3 sentences on why this matters]

## Our Solution
[2-3 sentences on what you built and why blockchain is essential]

## Demo
- [Demo Video Link] (<3 min)
- [Live App URL]
- [Deployed Contract Address + Block Explorer Link]

## Architecture
[Diagram showing how components connect]

## Tech Stack
- Frontend: Next.js 14, Tailwind CSS, shadcn/ui
- Web3: viem, wagmi, RainbowKit
- Blockchain: [Hedera/Base/ADI/etc.]
- AI: [OpenClaw/Kite AI/etc.]
- Backend: [Node.js/Python/etc.]

## Bounties Targeted
- [ ] Hedera -- OpenClaw Killer App ($10k)
- [ ] ADI -- Open Project ($19k)
- [ ] Base -- ($10k)
- [List each bounty and how your project satisfies it]

## How to Run Locally
[Step-by-step with copy-paste commands]

## Team
- [Name] -- [Role] -- [GitHub/Twitter]

## What's Next
[Future roadmap -- shows judges you're serious about continuing]
```

---

## 6. Tech Stack Recommendations

### Core Web3 Stack (Battle-Tested for Hackathons)

```
Frontend:       Next.js 14+ (App Router) + TypeScript
Styling:        Tailwind CSS + shadcn/ui (beautiful components fast)
Web3:           viem + wagmi v2 + RainbowKit (wallet connection)
Smart Contracts: Solidity + Foundry (fast compilation, testing)
Boilerplate:    Scaffold-ETH 2 (includes all of the above)
Deployment:     Vercel (frontend) + testnet deployment
```

### Why This Stack?
- **Scaffold-ETH 2** gives you a complete dApp in minutes with hot-reload
- **wagmi v2 + viem** are the modern standard (ethers.js is legacy)
- **shadcn/ui** components look professional with zero design skill
- **RainbowKit** handles wallet connection UX perfectly
- **Foundry** compiles and tests contracts 10x faster than Hardhat

### Quick-Start Boilerplates

| Boilerplate | What It Includes | Best For |
|-------------|-----------------|----------|
| **Scaffold-ETH 2** | Next.js + Wagmi + RainbowKit + Foundry/Hardhat + Viem | General dApp prototyping |
| **nexth** | Next.js + Viem + Wagmi + Web3Modal + SIWE + Tailwind + daisyUI | Auth-focused apps |
| **Next-Web3-Boilerplate** | Next.js + Viem + Wagmi + RainbowKit + Chakra UI | Polished UI apps |
| **create-web3-dapp** | Alchemy's all-in-one template | Quick API-driven apps |

### AI Agent Frameworks for Blockchain

| Framework | Best For | Blockchain Integration |
|-----------|----------|----------------------|
| **ElizaOS (ai16z)** | Autonomous AI agents with Web3 | Native plugin system for blockchain wallets, transactions, events. TypeScript. $20B+ ecosystem. |
| **LangChain/LangGraph** | Complex agent workflows | Good for orchestration; needs custom blockchain adapters |
| **AutoGPT** | Fully autonomous agents | Less blockchain-native; more general purpose |
| **CrewAI** | Multi-agent collaboration | Good for multi-agent scenarios; Python-based |
| **Vercel AI SDK** | Streaming AI in React apps | Best for UI-facing AI; pair with web3 stack |

### Recommendation for This Hackathon

For the OpenClaw + Hedera bounty and AI-focused bounties:

```
AI Layer:     ElizaOS (best blockchain-native AI agent framework)
              + Vercel AI SDK (for streaming UI)
Frontend:     Next.js 14 + shadcn/ui + Tailwind
Web3:         viem + wagmi + RainbowKit
Blockchain:   Hedera SDK (for scheduled transactions, HCS)
              + Base (for EVM compatibility)
Data:         0G Labs (decentralized AI data storage)
```

### Building Impressive UIs Fast

1. **shadcn/ui** -- Copy-paste React components that look professional
2. **v0.dev** -- Vercel's AI that generates React + Tailwind UI from prompts
3. **Magic UI** -- Animated components for landing pages
4. **Framer Motion** -- Smooth animations in React
5. **Recharts** -- Data visualization for dashboards
6. **React Flow** -- For visualizing agent workflows or transaction flows

**Pro tip**: Spend 30% of your time on UI. Judges form opinions in the first 5 seconds of seeing your app.

---

## 7. Cross-Bounty Analysis & Expected Value

### Complete Bounty Breakdown (ETHDenver 2026)

| Bounty | Prize Pool | # Winners | Top Prize | Sponsor |
|--------|-----------|-----------|-----------|---------|
| OpenClaw + Hedera | $10,000 | 1 | $10,000 | Hedera |
| Hedera Schedule Service | $5,000 | 2 | $3,000 | Hedera |
| Hedera SDKs Only | $5,000 | 3 | $2,500 | Hedera |
| Hiero CLI Plugin | $5,000 | 2 | $2,500 | Hedera |
| ADI Open | $19,000 | 5 | $10,000 | ADI Foundation |
| ADI ERC-4337 Paymaster | $3,000 | ? | ? | ADI Foundation |
| ADI Payments | $3,000 | 2 | ? | ADI Foundation |
| Base | $10,000 | TBA | TBA | Coinbase/Base |
| Kite AI | $10,000 | TBA | TBA | Kite AI |
| 0G Labs iNFT | $7,000 | 2 | ? | 0G Labs |
| 0G Labs (other tracks) | $18,000 | TBA | TBA | 0G Labs |
| Canton Network | $15,000 | 2 | $8,000 | Canton |
| QuickNode | $2,000 | 2 | $1,000 | QuickNode |
| Nouns Builder DAO | $2,000 | 2 | $1,000 | Nouns |
| ETHDenver Tracks (x5) | $10,000 | 5 | $2,000 | ETHDenver |

### Expected Value Analysis

**Expected Value = (Prize * Probability of Winning)**

Factors affecting probability:
- **Competition level**: Popular chains (Base) attract MORE teams. Niche protocols attract fewer.
- **Difficulty**: Complex integrations (Canton/Daml) deter many teams. Simple "use our SDK" bounties attract more.
- **Clarity of requirements**: Vague bounties ("Coming Soon") are risky -- you might build the wrong thing.
- **Number of winners**: More winners = higher probability of placing.

### Tier Analysis

#### TIER 1 -- Highest Expected Value (Target These)

**ADI Open -- $19,000 (5 winners)**
- EV Rating: VERY HIGH
- Why: 5 winners means high probability of placing. ADI Foundation is relatively new (Abu Dhabi-based L2), so fewer developers are familiar with it. $10K first prize is massive.
- Risk: Requirements may be vague. ADI Chain documentation may be limited.
- Strategy: Build something that showcases RWAs, stablecoins, or institutional use cases on their L2. MENA market focus is a plus.

**OpenClaw + Hedera -- $10,000 (1 winner)**
- EV Rating: HIGH
- Why: Only 1 winner but the AI agent narrative is HOT. OpenClaw is the buzzy new open-source AI agent. If your project genuinely uses multi-agent commerce on Hedera, you'll stand out.
- Risk: High competition from AI-focused teams. Must demonstrate autonomous agent capabilities.
- Strategy: Build an agent marketplace or autonomous commerce platform. Show agents actually transacting on Hedera.

**Kite AI -- $10,000 (TBA winners)**
- EV Rating: HIGH
- Why: Kite AI is an Avalanche L1 focused on AI agent payments. Fewer developers know this chain. AI x payments is the 2026 narrative.
- Risk: Details "Coming Soon" -- might change. Need to learn a new chain.
- Strategy: Build AI agents that use Kite's PoAI consensus for attribution and payments.

#### TIER 2 -- Good Expected Value

**Hedera Schedule Service -- $5,000 (2 winners)**
- EV Rating: GOOD
- Why: Very specific technical requirement (scheduled transactions). Teams that don't know Hedera's native services won't compete. 2 winners.
- Risk: Must learn Hedera's scheduling API specifically.
- Strategy: Build an automation tool (recurring payments, time-locked governance, scheduled agent actions).

**0G Labs iNFT -- $7,000 (2 winners)**
- EV Rating: GOOD
- Why: On-chain AI agents as iNFTs is a specific niche. 0G Labs' $25K total pool is large.
- Risk: 0G Labs details still "Coming Soon" for other tracks.
- Strategy: Create an AI agent that lives as an NFT and uses 0G's decentralized storage.

**Base -- $10,000 (TBA)**
- EV Rating: MODERATE-GOOD
- Why: $10K is significant, but Base is extremely popular and WILL attract the most teams.
- Risk: Highest competition of any bounty. Everyone knows Base/Coinbase.
- Strategy: Only target if your project naturally deploys on Base. Don't build specifically for this -- use it as a bonus submission.

#### TIER 3 -- Bonus Submissions (Low Effort, Low Risk)

**ADI Payments -- $3,000 (2 winners)**
- Add a payment component to your main project. Low effort if already on ADI.

**ADI ERC-4337 Paymaster -- $3,000**
- Add account abstraction if your app uses it anyway.

**QuickNode -- $2,000 (2 winners)**
- Use QuickNode as your RPC provider. Minimal extra work.

**Hedera SDKs Only -- $5,000 (3 winners)**
- If your Hedera project doesn't use Solidity, this is a freebie.

### Recommended Bounty Stack (Single Project Targeting 5-7 Bounties)

**Primary targets (build for these):**
1. ADI Open ($19K) -- Main submission
2. OpenClaw + Hedera ($10K) -- AI agent integration
3. Kite AI ($10K) -- AI payments layer

**Secondary targets (natural extensions):**
4. Hedera Schedule Service ($5K) -- Add scheduled transactions
5. 0G Labs iNFT ($7K) -- Store AI model data on 0G
6. Base ($10K) -- Deploy on Base as additional chain

**Bonus submissions (minimal extra work):**
7. ADI Payments ($3K) -- Payment flow already in app
8. QuickNode ($2K) -- Use as RPC provider

**Total potential prize pool: up to $66,000 from a single well-designed project.**

---

## 8. Day-by-Day Execution Plan

### Pre-Event (Feb 11-17): Virtual Phase

**Feb 11 (Wed) -- Bounty Drop Day**
- [ ] Read EVERY bounty requirement carefully (they drop this day)
- [ ] Finalize which bounties to target
- [ ] Set up project repo with Scaffold-ETH 2
- [ ] Create project on Devfolio
- [ ] Set up CI/CD (GitHub Actions + Vercel)

**Feb 12-14 -- Core Architecture**
- [ ] Design database/contract schema
- [ ] Set up multi-chain deployment (Hedera testnet + Base testnet + ADI testnet)
- [ ] Build smart contracts and deploy to testnets
- [ ] Set up AI agent framework (ElizaOS)
- [ ] Build basic frontend with wagmi + RainbowKit

**Feb 15-17 -- Feature Development**
- [ ] Complete core user flows
- [ ] Integrate each sponsor's specific SDK/service
- [ ] Test all integrations on testnets
- [ ] Polish UI with shadcn/ui components
- [ ] Start README documentation

### Onsite Phase (Feb 18-21)

**Feb 18 (Wed) -- Integration Day**
- [ ] Arrive at BUIDLHub early, claim workspace
- [ ] Talk to sponsor reps at their booths (crucial for bounty clarity)
- [ ] Fix any integration issues identified during virtual phase
- [ ] Continue feature development

**Feb 19 (Thu) -- Polish Day**
- [ ] Complete all features
- [ ] Bug fixes and edge cases
- [ ] UI polish and responsive design
- [ ] Start recording demo video B-roll

**Feb 20 (Fri) -- Presentation Prep**
- [ ] Record demo video (multiple takes)
- [ ] Edit video (keep under 3 min)
- [ ] Finalize README with all links
- [ ] Deploy final version to production
- [ ] Verify all contract deployments
- [ ] Practice 4-minute pitch

**Feb 21 (Sat) -- Submission Day**
- [ ] Final testing of all features (morning)
- [ ] Submit on Devfolio by noon (don't wait until 6PM!)
- [ ] Submit to all targeted bounties
- [ ] Verify demo video plays correctly
- [ ] Be available for judge Q&A (10AM-2:30PM)
- [ ] Attend closing ceremony (5PM)

---

## Appendix: Key Links

| Resource | URL |
|----------|-----|
| ETHDenver Main Site | https://ethdenver.com |
| Devfolio Submission | https://ethdenver2026.devfolio.co |
| ENS Subdomain Setup | https://app.ethdenver.com |
| ETHDenver Support | https://support.ethdenver.com |
| Scaffold-ETH 2 | https://scaffoldeth.io |
| ElizaOS Framework | https://github.com/ai16z/eliza |
| Hedera Developer Docs | https://docs.hedera.com |
| Base Developer Docs | https://docs.base.org |
| Kite AI Docs | https://docs.gokite.ai |
| 0G Labs | https://0g.ai |
| ADI Foundation | https://www.adi.foundation |
| Canton Network | https://www.canton.network |
| shadcn/ui | https://ui.shadcn.com |
| wagmi Docs | https://wagmi.sh |
| viem Docs | https://viem.sh |

---

## Sources

Research compiled from:
- [ETHDenver Official Site](https://ethdenver.com)
- [ETHDenver 2026 Devfolio](https://ethdenver2026.devfolio.co)
- [ETHDenver 2024 BUIDLathon Winners (Medium)](https://ethereumdenver.medium.com/ethdenver-2024-buidlathon-track-sponsor-bounty-winners-1960eea4d0ae)
- [ETHDenver 2024 Winners (Unchained)](https://unchainedcrypto.com/ethdenvers-2024-hackathon-onchain-security-ai-and-gaming-fun-dominate-the-winning-projects/)
- [Hedera ETHDenver 2025 Bounty Winners](https://hedera.com/blog/announcing-the-winners-of-eth-denver-2025-hedera-bounties/)
- [ETHDenver 2025 Devfolio Recap](https://devfolio.co/blog/ethdenver-2025-recap/)
- [Blockchain Hackathon Tips (Chainlink)](https://blog.chain.link/blockchain-hackathon-tips/)
- [5 Tips for Winning Blockchain Hackathons](https://tips.hackathon.com/article/5-tips-for-a-winning-submission-at-a-blockchain-hackathon)
- [ETHDenver Support: Event Dates](https://support.ethdenver.com/hc/en-us/articles/16968770511515-When-will-ETHDenver-2026-take-place)
- [Scaffold-ETH 2 GitHub](https://github.com/scaffold-eth/scaffold-eth-2)
- [ElizaOS Paper](https://arxiv.org/html/2501.06781v1)
- [Kite AI](https://gokite.ai)
- [0G Labs](https://0g.ai)
- [ADI Foundation](https://www.adi.foundation)
