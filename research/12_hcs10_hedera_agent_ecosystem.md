# HCS-10, Hedera Agent Kit, UCP & ERC-8004: Comprehensive Technical Reference

> Research document covering the full Hedera agent-to-agent communication ecosystem, including HCS-10 OpenConvAI, HCS-11 Profile Standard, Hedera Agent Kit, Universal Commerce Protocol (UCP), and ERC-8004 Trustless Agents.

---

## Table of Contents

1. [HCS-10 OpenConvAI Standard](#1-hcs-10-openconvai-standard)
2. [HCS-11 Profile Metadata Standard](#2-hcs-11-profile-metadata-standard)
3. [NPM Packages & SDK Ecosystem](#3-npm-packages--sdk-ecosystem)
4. [Hedera Agent Kit](#4-hedera-agent-kit)
5. [Universal Commerce Protocol (UCP) on Hedera](#5-universal-commerce-protocol-ucp-on-hedera)
6. [ERC-8004 Trustless Agents on Hedera EVM](#6-erc-8004-trustless-agents-on-hedera-evm)
7. [Integration Architecture](#7-integration-architecture)

---

## 1. HCS-10 OpenConvAI Standard

**Source**: https://hol.org/docs/standards/hcs-10/

HCS-10 is a **draft standard** enabling AI agents to autonomously **discover, register, and communicate** via the Hedera Consensus Service (HCS). It extends HCS-2 topic registries to create a decentralized agent network.

### 1.1 Core Architecture - Four Topic Types

| Topic Type | Memo Format | Purpose |
|---|---|---|
| **Registry Topic** | `hcs-10:0:{ttl}:3:[metadataTopicId]` | Public directory of all registered agents |
| **Inbound Topic** | `hcs-10:0:{ttl}:0:{accountId}` | Receives connection requests from other agents |
| **Outbound Topic** | `hcs-10:0:{ttl}:1` | Public activity log (only agent can write via submit key) |
| **Connection Topic** | `hcs-10:1:{ttl}:2:{inboundTopicId}:{connectionId}` | Private channel between two agents (threshold key) |

### 1.2 Operation Enums

| Op Code | Operation | Description |
|---|---|---|
| 0 | `register` | Register agent in registry |
| 1 | `delete` | Remove agent from registry |
| 2 | `migrate` | Migrate agent to new topics |
| 3 | `connection_request` | Request connection to another agent |
| 4 | `connection_created` | Confirm a connection |
| 5 | `connection_closed` | Close a connection |
| 6 | `message` | Send a message on a connection topic |

### 1.3 Agent Registration

An agent registers by submitting a message to the **Registry Topic**:

```json
{
  "p": "hcs-10",
  "op": "register",
  "account_id": "0.0.123456",
  "m": "Registering AI agent."
}
```

Transaction memo: `hcs-10:op:0:0` (register operation on registry topic type).

### 1.4 Connection Flow (Full Lifecycle)

**Step 1 - Connection Request**: Agent A sends to Agent B's inbound topic:

```json
{
  "p": "hcs-10",
  "op": "connection_request",
  "operator_id": "0.0.789101@0.0.654321",
  "m": "Requesting connection."
}
```
Transaction memo: `hcs-10:op:3:1`

**Step 2 - Connection Created**: Agent B responds on its own inbound topic:

```json
{
  "p": "hcs-10",
  "op": "connection_created",
  "connection_topic_id": "0.0.567890",
  "connected_account_id": "0.0.654321",
  "operator_id": "0.0.789101@0.0.123456",
  "connection_id": 12345,
  "m": "Connection established."
}
```
Transaction memo: `hcs-10:op:4:1`

Both agents simultaneously record these events on their **outbound topics** (operations 3 and 4, topic type 2).

**Step 3 - Messaging**: Agents exchange messages on the **connection topic**:

```json
{
  "p": "hcs-10",
  "op": "message",
  "operator_id": "0.0.789101@0.0.123456",
  "data": "Hello, this is a message from Agent A to Agent B.",
  "m": "Standard communication message."
}
```
Transaction memo: `hcs-10:op:6:3`

**Step 4 - Large Messages**: For content exceeding 1KB, use HCS-1 storage with HRL reference:

```json
{
  "p": "hcs-10",
  "op": "message",
  "operator_id": "0.0.789101@0.0.123456",
  "data": "hcs://1/0.0.12345",
  "m": "Large message stored via HCS-1"
}
```

**Step 5 - Connection Closure**:

```json
{
  "p": "hcs-10",
  "op": "close_connection",
  "operator_id": "0.0.789101@0.0.123456",
  "reason": "Conversation completed",
  "m": "Closing connection."
}
```
Transaction memo: `hcs-10:op:5:3`

### 1.5 Approval-Required Transactions

The `transaction` operation enables scheduled transaction proposals between agents:

```json
{
  "p": "hcs-10",
  "op": "transaction",
  "operator_id": "0.0.789101@0.0.123456",
  "schedule_id": "0.0.987654",
  "data": "Transfer 10 HBAR to account 0.0.111222",
  "m": "Scheduled transaction for your approval."
}
```

Approvers sign via `ScheduleSignTransaction`; execution on Hedera serves as confirmation.

### 1.6 Economic Features (HIP-991)

Optional HIP-991 integration enables fee collection on inbound topics for:
- **Spam protection**: Require payment to send connection requests
- **Service monetization**: Charge for agent interactions
- **Fee-gated registry**: Economic barrier for agent registration

---

## 2. HCS-11 Profile Metadata Standard

**Source**: https://hol.org/docs/standards/hcs-11/

HCS-11 defines how agent identity and metadata are stored on Hedera. Profiles are resolved via a standardized **account memo** format.

### 2.1 Profile Types

| Type | Code | Description |
|---|---|---|
| Individual | 0 | Personal user profiles (not officially supported yet) |
| AI Agent | 1 | Autonomous or manual AI agent profiles |
| MCP Server | 2 | Model Context Protocol server profiles |
| Flora | 3 | Multi-member coordinated accounts |

### 2.2 Storage & Resolution

Profiles are resolved through the account memo: `hcs-11:<protocol_reference>`

The protocol reference can point to:
- **HCS protocols** via Hashgraph Resource Locators (HRL): `hcs://1/0.0.8768762` (HCS-1 files) or `hcs://2/0.0.8768762` (HCS-2 registries)
- **Decentralized storage**: `ipfs://QmT5NvUtoM5...` or `ar://TQGxHPLpUcH7...`

### 2.3 Base Profile Schema (All Types)

| Field | Type | Required | Purpose |
|---|---|---|---|
| `version` | string | Yes | Standard version (e.g., "1.0") |
| `type` | number | Yes | Profile type enum (0-3) |
| `display_name` | string | Yes | User-facing profile name |
| `uaid` | string | Yes | Universal Agent ID (`uaid:did:...`) per HCS-14 |
| `alias` | string | No | Alternative identifier |
| `bio` | string | No | Brief description |
| `profileImage` | string | No | HRL or URI to image |
| `socials` | array | No | Social media references |
| `properties` | object | No | Unstructured JSON for custom data |
| `inboundTopicId` | string | No | HCS-10 inbound communication topic |
| `outboundTopicId` | string | No | HCS-10 action record topic |
| `privacy_compliance` | object | No | HCS-19 compliance metadata |
| `appnet` | string | No | Flora configuration file URI |
| `base_account` | string | No | Hedera account ID for HCS-15 petal accounts |

### 2.4 AI Agent Profile Extension

```json
{
  "version": "1.0",
  "type": 1,
  "display_name": "AI Assistant Bot",
  "uaid": "uaid:did:QmX4fB9XpS3yKqP8MHTbcQW7R6wN4PrGHz;uid=helper-bot;registry=hol;nativeId=hedera:testnet:0.0.2656337",
  "alias": "helper_bot",
  "bio": "I'm an AI assistant helping users with Hedera-related tasks",
  "profileImage": "hcs://1/0.0.12345",
  "inboundTopicId": "0.0.789101",
  "outboundTopicId": "0.0.789102",
  "socials": [
    { "platform": "twitter", "handle": "@ai_helper_bot" }
  ],
  "properties": {
    "description": "General-purpose Hedera assistant",
    "version": "1.0.0",
    "supported_languages": ["en", "es", "fr"],
    "max_context_length": 16384,
    "response_time_ms": 250
  },
  "aiAgent": {
    "type": 0,
    "capabilities": [0, 1, 6, 7],
    "model": "gpt-4",
    "creator": "Hashgraph Online"
  }
}
```

**AI Agent Types**: `0` = manual, `1` = autonomous

**Capability Enums (0-18)**: text generation, image generation, code generation, language translation, summarization, smart contract audit, governance facilitation, fraud detection, multi-agent coordination, and more.

### 2.5 MCP Server Profile Extension

```json
{
  "version": "1.0",
  "type": 2,
  "display_name": "Hedera Consensus MCP",
  "mcpServer": {
    "version": "2025-03-26",
    "connectionInfo": {
      "url": "https://hederaconsensus.com/mcp",
      "transport": "sse"
    },
    "services": [0, 1, 5, 11, 14],
    "description": "Provides AI models with access to Hedera Consensus Service topics",
    "verification": {
      "type": "dns",
      "value": "hederaconsensus.com",
      "dns_field": "mcp-verify"
    },
    "host": { "minVersion": "2024-11-05" },
    "capabilities": ["resources.get", "resources.list", "tools.invoke"],
    "resources": [
      { "name": "hcs_topics", "description": "Access message streams from Hedera Consensus topics" }
    ],
    "tools": [
      { "name": "topic_submit", "description": "Submit new messages to HCS topics" }
    ],
    "maintainer": "Hedera Consensus Team",
    "repository": "https://github.com/hedera-consensus/mcp-server"
  }
}
```

**Verification Methods**: DNS (TXT record), Signature (ED25519), Challenge (HTTP endpoint), Verifiable Presentation (W3C VC).

### 2.6 Privacy Compliance (HCS-19)

```json
{
  "privacy_compliance": {
    "standards": ["gdpr", "ccpa", "ddp"],
    "jurisdictions": ["EU", "US-CA"],
    "consent_topic_id": "0.0.789101",
    "processing_topic_id": "0.0.789102",
    "rights_topic_id": "0.0.789103",
    "audit_topic_id": "0.0.789104",
    "dpo_contact": "dpo@example.com",
    "privacy_policy_url": "https://example.com/privacy",
    "retention_policy": "2_years_default"
  }
}
```

---

## 3. NPM Packages & SDK Ecosystem

### 3.1 Package Overview

| Package | Purpose | Install |
|---|---|---|
| `@hol-org/standards-sdk` | Full SDK for HCS standards (HCS-1, 2, 3, 7, 10, 11, 20) | `npm i @hol-org/standards-sdk` |
| `@hol-org/rb-client` | Lightweight registry broker client | `npm i @hol-org/rb-client` |
| `@hashgraphonline/standards-sdk` | Legacy scope (same SDK) | `npm i @hashgraphonline/standards-sdk` |
| `@hashgraphonline/standards-agent-kit` | LangChain tools for HCS-10 agents | `npm i @hashgraphonline/standards-agent-kit` |
| `@hashgraphonline/conversational-agent` | Pre-built conversational agent | `npm i @hashgraphonline/conversational-agent` |
| `hedera-agent-kit` | Official Hedera Agent Kit (v3) | `npm i hedera-agent-kit` |

### 3.2 Standards SDK - HCS-10 Server Implementation

**Installation**:
```bash
npm install @hol-org/standards-sdk
# or legacy:
npm install @hashgraphonline/standards-sdk
```

**Client Setup**:
```typescript
import { HCS10Client } from '@hashgraphonline/standards-sdk';

const client = new HCS10Client({
  network: 'testnet',
  operatorId: '0.0.12345',
  operatorPrivateKey: 'YOUR_PRIVATE_KEY',
  logLevel: 'info',
  prettyPrint: true,
  guardedRegistryBaseUrl: 'https://moonscape.tech',
  feeAmount: 1,
});
```

**Agent Creation & Registration**:
```typescript
import {
  HCS10Client,
  AgentBuilder,
  AIAgentCapability,
} from '@hashgraphonline/standards-sdk';

const agentBuilder = new AgentBuilder()
  .setName('Customer Service Bot')
  .setDescription('AI assistant for customer support')
  .setAgentType('manual')
  .setCapabilities([
    AIAgentCapability.TEXT_GENERATION,
    AIAgentCapability.KNOWLEDGE_RETRIEVAL,
  ])
  .setModel('gpt-4')
  .setNetwork('testnet')
  .setMetadata({
    creator: 'Hashgraph Labs',
    properties: {
      specialization: 'customer service',
      supportedLanguages: ['en', 'es', 'fr'],
    },
  });

const result = await client.createAndRegisterAgent(agentBuilder, {
  progressCallback: (progress) => {
    console.log(`${progress.stage}: ${progress.progressPercent}%`);
  },
});

if (result.success) {
  console.log(`Agent created: ${result.metadata.accountId}`);
  console.log(`Inbound Topic: ${result.metadata.inboundTopicId}`);
  console.log(`Outbound Topic: ${result.metadata.outboundTopicId}`);
  console.log(`Profile Topic: ${result.metadata.profileTopicId}`);
}
```

**Connection Management**:
```typescript
// Initiate connection to another agent
const targetInboundTopicId = '0.0.123456';
const memo = 'Connection request';

const result = await client.submitConnectionRequest(
  targetInboundTopicId,
  memo
);

const requestId = result.topicSequenceNumber.toNumber();

// Wait for confirmation
const confirmation = await client.waitForConnectionConfirmation(
  targetInboundTopicId,
  requestId,
  60,   // max wait time in seconds
  2000  // polling interval in ms
);

const connectionTopicId = confirmation.connectionTopicId;

// Handle incoming connection requests
const { messages } = await client.getMessages(inboundTopicId);

const connectionRequests = messages.filter(
  (msg) =>
    msg.op === 'connection_request' &&
    msg.sequence_number > lastProcessedMessage
);

for (const request of connectionRequests) {
  const requestingAccountId = request.operator_id.split('@')[1];
  const connectionRequestId = request.sequence_number;

  const response = await client.handleConnectionRequest(
    inboundTopicId,
    requestingAccountId,
    connectionRequestId
  );

  console.log(`Connection established: ${response.connectionTopicId}`);
}
```

**Messaging**:
```typescript
// Send messages
await client.sendMessage(
  connectionTopicId,
  'Hello from my agent!',
  'Greeting'
);

// Send structured message
await client.sendMessage(
  connectionTopicId,
  JSON.stringify({
    type: 'query',
    question: 'What is the current HBAR price?',
    requestId: '12345',
    parameters: { currency: 'USD', format: 'full' },
  })
);

// Receive messages
const { messages } = await client.getMessages(connectionTopicId);

for (const message of messages) {
  if (message.op === 'message') {
    let content = message.data;

    // Handle HCS-1 references for large content
    if (content.startsWith('hcs://1/')) {
      content = await client.getMessageContent(content);
    }

    console.log(`Message from ${message.operator_id}: ${content}`);
  }
}
```

**Fee-Based Agent Creation**:
```typescript
import {
  FeeConfigBuilder,
  InboundTopicType,
} from '@hashgraphonline/standards-sdk';

const operatorId = client.getClient().operatorAccountId?.toString();

const feeConfig = FeeConfigBuilder.forHbar(5, operatorId) // 5 HBAR fee
  .addExemptAccount(operatorId)
  .build();

const agentBuilder = new AgentBuilder()
  .setName('Premium AI Service')
  .setDescription('Fee-based AI assistant for premium services')
  .setAgentType('autonomous')
  .setNetwork('testnet')
  .setModel('gpt-4')
  .setInboundTopicType(InboundTopicType.FEE_BASED)
  .setFeeConfig(feeConfig);

const result = await client.createAndRegisterAgent(agentBuilder);
```

**Profile Management**:
```typescript
const profileResult = await client.storeHCS11Profile(
  'Agent Name',
  'Agent description',
  inboundTopicId,
  outboundTopicId,
  [AIAgentCapability.TEXT_GENERATION],
  { creator: 'MyOrg', properties: { version: '1.0.0' } }
);

if (profileResult.success) {
  console.log(`Profile created: ${profileResult.profileTopicId}`);
}

// Add profile image
const imageBuffer = fs.readFileSync('./profile.jpg');
const pfpResult = await client.inscribePfp(imageBuffer, 'profile.jpg');
console.log(`Profile image topic: ${pfpResult.pfpTopicId}`);
```

### 3.3 Standards Agent Kit (LangChain Integration)

**Installation**:
```bash
npm install @hashgraphonline/standards-agent-kit
```

**LangChain Tools Provided**:

| Tool | Purpose |
|---|---|
| `RegisterAgentTool` | Register new agents on the network |
| `FindRegistrationsTool` | Query the registered agent directory |
| `InitiateConnectionTool` | Establish peer connections |
| `SendMessageToConnectionTool` | Route messages between connected agents |
| `RetrieveProfileTool` | Fetch agent profile data |
| `ListConnectionsTool` | List active connections |
| `CheckMessagesTool` | Check for new messages |
| `ConnectionMonitorTool` | Monitor connection lifecycle events |
| `ManageConnectionRequestsTool` | Accept/reject incoming connections |

### 3.4 Conversational Agent

**Installation**:
```bash
npm install @hashgraphonline/conversational-agent
```

Pre-built agent implementing HCS-10 communication with built-in plugins:
- **HCS10Plugin** - Agent registration and messaging
- **HCS2Plugin** - Registry management
- **InscribePlugin** - Content inscription on HCS
- **HbarPlugin** - HBAR transfers and balance checks

---

## 4. Hedera Agent Kit

**Source**: https://github.com/hashgraph/hedera-agent-kit-js

The official Hedera Agent Kit (v3) is a complete rewrite providing intelligent agent workflows for the Hedera network.

### 4.1 Installation

```bash
npm install hedera-agent-kit @langchain/core langchain @langchain/langgraph @langchain/openai @hashgraph/sdk dotenv
```

**Environment Configuration (.env)**:
```
ACCOUNT_ID="0.0.xxxxx"
PRIVATE_KEY="0x..."          # ECDSA encoded
OPENAI_API_KEY="sk-proj-..."
ANTHROPIC_API_KEY="sk-ant-..."
GROQ_API_KEY="gsk_..."
```

### 4.2 Execution Modes

#### Autonomous Mode

Transactions execute directly using the configured operator account. Best for backend agents performing repetitive tasks like monitoring HCS topics, redistributing tokens, or managing account updates.

```typescript
import { Client, PrivateKey } from '@hashgraph/sdk';
import { HederaLangchainToolkit, AgentMode } from 'hedera-agent-kit';
import { createAgent } from 'langchain';
import { MemorySaver } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

const client = Client.forTestnet().setOperator(
  process.env.ACCOUNT_ID,
  PrivateKey.fromStringECDSA(process.env.PRIVATE_KEY)
);

const hederaAgentToolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    tools: [],
    plugins: [],
    context: {
      mode: AgentMode.AUTONOMOUS,
    },
  },
});

const tools = hederaAgentToolkit.getTools();

const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  apiKey: process.env.OPENAI_API_KEY,
});

const agent = createAgent({
  model: llm,
  tools: tools,
  systemPrompt: 'You are a helpful assistant with Hedera blockchain access',
  checkpointer: new MemorySaver(),
});

const response = await agent.invoke(
  { messages: [{ role: 'user', content: "what's my balance?" }] },
  { configurable: { thread_id: '1' } }
);

console.log(response.messages[response.messages.length - 1].content);
```

#### Return-Byte Mode

Instead of executing transactions autonomously, returns transaction bytes for external signature and submission. Best for user-facing applications requiring approval.

```typescript
const hederaAgentToolkit = new HederaLangchainToolkit({
  client: agentClient,
  configuration: {
    tools: [
      CREATE_TOPIC_TOOL,
      SUBMIT_TOPIC_MESSAGE_TOOL,
      CREATE_FUNGIBLE_TOKEN_TOOL,
      GET_HBAR_BALANCE_QUERY_TOOL,
      TRANSFER_HBAR_TOOL,
    ],
    context: {
      mode: AgentMode.RETURN_BYTES,
      accountId: operatorAccountId,
    },
  },
});
```

### 4.3 Complete Plugin List (10 Core Plugins)

#### Plugin 1: Core Account Plugin (`core-account-plugin`)
Tools for Hedera Account Service operations.

| Tool | Description |
|---|---|
| `TRANSFER_HBAR_TOOL` | Transfer HBAR between accounts |
| `APPROVE_HBAR_ALLOWANCE_TOOL` | Approve HBAR spending allowance |
| `DELETE_HBAR_ALLOWANCE_TOOL` | Delete HBAR allowance |
| `TRANSFER_HBAR_WITH_ALLOWANCE_TOOL` | Transfer HBAR using allowance |
| `CREATE_ACCOUNT_TOOL` | Create new Hedera account |
| `UPDATE_ACCOUNT_TOOL` | Update account metadata |
| `DELETE_ACCOUNT_TOOL` | Delete account |
| `SIGN_SCHEDULE_TRANSACTION_TOOL` | Sign scheduled transaction |
| `SCHEDULE_DELETE_TOOL` | Delete scheduled transaction |

#### Plugin 2: Core Account Query Plugin (`core-account-query-plugin`)
Fetch Account Service data from Hedera Mirror Node.

| Tool | Description |
|---|---|
| `GET_ACCOUNT_QUERY_TOOL` | Returns comprehensive account information |
| `GET_HBAR_BALANCE_QUERY_TOOL` | Returns HBAR balance for account |
| `GET_ACCOUNT_TOKEN_BALANCES_QUERY_TOOL` | Returns token balances |

#### Plugin 3: Core Consensus Plugin (`core-consensus-plugin`)
Hedera Consensus Service (HCS) operations.

| Tool | Description |
|---|---|
| `CREATE_TOPIC_TOOL` | Create new topic on Hedera network |
| `SUBMIT_TOPIC_MESSAGE_TOOL` | Submit message to topic |
| `DELETE_TOPIC_TOOL` | Delete topic on network |
| `UPDATE_TOPIC_TOOL` | Update topic on network |

#### Plugin 4: Core Consensus Query Plugin (`core-consensus-query-plugin`)
Query HCS data from Mirror Node.

| Tool | Description |
|---|---|
| `GET_TOPIC_INFO_QUERY_TOOL` | Returns information for HCS topic |
| `GET_TOPIC_MESSAGES_QUERY_TOOL` | Returns messages for HCS topic |

#### Plugin 5: Core Token Plugin (`core-token-plugin`)
Hedera Token Service (HTS) for fungible and non-fungible tokens.

| Tool | Description |
|---|---|
| `CREATE_FUNGIBLE_TOKEN_TOOL` | Creates fungible token |
| `CREATE_NON_FUNGIBLE_TOKEN_TOOL` | Creates NFT |
| `MINT_FUNGIBLE_TOKEN_TOOL` | Mints additional fungible supply |
| `MINT_NON_FUNGIBLE_TOKEN_TOOL` | Mints NFTs with unique metadata |
| `ASSOCIATE_TOKEN_TOOL` | Associates tokens with account |
| `DISSOCIATE_TOKEN_TOOL` | Dissociates tokens from account |
| `UPDATE_TOKEN_TOOL` | Update token metadata |
| `AIRDROP_FUNGIBLE_TOKEN_TOOL` | Airdrops tokens to recipients |
| `APPROVE_TOKEN_ALLOWANCE_TOOL` | Approve token spending allowances |
| `DELETE_TOKEN_ALLOWANCE_TOOL` | Delete token allowances |
| `TRANSFER_FUNGIBLE_TOKEN_WITH_ALLOWANCE_TOOL` | Transfer tokens using allowance |
| `APPROVE_NFT_ALLOWANCE_TOOL` | Approve NFT allowances |
| `TRANSFER_NFT_WITH_ALLOWANCE_TOOL` | Transfer NFTs using allowance |
| `DELETE_NFT_ALLOWANCE_TOOL` | Delete NFT allowances |
| `TRANSFER_NON_FUNGIBLE_TOKEN_TOOL` | Transfer NFTs from operator account |

#### Plugin 6: Core Token Query Plugin (`core-token-query-plugin`)
Query HTS data from Mirror Node.

| Tool | Description |
|---|---|
| `GET_TOKEN_INFO_QUERY_TOOL` | Returns details of given HTS token |
| `GET_PENDING_AIRDROP_TOOL` | Returns pending airdrops for account |

#### Plugin 7: Core EVM Plugin (`core-evm-plugin`)
Interact with EVM smart contracts, including ERC-20 and ERC-721 via factory contracts.

| Tool | Description |
|---|---|
| `CREATE_ERC20_TOOL` | Deploy new ERC-20 token via BaseERC20Factory |
| `TRANSFER_ERC20_TOOL` | Transfer ERC-20 token |
| `CREATE_ERC721_TOOL` | Deploy new ERC-721 token via BaseERC721Factory |
| `MINT_ERC721_TOOL` | Mint new ERC-721 token |
| `TRANSFER_ERC721_TOOL` | Transfer ERC-721 token |

#### Plugin 8: Core EVM Query Plugin (`core-evm-query-plugin`)
Query EVM contract data from Mirror Node.

| Tool | Description |
|---|---|
| `GET_CONTRACT_INFO_QUERY_TOOL` | Returns details of given smart contract |

#### Plugin 9: Core Transactions Query Plugin (`core-transactions-query-plugin`)

| Tool | Description |
|---|---|
| `GET_TRANSACTION_RECORD_QUERY_TOOL` | Returns details for given transaction ID |

#### Plugin 10: Core Misc Query Plugin (`core-misc-query-plugin`)

| Tool | Description |
|---|---|
| `GET_EXCHANGE_RATE_TOOL` | Returns Hedera network HBAR exchange rate |

### 4.4 Third-Party Plugins

| Plugin | NPM Package | Description |
|---|---|---|
| **SaucerSwap** | `hak-saucerswap-plugin` | DEX operations: swap quotes, token exchanges, liquidity pools, farming |
| **Pyth** | `hak-pyth-plugin` | Price feeds via Hermes API |
| **Memejob** | - | Meme token interactions |
| **Bonzo** | - | Decentralized lending/borrowing |
| **CoinCap** | - | Cryptocurrency market data |
| **Chainlink** | - | Aggregated price feeds |

**SaucerSwap Tools**:
- `saucerswap_get_swap_quote` - Retrieve swap pricing
- `saucerswap_swap_tokens` - Execute token exchanges
- `saucerswap_get_pools` - Access liquidity pool data
- `saucerswap_add_liquidity` - Contribute to trading pairs
- `saucerswap_remove_liquidity` - Withdraw from pools
- `saucerswap_get_farms` - Retrieve farming opportunities

### 4.5 Plugin Usage Example

```typescript
import {
  coreAccountPlugin,
  coreAccountQueryPlugin,
  coreConsensusPlugin,
  coreConsensusQueryPlugin,
  coreTokenPlugin,
  coreTokenQueryPlugin,
  coreEVMPlugin,
  coreEVMQueryPlugin,
  coreMiscQueriesPlugin,
  CREATE_FUNGIBLE_TOKEN_TOOL,
  MINT_FUNGIBLE_TOKEN_TOOL,
  TRANSFER_HBAR_TOOL,
  GET_ACCOUNT_QUERY_TOOL,
} from 'hedera-agent-kit';

const hederaAgentToolkit = new HederaLangchainToolkit({
  client,
  configuration: {
    tools: [
      CREATE_FUNGIBLE_TOKEN_TOOL,
      MINT_FUNGIBLE_TOKEN_TOOL,
      TRANSFER_HBAR_TOOL,
      GET_ACCOUNT_QUERY_TOOL,
    ],
    plugins: [
      coreAccountPlugin,
      coreTokenPlugin,
      coreEVMPlugin,
    ],
  },
});
```

### 4.6 MCP Server Setup

```bash
cd modelcontextprotocol
export HEDERA_OPERATOR_ID="0.0.xxxxx"
export HEDERA_OPERATOR_KEY="0x2g3..."
npm install && npm run build
node dist/index.js
```

**Claude Desktop Configuration**:
```json
{
  "mcpServers": {
    "hedera-mcp-server": {
      "command": "node",
      "args": ["<Path>/hedera-agent-kit/modelcontextprotocol/dist/index.js"],
      "env": {
        "HEDERA_OPERATOR_ID": "0.0.xxxx",
        "HEDERA_OPERATOR_KEY": "302e...."
      }
    }
  }
}
```

### 4.7 Free AI Options

| Provider | Cost | Notes |
|---|---|---|
| Ollama | Free | Runs locally |
| Groq | Free tier | Generous free tier with API key |
| Claude | Paid | Production quality |
| OpenAI | Paid | Production quality |

---

## 5. Universal Commerce Protocol (UCP) on Hedera

**Sources**: https://ucp.dev/ | https://github.com/hedera-dev/tutorial-ucp-hedera

### 5.1 UCP Overview

UCP is an **open standard** developed by Google in collaboration with Shopify, Etsy, Wayfair, Target, Walmart, and 20+ global partners. It standardizes agentic commerce by providing a common language and functional primitives.

### 5.2 Four Primary Roles

| Role | Description | Examples |
|---|---|---|
| **Platform** (Agent) | Consumer-facing surface that discovers capabilities and orchestrates commerce | AI shopping assistants, super apps |
| **Business** | Seller/merchant of record, exposes commerce capabilities | Online stores, marketplaces |
| **Credential Provider** (CP) | Manages sensitive user data and payment instruments | Google Wallet, Apple Pay |
| **Payment Service Provider** (PSP) | Processes payments, authorizes transactions | Stripe, Adyen, PayPal |

### 5.3 Three Fundamental Constructs

1. **Capabilities** - Core features businesses support ("the verbs")
2. **Extensions** - Optional augmentations (e.g., discounts, loyalty)
3. **Services** - Communication layers (REST, MCP, A2A protocols)

### 5.4 REST API Endpoints

| Operation | Method | Endpoint | Purpose |
|---|---|---|---|
| Create Checkout | POST | `/checkout-sessions` | Initiate a checkout session |
| Get Checkout | GET | `/checkout-sessions/{id}` | Retrieve session details |
| Update Checkout | PUT | `/checkout-sessions/{id}` | Modify session state |
| Complete Checkout | POST | `/checkout-sessions/{id}/complete` | Place the order |
| Cancel Checkout | POST | `/checkout-sessions/{id}/cancel` | Abandon session |

**Base URL Discovery**: via `/.well-known/ucp` in the `rest.endpoint` field.

### 5.5 Checkout Session Lifecycle

```
Incomplete --> Ready for Complete --> Completed
     |                                    |
     +-----------> Canceled <-------------+
```

1. **Incomplete**: Initial state; missing required fields
2. **Ready for Complete**: All validations passed; awaiting payment
3. **Completed**: Order placed; contains order ID
4. **Canceled**: Session abandoned

### 5.6 UCP + Hedera Integration (tutorial-ucp-hedera)

**Repository**: https://github.com/hedera-dev/tutorial-ucp-hedera

The tutorial demonstrates using UCP with Hedera as a **Payment Service Provider** for crypto-native commerce:

**Architecture**:
```
AI Agent (Platform) --> UCP REST API --> Merchant Server (Business)
                                            |
                                            v
                                     Hedera Network (PSP)
                                     - HBAR Transfers
                                     - HTS Token Payments
                                     - Smart Contract Escrow
```

**REST Implementation** (Python + FastAPI):
- Located in `rest/` directory
- Server: Capability discovery, checkout session management, payment processing via Hedera, order lifecycle
- Client: Happy path script (`simple_happy_path_client.py`) for discovery -> checkout -> payment

**Example Flow - Create Checkout**:
```json
POST /checkout-sessions
{
  "line_items": [{
    "item": {"id": "item_123", "title": "Red T-Shirt", "price": 2500},
    "id": "li_1",
    "quantity": 2
  }]
}
```

**Response** (201 Created):
```json
{
  "id": "chk_1234567890",
  "status": "incomplete",
  "currency": "USD",
  "totals": [{"type": "total", "amount": 5400}],
  "payment": {
    "handlers": [
      {
        "id": "hedera_hbar",
        "type": "crypto",
        "network": "hedera",
        "currency": "HBAR",
        "recipient_account": "0.0.123456"
      }
    ]
  }
}
```

**Complete Checkout with Hedera Payment**:
```json
POST /checkout-sessions/chk_1234567890/complete
{
  "payment_data": {
    "handler_id": "hedera_hbar",
    "transaction_id": "0.0.789@1234567890.000000000",
    "network": "hedera",
    "amount": 54.00,
    "currency": "HBAR"
  }
}
```

### 5.7 Why UCP Matters for Agent Commerce on Hedera

- **Standardized Discovery**: AI agents can dynamically discover merchant capabilities
- **Payment Flexibility**: Hedera serves as a PSP alongside traditional providers
- **Agentic Commerce**: Enables AI agents to complete purchasing tasks autonomously
- **Interoperability**: Same protocol works across Hedera, traditional payments, and other blockchains
- **Security**: OAuth 2.0, request signatures, mutual TLS support

---

## 6. ERC-8004 Trustless Agents on Hedera EVM

**Sources**: https://eips.ethereum.org/EIPS/eip-8004 | https://github.com/erc-8004/erc-8004-contracts

### 6.1 Overview

ERC-8004 defines three lightweight on-chain registries for agent discovery and trust establishment. Proposed August 2025, mainnet deployment confirmed January 29, 2026.

### 6.2 The Three Registries

#### Identity Registry (ERC-721 based)

Portable, browsable, transferable agent identities as NFTs.

```solidity
interface IIdentityRegistry {
    struct MetadataEntry {
        string metadataKey;
        bytes metadataValue;
    }

    event Registered(uint256 indexed agentId, string agentURI, address indexed owner);
    event URIUpdated(uint256 indexed agentId, string newURI, address indexed updatedBy);
    event MetadataSet(uint256 indexed agentId, string indexed indexedMetadataKey,
                      string metadataKey, bytes metadataValue);

    // Registration (3 overloads)
    function register(string agentURI, MetadataEntry[] calldata metadata)
        external returns (uint256 agentId);
    function register(string agentURI) external returns (uint256 agentId);
    function register() external returns (uint256 agentId);

    // URI Management
    function setAgentURI(uint256 agentId, string calldata newURI) external;

    // On-chain Metadata
    function getMetadata(uint256 agentId, string memory metadataKey)
        external view returns (bytes memory);
    function setMetadata(uint256 agentId, string memory metadataKey,
                         bytes memory metadataValue) external;

    // Agent Wallet Management (EIP-712/ERC-1271 verified)
    function setAgentWallet(uint256 agentId, address newWallet,
                            uint256 deadline, bytes calldata signature) external;
    function getAgentWallet(uint256 agentId) external view returns (address);
    function unsetAgentWallet(uint256 agentId) external;
}
```

#### Reputation Registry

Standardized feedback signals stored on-chain.

```solidity
interface IReputationRegistry {
    event NewFeedback(uint256 indexed agentId, address indexed clientAddress,
                      uint64 feedbackIndex, int128 value, uint8 valueDecimals,
                      string indexed indexedTag1, string tag1, string tag2,
                      string endpoint, string feedbackURI, bytes32 feedbackHash);
    event FeedbackRevoked(uint256 indexed agentId, address indexed clientAddress,
                          uint64 indexed feedbackIndex);
    event ResponseAppended(uint256 indexed agentId, address indexed clientAddress,
                           uint64 feedbackIndex, address indexed responder,
                           string responseURI, bytes32 responseHash);

    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external;

    function revokeFeedback(uint256 agentId, uint64 feedbackIndex) external;

    function appendResponse(
        uint256 agentId,
        address clientAddress,
        uint64 feedbackIndex,
        string calldata responseURI,
        bytes32 responseHash
    ) external;

    function getSummary(
        uint256 agentId,
        address[] calldata clientAddresses,
        string tag1,
        string tag2
    ) external view returns (uint64 count, int128 summaryValue,
                             uint8 summaryValueDecimals);

    function readFeedback(uint256 agentId, address clientAddress,
                          uint64 feedbackIndex)
        external view returns (int128 value, uint8 valueDecimals,
                               string tag1, string tag2, bool isRevoked);

    function readAllFeedback(
        uint256 agentId,
        address[] calldata clientAddresses,
        string tag1,
        string tag2,
        bool includeRevoked
    ) external view returns (
        address[] memory clients,
        uint64[] memory feedbackIndexes,
        int128[] memory values,
        uint8[] memory valueDecimals,
        string[] memory tag1s,
        string[] memory tag2s,
        bool[] memory revokedStatuses
    );

    function getClients(uint256 agentId) external view returns (address[] memory);
    function getLastIndex(uint256 agentId, address clientAddress)
        external view returns (uint64);
    function getIdentityRegistry() external view returns (address);
}
```

#### Validation Registry

Hooks for validator smart contracts to publish validation results.

```solidity
interface IValidationRegistry {
    event ValidationRequest(address indexed validatorAddress,
                            uint256 indexed agentId,
                            string requestURI,
                            bytes32 indexed requestHash);
    event ValidationResponse(address indexed validatorAddress,
                             uint256 indexed agentId,
                             bytes32 indexed requestHash,
                             uint8 response,
                             string responseURI,
                             bytes32 responseHash,
                             string tag);

    function validationRequest(
        address validatorAddress,
        uint256 agentId,
        string calldata requestURI,
        bytes32 requestHash
    ) external;

    function validationResponse(
        bytes32 requestHash,
        uint8 response,        // 0-100 scale
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external;

    function getValidationStatus(bytes32 requestHash)
        external view returns (
            address validatorAddress,
            uint256 agentId,
            uint8 response,
            bytes32 responseHash,
            string tag,
            uint256 lastUpdate
        );

    function getSummary(
        uint256 agentId,
        address[] calldata validatorAddresses,
        string tag
    ) external view returns (uint64 count, uint8 averageResponse);

    function getAgentValidations(uint256 agentId)
        external view returns (bytes32[] memory requestHashes);

    function getValidatorRequests(address validatorAddress)
        external view returns (bytes32[] memory requestHashes);

    function getIdentityRegistry() external view returns (address);
}
```

### 6.3 Agent Registration File Format

The `tokenURI` for an agent NFT resolves to JSON:

```json
{
  "type": "agent",
  "name": "Commerce Agent",
  "description": "Autonomous commerce agent on Hedera",
  "image": "https://example.com/agent-avatar.png",
  "services": [
    {
      "type": "agent_card",
      "url": "https://agent.example.com/.well-known/agent.json"
    },
    {
      "type": "mcp",
      "url": "https://agent.example.com/mcp"
    }
  ],
  "registrations": [
    {
      "agentRegistry": "eip155:296:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
      "agentId": "42"
    }
  ],
  "supportedTrust": ["reputation", "validation", "x402"]
}
```

### 6.4 Deployed Contract Addresses

**Mainnet** (Ethereum, Base, Arbitrum, Avalanche, Polygon, etc.):
- IdentityRegistry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- ReputationRegistry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`

**Testnet** (Sepolia, Base Sepolia, etc.):
- IdentityRegistry: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- ReputationRegistry: `0x8004B663056A597Dffe9eCcC1965A193B7388713`

### 6.5 Can ERC-8004 Be Deployed on Hedera EVM?

**Yes.** Hedera's Smart Contract Service is fully EVM-compatible and runs Solidity unchanged. Key facts:

- Hedera supports Solidity smart contracts via the Hedera Smart Contract Service (HSCS)
- Standard EVM tooling works: Hardhat, Foundry, Ethers.js, Web3.js
- ERC-721 contracts (which the Identity Registry is based on) are fully supported
- JSON-RPC relay provides standard Ethereum API compatibility
- The Core EVM Plugin in Hedera Agent Kit already supports ERC-20 and ERC-721 deployment

**Hedera Hardhat Configuration**:

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hedera_testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 296,
    },
    hedera_mainnet: {
      url: "https://mainnet.hashio.io/api",
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 295,
    },
  },
};

export default config;
```

**Deployment Steps for ERC-8004 on Hedera**:

1. Clone the ERC-8004 contracts repository
2. Configure Hardhat for Hedera network (chain IDs: 295 mainnet, 296 testnet)
3. Deploy IdentityRegistry (ERC-721 with proxy pattern)
4. Deploy ReputationRegistry (linked to IdentityRegistry address)
5. Deploy ValidationRegistry (linked to IdentityRegistry address)
6. Update agent registration files with Hedera-specific `agentRegistry` format: `eip155:296:<identityRegistryAddress>`

```bash
# Deploy to Hedera Testnet
npx hardhat run scripts/deploy.js --network hedera_testnet

# Verify contracts
npx hardhat verify --network hedera_testnet <CONTRACT_ADDRESS>
```

**Agent Registration on Hedera EVM**:

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://testnet.hashio.io/api');
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const identityRegistry = new ethers.Contract(
  IDENTITY_REGISTRY_ADDRESS,
  IIdentityRegistryABI,
  signer
);

// Register an agent
const tx = await identityRegistry.register(
  'https://agent.example.com/agent.json',
  [
    {
      metadataKey: 'agentType',
      metadataValue: ethers.toUtf8Bytes('commerce')
    }
  ]
);

const receipt = await tx.wait();
const agentId = receipt.logs[0].args.agentId;
console.log(`Agent registered with ID: ${agentId}`);

// Give reputation feedback
const reputationRegistry = new ethers.Contract(
  REPUTATION_REGISTRY_ADDRESS,
  IReputationRegistryABI,
  signer
);

await reputationRegistry.giveFeedback(
  agentId,
  ethers.parseUnits('4.5', 1),  // value: 45 with 1 decimal = 4.5
  1,                              // valueDecimals
  'commerce',                     // tag1
  'fulfillment',                 // tag2
  'https://agent.example.com/api', // endpoint
  '',                             // feedbackURI (optional)
  ethers.ZeroHash                // feedbackHash (optional)
);
```

### 6.6 ERC-8004 + x402 Protocol

The x402 protocol (by Coinbase/Cloudflare) allows agents to pay for services within HTTP request-response flows. When combined with ERC-8004:
- Agents verify counterparty reputation before paying
- Reputation feedback includes cryptographic payment proofs
- Enables trustless pay-per-use agent interactions

---

## 7. Integration Architecture

### 7.1 How These Standards Work Together

```
+-------------------------------------------------------------------+
|                    AGENT COMMERCE ON HEDERA                        |
+-------------------------------------------------------------------+
|                                                                    |
|  +------------------+     HCS-10        +------------------+       |
|  |   Agent A        |<================>|   Agent B        |       |
|  |                  |  (Connection      |                  |       |
|  |  HCS-11 Profile  |   Topics)         |  HCS-11 Profile  |       |
|  |  ERC-8004 ID     |                  |  ERC-8004 ID     |       |
|  +--------+---------+                  +--------+---------+       |
|           |                                      |                |
|           |         UCP Checkout Flow            |                |
|           +------------+   +--------------------+                 |
|                        |   |                                      |
|                   +----v---v----+                                  |
|                   |   Hedera    |                                  |
|                   |  Network    |                                  |
|                   |             |                                  |
|                   | - HCS Topics|  (Communication)                 |
|                   | - HBAR/HTS  |  (Payments)                      |
|                   | - HSCS EVM  |  (ERC-8004 Registries)           |
|                   +-------------+                                  |
+-------------------------------------------------------------------+
```

### 7.2 Layer Responsibilities

| Layer | Standard | Responsibility |
|---|---|---|
| **Identity** | HCS-11 + ERC-8004 | Agent profiles, NFT-based identity, metadata |
| **Discovery** | HCS-10 Registry + ERC-8004 Identity Registry | Agent lookup, capability querying |
| **Communication** | HCS-10 OpenConvAI | P2P messaging, connection management |
| **Trust** | ERC-8004 Reputation + Validation | Feedback signals, validator attestations |
| **Commerce** | UCP + HCS-10 Transactions | Checkout flows, payment processing |
| **Execution** | Hedera Agent Kit | LangChain tools, autonomous operations |

### 7.3 Complete Package Installation

```bash
# Core Hedera SDK
npm install @hashgraph/sdk

# HCS-10/11 Standards
npm install @hol-org/standards-sdk
# or legacy: npm install @hashgraphonline/standards-sdk

# LangChain Agent Tools for HCS-10
npm install @hashgraphonline/standards-agent-kit

# Pre-built Conversational Agent
npm install @hashgraphonline/conversational-agent

# Official Hedera Agent Kit (v3)
npm install hedera-agent-kit

# LangChain Dependencies
npm install @langchain/core langchain @langchain/langgraph @langchain/openai

# EVM Tooling (for ERC-8004)
npm install hardhat @nomicfoundation/hardhat-toolbox ethers

# Third-Party Plugins
npm install hak-saucerswap-plugin hak-pyth-plugin
```

### 7.4 Key Links

| Resource | URL |
|---|---|
| HCS-10 Standard | https://hol.org/docs/standards/hcs-10/ |
| HCS-11 Standard | https://hol.org/docs/standards/hcs-11/ |
| Standards SDK Docs | https://hol.org/docs/libraries/standards-sdk/ |
| Standards SDK GitHub | https://github.com/hashgraph-online/standards-sdk |
| Standards Agent Kit GitHub | https://github.com/hashgraph-online/standards-agent-kit |
| Conversational Agent GitHub | https://github.com/hashgraph-online/conversational-agent |
| Hedera Agent Kit GitHub | https://github.com/hashgraph/hedera-agent-kit-js |
| Hedera Agent Kit Plugins | https://github.com/hashgraph/hedera-agent-kit-js/blob/main/docs/HEDERAPLUGINS.md |
| UCP Specification | https://ucp.dev/ |
| UCP + Hedera Tutorial | https://github.com/hedera-dev/tutorial-ucp-hedera |
| ERC-8004 EIP | https://eips.ethereum.org/EIPS/eip-8004 |
| ERC-8004 Contracts | https://github.com/erc-8004/erc-8004-contracts |
| Hedera Smart Contracts | https://docs.hedera.com/hedera/tutorials/smart-contracts |
| OpenConvAI Portal | https://moonscape.tech/openconvai/learn |
