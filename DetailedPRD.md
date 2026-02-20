# DetailedPRD.md - AgentMarket
## Autonomous AI Agent Commerce Platform

**Version**: 1.0 | **Date**: 2026-02-14 | **ETHDenver 2026 BUIDLathon**

---

## 1. EXECUTIVE SUMMARY

**AgentMarket** is an autonomous AI agent commerce platform where AI agents discover, negotiate, and pay for services across multiple blockchains. It features gas-free onboarding via a custom ERC-4337 paymaster on ADI Chain, an embeddable merchant checkout SDK, and cross-chain agent-to-agent commerce via Hedera (OpenClaw), Kite AI, and Base.

**One project. Eight bounty submissions. ~$66K addressable prize pool.**

---

## 2. TARGET BOUNTIES & QUALIFICATION

| # | Bounty | Prize | How We Qualify | Priority |
|---|--------|-------|---------------|----------|
| 1 | ADI Open | $19,000 | Full commerce platform deployed on ADI Chain with DDSC stablecoin integration | PRIMARY |
| 2 | ADI Payments | $3,000 | Embeddable merchant checkout widget + payment processor contract | PRIMARY |
| 3 | ADI Paymaster | $3,000 | Custom ERC-4337 Verifying Paymaster on ADI Chain (fills critical infra gap) | PRIMARY |
| 4 | OpenClaw + Hedera | $10,000 | AI agents use OpenClaw skills to transact on Hedera via UCP | SECONDARY |
| 5 | Hedera Schedule | $5,000 | Subscription payments via HSS self-rescheduling loop | SECONDARY |
| 6 | Kite AI | $10,000 | Agent Passport + PoAI attribution for AI service marketplace | SECONDARY |
| 7 | Base | $10,000 | Consumer UX layer via AgentKit + OnchainKit | TERTIARY |
| 8 | QuickNode | $2,000 | Event streaming for real-time transaction monitoring | TERTIARY |

---

## 3. ARCHITECTURE

### 3.1 System Overview

```
+------------------------------------------------------------------+
|                        FRONTEND (Next.js 14+)                     |
|  +------------------+  +------------------+  +------------------+ |
|  | Agent Dashboard  |  | Merchant Portal  |  | Checkout Widget  | |
|  | - Browse agents  |  | - Register store |  | - Embeddable     | |
|  | - Hire agents    |  | - Set prices     |  | - QR code pay    | |
|  | - View history   |  | - View analytics |  | - Gas-free       | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
           |                      |                     |
+------------------------------------------------------------------+
|                     WEB3 LAYER (viem + wagmi)                     |
|  +------------------+  +------------------+  +------------------+ |
|  | ADI Chain        |  | Hedera           |  | Kite AI          | |
|  | (ID: 99999)      |  | (ID: 296)        |  | (Ozone testnet)  | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
           |                      |                     |
+------------------------------------------------------------------+
|                      SMART CONTRACTS                              |
|  +-------------------+  +------------------+  +-----------------+ |
|  | ADI Chain         |  | Hedera           |  | API Layer       | |
|  | - AgentRegistry   |  | - HSS Scheduler  |  | - Kite SDK      | |
|  | - PaymentRouter   |  | - Subscription   |  | - Agent Routes  | |
|  | - ADIPaymaster    |  |   Manager        |  | - Webhook       | |
|  | - MerchantVault   |  +------------------+  +-----------------+ |
|  +-------------------+                                            |
+------------------------------------------------------------------+
```

### 3.2 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14+ (App Router) + TypeScript | Modern, SSR, API routes built-in |
| Styling | Tailwind CSS + shadcn/ui | Beautiful, accessible, fast to build |
| Web3 | viem + wagmi v2 | Type-safe, tree-shakeable, modern standard |
| Wallet | RainbowKit | Best UX, supports WalletConnect + injected |
| Contracts | Solidity 0.8.26 + Foundry | Type-safe, fast compilation, gas optimization |
| AI Agent | Vercel AI SDK + OpenAI | Streaming responses, tool calling |
| Deployment | Vercel (frontend) + ADI Testnet + Hedera Testnet | Free, fast, reliable |

---

## 4. SMART CONTRACTS (ADI Chain - Testnet 99999)

### 4.1 AgentRegistry.sol
Registers AI agents and their capabilities on-chain.

```solidity
// Key state
struct Agent {
    address owner;
    string metadataURI;      // IPFS link to agent profile
    uint256 pricePerTask;    // in wei (ADI native) or DDSC
    bool isActive;
    uint256 totalTasks;
    uint256 rating;          // 1-500 (5 stars * 100)
    uint256 ratingCount;
}

mapping(uint256 => Agent) public agents;      // agentId => Agent
mapping(address => uint256[]) public ownerAgents;

// Key functions
function registerAgent(string calldata metadataURI, uint256 pricePerTask) external returns (uint256 agentId);
function updateAgent(uint256 agentId, string calldata metadataURI, uint256 pricePerTask) external;
function deactivateAgent(uint256 agentId) external;
function rateAgent(uint256 agentId, uint256 rating) external;
function getAgent(uint256 agentId) external view returns (Agent memory);
function getActiveAgents(uint256 offset, uint256 limit) external view returns (Agent[] memory);
```

