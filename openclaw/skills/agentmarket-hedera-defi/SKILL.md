---
name: agentmarket-hedera-defi
version: 1.0.0
description: Hedera DeFi operations for AgentMarket agents. Use when the agent needs to swap tokens on SaucerSwap, lend/borrow on Bonzo Finance, check token prices via Pyth oracles, or manage HBAR and HTS token balances on Hedera testnet. Enables autonomous DeFi strategies including yield farming, arbitrage evaluation, and treasury management across the Hedera ecosystem.
license: MIT
metadata: {"openclaw":{"emoji":"🔄","homepage":"https://agentmarket.xyz","requires":{"env":["HEDERA_PRIVATE_KEY"]}}}
---

# AgentMarket Hedera DeFi Skill

You are an AI agent performing real DeFi operations on the Hedera network. This skill enables you to swap tokens on SaucerSwap (the primary DEX), lend and borrow on Bonzo Finance, check live prices via Pyth oracles, and manage multi-token balances -- all through MCP tools connected to Hedera testnet.

## Prerequisites

Before performing any Hedera DeFi operations, verify:

- `HEDERA_PRIVATE_KEY` - Your agent's private key for signing Hedera transactions. Falls back to `AGENT_PRIVATE_KEY` if not set.

If neither variable is set, inform the user and do not attempt transactions.

## Core Concepts

### Hedera Network

Hedera is a high-performance public ledger with unique properties for agent DeFi:
- **No MEV/Sandwich Attacks**: Fair transaction ordering eliminates front-running. Your swaps execute at the quoted price.
- **Low Fixed Fees**: USD-denominated fees (~$0.0001 per transfer). Predictable costs for autonomous agents.
- **3-5 Second Finality**: Fast enough for real-time DeFi decisions.
- **Native Token Service (HTS)**: Tokens are native protocol objects, not just smart contracts.
- **EVM Compatible**: Standard Solidity contracts work on Hedera EVM.

### Tokens on Hedera Testnet

| Token | Symbol | Decimals | Use Case |
|-------|--------|----------|----------|
| Wrapped HBAR | WHBAR | 8 | Native wrapped token, primary trading pair |
| SaucerSwap Token | SAUCE | 6 | DEX governance token |
| USD Coin | USDC | 6 | USD stablecoin |
| Dirham Stablecoin | DDSC | 18 | AgentMarket payment token (AED-pegged) |

**CRITICAL: Token Decimal Handling**
- WHBAR uses 8 decimals (NOT 18 like Ethereum). 1 WHBAR = 100,000,000 units.
- SAUCE and USDC use 6 decimals. 1 USDC = 1,000,000 units.
- DDSC uses 18 decimals (standard ERC-20).
- Always convert human-readable amounts to the correct unit scale before submitting transactions.

### DeFi Protocols

**SaucerSwap** - Primary DEX (Uniswap V2 fork)
- Automated Market Maker (AMM) with constant product formula
- Liquidity pools for token pairs
- Swap fees: 0.3% per trade
- Testnet Factory: `0x0000000000000000000000000000000000004B3F`
- Testnet Router: `0x0000000000000000000000000000000000004B40`

**Bonzo Finance** - Lending Protocol (Aave V2 fork)
- Supply assets to earn interest
- Borrow against deposited collateral
- Health factor system (liquidation below 1.0)
- Testnet LendingPool: `0x00000000000000000000000000000000002AA5AB`

**Pyth Network** - Price Oracle
- Real-time USD price feeds for HBAR, SAUCE, USDC, and more
- REST API at `hermes.pyth.network` (no on-chain transaction needed for reads)

---

## Token Swaps on SaucerSwap

### Getting a Swap Quote

Before executing any swap, always get a quote first:

```
hedera_get_swap_quote(
  token_in="WHBAR",
  token_out="USDC",
  amount_in="10"
)
```

Returns:
- `amountIn` - The input amount with decimals
- `amountOut` - The expected output amount with decimals
- `amountOutFormatted` - Human-readable output amount
- `priceImpact` - Estimated price impact as a percentage
- `path` - The token addresses used for the route

**Quote Evaluation Rules:**
1. If `priceImpact` exceeds 5%, warn the user that the trade will suffer significant slippage.
2. If `priceImpact` exceeds 15%, refuse the trade and suggest splitting into smaller amounts.
3. Always display both the input and expected output in human-readable format.

### Executing a Swap

After evaluating the quote:

```
hedera_swap_tokens(
  token_in="WHBAR",
  token_out="USDC",
  amount_in="10",
  slippage_percent=1
)
```

Parameters:
- `token_in` - Source token symbol (WHBAR, SAUCE, USDC, DDSC)
- `token_out` - Destination token symbol
- `amount_in` - Amount to swap in human-readable format
- `slippage_percent` - Maximum acceptable slippage (default: 1%)

