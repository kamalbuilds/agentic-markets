# Research: ADI Chain / ADI Foundation ($19K + $3K + $3K Bounties)
# Agent: ad9d2ea | Status: Complete

---

## What is ADI Chain?

First institutional-grade L2 blockchain in MENA. Created by ADI Foundation (Abu Dhabi), subsidiary of IHC ($240B conglomerate). Mission: bring 1 billion on-chain by 2030.

- **Type**: L2 ZK-Rollup secured by Ethereum
- **Built on**: ZKsync Atlas + Airbender
- **EVM-Compatible**: Yes, fully
- **L3 Support**: Modular compliance-optimized L3 chains

## DDSC Dirham Stablecoin (JUST LAUNCHED Feb 12, 2026!)

- Backed 1:1 by UAE Dirham (AED)
- Initiated by IHC + First Abu Dhabi Bank ($330B assets)
- Licensed by UAE Central Bank
- AED pegged to USD at ~1 USD = 3.6725 AED (fixed)

## Network Details

### Mainnet
| Parameter | Value |
|---|---|
| Chain ID | **36900** |
| RPC | `https://rpc.adifoundation.ai/` |
| Explorer | `https://explorer.adifoundation.ai/` |
| Bridge | `https://bridge.adifoundation.ai/` |
| Native Token | ADI (18 decimals) |

### Testnet
| Parameter | Value |
|---|---|
| Chain ID | **99999** |
| RPC | `https://rpc.ab.testnet.adifoundation.ai/` |
| Explorer | `https://explorer.ab.testnet.adifoundation.ai/` |
| Faucet | `https://faucet.ab.testnet.adifoundation.ai/` |
| Bridge | `https://bridge.ab.testnet.adifoundation.ai/` |

### Alchemy RPC (Alternative)
- Testnet HTTP: `https://adi-testnet.g.alchemy.com/v2/<KEY>`

## $ADI Token
- ERC-20 on ETH L1, native gas on L2
- Genesis supply: 999,999,999
- Price: ~$3.09 USD
- FDV: ~$3.02B
- L1 Contract: `0x8b1484d57abbe239bb280661377363b03c89caea`

## Institutional Partnerships
- **BlackRock**: Blockchain adoption in financial markets
- **Mastercard**: Blockchain payments + asset tokenization in MENA
- **Franklin Templeton**: Regulated digital asset infrastructure
- **M-Pesa Africa**: Cross-border remittances (60M+ users)
- **ADREC**: Abu Dhabi real estate tokenization
- **Esyasoft**: Green energy tokenization, carbon credits
- **FAB**: Largest UAE bank, DDSC issuer

## Account Abstraction (ERC-4337)
- EntryPoint V0.7: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`
- EntryPoint V0.8: `0x4337084d9e255ff0702461cf8895ce9e3b5ff108`
- **NO default paymaster contracts** -- must deploy your own
- Recommended stack: Pimlico bundler + permissionless.js + ZeroDev Kernel v3.1

## How to Deploy

### Foundry
```bash
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.ab.testnet.adifoundation.ai \
  --broadcast --private-key $KEY
```

### Hardhat
```javascript
networks: {
  adiTestnet: {
    url: "https://rpc.ab.testnet.adifoundation.ai",
    chainId: 99999,
    accounts: [process.env.TESTNET_PRIVATE_KEY],
  }
}
```

## RWA Token Standards
- **ERC-3643 (T-REX)**: Primary for regulated RWAs. On-chain identity (ONCHAINID), compliance-enforced transfers.
- **ERC-1400**: Partitioned securities
- **ERC-20/721/1155**: Standard tokens

## Project Ideas

### $19K Open Bounty
1. **SolarChain**: UAE Solar DePIN + RWA tokenization (Esyasoft alignment)
2. **DirhamDeeds**: Tokenized Abu Dhabi real estate (ADREC alignment)
3. **TradeFlow**: Cross-border trade finance (M-Pesa + Mastercard alignment)

### $3K Payments Bounty
4. **ADI Pay**: Embeddable merchant checkout SDK (React component + QR + WalletConnect)
5. **ADI POS**: Mobile point-of-sale PWA

### $3K Paymaster Bounty
6. **ADI Paymaster Kit**: Complete AA infrastructure (fills critical gap)

## Risk/Reward Analysis

| Bounty | Prize | Winners | Competition | EV Rating |
|--------|-------|---------|-------------|-----------|
| Open Project | $19K | 5 | Medium | VERY HIGH |
| Payments | $3K | 2 | Lower | GOOD |
| Paymaster | $3K | 1-2 | Lowest | BEST RATIO |

**Best hybrid strategy**: Build payments component INSIDE a larger RWA project. One project, three bounty submissions, $25K total pool.

## Key Sources
- https://docs.adi.foundation/
- https://github.com/ADI-Foundation-Labs
- https://www.adi.foundation/
- https://faucet.ab.testnet.adifoundation.ai/
- https://www.alchemy.com/blog/adi-chain