### 4.2 PaymentRouter.sol
Handles all payments between users and agents/merchants.

```solidity
// Key state
struct Payment {
    address payer;
    address payee;
    uint256 amount;
    address token;           // address(0) for native ADI, or ERC20 (DDSC)
    uint256 agentId;
    PaymentStatus status;
    uint256 timestamp;
}

enum PaymentStatus { Pending, Completed, Refunded, Disputed }

mapping(bytes32 => Payment) public payments;  // paymentId => Payment

// Key functions
function createPayment(address payee, uint256 agentId, address token) external payable returns (bytes32 paymentId);
function createERC20Payment(address payee, uint256 agentId, address token, uint256 amount) external returns (bytes32 paymentId);
function completePayment(bytes32 paymentId) external;
function refundPayment(bytes32 paymentId) external;
function getPayment(bytes32 paymentId) external view returns (Payment memory);
```

### 4.3 MerchantVault.sol
Merchant payment acceptance and settlement.

```solidity
// Key state
struct Merchant {
    address owner;
    string name;
    string metadataURI;
    bool isActive;
    uint256 totalRevenue;
    address[] acceptedTokens;
}

mapping(uint256 => Merchant) public merchants;
mapping(address => uint256) public merchantByAddress;

// Key functions
function registerMerchant(string calldata name, string calldata metadataURI, address[] calldata tokens) external returns (uint256 merchantId);
function checkout(uint256 merchantId, address token, uint256 amount, bytes32 orderId) external payable;
function withdraw(uint256 merchantId, address token) external;
function getMerchant(uint256 merchantId) external view returns (Merchant memory);
```

### 4.4 ADIPaymaster.sol (ERC-4337 Verifying Paymaster)
Custom paymaster for gas-free transactions on ADI Chain.

**Target**: EntryPoint V0.7 at `0x0000000071727De22E5E9d8BAf0edAc6f37da032`

```solidity
// Based on Pimlico's SingletonPaymasterV7 pattern, simplified for hackathon
// Verifying mode only - sponsor signs off on UserOperations

contract ADIPaymaster is BasePaymaster {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public verifyingSigner;
    mapping(address => bool) public sponsoredAddresses;

    constructor(IEntryPoint _entryPoint, address _owner, address _signer)
        BasePaymaster(_entryPoint, _owner) {
        verifyingSigner = _signer;
    }

    // Validate that the paymaster agrees to sponsor this UserOp
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        (uint48 validUntil, uint48 validAfter, bytes memory signature) =
            abi.decode(userOp.paymasterAndData[VALID_PND_OFFSET:], (uint48, uint48, bytes));

        bytes32 hash = keccak256(abi.encode(
            userOp.sender, userOp.nonce, userOp.callData,
            userOp.accountGasLimits, userOp.preVerificationGas,
            userOp.gasFees, block.chainid, address(this),
            validUntil, validAfter
        )).toEthSignedMessageHash();

        if (hash.recover(signature) != verifyingSigner) {
            return ("", _packValidationData(true, validUntil, validAfter));
        }

        return ("", _packValidationData(false, validUntil, validAfter));
    }

    function _postOp(PostOpMode, bytes calldata, uint256, uint256) internal override {}
}
```

### 4.5 SubscriptionManager.sol (Hedera - uses HSS)
Recurring subscription payments using Hedera Schedule Service.

```solidity
// Deployed on Hedera testnet (Chain ID 296)
// Uses HSS at 0x16b for self-rescheduling

IScheduleService constant HSS = IScheduleService(address(0x16b));

struct Subscription {
    address subscriber;
    address merchant;
    uint256 amount;
    uint256 intervalSeconds;
    bool active;
    uint256 executionCount;
    address nextSchedule;
}

function createSubscription(address merchant, uint256 amount, uint256 interval) external payable;
function execute(uint256 subId) external;  // Called by HSS, reschedules itself
function cancelSubscription(uint256 subId) external;
```

---

## 5. FRONTEND PAGES

### 5.1 Landing Page (`/`)
- Hero: "AI Agent Commerce. Zero Gas Fees."
- Stats bar: Total agents, Total payments, Total merchants
- Featured agents grid (3-4 cards)
- "Get Started" CTA -> Connect Wallet

### 5.2 Agent Marketplace (`/agents`)
- Search/filter bar (category, price range, rating)
- Agent cards grid with: name, description, price, rating, task count
- Click -> Agent detail page

### 5.3 Agent Detail (`/agents/[id]`)
- Agent profile (name, description, capabilities)
- Pricing info
- "Hire Agent" button -> triggers payment flow
- Transaction history
- Rating system

### 5.4 Merchant Portal (`/merchant`)
- Register merchant form
- Product/service listing management
- Embeddable checkout code generator (copy-paste iframe/script)
- Revenue analytics dashboard
- Withdraw funds button

### 5.5 Checkout Widget (`/checkout/[merchantId]`)
- Standalone page (also embeddable)
- Shows: merchant name, item, price
- Pay with: ADI native token or DDSC stablecoin
- Gas-free toggle (uses paymaster)
- Transaction confirmation + receipt

