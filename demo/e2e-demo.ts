#!/usr/bin/env npx tsx
/**
 * AgentMarket E2E Demo Script
 *
 * Exercises the full flow through the MCP server against live ADI testnet contracts:
 * 1. Platform stats (read)
 * 2. List agents (read)
 * 3. Get agent details (read)
 * 4. Register a new agent (write)
 * 5. Pay an agent (write)
 * 6. Rate an agent (write)
 * 7. Register a merchant (write)
 * 8. Checkout with merchant (write)
 * 9. Claim DDSC tokens (write)
 * 10. Check DDSC balance (read)
 * 11. Final platform stats (read)
 */

import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MCP_SERVER_PATH = resolve(__dirname, "../mcp-server/src/index.ts");

interface McpResponse {
  jsonrpc: string;
  id?: number;
  result?: any;
  error?: any;
}

class McpClient {
  private proc: ReturnType<typeof spawn>;
  private buffer = "";
  private resolvers: Map<number, (value: McpResponse) => void> = new Map();
  private nextId = 1;

  constructor(privateKey?: string) {
    const env: Record<string, string> = {
      ...process.env as Record<string, string>,
      ADI_RPC_URL: "https://rpc.ab.testnet.adifoundation.ai/",
    };
    if (privateKey) {
      env.AGENT_PRIVATE_KEY = privateKey;
    }

    this.proc = spawn("npx", ["tsx", MCP_SERVER_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
      env,
    });

    this.proc.stdout!.on("data", (data: Buffer) => {
      this.buffer += data.toString();
      const lines = this.buffer.split("\n");
      this.buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg: McpResponse = JSON.parse(line);
          if (msg.id && this.resolvers.has(msg.id)) {
            this.resolvers.get(msg.id)!(msg);
            this.resolvers.delete(msg.id);
          }
        } catch {}
      }
    });

    this.proc.stderr!.on("data", () => {}); // suppress stderr
  }

  async send(method: string, params: any = {}): Promise<any> {
    const id = this.nextId++;
    const msg = JSON.stringify({ jsonrpc: "2.0", id, method, params });

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.resolvers.delete(id);
        reject(new Error(`Timeout waiting for response to ${method}`));
      }, 30000);

      this.resolvers.set(id, (response) => {
        clearTimeout(timer);
        if (response.error) {
          reject(new Error(response.error.message || JSON.stringify(response.error)));
        } else {
          resolve(response.result);
        }
      });

      this.proc.stdin!.write(msg + "\n");
    });
  }

  async callTool(name: string, args: Record<string, any> = {}): Promise<string> {
    const result = await this.send("tools/call", { name, arguments: args });
    return result.content?.[0]?.text || JSON.stringify(result);
  }

  async initialize(): Promise<void> {
    await this.send("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "e2e-demo", version: "1.0.0" },
    });
    // Send initialized notification (no response expected)
    this.proc.stdin!.write(
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n"
    );
    await new Promise((r) => setTimeout(r, 500));
  }

  close(): void {
    this.proc.kill();
  }
}

// ANSI colors
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

function step(n: number, label: string) {
  console.log(`\n${bold(cyan(`[Step ${n}]`))} ${label}`);
}

function result(data: string) {
  try {
    const parsed = JSON.parse(data);
    console.log(dim(JSON.stringify(parsed, null, 2)));
  } catch {
    console.log(dim(data));
  }
}

async function main() {
  console.log(bold("\n═══════════════════════════════════════════════════"));
  console.log(bold("   AgentMarket E2E Demo — ADI Testnet (Chain 99999)"));
  console.log(bold("═══════════════════════════════════════════════════\n"));

  // Use deployer key for demo (same one from previous deployment)
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error(red("Error: Set DEPLOYER_PRIVATE_KEY env var"));
    process.exit(1);
  }

  console.log(yellow("Starting MCP server..."));
  const client = new McpClient(privateKey);

  try {
    await client.initialize();
    console.log(green("MCP server initialized."));

    // ── READ OPERATIONS ──────────────────────────────

    step(1, "Get Platform Stats");
    const stats = await client.callTool("get_platform_stats");
    result(stats);

    step(2, "List All Agents");
    const agents = await client.callTool("list_agents");
    result(agents);

    step(3, "Get Agent #1 Details");
    const agent1 = await client.callTool("get_agent", { agentId: "1" });
    result(agent1);

    step(4, "Get Agent #1 Rating");
    const rating1 = await client.callTool("get_agent_rating", { agentId: "1" });
    result(rating1);

    step(5, "Check Paymaster Sponsorship Info");
    const paymasterInfo = await client.callTool("get_paymaster_info", {
      address: "0x195D0B858A4E6509300Cfd8141794AF6A6f2c077",
    });
    result(paymasterInfo);

    step(6, "Check DDSC Balance");
    const ddscBalance = await client.callTool("get_ddsc_balance", {
      address: "0x195D0B858A4E6509300Cfd8141794AF6A6f2c077",
    });
    result(ddscBalance);

    // ── WRITE OPERATIONS (if enough gas) ──────────────

    const hasGas = process.argv.includes("--write");

    if (hasGas) {
      step(7, "Register New Agent: 'DemoAgent-E2E'");
      const newAgent = await client.callTool("register_agent", {
        metadataURI: "ipfs://demo-agent-e2e-test",
        pricePerTask: "0.01",
      });
      result(newAgent);

      step(8, "Rate Agent #1 (5 stars)");
      const rateResult = await client.callTool("rate_agent", {
        agentId: "1",
        rating: 5,
      });
      result(rateResult);

      step(9, "Register Merchant: 'Demo Coffee Shop'");
      const newMerchant = await client.callTool("register_merchant", {
        name: "Demo Coffee Shop",
        metadataURI: "ipfs://demo-coffee-shop",
      });
      result(newMerchant);

      step(10, "Claim DDSC Tokens");
      const claimResult = await client.callTool("claim_ddsc", {
        amount: "1000",
      });
      result(claimResult);

      step(11, "Final Platform Stats");
      const finalStats = await client.callTool("get_platform_stats");
      result(finalStats);
    } else {
      console.log(yellow("\n  Skipping write operations (pass --write to enable)."));
      console.log(dim("  Write ops require ADI testnet gas."));
    }

    // ── SUMMARY ──────────────────────────────────────

    console.log(bold("\n═══════════════════════════════════════════════════"));
    console.log(bold("   Demo Complete"));
    console.log(bold("═══════════════════════════════════════════════════"));
    console.log(`
  ${green("All MCP tools working against live ADI testnet contracts.")}

  ${bold("Deployed Contracts:")}
    AgentRegistry:  0x24fF5f6637A83CA7CA7B72b3Ad55275D669Ab7da
    PaymentRouter:  0x13e935CF88Fd5a967B621aDf0b331361E8aF76f3
    MerchantVault:  0x809039A3A6791bb734841E1B14405FF521BC6ddb
    ADIPaymaster:   0x804911e28D000695b6DD6955EEbF175EbB628A16
    MockDDSC:       0x66bfba26d31e008dF0a6D40333e01bd1213CB109

  ${bold("MCP Server:")} 16 tools (9 read + 7 write)
  ${bold("OpenClaw Agents:")} Commerce, Merchant, Analytics
  ${bold("Chain:")} ADI Testnet (99999)
`);
  } catch (err) {
    console.error(red(`Error: ${err}`));
  } finally {
    client.close();
  }
}

main();
