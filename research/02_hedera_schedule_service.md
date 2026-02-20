# Research: Hedera Schedule Service ($5K Bounty)
# Agent: ac2f30f | Status: Complete

---

## What is HSS?

Protocol-native system contract at EVM address `0x16b`. Enables smart contracts to schedule future execution at the consensus layer -- zero off-chain infrastructure needed.

**Key HIPs:**
- HIP-755 (v0.57+): Base schedule service with `authorizeSchedule`/`signSchedule`
- HIP-756 (v0.59+): `scheduleNative` for HTS operations
- HIP-1215 (v0.68+): `scheduleCall`, `scheduleCallWithPayer`, `executeCallOnPayerSignature` -- mainnet Dec 18, 2025

## Complete API Reference

### Schedule Creation (HIP-1215)

```solidity
// Self-funded, deferred execution
function scheduleCall(
    address to, uint256 expirySecond, uint256 gasLimit, uint64 value, bytes memory callData
) external returns (int64 responseCode, address scheduleAddress);

// External payer, deferred execution
function scheduleCallWithPayer(
    address to, address payer, uint256 expirySecond, uint256 gasLimit, uint64 value, bytes memory callData
) external returns (int64 responseCode, address scheduleAddress);

// External payer, immediate on signature
function executeCallOnPayerSignature(
    address to, address payer, uint256 expirySecond, uint256 gasLimit, uint64 value, bytes memory callData
) external returns (int64 responseCode, address scheduleAddress);
```

### Management
```solidity
function deleteSchedule(address scheduleAddress) external returns (int64 responseCode);
function hasScheduleCapacity(uint256 expirySecond, uint256 gasLimit) external view returns (bool);
```

## Three Execution Models

| Property | scheduleCall | scheduleCallWithPayer | executeCallOnPayerSignature |
|----------|-------------|----------------------|------------------------------|
| Who pays | Contract | External payer | External payer |
| When executes | At expiry | At expiry (after sign) | Immediately on signature |
| Self-reschedule | YES | YES | NO |

## Capacity-Aware Scheduling Pattern

```solidity
function _findAvailableSecond(uint256 desired) internal view returns (uint256) {
    if (hasScheduleCapacity(desired, GAS_LIMIT)) return desired;
    for (uint256 i = 0; i < 8; i++) {
        uint256 backoff = 2 ** i;
        uint256 jitter = uint256(keccak256(abi.encodePacked(block.timestamp, i, address(this)))) % backoff;
        uint256 candidate = desired + backoff + jitter;
        if (hasScheduleCapacity(candidate, GAS_LIMIT)) return candidate;
    }
    revert("No capacity");
}
```

## Self-Rescheduling Loop Pattern

```solidity
function execute() external {
    config.executionCount++;
    _doWork();
    if (config.active) _scheduleNext(); // Creates next schedule
}
```

## Edge Cases
- **Insufficient HBAR**: Returns non-SUCCESS code, loop halts silently. Check balance first.
- **Expired schedules**: Auto-removed, no extra fees
- **Gas exhaustion**: Schedule consumed but effects may not complete
- **Concurrent collisions**: Jitter via `address(this)` as entropy

## Mirror Node REST API (for Frontend)
- `GET /api/v1/schedules` - List all schedules
- `GET /api/v1/schedules/{scheduleId}` - Single schedule
- Testnet: `https://testnet.mirrornode.hedera.com`

## Schedule State for UI
```typescript
type ScheduleState = 'CREATED' | 'PENDING' | 'EXECUTED' | 'EXPIRED' | 'DELETED';
```

## Network Details
- Chain ID: 296 (testnet)
- RPC: `https://testnet.hashio.io/api`
- HSS Address: `0x16b`
- Explorer: `https://hashscan.io/testnet`
- Faucet: portal.hedera.com (100 HBAR/24h)

## Project Ideas (Ranked)

1. **VestFlow** - Token Vesting Vault (HIGH feasibility, HIGH innovation)
2. **ShieldFi** - Liquidation Guardian (MEDIUM feasibility, VERY HIGH innovation)
3. **PayDAO** - DAO Payroll Automator (HIGH feasibility, MEDIUM innovation)
4. **CouponChain** - Bond Coupon Engine (MEDIUM feasibility, HIGH innovation)
5. **EvoNFT** - Dynamic NFT Evolution (HIGH feasibility, MEDIUM innovation)

## Winning Strategy
- Emphasize: "No Chainlink Automation. No keeper bots. The protocol itself executes."
- Use `hasScheduleCapacity` prominently
- Fund contract with 50+ test HBAR
- Show full lifecycle in UI: Created -> Pending -> Executed -> Re-scheduled

## Key Sources
- https://docs.hedera.com/hedera/core-concepts/smart-contracts/system-smart-contracts/hedera-schedule-service
- https://github.com/hedera-dev/tutorial-hss-rebalancer-capacity-aware
- https://github.com/hashgraph/hedera-smart-contracts
- https://hips.hedera.com/hip/hip-1215
