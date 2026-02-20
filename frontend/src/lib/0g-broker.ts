import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { ethers } from "ethers";

// ============================================================================
// 0G Compute Network - Shared Broker Singleton
// Lazy initialization, shared across inference and decisions routes
// Network: 0G Galileo Testnet (Chain ID 16602)
// ============================================================================

const OG_GALILEO_RPC = "https://evmrpc-testnet.0g.ai";

let brokerInstance: Awaited<ReturnType<typeof createZGComputeNetworkBroker>> | null = null;
let brokerInitPromise: Promise<Awaited<ReturnType<typeof createZGComputeNetworkBroker>>> | null = null;

/**
 * Returns a lazy singleton 0G Compute Network broker.
 * The broker is initialized once and reused across all requests.
 * Uses the 0G Galileo Testnet (chain ID 16602).
 */
export async function getOGBroker() {
  if (brokerInstance) return brokerInstance;

  // Prevent concurrent initialization
  if (brokerInitPromise) return brokerInitPromise;

  brokerInitPromise = (async () => {
    const privateKey = process.env.OG_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error(
        "OG_PRIVATE_KEY environment variable is not set. " +
        "Please add it to .env.local with a funded 0G Galileo testnet wallet private key."
      );
    }

    const provider = new ethers.JsonRpcProvider(OG_GALILEO_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("[0G Broker] Initializing broker on Galileo testnet...");
    console.log("[0G Broker] Wallet address:", wallet.address);

    const broker = await createZGComputeNetworkBroker(wallet);

    console.log("[0G Broker] Broker initialized successfully");
    brokerInstance = broker;
    return broker;
  })();

  try {
    const result = await brokerInitPromise;
    return result;
  } catch (err) {
    // Reset so next call retries
    brokerInitPromise = null;
    brokerInstance = null;
    throw err;
  }
}

export { OG_GALILEO_RPC };