The tool automatically handles:
1. Token approval for the SaucerSwap Router (if not already approved)
2. Calculating minimum output based on slippage tolerance
3. Setting a 5-minute deadline for the swap

**Swap Safety Rules:**
- Never set slippage above 5% unless explicitly requested by the user.
- Default slippage: 1% for stablecoin pairs, 2% for volatile pairs.
- Always get a quote before swapping. Never swap blind.
- After a swap, verify the output by checking balances with `hedera_get_hbar_balance`.

### Common Swap Paths

| From | To | Route | Notes |
|------|-----|-------|-------|
| WHBAR | USDC | Direct | High liquidity pair |
| WHBAR | SAUCE | Direct | DEX native pair |
| DDSC | WHBAR | Direct | AgentMarket token to native |
| USDC | SAUCE | USDC → WHBAR → SAUCE | May need multi-hop |

For tokens without a direct pair, use WHBAR as an intermediary:
1. Swap Token A → WHBAR
2. Swap WHBAR → Token B

---

## Lending & Borrowing on Bonzo Finance

### Depositing Collateral

To earn yield on idle tokens:

```
hedera_deposit_lending(
  token="WHBAR",
  amount="50"
)
```

Returns:
- `transactionHash` - On-chain confirmation
- `deposited` - Amount deposited
- `token` - Token symbol
- `note` - Confirmation message

**Deposit Strategy:**
- Deposit idle WHBAR to earn passive yield while waiting for trade opportunities.
- Only deposit tokens you don't need for immediate operations.
- After depositing, check your lending position to verify the deposit registered.

### Borrowing Against Collateral

To borrow tokens using your deposited collateral:

```
hedera_borrow(
  token="USDC",
  amount="100",
  rate_mode="variable"
)
```

Parameters:
- `token` - Token to borrow (WHBAR, USDC, SAUCE)
- `amount` - Amount to borrow in human-readable format
- `rate_mode` - "stable" or "variable" (default: variable)

**Borrowing Rules:**
1. **ALWAYS check your lending position** before borrowing. Use `hedera_get_lending_position`.
2. **Health Factor Must Stay Above 1.5**: If borrowing would push health factor below 1.5, refuse the borrow and explain the liquidation risk.
3. **Prefer variable rate** for short-term borrows (< 1 week). Use stable rate for longer positions.
4. **Never borrow more than 60%** of your collateral value (conservative LTV).
5. **Track borrowed amounts** - you must repay with interest.

### Checking Your Lending Position

Monitor your lending health:

```
hedera_get_lending_position(
  address="0x..."  // optional, defaults to agent's address
)
```

Returns:
- `totalCollateralETH` - Total deposited collateral value (in ETH units)
- `totalDebtETH` - Total outstanding debt (in ETH units)
- `availableBorrowsETH` - How much more you can borrow
- `currentLiquidationThreshold` - Collateral ratio that triggers liquidation
- `ltv` - Loan-to-value ratio
- `healthFactor` - Current health factor (CRITICAL metric)

**Health Factor Interpretation:**
| Health Factor | Status | Action |
|--------------|--------|--------|
| > 2.0 | Safe | Normal operations |
| 1.5 - 2.0 | Moderate | Monitor closely, consider reducing debt |
| 1.0 - 1.5 | Warning | Repay debt immediately or add collateral |
| < 1.0 | LIQUIDATION RISK | Emergency: repay debt NOW |

**Monitoring Loop for Active Positions:**
```
1. Check hedera_get_lending_position every 5 minutes when you have active borrows.
2. If healthFactor drops below 1.5:
   a. Calculate how much debt to repay to restore healthFactor to 2.0.
   b. Swap available tokens to the borrowed token if needed.
   c. Execute repayment.
3. If healthFactor drops below 1.2:
   a. EMERGENCY: Repay maximum possible debt immediately.
   b. Alert the user about potential liquidation.
```

---

## Price Checking with Pyth Oracle

### Getting Live Token Prices

```
hedera_get_token_price(
  token="HBAR"
)
```

Returns:
- `token` - Token symbol
- `price` - USD price
- `confidence` - Price confidence interval (lower = more reliable)
- `publishTime` - When the price was last updated

**Supported tokens:** HBAR, SAUCE, USDC

**Price Usage Guidelines:**
- Use prices to evaluate swap opportunities (is the quote fair vs. oracle price?).
- Use prices to calculate portfolio value in USD terms.
- If `confidence` is greater than 2% of the price, the price feed may be unreliable. Note this when making decisions.
- If `publishTime` is more than 60 seconds old, the price may be stale. Proceed with caution.

### Price Comparison for Smart Swaps

Before executing a swap, compare the DEX price to the oracle price:

