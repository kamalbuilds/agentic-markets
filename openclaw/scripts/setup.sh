#!/bin/bash
set -e

echo "🤖 AgentMarket OpenClaw Setup"
echo "=============================="

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ npx is required (comes with Node.js)"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Install MCP server dependencies
echo "📦 Installing MCP server dependencies..."
cd "$ROOT_DIR/../mcp-server"
npm install --production

# Verify environment
echo ""
echo "🔑 Checking environment variables..."
if [ -z "$AGENT_PRIVATE_KEY" ]; then
  echo "⚠️  AGENT_PRIVATE_KEY not set. Export it before running agents:"
  echo "   export AGENT_PRIVATE_KEY=0x..."
else
  echo "✅ AGENT_PRIVATE_KEY is set"
fi

if [ -z "$ADI_RPC_URL" ]; then
  export ADI_RPC_URL="https://rpc.ab.testnet.adifoundation.ai/"
  echo "ℹ️  ADI_RPC_URL defaulting to testnet: $ADI_RPC_URL"
else
  echo "✅ ADI_RPC_URL is set: $ADI_RPC_URL"
fi

# Copy skills to OpenClaw managed directory
OPENCLAW_SKILLS="$HOME/.openclaw/skills"
if [ -d "$HOME/.openclaw" ]; then
  echo ""
  echo "📂 Installing skills to $OPENCLAW_SKILLS..."
  mkdir -p "$OPENCLAW_SKILLS"

  for skill in agentmarket-commerce agentmarket-merchant agentmarket-defi agentmarket-autonomous; do
    if [ -d "$ROOT_DIR/skills/$skill" ]; then
      cp -r "$ROOT_DIR/skills/$skill" "$OPENCLAW_SKILLS/"
      echo "  ✅ Installed $skill"
    fi
  done
else
  echo ""
  echo "ℹ️  OpenClaw not detected at ~/.openclaw"
  echo "   Skills are available at: $ROOT_DIR/skills/"
  echo "   Copy them manually or use extraDirs in openclaw.json"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Deployed contracts on ADI Testnet (Chain 99999):"
echo "  AgentRegistry:  0x24fF5f6637A83CA7CA7B72b3Ad55275D669Ab7da"
echo "  PaymentRouter:  0x13e935CF88Fd5a967B621aDf0b331361E8aF76f3"
echo "  MerchantVault:  0x809039A3A6791bb734841E1B14405FF521BC6ddb"
echo "  ADIPaymaster:   0x804911e28D000695b6DD6955EEbF175EbB628A16"
echo "  MockDDSC:       0x66bfba26d31e008dF0a6D40333e01bd1213CB109"
echo ""
echo "To run OpenClaw agents:"
echo "  docker compose up"
echo ""
echo "To test MCP server manually:"
echo "  cd $ROOT_DIR/../mcp-server && npx tsx src/index.ts"
