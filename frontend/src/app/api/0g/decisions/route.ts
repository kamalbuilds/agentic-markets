import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { getOGBroker } from "@/lib/0g-broker";

// ============================================================================
// 0G DeFAI - AI Decision Engine for Agent Hiring
// Uses REAL 0G Compute Network inference for AI-powered decisions
// Network: 0G Galileo Testnet (Chain ID 16602)
// Track: Best DeFAI Application ($7K)
// ============================================================================

interface AgentHiringDecision {
  recommendedAgent: {
    agentId: number;
    name: string;
    specialization: string;
    rating: number;
    completionRate: number;
    pricePerTask: string;
  };
  paymentRoute: {
    sourceChain: number;
    sourceChainName: string;
    destChain: number;
    destChainName: string;
    tokenPath: string[];
    estimatedCost: string;
    estimatedGas: string;
    routingType: "CLASSIC" | "UNISWAPX" | "DIRECT";
  };
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  guardrails: {
    maxSlippage: number;
    escrowTimeout: number;
    requiresApproval: boolean;
    maxTransactionValue: string;
    allowedTokens: string[];
    cooldownPeriod: number;
  };
  yieldOptimization: {
    idleFundsDetected: string;
    recommendedAction: string;
    estimatedAPY: number;
    protocol: string;
  } | null;
  reasoning: string;
  confidence: number;
  timestamp: string;
  modelProvider: string;
}

// Agent registry (local data - represents our own agent database)
const AVAILABLE_AGENTS = [
  {
    agentId: 1,
    name: "CodeForge AI",
    specialization: "Smart Contract Auditing",
    rating: 4.8,
    completionRate: 0.97,
    pricePerTask: "0.05",
    chains: [99999, 296],
    successHistory: 142,
  },
  {
    agentId: 2,
    name: "DataMiner Pro",
    specialization: "On-chain Analytics",
    rating: 4.5,
    completionRate: 0.93,
    pricePerTask: "0.03",
    chains: [99999, 8453],
    successHistory: 89,
  },
  {
    agentId: 3,
    name: "DeFi Strategist",
    specialization: "Yield Optimization",
    rating: 4.9,
    completionRate: 0.99,
    pricePerTask: "0.08",
    chains: [99999, 296, 8453],
    successHistory: 231,
  },
  {
    agentId: 4,
    name: "NLP Sentinel",
    specialization: "Content Moderation",
    rating: 4.2,
    completionRate: 0.88,
    pricePerTask: "0.02",
    chains: [99999],
    successHistory: 56,
  },
  {
    agentId: 5,
    name: "TradingBot Alpha",
    specialization: "Market Analysis",
    rating: 4.6,
    completionRate: 0.95,
    pricePerTask: "0.06",
    chains: [99999, 8453, 42161],
    successHistory: 178,
  },
];

const CHAIN_NAMES: Record<number, string> = {
  99999: "ADI Chain Testnet",
  296: "Hedera Testnet",
  8453: "Base",
  42161: "Arbitrum",
  1: "Ethereum",
};

function computeRiskScore(params: {
  taskBudget: number;
  taskComplexity: string;
  agent: (typeof AVAILABLE_AGENTS)[0];
  sourceChain: number;
  destChain: number;
}): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  // Budget risk (higher budget = higher risk)
  if (params.taskBudget > 1) {
    score += 25;
    factors.push("High-value transaction (>1 ETH equivalent)");
  } else if (params.taskBudget > 0.5) {
    score += 15;
    factors.push("Medium-value transaction (0.5-1 ETH equivalent)");
  } else {
    score += 5;
    factors.push("Low-value transaction (<0.5 ETH equivalent)");
  }

  // Agent reliability risk
  if (params.agent.completionRate < 0.9) {
    score += 20;
    factors.push(`Agent completion rate below 90% (${(params.agent.completionRate * 100).toFixed(1)}%)`);
  } else if (params.agent.completionRate < 0.95) {
    score += 10;
    factors.push(`Agent completion rate moderate (${(params.agent.completionRate * 100).toFixed(1)}%)`);
  }

  // Cross-chain risk
  if (params.sourceChain !== params.destChain) {
    score += 15;
    factors.push("Cross-chain transaction required (bridge risk)");
  }

  // Complexity risk
  if (params.taskComplexity === "high") {
    score += 20;
    factors.push("High complexity task");
  } else if (params.taskComplexity === "medium") {
    score += 10;
    factors.push("Medium complexity task");
  }

  // Agent track record
  if (params.agent.successHistory < 50) {
    score += 10;
    factors.push("Agent has limited history (<50 tasks)");
  }

  return { score: Math.min(score, 100), factors };
}