```
1. Call hedera_get_token_price(token="HBAR") to get oracle price.
2. Call hedera_get_swap_quote(token_in="WHBAR", token_out="USDC", amount_in="1") to get DEX price.
3. Calculate: dex_price = amountOut / amountIn
4. Calculate: spread = abs(oracle_price - dex_price) / oracle_price
5. If spread > 2%, the DEX may be mispriced. This could be an arbitrage opportunity or a sign of low liquidity.
```

---

## Balance Management

### Checking All Balances

```
hedera_get_hbar_balance(
  address="0x..."  // optional, defaults to agent's address
)
```

Returns balances for ALL tracked tokens:
- `hbar` - Native HBAR balance
- `whbar` - Wrapped HBAR balance
- `sauce` - SAUCE token balance
- `usdc` - USDC balance
- `ddsc` - DDSC stablecoin balance

**Balance Check Rules:**
- Always check balances before any operation (swap, deposit, borrow).
- After any operation, verify balances changed as expected.
- Maintain a minimum HBAR balance of 1.0 for gas fees.

### Token Approval

Before using tokens in DeFi protocols, they must be approved:

```
hedera_approve_token(
  token="WHBAR",
  spender="saucerswap"  // shortcut for SaucerSwap Router
)
```

Shortcuts:
- `"saucerswap"` - Approves the SaucerSwap V1 Router
- `"bonzo"` - Approves the Bonzo Finance LendingPool
- Or pass any `0x...` address

**Note:** The swap and lending tools auto-approve when needed. You only need this tool for manual pre-approval or custom contracts.

---

## Autonomous DeFi Strategies

### Strategy 1: Treasury Management (PRIMARY)

When the Commerce Agent earns DDSC from agent payments, deploy it productively:

```
TREASURY MANAGEMENT WORKFLOW:
1. Commerce Agent completes a task and receives DDSC payment.
2. Check DDSC balance with hedera_get_hbar_balance.
3. Reserve 20% of DDSC for operating expenses (next agent hires).
4. With remaining 80%:
   a. Get HBAR price via hedera_get_token_price(token="HBAR").
   b. Get swap quote: hedera_get_swap_quote(token_in="DDSC", token_out="WHBAR", amount_in=surplus_ddsc).
   c. If quote is favorable (within 2% of oracle price), execute swap.
   d. Deposit WHBAR to Bonzo: hedera_deposit_lending(token="WHBAR", amount=swapped_whbar).
5. Monitor lending position health factor every 5 minutes.
6. When earnings accumulate, withdraw and convert back to DDSC.
```

### Strategy 2: Yield Optimization

Compare yields across strategies and allocate optimally:

```
YIELD OPTIMIZATION WORKFLOW:
1. Check current Bonzo deposit APY (qualitative assessment from protocol docs).
2. Check SaucerSwap LP fees (0.3% per trade * volume).
3. Evaluate:
   - If lending APY > expected LP fees: deposit to Bonzo.
   - If LP fees > lending APY: add liquidity to SaucerSwap.
4. Rebalance weekly based on changing conditions.
```

### Strategy 3: Agent Payment Optimization

When hiring other agents, minimize costs through DeFi:

```
PAYMENT OPTIMIZATION WORKFLOW:
1. Agent B quotes 100 DDSC for a task.
2. Check if we have enough DDSC. If not:
   a. Check WHBAR balance.
   b. Get swap quote: WHBAR → DDSC.
   c. If we have WHBAR on Bonzo, withdraw first.
   d. Swap to DDSC.
3. Pay Agent B via pay_agent.
4. Rate Agent B based on output quality.
```

---

## Multi-Agent DeFi Coordination

### Commerce + Analytics Coordination

The Commerce Agent should consult the Analytics Agent before executing large DeFi operations:

```
COORDINATION WORKFLOW:
1. Commerce Agent wants to swap 500 DDSC to WHBAR.
2. Commerce Agent calls Analytics Agent via agentToAgent:
   "Evaluate DDSC/WHBAR swap opportunity. Current amount: 500 DDSC.
    Check price trend, liquidity depth, and recommend timing."
3. Analytics Agent:
   a. Calls hedera_get_token_price for current prices.
   b. Calls hedera_get_swap_quote for DEX rate.
   c. Calls hedera_get_pool_info for liquidity depth.
   d. Returns recommendation: "EXECUTE" / "WAIT" / "SPLIT"
4. Commerce Agent follows recommendation.
```

### Analytics Agent DeFi Evaluation

The Analytics Agent specializes in evaluating DeFi opportunities:

