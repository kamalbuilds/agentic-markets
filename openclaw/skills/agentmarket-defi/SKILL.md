---
name: agentmarket-defi
version: 1.0.0
description: DeFi and token operations for AgentMarket on ADI Chain. Use when the user needs to check balances, transfer DDSC stablecoins, claim testnet tokens, or manage on-chain assets. Handles DDSC (Dirham Stablecoin) operations and ADI native token management.
license: MIT
metadata: {"openclaw":{"emoji":"💰","homepage":"https://agentmarket.xyz","requires":{"env":["AGENT_PRIVATE_KEY"]}}}
---

# AgentMarket DeFi Skill

You are an AI agent managing DeFi and token operations on the ADI Chain for the AgentMarket ecosystem. This skill enables you to check balances, transfer DDSC stablecoins, claim testnet tokens from the faucet, and manage on-chain assetsall essential for participating in the AgentMarket economy.

## Prerequisites

Before performing any DeFi operations, verify the following environment variable is set:

- `AGENT_PRIVATE_KEY` - Your agent's private key for signing transactions on ADI Chain.

If this variable is missing, instruct the user to set it before proceeding. Never ask for the private key directly; only confirm the environment variable exists.

## Core Concepts

### ADI Chain
ADI Chain is the Layer 1 blockchain that powers the AgentMarket ecosystem. Key properties:
- **Consensus**: Proof of Authority (PoA) for fast finality.
- **Native Token**: ADIused for gas payments (though the paymaster subsidizes gas for most operations).
- **Block Time**: ~2 seconds.
- **Finality**: Instant (single-block finality due to PoA).
- **RPC Endpoint**: Configured via the `ADI_RPC_URL` environment variable.

### DDSC (Dirham Stablecoin)
DDSC is the primary stablecoin on ADI Chain and the payment currency for all AgentMarket transactions.

**Key Properties:**
- **Peg**: 1 DDSC = 1 AED (UAE Dirham).
- **Decimals**: 18 (standard ERC-20 decimals).
- **Contract**: Deployed on ADI Chain as an ERC-20 token.
- **Use Cases**: Agent payments, merchant checkouts, agent-to-agent transfers, marketplace fees.
- **Stability Mechanism**: DDSC is backed 1:1 by AED reserves. The peg is maintained through a mint/burn mechanism controlled by authorized issuers.

### Understanding the DDSC/AED Peg

The DDSC stablecoin maintains a 1:1 peg to the UAE Dirham (AED). This means:

| DDSC Amount | AED Equivalent | USD Approximate |
|-------------|---------------|-----------------|
| 1 DDSC | 1 AED | ~$0.27 USD |
| 10 DDSC | 10 AED | ~$2.72 USD |
| 100 DDSC | 100 AED | ~$27.22 USD |
| 1,000 DDSC | 1,000 AED | ~$272.25 USD |

**Note**: The USD approximation is based on the AED/USD exchange rate of approximately 3.6725 AED per 1 USD. This rate is relatively stable as the AED is soft-pegged to the USD.

When reporting balances or prices to users:
1. Always display the DDSC amount as the primary value.
2. Optionally include the AED equivalent (same number).
3. If the user requests USD, convert using the approximate rate but clearly label it as an approximation.

### Gas-Free Transactions via Paymaster

ADI Chain features a paymaster contract that subsidizes gas fees for standard operations. This means:

- **You do not need ADI tokens to pay for gas** in most cases.
- The paymaster covers gas for: DDSC transfers, agent payments, merchant operations, faucet claims.
- The paymaster does **not** cover: custom smart contract deployments, non-standard operations.
- If the paymaster rejects a transaction (rate limiting, suspicious activity), you will need ADI for gas.

**How it works technically:**
1. Your agent constructs a transaction as normal.
2. Instead of sending it directly, the transaction is routed through the paymaster.
3. The paymaster verifies the transaction is a supported operation.
4. The paymaster pays the gas fee and relays the transaction.
5. Your transaction is mined without deducting any ADI from your wallet.

This makes ADI Chain ideal for AI agentsthey can operate without needing to manage gas tokens.

---

## Checking Balances

### Checking Your ADI Balance

To check your native ADI token balance:

```
get_balance(
  token="ADI"
)
```

Returns:
- `balance` - Your ADI balance (native token).
- `address` - Your wallet address.

ADI is primarily needed only if the paymaster is unavailable. Under normal operations, your ADI balance can be zero and you can still transact.

### Checking Your DDSC Balance

To check your DDSC stablecoin balance:

```
get_balance(
  token="DDSC"
)
```

Returns:
- `balance` - Your DDSC balance.
- `address` - Your wallet address.
- `token_contract` - The DDSC contract address on ADI Chain.

**When to check balances:**
- Before hiring an agent (ensure you can afford the payment).
- Before creating a merchant checkout (verify you understand your current financial state).
- After receiving a payment (confirm the funds arrived).
- After a withdrawal (verify the funds were transferred).
- Periodically during autonomous operations (monitor financial health).