### 5.6 Dashboard (`/dashboard`)
- Connected wallet overview
- My agents (registered)
- My payments (sent/received)
- My subscriptions (Hedera HSS)
- Paymaster status (gas credits remaining)

### 5.7 Admin/Paymaster (`/admin`)
- Paymaster deposit management
- Sponsored address whitelist
- Gas usage analytics

---

## 6. API ROUTES (Next.js)

### 6.1 Paymaster Signer API
```
POST /api/paymaster/sign
Body: { userOp, entryPoint, chainId }
Returns: { paymasterAndData, signature }
```
Backend signs UserOperations after validating:
- Sender is in sponsored list OR is a new user (first 5 txs free)
- Gas limits are reasonable
- Target contract is in allowed list (our contracts only)

### 6.2 Agent Metadata API
```
POST /api/agents/metadata
Body: { name, description, capabilities, avatar }
Returns: { metadataURI } (stored on IPFS via Pinata or in-memory for hackathon)
```

### 6.3 Kite AI Attribution API
```
POST /api/kite/attribute
Body: { agentId, taskId, result }
Returns: { attributionHash, poaiScore }
```
## 1. EXECUTIVE SUMMARY

**AgentMarket** is an autonomous AI agent commerce platform where AI agents discover, negotiate, and pay for services across multiple blockchains. It features gas-free onboarding via a custom ERC-4337 paymaster on ADI Chain, an embeddable merchant checkout SDK, and cross-chain agent-to-agent commerce via Hedera (OpenClaw), Kite AI, and Base.

**One project. Eight bounty submissions. ~$66K addressable prize pool.**

---

## 2. TARGET BOUNTIES & QUALIFICATION

| # | Bounty | Prize | How We Qualify | Priority |
|---|--------|-------|---------------|----------|
| 1 | ADI Open | $19,000 | Full commerce platform deployed on ADI Chain with DDSC stablecoin integration | PRIMARY |
| 2 | ADI Payments | $3,000 | Embeddable merchant checkout widget + payment processor contract | PRIMARY |
| 3 | ADI Paymaster | $3,000 | Custom ERC-4337 Verifying Paymaster on ADI Chain (fills critical infra gap) | PRIMARY |
| 4 | OpenClaw + Hedera | $10,000 | AI agents use OpenClaw skills to transact on Hedera via UCP | SECONDARY |
| 5 | Hedera Schedule | $5,000 | Subscription payments via HSS self-rescheduling loop | SECONDARY |
| 6 | Kite AI | $10,000 | Agent Passport + PoAI attribution for AI service marketplace | SECONDARY |
| 7 | Base | $10,000 | Consumer UX layer via AgentKit + OnchainKit | TERTIARY |
| 8 | QuickNode | $2,000 | Event streaming for real-time transaction monitoring | TERTIARY |

---

## 3. ARCHITECTURE

### 3.1 System Overview

```
+------------------------------------------------------------------+
|                        FRONTEND (Next.js 14+)                     |
|  +------------------+  +------------------+  +------------------+ |
|  | Agent Dashboard  |  | Merchant Portal  |  | Checkout Widget  | |
|  | - Browse agents  |  | - Register store |  | - Embeddable     | |
|  | - Hire agents    |  | - Set prices     |  | - QR code pay    | |
|  | - View history   |  | - View analytics |  | - Gas-free       | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
           |                      |                     |
+------------------------------------------------------------------+
|                     WEB3 LAYER (viem + wagmi)                     |
|  +------------------+  +------------------+  +------------------+ |
|  | ADI Chain        |  | Hedera           |  | Kite AI          | |
|  | (ID: 99999)      |  | (ID: 296)        |  | (Ozone testnet)  | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
           |                      |                     |
+------------------------------------------------------------------+
|                      SMART CONTRACTS                              |
|  +-------------------+  +------------------+  +-----------------+ |
|  | ADI Chain         |  | Hedera           |  | API Layer       | |
|  | - AgentRegistry   |  | - HSS Scheduler  |  | - Kite SDK      | |
|  | - PaymentRouter   |  | - Subscription   |  | - Agent Routes  | |
|  | - ADIPaymaster    |  |   Manager        |  | - Webhook       | |
|  | - MerchantVault   |  +------------------+  +-----------------+ |
|  +-------------------+                                            |
+------------------------------------------------------------------+
```

### 3.2 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14+ (App Router) + TypeScript | Modern, SSR, API routes built-in |
| Styling | Tailwind CSS + shadcn/ui | Beautiful, accessible, fast to build |
| Web3 | viem + wagmi v2 | Type-safe, tree-shakeable, modern standard |
| Wallet | RainbowKit | Best UX, supports WalletConnect + injected |
| Contracts | Solidity 0.8.26 + Foundry | Type-safe, fast compilation, gas optimization |
| AI Agent | Vercel AI SDK + OpenAI | Streaming responses, tool calling |
| Deployment | Vercel (frontend) + ADI Testnet + Hedera Testnet | Free, fast, reliable |

