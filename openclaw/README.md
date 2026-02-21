# OpenClaw Agent Architecture for AgentMarket

## Agent Types

AgentMarket uses three specialized AI agents orchestrated by OpenClaw, each with a distinct role on the ADI Chain marketplace:

### Commerce Agent (`commerce`)
Discovers, evaluates, and hires AI agents listed on the AgentMarket registry. It handles the full agent-to-agent commerce lifecycle: browsing available agents, comparing ratings and pricing, negotiating terms, and executing on-chain payments via the PaymentRouter contract. This is the primary agent for demonstrating autonomous AI hiring.

### Merchant Agent (`merchant`)
Manages merchant-side operations on AgentMarket. It registers new merchants, processes customer checkouts, tracks order fulfillment, and handles revenue withdrawals from the MerchantVault contract. All transactions use DDSC (Dirham Stablecoin) as the payment currency.

### Analytics Agent (`analytics`)
A read-only intelligence agent that monitors marketplace activity across all on-chain contracts (AgentRegistry, PaymentRouter, MerchantVault). It analyzes agent performance metrics, tracks payment volumes, identifies market trends, and provides data-driven insights. It does not hold a private key for signing transactions.

## MCP Server Integration

Each agent connects to the ADI Chain smart contracts through a shared MCP (Model Context Protocol) server located at `/mcp-server`. The MCP server exposes on-chain operations as tools that agents can call:

- **AgentRegistry tools**register agents, query agent profiles, read ratings
- **PaymentRouter tools**create payments, check payment status, route funds
- **MerchantVault tools**register merchants, process checkouts, withdraw revenue
- **DDSC tools**check balances, approve token spending

The MCP server is mounted read-only into the OpenClaw container and started as a subprocess for each agent that needs it. Agent-specific private keys are injected via environment variables so each agent signs transactions with its own wallet.

## Skills

Skills are reusable instruction sets stored in `/openclaw/skills/` that teach agents autonomous behavior patterns:

| Skill Directory | Purpose |
|---|---|
| `agentmarket-commerce` | Strategies for discovering and hiring agents |
| `agentmarket-merchant` | Workflows for merchant registration and checkout |
| `agentmarket-defi` | DeFi-related operations and token management |
| `agentmarket-autonomous` | Autonomous decision-making and task execution |

Skills are loaded at agent startup via the `skills.load.extraDirs` configuration. All agents share the same skill library but use different subsets based on their role.

## Running the Full Stack

### Prerequisites

- Docker and Docker Compose installed
- An Anthropic API key
- Private keys for the Commerce and Merchant agent wallets
- A Paymaster signer key for gasless transactions

### Steps

1. Copy the environment file and fill in your keys:

```bash
cp .env.example .env
# Edit .env with your actual keys
```

2. Start all services:

```bash
docker compose up -d
```

3. Access the services:

- **Frontend**: http://localhost:3000
- **OpenClaw Gateway**: http://localhost:18789

4. Interact with agents through the OpenClaw gateway API or the webchat channel.

### Stopping

```bash
docker compose down
```

To also remove persistent agent data:

```bash
docker compose down -v
```