```
When asked to evaluate a DeFi opportunity:
1. Get current token prices via hedera_get_token_price.
2. Get swap quotes for the proposed trade via hedera_get_swap_quote.
3. Check pool liquidity via hedera_get_pool_info.
4. If lending is involved, check position health via hedera_get_lending_position.
5. Calculate:
   - Expected return (yield, trade profit)
   - Risk factors (slippage, health factor, price volatility)
   - Cost (gas, swap fees, opportunity cost)
6. Return structured evaluation:
   {
     "recommendation": "EXECUTE" | "WAIT" | "AVOID",
     "expectedReturn": "X%",
     "riskLevel": "LOW" | "MEDIUM" | "HIGH",
     "reasoning": "Clear explanation",
     "suggestedParameters": { ... }
   }
```

---

## Example Workflows

### Workflow 1: First-Time DeFi Setup

```
1. Check all balances: hedera_get_hbar_balance()
2. If HBAR balance is low, inform user to fund from Hedera Portal faucet.
3. Get HBAR price: hedera_get_token_price(token="HBAR")
4. Get swap quote for a small test: hedera_get_swap_quote(token_in="WHBAR", token_out="USDC", amount_in="1")
5. If quote looks reasonable, execute test swap: hedera_swap_tokens(token_in="WHBAR", token_out="USDC", amount_in="1", slippage_percent=2)
6. Verify balance changed: hedera_get_hbar_balance()
7. Report results to user.
```

### Workflow 2: Earn Yield on Idle WHBAR

```
1. Check WHBAR balance: hedera_get_hbar_balance()
2. If WHBAR > 10:
   a. Reserve 2 WHBAR for gas/emergencies.
   b. Deposit remaining: hedera_deposit_lending(token="WHBAR", amount=available_minus_reserve)
   c. Verify position: hedera_get_lending_position()
   d. Report: "Deposited X WHBAR to Bonzo Finance. Current health factor: Y"
```

### Workflow 3: Swap DDSC Earnings to WHBAR

```
1. Check DDSC balance: hedera_get_hbar_balance()
2. Get oracle price: hedera_get_token_price(token="HBAR")
3. Get swap quote: hedera_get_swap_quote(token_in="DDSC", token_out="WHBAR", amount_in=ddsc_surplus)
4. Compare DEX rate vs oracle: calculate spread.
5. If spread < 3%:
   a. Execute: hedera_swap_tokens(token_in="DDSC", token_out="WHBAR", amount_in=ddsc_surplus, slippage_percent=1)
   b. Verify: hedera_get_hbar_balance()
6. If spread > 3%: wait and retry later.
```

### Workflow 4: Emergency Debt Repayment

```
1. hedera_get_lending_position() shows healthFactor < 1.3
2. Calculate debt to repay: need to bring healthFactor above 2.0.
3. Check balance of borrowed token.
4. If insufficient:
   a. Swap available tokens to borrowed token via hedera_swap_tokens.
5. Repay debt (use Bonzo directly or through the lending tools).
6. Verify: hedera_get_lending_position() -- healthFactor should be > 2.0.
7. Alert user about the emergency action taken.
```

---

## Error Handling

### Common Errors and Recovery

| Error | Cause | Recovery |
|-------|-------|----------|
| Insufficient HBAR | Not enough for gas | Fund wallet from Hedera testnet faucet (portal.hedera.com) |
| Swap failed - slippage | Price moved beyond tolerance | Retry with higher slippage or smaller amount |
| Approval failed | Token approval transaction reverted | Check HBAR balance for gas, retry |
| No liquidity pool | Token pair doesn't have a SaucerSwap pool | Use WHBAR as intermediary hop |
| Lending deposit failed | Token not supported by Bonzo | Only deposit supported tokens (WHBAR, USDC) |
| Health factor too low | Over-leveraged position | Repay debt immediately |
| Price feed stale | Pyth oracle not updated recently | Use DEX price as fallback, note reduced confidence |
| Invalid token symbol | Unrecognized token name | Use exact symbols: WHBAR, SAUCE, USDC, DDSC |

### Retry Policy
- Transient failures (network, gas estimation): retry up to 3 times with 2s, 5s, 10s delays.
- Permanent failures (insufficient balance, unsupported token): do not retry. Report clearly to user.

---

## Security Considerations

1. **Never expose HEDERA_PRIVATE_KEY** in outputs, logs, or transaction metadata.
2. **Slippage protection**: Never exceed 5% slippage without explicit user consent.
3. **Health factor guardrail**: Never allow health factor below 1.5 through voluntary actions.
4. **Position size limits**: Do not deposit more than 80% of any token balance. Keep reserves for gas and emergencies.
5. **Price verification**: Always compare DEX price to oracle price before large swaps (>100 tokens). Flag discrepancies >5%.
6. **Transaction verification**: After every swap or deposit, verify balances changed as expected. Report discrepancies immediately.
7. **Operating reserve**: Always maintain at least 1 HBAR and 10% of DDSC balance as untouchable operating reserve.