---

## 4. SMART CONTRACTS (ADI Chain - Testnet 99999)

### 4.1 AgentRegistry.sol
Registers AI agents and their capabilities on-chain.

```solidity
// Key state
struct Agent {
    address owner;
    string metadataURI;      // IPFS link to agent profile
    uint256 pricePerTask;    // in wei (ADI native) or DDSC
    bool isActive;
    uint256 totalTasks;
    uint256 rating;          // 1-500 (5 stars * 100)
    uint256 ratingCount;
}

mapping(uint256 => Agent) public agents;      // agentId => Agent
mapping(address => uint256[]) public ownerAgents;

// Key functions
function registerAgent(string calldata metadataURI, uint256 pricePerTask) external returns (uint256 agentId);
function updateAgent(uint256 agentId, string calldata metadataURI, uint256 pricePerTask) external;
function deactivateAgent(uint256 agentId) external;
function rateAgent(uint256 agentId, uint256 rating) external;
function getAgent(uint256 agentId) external view returns (Agent memory);
function getActiveAgents(uint256 offset, uint256 limit) external view returns (Agent[] memory);
```

### 4.2 PaymentRouter.sol
Handles all payments between users and agents/merchants.

```solidity
// Key state
struct Payment {
    address payer;
    address payee;
    uint256 amount;
    address token;           // address(0) for native ADI, or ERC20 (DDSC)
    uint256 agentId;
    PaymentStatus status;
    uint256 timestamp;
}

enum PaymentStatus { Pending, Completed, Refunded, Disputed }

mapping(bytes32 => Payment) public payments;  // paymentId => Payment

// Key functions
function createPayment(address payee, uint256 agentId, address token) external payable returns (bytes32 paymentId);
function createERC20Payment(address payee, uint256 agentId, address token, uint256 amount) external returns (bytes32 paymentId);
function completePayment(bytes32 paymentId) external;
function refundPayment(bytes32 paymentId) external;
function getPayment(bytes32 paymentId) external view returns (Payment memory);
```

### 4.3 MerchantVault.sol
Merchant payment acceptance and settlement.

```solidity
// Key state
struct Merchant {
    address owner;
    string name;
    string metadataURI;
    bool isActive;
    uint256 totalRevenue;
    address[] acceptedTokens;
}

mapping(uint256 => Merchant) public merchants;
mapping(address => uint256) public merchantByAddress;

// Key functions
function registerMerchant(string calldata name, string calldata metadataURI, address[] calldata tokens) external returns (uint256 merchantId);
function checkout(uint256 merchantId, address token, uint256 amount, bytes32 orderId) external payable;
function withdraw(uint256 merchantId, address token) external;
function getMerchant(uint256 merchantId) external view returns (Merchant memory);
```

### 4.4 ADIPaymaster.sol (ERC-4337 Verifying Paymaster)
Custom paymaster for gas-free transactions on ADI Chain.

**Target**: EntryPoint V0.7 at `0x0000000071727De22E5E9d8BAf0edAc6f37da032`

```solidity
// Based on Pimlico's SingletonPaymasterV7 pattern, simplified for hackathon
// Verifying mode only - sponsor signs off on UserOperations

contract ADIPaymaster is BasePaymaster {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public verifyingSigner;
    mapping(address => bool) public sponsoredAddresses;

    constructor(IEntryPoint _entryPoint, address _owner, address _signer)
        BasePaymaster(_entryPoint, _owner) {
        verifyingSigner = _signer;
    }

    // Validate that the paymaster agrees to sponsor this UserOp
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        (uint48 validUntil, uint48 validAfter, bytes memory signature) =
            abi.decode(userOp.paymasterAndData[VALID_PND_OFFSET:], (uint48, uint48, bytes));

        bytes32 hash = keccak256(abi.encode(
            userOp.sender, userOp.nonce, userOp.callData,
            userOp.accountGasLimits, userOp.preVerificationGas,
            userOp.gasFees, block.chainid, address(this),
            validUntil, validAfter
        )).toEthSignedMessageHash();

        if (hash.recover(signature) != verifyingSigner) {
            return ("", _packValidationData(true, validUntil, validAfter));
        }

        return ("", _packValidationData(false, validUntil, validAfter));
    }

    function _postOp(PostOpMode, bytes calldata, uint256, uint256) internal override {}
}
```

### 4.5 SubscriptionManager.sol (Hedera - uses HSS)
Recurring subscription payments using Hedera Schedule Service.

```solidity
// Deployed on Hedera testnet (Chain ID 296)
// Uses HSS at 0x16b for self-rescheduling

IScheduleService constant HSS = IScheduleService(address(0x16b));

struct Subscription {
    address subscriber;
    address merchant;
    uint256 amount;
    uint256 intervalSeconds;
    bool active;
    uint256 executionCount;
    address nextSchedule;
}

function createSubscription(address merchant, uint256 amount, uint256 interval) external payable;
function execute(uint256 subId) external;  // Called by HSS, reschedules itself
function cancelSubscription(uint256 subId) external;
```

---

## 5. FRONTEND PAGES