function selectBestAgent(params: {
  taskType: string;
  preferredChain: number;
  maxBudget: number;
}): (typeof AVAILABLE_AGENTS)[0] {
  // Filter by budget
  const affordable = AVAILABLE_AGENTS.filter(
    (a) => parseFloat(a.pricePerTask) <= params.maxBudget
  );

  if (affordable.length === 0) return AVAILABLE_AGENTS[0];

  // Score agents based on task match, chain compatibility, and rating
  const scored = affordable.map((agent) => {
    let score = agent.rating * 20; // Base score from rating
    score += agent.completionRate * 30; // Reliability bonus

    // Chain compatibility bonus
    if (agent.chains.includes(params.preferredChain)) {
      score += 15;
    }

    // Specialization match (simple keyword matching)
    const taskLower = params.taskType.toLowerCase();
    const specLower = agent.specialization.toLowerCase();
    if (
      taskLower.includes("audit") && specLower.includes("audit") ||
      taskLower.includes("defi") && specLower.includes("yield") ||
      taskLower.includes("analyt") && specLower.includes("analyt") ||
      taskLower.includes("trad") && specLower.includes("market") ||
      taskLower.includes("content") && specLower.includes("content")
    ) {
      score += 25;
    }

    return { agent, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].agent;
}

function determinePaymentRoute(
  sourceChain: number,
  destChain: number,
  budget: number
): AgentHiringDecision["paymentRoute"] {
  const isCrossChain = sourceChain !== destChain;

  if (!isCrossChain) {
    return {
      sourceChain,
      sourceChainName: CHAIN_NAMES[sourceChain] || `Chain ${sourceChain}`,
      destChain,
      destChainName: CHAIN_NAMES[destChain] || `Chain ${destChain}`,
      tokenPath: ["DDSC"],
      estimatedCost: budget.toFixed(4),
      estimatedGas: "0.0001",
      routingType: "DIRECT",
    };
  }

  return {
    sourceChain,
    sourceChainName: CHAIN_NAMES[sourceChain] || `Chain ${sourceChain}`,
    destChain,
    destChainName: CHAIN_NAMES[destChain] || `Chain ${destChain}`,
    tokenPath: ["DDSC", "USDC", "WHBAR"],
    estimatedCost: (budget * 1.003).toFixed(4),
    estimatedGas: "0.0025",
    routingType: budget > 0.5 ? "UNISWAPX" : "CLASSIC",
  };
}

// ============================================================================
// 0G Inference Integration
// ============================================================================

/**
 * Build a structured prompt for the 0G AI model to analyze a DeFAI task
 * and provide recommendations that augment our local decision engine.
 */
function buildDecisionPrompt(params: {
  taskType: string;
  taskDescription: string;
  taskComplexity: string;
  preferredChain: number;
  sourceChain: number;
  maxBudget: number;
  walletAddress?: string;
  selectedAgent: (typeof AVAILABLE_AGENTS)[0];
  riskScore: number;
  riskLevel: string;
  riskFactors: string[];
}): string {
  const agentsList = AVAILABLE_AGENTS.map(
    (a) =>
      `  - ${a.name} (ID:${a.agentId}): ${a.specialization}, rating ${a.rating}/5, ` +
      `${(a.completionRate * 100).toFixed(0)}% completion, ${a.pricePerTask} ETH/task, ` +
      `${a.successHistory} completed tasks, chains: [${a.chains.join(",")}]`
  ).join("\n");

  return `You are a DeFAI decision engine analyzing a task for an AI agent marketplace.

TASK PARAMETERS:
- Type: ${params.taskType}
- Description: "${params.taskDescription}"
- Complexity: ${params.taskComplexity}
- Preferred Chain: ${CHAIN_NAMES[params.preferredChain] || `Chain ${params.preferredChain}`}
- Source Chain: ${CHAIN_NAMES[params.sourceChain] || `Chain ${params.sourceChain}`}
- Max Budget: ${params.maxBudget} ETH
- Wallet: ${params.walletAddress || "not provided"}

AVAILABLE AGENTS:
${agentsList}

OUR ENGINE PRE-SELECTED: ${params.selectedAgent.name} (ID:${params.selectedAgent.agentId})
COMPUTED RISK: ${params.riskScore}/100 (${params.riskLevel})
RISK FACTORS: ${params.riskFactors.join("; ")}

Respond with a JSON object (no markdown, no code fences, just raw JSON) with these fields:
{
  "agentAnalysis": "Brief analysis of why the selected agent is or isn't the best choice (2-3 sentences)",
  "taskAnalysis": "Analysis of the task requirements, feasibility, and potential challenges (2-3 sentences)",
  "riskInsights": "Additional risk insights beyond the computed factors (1-2 sentences)",
  "yieldSuggestion": "If there are idle funds, suggest a yield strategy. Otherwise say 'No idle funds detected.' (1-2 sentences)",
  "confidence": a number between 0.6 and 0.99 representing your confidence in this recommendation,
  "guardrailNotes": "Any additional guardrail recommendations (1 sentence)"
}`;
}

/**
 * Parse the AI response JSON, handling various edge cases.
 */
function parseAIResponse(raw: string): {
  agentAnalysis: string;
  taskAnalysis: string;
  riskInsights: string;
  yieldSuggestion: string;
  confidence: number;
  guardrailNotes: string;
} {
  // Try to extract JSON from the response (handle markdown code fences, etc.)
  let jsonStr = raw.trim();

  // Strip markdown code fences if present
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  // Try to find a JSON object
  const braceStart = jsonStr.indexOf("{");
  const braceEnd = jsonStr.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1) {
    jsonStr = jsonStr.slice(braceStart, braceEnd + 1);
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      agentAnalysis: String(parsed.agentAnalysis || "Agent analysis unavailable."),
      taskAnalysis: String(parsed.taskAnalysis || "Task analysis unavailable."),
      riskInsights: String(parsed.riskInsights || "No additional risk insights."),
      yieldSuggestion: String(parsed.yieldSuggestion || "No idle funds detected."),
      confidence: typeof parsed.confidence === "number"
        ? Math.max(0.6, Math.min(0.99, parsed.confidence))
        : 0.75,
      guardrailNotes: String(parsed.guardrailNotes || "Standard guardrails apply."),
    };
  } catch {
    // If JSON parse fails, use the raw text as reasoning
    return {
      agentAnalysis: raw.slice(0, 200),
      taskAnalysis: "AI provided unstructured response.",
      riskInsights: "Could not parse structured risk insights from AI.",
      yieldSuggestion: "No idle funds detected.",
      confidence: 0.7,
      guardrailNotes: "Standard guardrails apply.",
    };
  }
}

