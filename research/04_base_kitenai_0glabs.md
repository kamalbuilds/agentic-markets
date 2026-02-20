# Research: Base ($10K), Kite AI ($10K), 0G Labs ($25K)
# Agent: a2211c4 | Status: Complete

---

## COMPLETE PRIZE POOL: $124,000

| Sponsor | Prize | Status |
|---------|-------|--------|
| Hedera | $25K | Published |
| 0G Labs | $25K | Partially published |
| ADI Foundation | $25K | Published |
| Canton Network | $15K | Published |
| Base | $10K | Coming Soon |
| Kite AI | $10K | Coming Soon |
| ETHDenver Main | $10K | Published |
| QuickNode | $2K | Published |
| Nouns Builder DAO | $2K | Coming Soon |

---

## 1. BASE -- $10,000

### Developer Tools

**OnchainKit**: Full-stack React components for identity, wallet, transactions, USDC checkout, swaps
**AgentKit** (github.com/coinbase/agentkit): AI agents with blockchain wallets. Deploy contracts, manage tokens, execute DeFi. Model-agnostic. Gasless via CDP Smart Wallet. Keys in TEEs. x402 payment protocol.
**Smart Wallet**: Passkey-based, no extensions/seed phrases. ERC-4337 support.
**Paymaster**: Gasless sponsored transactions. 15M+ powered.
**MiniKit**: Lightweight rapid prototyping framework.
**Base Appchains**: Dedicated L3 chains on Base.

### Likely Requirements
- Deploy on Base (mainnet or Sepolia testnet)
- Open source with public GitHub
- New development during hackathon
- Bonus for combining multiple Base/CDP tools

### Project Ideas
1. AI Agent Marketplace on Base (AgentKit + OnchainKit)
2. Gasless Social Platform (Smart Wallet + Paymaster)
3. USDC Payment Agent Network (x402 protocol)

---

## 2. KITE AI -- $10,000

### What is Kite AI?

World's first AI payment blockchain. EVM-compatible L1 on Avalanche. $33M+ funded (PayPal Ventures, Samsung, Coinbase Ventures).

### Core Innovation: Proof of Attributed Intelligence (PoAI)
- Tracks contributions from data providers, model developers, agents
- Attributes value to specific work
- Rewards proportionally on-chain
- Creates accountability for AI outputs

### SPACE Framework
- **S**: Stablecoin-native payments (USDC, sub-cent fees)
- **P**: Programmable constraints (spending rules via smart contracts)
- **A**: Agent-first authentication (3-tier: user/agent/session identity)
- **C**: x402 compatibility (machine-to-machine payments)
- **E**: Delegation model (cryptographic authority chain)

### Agent Passport System
- Every AI entity gets on-chain identity
- BIP-32 derived addresses from parent wallets
- Session keys with configurable expiry

### Resources
- SDK/API: `docs.gokite.ai/integration-guide/sdk-api-overview`
- Testnet (Ozone): `testnet.gokite.ai`
- GitHub: `github.com/gokite-ai`
- Docs: `docs.gokite.ai`

### Project Ideas
1. AI Agent Payment Router (discover + negotiate + settle via USDC)
2. AI Model Marketplace with Attribution (PoAI micropayments)
3. Agent-to-Agent Task Delegation Network (3-tier identity)

---

## 3. 0G LABS -- $25,000 TOTAL

### What is 0G?

Modular AI L1 blockchain and deAIOS. $325M raised. Infrastructure for decentralized AI.

### Four Components
1. **0G Storage**: Decentralized encrypted metadata storage
2. **0G DA**: Data availability / proof verification
3. **0G Chain**: EVM-compatible smart contracts
4. **0G Compute**: Secure AI inference in TEEs

### iNFTs (Intelligent NFTs) -- ERC-7857

AI agents as NFTs. Encrypted model weights stored as metadata.

**Core Functions:**
- `transfer(tokenId, to, encryptedData, proof)` - Re-encrypts intelligence for new owner
- `clone(tokenId, newMetadata)` - Fork an AI agent
- `authorizeUsage(tokenId, user, duration)` - Rent agent capabilities (AI-as-a-Service)

**Security**: AES-256-GCM encryption, RSA-4096/ECC-P384 key sealing, TEE oracle for transfers

### Bounty Tracks
| Track | Prize | Focus |
|-------|-------|-------|
| 1 | $7K | Best Use of On-Chain Agent (iNFT) |
| 2 | $7K | Coming Soon |
| 3 | $7K | Coming Soon |
| 4 | $4K | Coming Soon |

### Project Ideas
1. AI Agent Marketplace (ERC-7857 transfers)
2. AI-as-a-Service via iNFT (authorizeUsage monetization)
3. Autonomous DeFi Trading Agent as iNFT

---

## 4. CANTON NETWORK -- $15,000

Privacy-preserving blockchain for financial institutions. Goldman Sachs, Deutsche Borse, Microsoft consortium.
- **Track 1**: Best Privacy-Focused dApp Using Daml -- $8,000
- **Track 2**: Best Canton Dev Tooling -- $7,000

---

## 5. QUICKNODE -- $2,000

- Best Use of QuickNode Monad Streams -- $1,000
- Best Use of QuickNode Hyperliquid HyperCore Streams -- $1,000

---

## 6. ETHDENVER MAIN TRACKS -- $10,000

$2K each: ETHERSPACE, Devtopia, New France Village, Futurllama, Prosperia

---

## Cross-Bounty "AgentVault" Concept

One project targeting multiple bounties:
- iNFTs on 0G (ERC-7857) -> 0G bounty
- Wallets on Base (AgentKit) -> Base bounty
- Payments on Kite (x402/USDC) -> Kite bounty
- Commerce on Hedera (OpenClaw) -> Hedera bounty
- Stablecoins on ADI -> ADI bounty
- **Potential: $40K+ from single project**

## Key Sources
- https://ethdenver2026.devfolio.co/
- https://gokite.ai/
- https://docs.gokite.ai
- https://0g.ai/
- https://docs.0g.ai/build-with-0g/inft
- https://github.com/coinbase/agentkit
- https://docs.base.org
- https://www.canton.network/