### 5.1 Landing Page (`/`)
- Hero: "AI Agent Commerce. Zero Gas Fees."
- Stats bar: Total agents, Total payments, Total merchants
- Featured agents grid (3-4 cards)
- "Get Started" CTA -> Connect Wallet

### 5.2 Agent Marketplace (`/agents`)
- Search/filter bar (category, price range, rating)
- Agent cards grid with: name, description, price, rating, task count
- Click -> Agent detail page

### 5.3 Agent Detail (`/agents/[id]`)
- Agent profile (name, description, capabilities)
- Pricing info
- "Hire Agent" button -> triggers payment flow
- Transaction history
- Rating system

### 5.4 Merchant Portal (`/merchant`)
- Register merchant form
- Product/service listing management
- Embeddable checkout code generator (copy-paste iframe/script)
- Revenue analytics dashboard
- Withdraw funds button

### 5.5 Checkout Widget (`/checkout/[merchantId]`)
- Standalone page (also embeddable)
- Shows: merchant name, item, price
- Pay with: ADI native token or DDSC stablecoin
- Gas-free toggle (uses paymaster)
- Transaction confirmation + receipt

### 5.6 Dashboard (`/dashboard`)
- Connected wallet overview
- My agents (registered)
- My payments (sent/received)
- My subscriptions (Hedera HSS)
- Paymaster status (gas credits remaining)

### 5.7 Admin/Paymaster (`/admin`)
- Paymaster deposit management
- Sponsored address whitelist
- Gas usage analytics

---

## 6. API ROUTES (Next.js)

### 6.1 Paymaster Signer API
```
POST /api/paymaster/sign
Body: { userOp, entryPoint, chainId }
Returns: { paymasterAndData, signature }
```
Backend signs UserOperations after validating:
- Sender is in sponsored list OR is a new user (first 5 txs free)
- Gas limits are reasonable
- Target contract is in allowed list (our contracts only)

### 6.2 Agent Metadata API
```
POST /api/agents/metadata
Body: { name, description, capabilities, avatar }
Returns: { metadataURI } (stored on IPFS via Pinata or in-memory for hackathon)
```

### 6.3 Kite AI Attribution API
```
POST /api/kite/attribute
Body: { agentId, taskId, result }
Returns: { attributionHash, poaiScore }
```
## 1. EXECUTIVE SUMMARY

**AgentMarket** is an autonomous AI agent commerce platform where AI agents discover, negotiate, and pay for services across multiple blockchains. It features gas-free onboarding via a custom ERC-4337 paymaster on ADI Chain, an embeddable merchant checkout SDK, and cross-chain agent-to-agent commerce via Hedera (OpenClaw), Kite AI, and Base.

**One project. Eight bounty submissions. ~$66K addressable prize pool.**

---

## 2. TARGET BOUNTIES & QUALIFICATION

| # | Bounty | Prize | How We Qualify | Priority |
|---|--------|-------|---------------|----------|
| 1 | ADI Open | $19,000 | Full commerce platform deployed on ADI Chain with DDSC stablecoin integration | PRIMARY |
| 2 | ADI Payments | $3,000 | Embeddable merchant checkout widget + payment processor contract | PRIMARY |
| 3 | ADI Paymaster | $3,000 | Custom ERC-4337 Verifying Paymaster on ADI Chain (fills critical infra gap) | PRIMARY |
| 4 | OpenClaw + Hedera | $10,000 | AI agents use OpenClaw skills to transact on Hedera via UCP | SECONDARY |
| 5 | Hedera Schedule | $5,000 | Subscription payments via HSS self-rescheduling loop | SECONDARY |
| 6 | Kite AI | $10,000 | Agent Passport + PoAI attribution for AI service marketplace | SECONDARY |
| 7 | Base | $10,000 | Consumer UX layer via AgentKit + OnchainKit | TERTIARY |
| 8 | QuickNode | $2,000 | Event streaming for real-time transaction monitoring | TERTIARY |

---

## 3. ARCHITECTURE

### 3.1 System Overview

```
+------------------------------------------------------------------+
|                        FRONTEND (Next.js 14+)                     |
|  +------------------+  +------------------+  +------------------+ |
|  | Agent Dashboard  |  | Merchant Portal  |  | Checkout Widget  | |
|  | - Browse agents  |  | - Register store |  | - Embeddable     | |
|  | - Hire agents    |  | - Set prices     |  | - QR code pay    | |
|  | - View history   |  | - View analytics |  | - Gas-free       | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
           |                      |                     |
+------------------------------------------------------------------+
|                     WEB3 LAYER (viem + wagmi)                     |
|  +------------------+  +------------------+  +------------------+ |
|  | ADI Chain        |  | Hedera           |  | Kite AI          | |
|  | (ID: 99999)      |  | (ID: 296)        |  | (Ozone testnet)  | |
|  +------------------+  +------------------+  +------------------+ |
+------------------------------------------------------------------+
           |                      |                     |
+------------------------------------------------------------------+
|                      SMART CONTRACTS                              |
|  +-------------------+  +------------------+  +-----------------+ |
|  | ADI Chain         |  | Hedera           |  | API Layer       | |
|  | - AgentRegistry   |  | - HSS Scheduler  |  | - Kite SDK      | |
|  | - PaymentRouter   |  | - Subscription   |  | - Agent Routes  | |
|  | - ADIPaymaster    |  |   Manager        |  | - Webhook       | |
|  | - MerchantVault   |  +------------------+  +-----------------+ |
|  +-------------------+                                            |
+------------------------------------------------------------------+
```