/**
 * Call 0G Compute Network inference with the decision prompt.
 * Uses the real broker SDK to find a provider, get auth headers,
 * and make an OpenAI-compatible chat completion request.
 */
async function callOGInference(prompt: string): Promise<{
  content: string;
  model: string;
  providerAddress: string;
}> {
  const broker = await getOGBroker();

  // Step 1: List available services and pick one
  console.log("[0G Decision] Listing available inference services...");
  const services = await broker.inference.listService();

  if (!services || services.length === 0) {
    throw new Error(
      "No inference services available on 0G Galileo Testnet. " +
      "The network may be experiencing downtime or no providers are registered."
    );
  }

  console.log(`[0G Decision] Found ${services.length} services`);

  // Pick a service - prefer chat/text models
  // ServiceStructOutput: [provider, serviceType, url, inputPrice, outputPrice, updatedAt, model, ...]
  let selectedService = services[0];
  for (const svc of services) {
    const model = (svc.model || "").toLowerCase();
    // Prefer instruction-tuned / chat models
    if (
      model.includes("instruct") ||
      model.includes("chat") ||
      model.includes("qwen")
    ) {
      selectedService = svc;
      break;
    }
  }

  const providerAddress = selectedService.provider;
  const modelName = selectedService.model;
  console.log(`[0G Decision] Selected provider: ${providerAddress}`);
  console.log(`[0G Decision] Model: ${modelName}`);

  // Step 2: Acknowledge provider signer (required before first use)
  try {
    const isAcked = await broker.inference.acknowledged(providerAddress);
    if (!isAcked) {
      console.log("[0G Decision] Acknowledging provider signer...");
      await broker.inference.acknowledgeProviderSigner(providerAddress);
      console.log("[0G Decision] Provider signer acknowledged");
    }
  } catch (ackErr) {
    console.warn("[0G Decision] Acknowledge check/call warning:", ackErr);
    // Continue - may already be acknowledged or not needed
  }

  // Step 3: Ensure funds are available for inference
  try {
    console.log("[0G Decision] Checking ledger and transferring funds if needed...");

    // Ensure ledger exists
    try {
      await broker.ledger.getLedger();
    } catch {
      console.log("[0G Decision] Creating ledger with initial deposit...");
      await broker.ledger.addLedger(0.5);
    }

    // Check inference sub-account and top up if needed
    try {
      const account = await broker.inference.getAccount(providerAddress);
      // account is a tuple: [user, provider, balance, pendingRefund, ...]
      const balance = account[2] || BigInt(0);
      const minRequired = ethers.parseEther("0.1");
      if (balance < minRequired) {
        console.log("[0G Decision] Balance low, depositing and transferring...");
        try {
          await broker.ledger.depositFund(0.5);
        } catch {
          // May fail if already funded enough in ledger
        }
        await broker.ledger.transferFund(
          providerAddress,
          "inference",
          ethers.parseEther("0.2")
        );
        console.log("[0G Decision] Funds topped up");
      }
    } catch {
      // Account doesn't exist yet - set it up
      console.log("[0G Decision] Setting up inference sub-account...");
      try {
        await broker.ledger.depositFund(0.5);
      } catch {
        // Ledger may already have funds
      }
      await broker.ledger.transferFund(
        providerAddress,
        "inference",
        ethers.parseEther("0.2")
      );
      console.log("[0G Decision] Funds transferred to inference account");
    }
  } catch (fundErr) {
    console.warn("[0G Decision] Fund setup warning:", fundErr);
    // Continue - funds may already be sufficient
  }

  // Step 4: Get service metadata (endpoint + model)
  const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
  console.log(`[0G Decision] Endpoint: ${endpoint}`);
  console.log(`[0G Decision] Model from metadata: ${model}`);

  // Step 5: Build the chat completion request content
  const content = prompt;

  // Step 6: Get billing/auth headers from the broker
  const headers = await broker.inference.getRequestHeaders(providerAddress, content);
  console.log("[0G Decision] Got request headers from broker");

  // Step 7: Call the inference endpoint (OpenAI-compatible format)
  const requestBody = {
    model: model,
    messages: [
      {
        role: "system",
        content:
          "You are a DeFAI decision engine. Analyze tasks and provide structured JSON recommendations for an AI agent marketplace. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: content,
      },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  };

  const inferenceUrl = `${endpoint.replace(/\/$/, "")}/chat/completions`;
  console.log(`[0G Decision] Calling inference: ${inferenceUrl}`);

  const response = await fetch(inferenceUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `0G inference request failed (${response.status}): ${errorText}`
    );
  }

  const result = await response.json();

  // Step 8: Process the response with the broker (verification + fee caching)
  try {
    const chatID =
      response.headers.get("ZG-Res-Key") ||
      result?.id ||
      "";
    if (chatID) {
      await broker.inference.processResponse(
        providerAddress,
        chatID,
        JSON.stringify(result?.usage || {})
      );
    }
  } catch (procErr) {
    console.warn("[0G Decision] processResponse warning:", procErr);
  }

  const aiContent =
    result?.choices?.[0]?.message?.content ||
    result?.choices?.[0]?.text ||
    JSON.stringify(result);

  return {
    content: aiContent,
    model: model || modelName,
    providerAddress,
  };
}

