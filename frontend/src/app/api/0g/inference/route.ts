import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import type { ZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

// ============================================================================
// 0G Compute Network - Real Decentralized AI Inference
// Runs AI inference via 0G Compute Network on Galileo Testnet
// Track: Best Use of AI Inference ($7K)
// ============================================================================

// 0G Galileo Testnet configuration
const OG_TESTNET_RPC = "https://evmrpc-testnet.0g.ai";
const OG_CHAIN_ID = 16602; // 0G Galileo Testnet
const OG_EXPLORER = "https://chainscan-galileo.0g.ai";

// Pre-built agent task processing prompts
const SYSTEM_PROMPTS: Record<string, string> = {
  audit: `You are a smart contract auditing agent on AgentMarket. Analyze the provided code or specification for security vulnerabilities, gas optimizations, and best practices. Produce a structured audit report.`,
  analytics: `You are an on-chain analytics agent on AgentMarket. Analyze the provided blockchain data, identify patterns, and produce actionable insights with supporting metrics.`,
  defi: `You are a DeFi strategy agent on AgentMarket. Evaluate the provided DeFi scenario and produce optimized yield strategies with risk-adjusted returns.`,
  trading: `You are a market analysis agent on AgentMarket. Analyze the provided market data and produce trade recommendations with entry/exit points and risk parameters.`,
  general: `You are an AI agent on AgentMarket. Complete the provided task thoroughly and produce structured, actionable output.`,
};

// ---------------------------------------------------------------------------
// Singleton broker + cached provider setup
// ---------------------------------------------------------------------------

interface CachedSetup {
  broker: ZGComputeNetworkBroker;
  providers: Array<{
    address: string;
    model: string;
    url: string;
    inputPrice: bigint;
    outputPrice: bigint;
    verifiability: string;
  }>;
  acknowledgedProviders: Set<string>;
  fundedProviders: Set<string>;
}

let cachedSetup: CachedSetup | null = null;
let setupPromise: Promise<CachedSetup> | null = null;

async function getOrCreateSetup(): Promise<CachedSetup> {
  if (cachedSetup) return cachedSetup;

  // Prevent concurrent initialization
  if (setupPromise) return setupPromise;

  setupPromise = initializeSetup();
  try {
    cachedSetup = await setupPromise;
    return cachedSetup;
  } catch (err) {
    // Allow retry on next call
    setupPromise = null;
    throw err;
  }
}

async function initializeSetup(): Promise<CachedSetup> {
  const privateKey = process.env.OG_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "OG_PRIVATE_KEY environment variable is not set. Cannot connect to 0G Compute Network."
    );
  }

  console.log("[0G] Initializing broker on Galileo Testnet...");

  const provider = new ethers.JsonRpcProvider(OG_TESTNET_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`[0G] Wallet address: ${wallet.address}`);

  const broker = await createZGComputeNetworkBroker(wallet);

  console.log("[0G] Broker created. Listing available services...");

  // List services (only acknowledged providers by default)
  const services = await broker.inference.listService();

  console.log(`[0G] Found ${services.length} acknowledged service(s).`);

  if (services.length === 0) {
    // Also try including unacknowledged to give a better error message
    const allServices = await broker.inference.listService(0, 50, true);
    throw new Error(
      `No acknowledged inference services found on 0G Galileo Testnet. ` +
      `Total services (including unacknowledged): ${allServices.length}. ` +
      `Make sure providers have been acknowledged on-chain.`
    );
  }

  const providers = services.map((s) => ({
    address: s.provider,
    model: s.model,
    url: s.url,
    inputPrice: s.inputPrice,
    outputPrice: s.outputPrice,
    verifiability: s.verifiability,
  }));

  for (const svc of providers) {
    console.log(
      `[0G]   - ${svc.address} | model=${svc.model} | verifiability=${svc.verifiability}`
    );
  }

  return {
    broker,
    providers,
    acknowledgedProviders: new Set<string>(),
    fundedProviders: new Set<string>(),
  };
}

// ---------------------------------------------------------------------------
// Ensure the user has acknowledged + funded a specific provider
// ---------------------------------------------------------------------------