### 3.2 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14+ (App Router) + TypeScript | Modern, SSR, API routes built-in |
| Styling | Tailwind CSS + shadcn/ui | Beautiful, accessible, fast to build |
| Web3 | viem + wagmi v2 | Type-safe, tree-shakeable, modern standard |
| Wallet | RainbowKit | Best UX, supports WalletConnect + injected |
| Contracts | Solidity 0.8.26 + Foundry | Type-safe, fast compilation, gas optimization |
| AI Agent | Vercel AI SDK + OpenAI | Streaming responses, tool calling |
| Deployment | Vercel (frontend) + ADI Testnet + Hedera Testnet | Free, fast, reliable |

---

## 4. SMART CONTRACTS (ADI Chain - Testnet 99999)

### 4.1 AgentRegistry.sol
Registers AI agents and their capabilities on-chain.

```solidity
// Key state
struct Agent {
    address owner;
    string metadataURI;      // IPFS link to agent profile
    uint256 pricePerTask;    // in wei (ADI native) or DDSC
    bool isActive;
    uint256 totalTasks;
    uint256 rating;          // 1-500 (5 stars * 100)
    uint256 ratingCount;
}

mapping(uint256 => Agent) public agents;      // agentId => Agent
mapping(address => uint256[]) public ownerAgents;

// Key functions
function registerAgent(string calldata metadataURI, uint256 pricePerTask) external returns (uint256 agentId);
function updateAgent(uint256 agentId, string calldata metadataURI, uint256 pricePerTask) external;
function deactivateAgent(uint256 agentId) external;
function rateAgent(uint256 agentId, uint256 rating) external;
function getAgent(uint256 agentId) external view returns (Agent memory);
function getActiveAgents(uint256 offset, uint256 limit) external view returns (Agent[] memory);
```

### 4.2 PaymentRouter.sol
Handles all payments between users and agents/merchants.

```solidity
// Key state
struct Payment {
    address payer;
    address payee;
    uint256 amount;
    address token;           // address(0) for native ADI, or ERC20 (DDSC)
    uint256 agentId;
    PaymentStatus status;
    uint256 timestamp;
}

enum PaymentStatus { Pending, Completed, Refunded, Disputed }

mapping(bytes32 => Payment) public payments;  // paymentId => Payment

// Key functions
function createPayment(address payee, uint256 agentId, address token) external payable returns (bytes32 paymentId);
function createERC20Payment(address payee, uint256 agentId, address token, uint256 amount) external returns (bytes32 paymentId);
function completePayment(bytes32 paymentId) external;
function refundPayment(bytes32 paymentId) external;
function getPayment(bytes32 paymentId) external view returns (Payment memory);
```

### 4.3 MerchantVault.sol
Merchant payment acceptance and settlement.

```solidity
// Key state
struct Merchant {
    address owner;
    string name;
    string metadataURI;
    bool isActive;
    uint256 totalRevenue;
    address[] acceptedTokens;
}

mapping(uint256 => Merchant) public merchants;
mapping(address => uint256) public merchantByAddress;

// Key functions
function registerMerchant(string calldata name, string calldata metadataURI, address[] calldata tokens) external returns (uint256 merchantId);
function checkout(uint256 merchantId, address token, uint256 amount, bytes32 orderId) external payable;
function withdraw(uint256 merchantId, address token) external;
function getMerchant(uint256 merchantId) external view returns (Merchant memory);
```

### 4.4 ADIPaymaster.sol (ERC-4337 Verifying Paymaster)
Custom paymaster for gas-free transactions on ADI Chain.

**Target**: EntryPoint V0.7 at `0x0000000071727De22E5E9d8BAf0edAc6f37da032`

```solidity
// Based on Pimlico's SingletonPaymasterV7 pattern, simplified for hackathon
// Verifying mode only - sponsor signs off on UserOperations

contract ADIPaymaster is BasePaymaster {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    address public verifyingSigner;
    mapping(address => bool) public sponsoredAddresses;

    constructor(IEntryPoint _entryPoint, address _owner, address _signer)
        BasePaymaster(_entryPoint, _owner) {
        verifyingSigner = _signer;
    }

    // Validate that the paymaster agrees to sponsor this UserOp
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) internal override returns (bytes memory context, uint256 validationData) {
        (uint48 validUntil, uint48 validAfter, bytes memory signature) =
            abi.decode(userOp.paymasterAndData[VALID_PND_OFFSET:], (uint48, uint48, bytes));

        bytes32 hash = keccak256(abi.encode(
            userOp.sender, userOp.nonce, userOp.callData,
            userOp.accountGasLimits, userOp.preVerificationGas,
            userOp.gasFees, block.chainid, address(this),
            validUntil, validAfter
        )).toEthSignedMessageHash();

        if (hash.recover(signature) != verifyingSigner) {
            return ("", _packValidationData(true, validUntil, validAfter));
        }

        return ("", _packValidationData(false, validUntil, validAfter));
    }

    function _postOp(PostOpMode, bytes calldata, uint256, uint256) internal override {}
}
```