// ============================================================================
// POST Handler
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      taskType = "general",
      taskDescription = "Execute a task",
      taskComplexity = "medium",
      preferredChain = 99999,
      sourceChain = 99999,
      maxBudget = 0.1,
      walletAddress,
    } = body;

    // Step 1: AI Agent Selection (local scoring)
    const selectedAgent = selectBestAgent({
      taskType,
      preferredChain,
      maxBudget,
    });

    // Step 2: Determine optimal payment route
    const destChain = selectedAgent.chains.includes(preferredChain)
      ? preferredChain
      : selectedAgent.chains[0];

    const paymentRoute = determinePaymentRoute(
      sourceChain,
      destChain,
      parseFloat(selectedAgent.pricePerTask)
    );

    // Step 3: Risk assessment (local computation)
    const { score: riskScore, factors: riskFactors } = computeRiskScore({
      taskBudget: parseFloat(selectedAgent.pricePerTask),
      taskComplexity,
      agent: selectedAgent,
      sourceChain,
      destChain,
    });

    const riskLevel: AgentHiringDecision["riskLevel"] =
      riskScore <= 25 ? "LOW" : riskScore <= 50 ? "MEDIUM" : riskScore <= 75 ? "HIGH" : "CRITICAL";

    // Step 4: Call REAL 0G Compute Network inference for AI analysis
    let aiAnalysis: ReturnType<typeof parseAIResponse> | null = null;
    let usedModel = "0G Compute Network - Galileo Testnet";
    let inferenceProviderAddress = "";

    const prompt = buildDecisionPrompt({
      taskType,
      taskDescription,
      taskComplexity,
      preferredChain,
      sourceChain,
      maxBudget,
      walletAddress,
      selectedAgent,
      riskScore,
      riskLevel,
      riskFactors,
    });

    try {
      const inferenceResult = await callOGInference(prompt);
      aiAnalysis = parseAIResponse(inferenceResult.content);
      usedModel = inferenceResult.model;
      inferenceProviderAddress = inferenceResult.providerAddress;
      console.log("[0G Decision] AI inference completed successfully");
    } catch (inferenceErr) {
      console.error("[0G Decision] Inference error:", inferenceErr);
      // Graceful degradation: use local-only reasoning if inference fails
      aiAnalysis = {
        agentAnalysis: `${selectedAgent.name} selected based on local scoring: ${selectedAgent.rating}/5 rating, ${(selectedAgent.completionRate * 100).toFixed(1)}% completion rate.`,
        taskAnalysis: `Task "${taskDescription}" classified as ${taskComplexity} complexity ${taskType}. Local engine processed without AI augmentation due to inference error.`,
        riskInsights: `Risk score ${riskScore}/100. ${riskFactors.join(". ")}.`,
        yieldSuggestion: "No idle funds detected.",
        confidence: 0.65,
        guardrailNotes: "Standard guardrails applied (AI inference unavailable).",
      };
      usedModel = `fallback-local (inference error: ${inferenceErr instanceof Error ? inferenceErr.message.slice(0, 120) : "unknown"})`;
    }

    // Step 5: Guardrails (merge local + AI)
    const guardrails: AgentHiringDecision["guardrails"] = {
      maxSlippage: riskLevel === "LOW" ? 1.0 : riskLevel === "MEDIUM" ? 0.5 : 0.3,
      escrowTimeout: riskLevel === "LOW" ? 3600 : riskLevel === "MEDIUM" ? 7200 : 14400,
      requiresApproval: riskScore > 50,
      maxTransactionValue: riskLevel === "CRITICAL" ? "0.1" : riskLevel === "HIGH" ? "0.5" : "10.0",
      allowedTokens: ["DDSC", "ADI", "USDC", "WHBAR"],
      cooldownPeriod: riskScore > 75 ? 300 : 0,
    };

    // Step 6: Yield optimization check
    let yieldOptimization: AgentHiringDecision["yieldOptimization"] = null;
    if (maxBudget > parseFloat(selectedAgent.pricePerTask) * 2) {
      const idleFunds = (maxBudget - parseFloat(selectedAgent.pricePerTask)).toFixed(4);
      yieldOptimization = {
        idleFundsDetected: `${idleFunds} ETH equivalent idle`,
        recommendedAction: "Deploy to Bonzo Finance lending pool for yield",
        estimatedAPY: 8.2,
        protocol: "Bonzo Finance (Hedera)",
      };
    }

    // Step 7: Build structured reasoning (AI-augmented)
    const reasoning = [
      `TASK ANALYSIS (0G AI): ${aiAnalysis.taskAnalysis}`,
      `AGENT SELECTION: ${selectedAgent.name} selected with ${selectedAgent.rating}/5.0 rating and ${(selectedAgent.completionRate * 100).toFixed(1)}% completion rate across ${selectedAgent.successHistory} tasks.`,
      `AI AGENT ASSESSMENT: ${aiAnalysis.agentAnalysis}`,
      `PAYMENT ROUTING: ${paymentRoute.routingType} route via ${paymentRoute.tokenPath.join(" -> ")} from ${paymentRoute.sourceChainName} to ${paymentRoute.destChainName}. Estimated cost: ${paymentRoute.estimatedCost} + ${paymentRoute.estimatedGas} gas.`,
      `RISK ASSESSMENT: Score ${riskScore}/100 (${riskLevel}). Factors: ${riskFactors.join("; ")}.`,
      `AI RISK INSIGHTS: ${aiAnalysis.riskInsights}`,
      guardrails.requiresApproval
        ? `GUARDRAIL: Manual approval required due to elevated risk score. ${aiAnalysis.guardrailNotes}`
        : `GUARDRAIL: Auto-execution permitted. ${aiAnalysis.guardrailNotes}`,
      yieldOptimization
        ? `YIELD: ${yieldOptimization.idleFundsDetected} - ${aiAnalysis.yieldSuggestion}`
        : `YIELD: ${aiAnalysis.yieldSuggestion}`,
      inferenceProviderAddress
        ? `0G PROVIDER: ${inferenceProviderAddress}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    // Use the AI's confidence if available, otherwise compute locally
    const confidence = aiAnalysis.confidence || Math.max(0.7, 1 - riskScore / 200);

    const decision: AgentHiringDecision = {
      recommendedAgent: {
        agentId: selectedAgent.agentId,
        name: selectedAgent.name,
        specialization: selectedAgent.specialization,
        rating: selectedAgent.rating,
        completionRate: selectedAgent.completionRate,
        pricePerTask: selectedAgent.pricePerTask,
      },
      paymentRoute,
      riskScore,
      riskLevel,
      guardrails,
      yieldOptimization,
      reasoning,
      confidence,
      timestamp: new Date().toISOString(),
      modelProvider: `0G Compute Network - ${usedModel}`,
    };

    return NextResponse.json({
      success: true,
      decision,
    });
  } catch (error) {
    console.error("[0G Decision] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