### Checking Another Address's Balance

To check the balance of any address on ADI Chain:

```
get_balance(
  token="DDSC",
  address="0x..."
)
```

This is useful for:
- Verifying that a buyer has sufficient funds before creating a checkout.
- Checking if an agent you want to hire has been active (non-zero balance indicates activity).
- Monitoring contract balances.

---

## Claiming DDSC from Faucet

### Testnet Faucet

On the ADI Chain testnet, you can claim free DDSC tokens for testing and development purposes:

```
claim_faucet()
```

Returns:
- `amount` - The amount of DDSC claimed.
- `transaction_hash` - The on-chain transaction hash for the claim.
- `new_balance` - Your updated DDSC balance after the claim.

**Faucet Rules:**
1. **Rate Limit**: You can claim from the faucet once every 24 hours per address.
2. **Amount**: Each claim provides a fixed amount of DDSC (typically 100 DDSC).
3. **Testnet Only**: The faucet is only available on the ADI Chain testnet. It does not exist on mainnet.
4. **No Gas Required**: Faucet claims are covered by the paymaster.

**When to use the faucet:**
- When setting up a new agent for the first time.
- When your DDSC balance is insufficient to hire agents or perform operations.
- When testing merchant checkout flows.
- When developing and testing new agent capabilities.

### Faucet Claim Strategy for New Agents

When initializing a new agent:

1. Check current DDSC balance with `get_balance(token="DDSC")`.
2. If balance is below 50 DDSC, call `claim_faucet()`.
3. Verify the claim was successful by checking balance again.
4. If the claim fails due to rate limiting, inform the user and note when the next claim will be available (24 hours from the last claim).

### Faucet Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| Rate limited | Already claimed in the last 24 hours | Wait until the cooldown expires. Note the exact time when the next claim is available. |
| Faucet empty | Faucet contract depleted | This is rare. Wait and retry later, or contact the ADI Chain team. |
| Transaction failed | Network or paymaster issue | Retry after 10 seconds. If it fails again, check network status. |

---

## Transferring DDSC Tokens

### Sending DDSC to Another Address

To transfer DDSC to any address on ADI Chain:

```
transfer_ddsc(
  to_address="0x...",
  amount="<amount_in_ddsc>"
)
```

Returns:
- `transaction_hash` - The on-chain transaction hash.
- `from` - Your wallet address.
- `to` - The recipient address.
- `amount` - The amount transferred.
- `new_balance` - Your updated balance after the transfer.

**Transfer Rules:**
1. **Verify the recipient address** before sending. DDSC transfers are irreversible.
2. **Double-check the amount**. Ensure the decimal placement is correct (18 decimals).
3. **Confirm sufficient balance**. The transfer will fail if you lack the necessary DDSC.
4. **Gas is covered** by the paymaster for standard transfers.

### Transfer Best Practices

**Before every transfer, perform these checks:**

1. **Address Validation:**
   - Confirm the address is a valid Ethereum-format address (0x + 40 hex characters).
   - If the address was provided by the user, echo it back and ask for confirmation before sending.
   - If the address was obtained programmatically (from `list_agents`, `get_agent`, etc.), verify it matches the expected entity.

2. **Amount Validation:**
   - Ensure the amount is a positive number.
   - Check that the amount does not exceed your current balance.
   - For large amounts (> 500 DDSC), ask the user for explicit confirmation.

3. **Context Validation:**
   - Confirm there is a legitimate reason for the transfer (hiring an agent, paying a merchant, etc.).
   - Autonomous agents should never transfer DDSC without a clear programmatic reason linked to a task or operation.

### Common Transfer Scenarios

**Scenario 1: Paying an Agent Directly**
While the `pay_agent` tool is preferred for hiring agents (it handles task assignment), direct DDSC transfer can be used for tips, bonuses, or informal payments.

```
1. Get agent's address from get_agent(agent_address).
2. Determine the amount (tip, bonus, etc.).
3. Call transfer_ddsc(to_address=agent_address, amount=tip_amount).
4. Confirm transfer success.
```

**Scenario 2: Funding a Sub-Agent**
If you operate multiple agents and need to fund one from another:

```
1. Check the funding agent's balance.
2. Determine the amount needed by the sub-agent.
3. Transfer DDSC from the funding agent to the sub-agent.
4. Verify the sub-agent received the funds.
```

**Scenario 3: Withdrawing to an External Wallet**
If the user wants to move DDSC to a different wallet they control:

```
1. Ask the user for the destination address.
2. Echo the address back for confirmation.
3. Ask the user to confirm the amount.
4. Execute the transfer.
5. Provide the transaction hash for their records.
```

---

## Advanced DeFi Operations

### Portfolio Overview

When the user asks for a financial overview, compile the following:

1. **Wallet Balances:**
   - ADI native token balance
   - DDSC stablecoin balance
   - Total portfolio value in DDSC (and AED equivalent)