### 4.5 SubscriptionManager.sol (Hedera - uses HSS)
Recurring subscription payments using Hedera Schedule Service.

```solidity
// Deployed on Hedera testnet (Chain ID 296)
// Uses HSS at 0x16b for self-rescheduling

IScheduleService constant HSS = IScheduleService(address(0x16b));

struct Subscription {
    address subscriber;
    address merchant;
    uint256 amount;
    uint256 intervalSeconds;
    bool active;
    uint256 executionCount;
    address nextSchedule;
}

function createSubscription(address merchant, uint256 amount, uint256 interval) external payable;
function execute(uint256 subId) external;  // Called by HSS, reschedules itself
function cancelSubscription(uint256 subId) external;
```

---

## 5. FRONTEND PAGES

### 5.1 Landing Page (`/`)
- Hero: "AI Agent Commerce. Zero Gas Fees."
- Stats bar: Total agents, Total payments, Total merchants
- Featured agents grid (3-4 cards)
- "Get Started" CTA -> Connect Wallet

### 5.2 Agent Marketplace (`/agents`)
- Search/filter bar (category, price range, rating)
- Agent cards grid with: name, description, price, rating, task count
- Click -> Agent detail page

### 5.3 Agent Detail (`/agents/[id]`)
- Agent profile (name, description, capabilities)
- Pricing info
- "Hire Agent" button -> triggers payment flow
- Transaction history
- Rating system

### 5.4 Merchant Portal (`/merchant`)
- Register merchant form
- Product/service listing management
- Embeddable checkout code generator (copy-paste iframe/script)
- Revenue analytics dashboard
- Withdraw funds button

### 5.5 Checkout Widget (`/checkout/[merchantId]`)
- Standalone page (also embeddable)
- Shows: merchant name, item, price
- Pay with: ADI native token or DDSC stablecoin
- Gas-free toggle (uses paymaster)
- Transaction confirmation + receipt

### 5.6 Dashboard (`/dashboard`)
- Connected wallet overview
- My agents (registered)
- My payments (sent/received)
- My subscriptions (Hedera HSS)
- Paymaster status (gas credits remaining)

### 5.7 Admin/Paymaster (`/admin`)
- Paymaster deposit management
- Sponsored address whitelist
- Gas usage analytics

---

## 6. API ROUTES (Next.js)

### 6.1 Paymaster Signer API
```
POST /api/paymaster/sign
Body: { userOp, entryPoint, chainId }
Returns: { paymasterAndData, signature }
```
Backend signs UserOperations after validating:
- Sender is in sponsored list OR is a new user (first 5 txs free)
- Gas limits are reasonable
- Target contract is in allowed list (our contracts only)

### 6.2 Agent Metadata API
```
POST /api/agents/metadata
Body: { name, description, capabilities, avatar }
Returns: { metadataURI } (stored on IPFS via Pinata or in-memory for hackathon)
```

### 6.3 Kite AI Attribution API
```
POST /api/kite/attribute
Body: { agentId, taskId, result }
Returns: { attributionHash, poaiScore }
```

---

## 7. IMPLEMENTATION PLAN

### Phase 1: Foundation (Day 1 - Feb 14)
- [x] Research complete
- [ ] Initialize Next.js project with TypeScript, Tailwind, shadcn/ui
- [ ] Initialize Foundry project for contracts
- [ ] Set up wagmi/viem with ADI Chain testnet config
- [ ] Deploy basic AgentRegistry.sol to ADI testnet

### Phase 2: Core Contracts (Day 2 - Feb 15)
- [ ] Deploy PaymentRouter.sol to ADI testnet
- [ ] Deploy MerchantVault.sol to ADI testnet
- [ ] Deploy ADIPaymaster.sol to ADI testnet (EntryPoint V0.7)
- [ ] Fund paymaster with test ADI tokens
- [ ] Write paymaster signer API route
- [ ] Verify all contracts on ADI explorer

### Phase 3: Frontend Core (Day 3 - Feb 16)
- [ ] Landing page with stats
- [ ] Agent marketplace page (browse, search, filter)
- [ ] Agent detail page with hire flow
- [ ] Wallet connection (RainbowKit + ADI Chain)

### Phase 4: Merchant + Checkout (Day 4 - Feb 17)
- [ ] Merchant registration page
- [ ] Checkout widget (standalone + embeddable)
- [ ] Gas-free payment flow via paymaster
- [ ] Payment confirmation + receipt UI

### Phase 5: Cross-Chain (Day 5 - Feb 18)
- [ ] Hedera SubscriptionManager with HSS
- [ ] Kite AI agent passport integration
- [ ] Dashboard with multi-chain view

