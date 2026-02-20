/**
 * Deploy SubscriptionManager to Hedera Testnet
 *
 * Usage:
 *   HEDERA_PRIVATE_KEY=0x... HEDERA_ACCOUNT_ID=0.0.4729347 npx tsx deploy-hedera-subscription.ts
 *
 * Constructor arg: Hedera AgentRegistry at 0xf53D927D6D19c7A67cF5126aA7EED0b4c0185850
 */

import {
  Client as HederaClient,
  PrivateKey as HederaPrivateKey,
  AccountId,
  ContractCreateFlow,
} from "@hashgraph/sdk";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Load env
  const pk = process.env.HEDERA_PRIVATE_KEY;
  if (!pk) throw new Error("HEDERA_PRIVATE_KEY not set");

  const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
  if (!accountIdStr) throw new Error("HEDERA_ACCOUNT_ID not set");

  const privateKey = HederaPrivateKey.fromStringECDSA(pk.replace("0x", ""));
  const accountId = AccountId.fromString(accountIdStr);

  const client = HederaClient.forTestnet();
  client.setOperator(accountId, privateKey);

  // Load compiled contract
  const artifactPath = path.resolve(
    __dirname,
    "../contracts/out/SubscriptionManager.sol/SubscriptionManager.json"
  );
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Compiled contract not found at ${artifactPath}`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const bytecode = artifact.bytecode?.object;
  if (!bytecode) {
    throw new Error("No bytecode found in artifact");
  }

  // Constructor arg: address _agentRegistry
  // Hedera AgentRegistry: 0xf53D927D6D19c7A67cF5126aA7EED0b4c0185850
  const agentRegistryAddress = "0xf53D927D6D19c7A67cF5126aA7EED0b4c0185850";

  // ABI-encode the constructor arg (address padded to 32 bytes)
  const encodedArg = agentRegistryAddress
    .replace("0x", "")
    .toLowerCase()
    .padStart(64, "0");

  const fullBytecode = bytecode + encodedArg;

  console.log("Deploying SubscriptionManager to Hedera Testnet...");
  console.log(`  Operator: ${accountIdStr}`);
  console.log(`  AgentRegistry: ${agentRegistryAddress}`);
  console.log(`  Bytecode length: ${bytecode.length} chars`);
  console.log(`  Full bytecode (with constructor): ${fullBytecode.length} chars`);

  // Deploy using ContractCreateFlow (handles file upload + contract create in one step)
  const contractTx = new ContractCreateFlow()
    .setBytecode(fullBytecode)
    .setGas(4_000_000)
    .setAdminKey(privateKey);

  const txResponse = await contractTx.execute(client);
  const receipt = await txResponse.getReceipt(client);

  const contractId = receipt.contractId;
  if (!contractId) {
    throw new Error("Contract deployment failed - no contract ID in receipt");
  }

  // Get the EVM address from mirror node
  const contractIdStr = contractId.toString();
  console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
  console.log(`  Contract ID: ${contractIdStr}`);
  console.log(`  Transaction ID: ${txResponse.transactionId?.toString()}`);

  // Look up EVM address via mirror node
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((r) => setTimeout(r, 3000));
      const resp = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/contracts/${contractIdStr}`
      );
      const data = (await resp.json()) as { evm_address?: string };
      if (data.evm_address) {
        console.log(`  EVM Address: 0x${data.evm_address}`);
        console.log(
          `  HashScan: https://hashscan.io/testnet/contract/${contractIdStr}`
        );
        break;
      }
    } catch {
      if (i === maxRetries - 1) {
        console.log(
          "  (Mirror node lookup timed out - check HashScan manually)"
        );
      }
    }
  }

  console.log("\nDone! Add this address to HEDERA_CONTRACTS in mcp-server/src/index.ts");
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