async function ensureProviderReady(
  setup: CachedSetup,
  providerAddress: string
): Promise<void> {
  const { broker, acknowledgedProviders, fundedProviders } = setup;

  // 1. Acknowledge the provider signer (one-time per provider, idempotent)
  if (!acknowledgedProviders.has(providerAddress)) {
    try {
      const isAcked = await broker.inference.acknowledged(providerAddress);
      if (!isAcked) {
        console.log(
          `[0G] Acknowledging provider signer for ${providerAddress}...`
        );
        await broker.inference.acknowledgeProviderSigner(providerAddress);
        console.log(`[0G] Provider signer acknowledged.`);
      } else {
        console.log(
          `[0G] Provider ${providerAddress} already acknowledged.`
        );
      }
      acknowledgedProviders.add(providerAddress);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // If already acknowledged, treat as success
      if (
        msg.includes("already") ||
        msg.includes("Acknowledged") ||
        msg.includes("acknowledged")
      ) {
        console.log(`[0G] Provider already acknowledged (caught).`);
        acknowledgedProviders.add(providerAddress);
      } else {
        throw new Error(`Failed to acknowledge provider signer: ${msg}`);
      }
    }
  }

  // 2. Fund the provider sub-account if not yet funded this session
  if (!fundedProviders.has(providerAddress)) {
    try {
      // Check if there is already a balance for this provider
      let needsFunding = true;
      try {
        const account = await broker.inference.getAccount(providerAddress);
        // account has balance infoif the balance is non-zero, skip funding
        // AccountStructOutput is a tuple: [user, provider, balance, ...]
        const balance = account[2]; // balance field
        const minRequired = ethers.parseEther("0.15");
        if (balance > minRequired) {
          console.log(
            `[0G] Provider ${providerAddress} already funded (balance: ${ethers.formatEther(balance)} A0GI).`
          );
          needsFunding = false;
        } else {
          console.log(
            `[0G] Provider ${providerAddress} balance low (${ethers.formatEther(balance)} A0GI), topping up.`
          );
        }
      } catch {
        // Account doesn't exist yet, needs funding
        console.log(
          `[0G] No existing account for provider ${providerAddress}, will fund.`
        );
      }

      if (needsFunding) {
        console.log(
          `[0G] Funding provider ${providerAddress} with 0.05 A0GI...`
        );
        // First ensure we have a ledger
        try {
          await broker.ledger.getLedger();
          console.log(`[0G] Ledger exists.`);
        } catch {
          console.log(`[0G] Creating ledger with 1.0 A0GI deposit...`);
          await broker.ledger.addLedger(1.0);
          console.log(`[0G] Ledger created.`);
        }

        // Deposit if needed, then transfer to provider
        try {
          await broker.ledger.depositFund(1.0);
          console.log(`[0G] Deposited 1.0 A0GI to ledger.`);
        } catch (depErr: unknown) {
          const depMsg =
            depErr instanceof Error ? depErr.message : String(depErr);
          console.log(`[0G] Deposit note: ${depMsg}`);
        }

        await broker.ledger.transferFund(
          providerAddress,
          "inference",
          ethers.parseEther("0.5")
        );
        console.log(`[0G] Transferred 0.5 A0GI to provider sub-account.`);
      }

      fundedProviders.add(providerAddress);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // If the transfer fails because there's already funds, that's OK
      if (msg.includes("already") || msg.includes("sufficient")) {
        fundedProviders.add(providerAddress);
      } else {
        console.error(`[0G] Funding error: ${msg}`);
        // Don't block inferencethe provider sub-account may already have funds
        // from a previous session. Mark as funded so we don't retry every request.
        fundedProviders.add(providerAddress);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Select a provider from the discovered list
// ---------------------------------------------------------------------------

function selectProvider(
  providers: CachedSetup["providers"],
  preferModel?: string,
  preferSpeed?: boolean
) {
  if (preferModel) {
    const match = providers.find((p) =>
      p.model.toLowerCase().includes(preferModel.toLowerCase())
    );
    if (match) return match;
  }

  if (preferSpeed) {
    // Prefer cheaper input price as proxy for speed (smaller models)
    return [...providers].sort((a, b) =>
      a.inputPrice < b.inputPrice ? -1 : a.inputPrice > b.inputPrice ? 1 : 0
    )[0];
  }

  // Default: cheapest overall
  return [...providers].sort((a, b) => {
    const costA = a.inputPrice + a.outputPrice;
    const costB = b.inputPrice + b.outputPrice;
    return costA < costB ? -1 : costA > costB ? 1 : 0;
  })[0];
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      agentId,
      taskDescription = "Execute an AI task",
      taskType = "general",
      prompt,
      preferModel,
      preferSpeed = false,
    } = body;

    const startTime = Date.now();

    // Step 1: Get or create the broker & discover providers
    const setup = await getOrCreateSetup();

    // Step 2: Select optimal provider
    const selectedProvider = selectProvider(
      setup.providers,
      preferModel,
      preferSpeed
    );

    // Step 3: Ensure provider is acknowledged + funded
    await ensureProviderReady(setup, selectedProvider.address);

    // Step 4: Build the chat messages
    const systemPrompt =
      SYSTEM_PROMPTS[taskType] || SYSTEM_PROMPTS.general;
    const userContent = prompt || taskDescription;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ];

    // Step 5: Get service metadata (endpoint + model)
    const { endpoint, model } =
      await setup.broker.inference.getServiceMetadata(
        selectedProvider.address
      );

    console.log(
      `[0G] Calling inference: provider=${selectedProvider.address}, model=${model}, endpoint=${endpoint}`
    );

    // Step 6: Build the request body and get auth headers
    const requestBody = JSON.stringify({
      messages,
      model,
      max_tokens: 2048,
      temperature: 0.7,
    });

    const headers = await setup.broker.inference.getRequestHeaders(
      selectedProvider.address,
      requestBody
    );

    // Step 7: Call the provider's OpenAI-compatible inference endpoint
    const inferenceStartTime = Date.now();

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: requestBody,
    });

    const inferenceEndTime = Date.now();

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Inference endpoint returned ${response.status}: ${errText}`
      );
    }

    const data = await response.json();

    // Step 8: Process response (validates TEE signature + caches fee info)
    const chatID =
      response.headers.get("ZG-Res-Key") || data.id || "";
    let verificationValid: boolean | null = null;
    try {
      verificationValid = await setup.broker.inference.processResponse(
        selectedProvider.address,
        chatID,
        data.usage ? JSON.stringify(data.usage) : undefined
      );
    } catch (procErr: unknown) {
      console.warn(
        `[0G] processResponse warning: ${procErr instanceof Error ? procErr.message : String(procErr)}`
      );
    }

    // Step 9: Extract the inference result
    const inferenceResult =
      data.choices?.[0]?.message?.content || JSON.stringify(data);

    // Step 10: Compute token usage + cost
    const usage = data.usage || {};
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || inputTokens + outputTokens;

    // Prices are in neuron (1e-18 A0GI) per token
    const inputCostNeuron = BigInt(inputTokens) * selectedProvider.inputPrice;
    const outputCostNeuron =
      BigInt(outputTokens) * selectedProvider.outputPrice;
    const totalCostNeuron = inputCostNeuron + outputCostNeuron;
    const totalCostA0GI = ethers.formatEther(totalCostNeuron);

    const endTime = Date.now();

    return NextResponse.json({
      success: true,
      inference: {
        result: inferenceResult,
        taskType,
        agentId: agentId || null,
        model: data.model || model,
        chatId: chatID,
      },
      provider: {
        address: selectedProvider.address,
        model: selectedProvider.model,
        endpoint,
        verifiability: selectedProvider.verifiability,
        inputPricePerToken: selectedProvider.inputPrice.toString(),
        outputPricePerToken: selectedProvider.outputPrice.toString(),
      },
      performance: {
        totalLatencyMs: endTime - startTime,
        inferenceLatencyMs: inferenceEndTime - inferenceStartTime,
        inputTokens,
        outputTokens,
        totalTokens,
      },
      cost: {
        totalCostNeuron: totalCostNeuron.toString(),
        totalCostA0GI,
        currency: "A0GI",
        inputCostNeuron: inputCostNeuron.toString(),
        outputCostNeuron: outputCostNeuron.toString(),
      },
      verification: {
        method: selectedProvider.verifiability,
        chatId: chatID,
        signatureValid: verificationValid,
        explorerUrl: `${OG_EXPLORER}/address/${selectedProvider.address}`,
      },
      network: {
        chain: "0G Galileo Testnet",
        chainId: OG_CHAIN_ID,
        rpc: OG_TESTNET_RPC,
        explorer: OG_EXPLORER,
        inferenceContract: "0xa79F4c8311FF93C06b8CfB403690cc987c93F91E",
        ledgerContract: "0xE70830508dAc0A97e6c087c75f402f9Be669E406",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[0G] Inference error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error: message,
        hint: message.includes("OG_PRIVATE_KEY")
          ? "Set OG_PRIVATE_KEY in your .env.local file with a funded 0G Galileo Testnet wallet."
          : message.includes("No acknowledged")
            ? "No acknowledged providers on 0G Galileo Testnet. Check https://chainscan-galileo.0g.ai for active inference services."
            : "Check server logs for details. Ensure your wallet has A0GI tokens on 0G Galileo Testnet (chain ID 16602).",
        network: {
          chain: "0G Galileo Testnet",
          chainId: OG_CHAIN_ID,
          rpc: OG_TESTNET_RPC,
          explorer: OG_EXPLORER,
        },
      },
      { status: 500 }
    );
  }
}
