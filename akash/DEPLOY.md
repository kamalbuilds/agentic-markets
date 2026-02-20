# Deploy AgentMarket OpenClaw Agents on Akash

## Quick Deploy via Akash Console (Recommended)

### Step 1: Go to Akash Console
Open https://console.akash.network/templates/akash-network-awesome-akash-openclaw

### Step 2: Click "Deploy"
- Connect your Keplr wallet (needs AKT tokens for ~$5-10/month)
- The template will pre-fill the SDL

### Step 3: Update Environment Variables
In the deployment config, set:
```
SETUP_PASSWORD=<your-strong-password>
ANTHROPIC_API_KEY=<your-anthropic-key>
```

### Step 4: Deploy and Wait
- Select a provider and accept a bid
- Wait for deployment to spin up (~2-3 minutes)
- You'll get a URL like `https://xxxxx.provider.akash.network`

### Step 5: Access Setup UI
- Open the deployment URL in your browser
- Enter your SETUP_PASSWORD
- You'll see the OpenClaw setup interface

### Step 6: Configure AgentMarket
In the OpenClaw setup UI:

1. **Upload config**: Copy the contents of `openclaw/openclaw.json` into the config editor
2. **Set agent keys**: Generate two wallets for the Commerce and Merchant agents:
   ```bash
   # Generate agent wallets
   cast wallet new  # Commerce Agent
   cast wallet new  # Merchant Agent
   ```
3. **Fund agent wallets**: Send ADI testnet tokens to each agent wallet:
   ```bash
   # From deployer wallet
   cast send <COMMERCE_AGENT_ADDRESS> --value 0.05ether --rpc-url https://rpc.ab.testnet.adifoundation.ai/ --private-key <DEPLOYER_KEY>
   cast send <MERCHANT_AGENT_ADDRESS> --value 0.05ether --rpc-url https://rpc.ab.testnet.adifoundation.ai/ --private-key <DEPLOYER_KEY>
   ```

### Step 7: Install Skills
Upload the 4 skill files from `openclaw/skills/` into the OpenClaw skills directory via the setup UI.

### Step 8: Start Agents
The agents will start automatically and begin:
- **Commerce Agent**: Discovering and hiring agents on-chain
- **Merchant Agent**: Managing merchant operations
- **Analytics Agent**: Monitoring marketplace metrics

## Contract Addresses (ADI Testnet 99999)
```
AgentRegistry:  0x24fF5f6637A83CA7CA7B72b3Ad55275D669Ab7da
PaymentRouter:  0x13e935CF88Fd5a967B621aDf0b331361E8aF76f3
MerchantVault:  0x809039A3A6791bb734841E1B14405FF521BC6ddb
ADIPaymaster:   0x804911e28D000695b6DD6955EEbF175EbB628A16
MockDDSC:       0x66bfba26d31e008dF0a6D40333e01bd1213CB109
```

## Alternative: Custom Docker Image

If you want to pre-bundle the MCP server and skills:

```bash
cd /Users/kamal/Desktop/denver
docker build -f akash/Dockerfile -t agentmarket-openclaw .
docker tag agentmarket-openclaw <your-registry>/agentmarket-openclaw:latest
docker push <your-registry>/agentmarket-openclaw:latest
```

Then update `akash/deploy.yaml` to use your custom image.

## Alternative: Local Docker (for testing)

```bash
docker run -d \
  -p 8080:8080 \
  -e SETUP_PASSWORD=test123 \
  -e ANTHROPIC_API_KEY=<your-key> \
  -v $(pwd)/openclaw/openclaw.json:/data/.openclaw/openclaw.json \
  -v $(pwd)/openclaw/skills:/data/skills \
  -v $(pwd)/mcp-server:/app/mcp-server \
  ghcr.io/zjuuu/openclaw-docker:openclaw-v2026.2.12

# Then open http://localhost:8080
```