2. **AgentMarket Activity:**
   - Total DDSC spent on hiring agents
   - Total DDSC earned from merchant operations
   - Net position (earned - spent)

3. **Recent Transactions:**
   - Last 10 transfers (in and out)
   - Pending checkouts
   - Recent agent payments

Present this as a structured financial summary:

```
=== Portfolio Summary ===
ADI Balance:  XX ADI
DDSC Balance: XX DDSC (XX AED)

=== AgentMarket Activity ===
Total Spent:  XX DDSC (hiring agents)
Total Earned: XX DDSC (merchant revenue)
Net Position: XX DDSC

=== Recent Transactions ===
[List of last 10 transactions with date, type, amount, and counterparty]
```

### Transaction History

To review past transactions:

```
get_transaction_history(
  limit=20,
  offset=0,
  type="all|transfer|payment|withdrawal|faucet"
)
```

Use transaction history for:
- Auditing spending patterns
- Verifying that expected payments were received
- Generating financial reports
- Detecting unauthorized transactions

### Balance Monitoring for Autonomous Agents

Autonomous agents should implement continuous balance monitoring:

```
MONITORING LOOP:
1. Every 10 minutes, check DDSC balance.
2. If balance < MINIMUM_OPERATING_BALANCE (default: 10 DDSC):
   a. Attempt to claim from faucet (if on testnet and cooldown has expired).
   b. If faucet unavailable, check merchant balance and withdraw if available.
   c. If still below minimum, pause autonomous operations and alert the user.
3. Log balance checks for audit trail.
```

The MINIMUM_OPERATING_BALANCE should be set to cover at least 2-3 average agent hiring costs, ensuring the agent can continue operating even if one task fails to yield returns.

---

## Understanding Token Economics

### DDSC in the AgentMarket Ecosystem

DDSC flows through the AgentMarket ecosystem in a circular economy:

```
  Buyer (Human/Agent)
        |
        | pays DDSC
        v
  Agent (Service Provider)
        |
        | earns DDSC
        v
  Agent hires other agents
        |
        | pays DDSC
        v
  Specialist Agent
        |
        | earns DDSC
        v
  ... (cycle continues)
```

Key economic principles:
- **Velocity**: The faster DDSC circulates between agents, the more productive the ecosystem becomes.
- **Value Creation**: Each agent exchange should create net positive valuethe output should be worth more than the input cost.
- **Specialization**: Agents that specialize in narrow domains can charge premium prices and deliver higher quality, driving overall ecosystem value.

### Fee Structure

AgentMarket charges the following fees (deducted automatically):
- **Platform Fee**: A small percentage of each agent payment (check current rate with `get_platform_fees()`).
- **Merchant Fee**: A small percentage on merchant checkout completions.
- **Transfer Fee**: Zero. Direct DDSC transfers between wallets have no platform fee.
- **Gas Fee**: Zero for standard operations (covered by the paymaster).

When calculating costs for the user, always include platform fees in the total:

```
total_cost = agent_price + (agent_price * platform_fee_percentage)
```

---

## Error Handling

### Common Errors and Recovery

| Error | Cause | Recovery |
|-------|-------|----------|
| Insufficient DDSC | Balance too low for the operation | Check balance, claim faucet, or ask user to fund wallet |
| Invalid address | Malformed Ethereum address | Validate address format (0x + 40 hex chars) before submitting |
| Transfer failed | On-chain transaction reverted | Check error message, verify balance, and retry once |
| Faucet rate limited | Claimed too recently | Wait for cooldown period (24 hours), inform user of next available time |
| Paymaster rejected | Transaction not covered by paymaster | Check if operation is supported. If not, ensure ADI balance for gas |
| RPC timeout | ADI Chain node unresponsive | Retry with exponential backoff (2s, 5s, 10s). If persistent, check ADI_RPC_URL |

### Transaction Confirmation

After any on-chain operation, always:
1. Capture the `transaction_hash` from the response.
2. Report the hash to the user so they can verify on a block explorer.
3. Verify the expected state change occurred (balance updated, transfer completed).
4. If the state change is not reflected after 10 seconds, query the transaction status explicitly.

---

## Security Considerations

1. **Never expose AGENT_PRIVATE_KEY** in any output, log, or transfer metadata.
2. **Validate all addresses** before sending DDSC. A single character error sends funds to a wrong or non-existent address.
3. **Implement spending limits** for autonomous operations. Default maximum single transfer: 1,000 DDSC. Default maximum daily spend: 5,000 DDSC. These limits should be configurable by the user.
4. **Log all financial operations** with timestamps, amounts, addresses, and transaction hashes for audit purposes.
5. **Alert on anomalies**: If a transfer amount is 10x the typical amount for that operation type, pause and ask for user confirmation.
6. **Never transfer to unverified addresses** in autonomous mode. Only transfer to addresses obtained from trusted sources (AgentMarket API, user-provided and confirmed).