### Phase 6: Polish (Day 6 - Feb 19)
- [ ] UI polish, animations, responsive design
- [ ] Error handling, loading states
- [ ] Test all flows end-to-end on testnets

### Phase 7: Submit (Day 7 - Feb 20-21)
- [ ] Record 3-minute demo video
- [ ] Write README with architecture diagram
- [ ] Submit to Devfolio (up to 10 bounties)
- [ ] Prepare for judge Q&A

---

## 8. CONTRACT DEPLOYMENT DETAILS

### ADI Chain Testnet
| Contract | Constructor Args |
|----------|-----------------|
| AgentRegistry | (none) |
| PaymentRouter | (agentRegistryAddress) |
| MerchantVault | (paymentRouterAddress) |
| ADIPaymaster | (entryPointV07, ownerAddress, signerAddress) |

**RPC**: `https://rpc.ab.testnet.adifoundation.ai/`
**Chain ID**: 99999
**Faucet**: `https://faucet.ab.testnet.adifoundation.ai/`
**Explorer**: `https://explorer.ab.testnet.adifoundation.ai/`
**EntryPoint V0.7**: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`

### Hedera Testnet
| Contract | Constructor Args |
|----------|-----------------|
| SubscriptionManager | (none, uses HSS at 0x16b) |

**RPC**: `https://testnet.hashio.io/api`
**Chain ID**: 296
**Faucet**: `https://portal.hedera.com`

---

## 9. KEY DIFFERENTIATORS (Why Judges Pick Us)

1. **Fills a real gap**: ADI Chain has NO paymaster infrastructure. We're building it.
2. **DDSC is 2 days old**: First project to integrate the just-launched dirham stablecoin.
3. **Working demo**: Real transactions on real testnets, zero mocks.
4. **8 bounties, 1 project**: Maximum coverage, demonstrates composability.
5. **Consumer UX**: Gas-free onboarding means non-crypto users can participate.
6. **Cross-chain**: ADI + Hedera + Kite AI shows real interoperability.
7. **Narrative fit**: 2026 theme = autonomous agent commerce. We ARE that.

---

## 10. DEMO FLOW (3 minutes)

1. **0:00-0:20** HOOK: "What if AI agents could hire each other and pay autonomously?"
2. **0:20-0:40** Show agent marketplace, browse agents
3. **0:40-1:10** Hire an agent, show gas-free payment via paymaster (show tx on explorer)
4. **1:10-1:40** Merchant checkout widget, pay with DDSC stablecoin
5. **1:40-2:10** Hedera subscription via HSS (show self-rescheduling on HashScan)
6. **2:10-2:40** Architecture diagram, name all sponsor tech used
7. **2:40-3:00** "AgentMarket: built on ADI Chain, Hedera, Kite AI. Gas-free. Cross-chain. Live."

---

## 11. RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| ADI testnet down | Have Hedera contracts as backup demo |
| Paymaster complexity | Start with simple verifying mode, skip ERC-20 mode |
| Time pressure | Core ADI bounties ($25K) are priority; cross-chain is bonus |
| DDSC token not on testnet | Use mock ERC20 with same interface, label as "DDSC Preview" |
| Pimlico bundler issues on ADI | Use simple relay server as bundler alternative |

---

## 12. FILE STRUCTURE

```
denver/
├── DetailedPRD.md
├── research/
│   ├── INDEX.md
│   ├── 01_openclaw_hedera_agents.md
│   ├── 02_hedera_schedule_service.md
│   ├── 03_adi_chain_foundation.md
│   ├── 04_base_kitenai_0glabs.md
│   └── 05_strategy_and_winning.md
├── contracts/
│   ├── foundry.toml
│   ├── src/
│   │   ├── AgentRegistry.sol
│   │   ├── PaymentRouter.sol
│   │   ├── MerchantVault.sol
│   │   ├── ADIPaymaster.sol
│   │   └── SubscriptionManager.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── test/
│       └── AgentRegistry.t.sol
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── agents/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── merchant/
│   │   │   │   └── page.tsx
│   │   │   ├── checkout/
│   │   │   │   └── [merchantId]/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── api/
│   │   │       ├── paymaster/
│   │   │       │   └── sign/route.ts
│   │   │       └── agents/
│   │   │           └── metadata/route.ts
│   │   ├── components/
│   │   │   ├── ui/ (shadcn)
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Footer.tsx
│   │   │   ├── agents/
│   │   │   │   ├── AgentCard.tsx
│   │   │   │   └── AgentGrid.tsx
│   │   │   ├── merchant/
│   │   │   │   └── CheckoutWidget.tsx
│   │   │   └── web3/
│   │   │       ├── ConnectButton.tsx
│   │   │       └── TransactionStatus.tsx
│   │   ├── lib/
│   │   │   ├── contracts.ts (ABIs + addresses)
│   │   │   ├── chains.ts (ADI + Hedera chain defs)
│   │   │   └── wagmi.ts (wagmi config)
│   │   └── hooks/
│   │       ├── useAgentRegistry.ts
│   │       ├── usePaymentRouter.ts
│   │       └── useMerchantVault.ts
│   └── public/
└── README.md
```
