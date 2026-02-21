"use client";

import { useState } from "react";
import {
  Brain,
  Cpu,
  Image,
  Activity,
  Shield,
  Zap,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  Unlock,
  Server,
  BadgeCheck,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------- Types ----------

interface DecisionResult {
  success: boolean;
  decision?: {
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
      routingType: string;
    };
    riskScore: number;
    riskLevel: string;
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
  };
}

interface InferenceResult {
  success: boolean;
  inference?: {
    result: string;
    taskType: string;
    agentId: number | null;
  };
  provider?: {
    address: string;
    name: string;
    model: string;
    region: string;
    verificationMethod: string;
  };
  performance?: {
    processingTimeMs: number;
    totalLatencyMs: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost?: {
    totalCost: string;
    costPerToken: string;
    currency: string;
    centralizedEquivalent: string;
    savingsPercent: string;
  };
  verification?: {
    method: string;
    verified: boolean;
    [key: string]: unknown;
  };
  network?: {
    chain: string;
    chainId: number;
    rpc: string;
    settlementType: string;
  };
}

interface INFTResult {
  success: boolean;
  tokenId?: number;
  agentMarketId?: number;
  action?: string;
  [key: string]: unknown;
}

// ---------- Sub-components ----------

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    LOW: "border-green-500/30 text-green-400 bg-green-500/10",
    MEDIUM: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
    HIGH: "border-orange-500/30 text-orange-400 bg-orange-500/10",
    CRITICAL: "border-red-500/30 text-red-400 bg-red-500/10",
  };
  return (
    <Badge variant="outline" className={colors[level] || colors.MEDIUM}>
      {level}
    </Badge>
  );
}

function JsonViewer({ data, maxHeight = "300px" }: { data: unknown; maxHeight?: string }) {
  const [expanded, setExpanded] = useState(false);
  const json = JSON.stringify(data, null, 2);
  const isLong = json.length > 500;

  return (
    <div className="relative">
      <pre
        className={`overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-[11px] text-zinc-300 font-mono ${!expanded && isLong ? "max-h-[200px]" : ""
          }`}
        style={expanded ? { maxHeight } : undefined}
      >
        {json}
      </pre>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          {expanded ? "Collapse" : "Expand full JSON"}
        </button>
      )}
    </div>
  );
}

// ---------- DeFAI Decision Panel ----------

function DecisionPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [taskType, setTaskType] = useState("defi");
  const [taskDescription, setTaskDescription] = useState("Optimize yield strategy for 500 DDSC across DeFi protocols");
  const [complexity, setComplexity] = useState("medium");
  const [budget, setBudget] = useState("0.1");

  async function runDecision() {
    setLoading(true);
    try {
      const res = await fetch("/api/0g/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType,
          taskDescription,
          taskComplexity: complexity,
          preferredChain: 99999,
          sourceChain: 99999,
          maxBudget: parseFloat(budget),
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false });
    }
    setLoading(false);
  }

  const d = result?.decision;

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Brain className="size-5 text-indigo-400" />
          AI Decision Engine
          <Badge variant="outline" className="ml-auto border-indigo-500/30 text-indigo-400 text-[10px]">
            DeFAI Track
          </Badge>
        </CardTitle>
        <CardDescription>
          Structured AI decisions for agent hiring - produces JSON guardrails, risk scores, and payment routing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Form */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Task Type</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger className="h-9 border-zinc-700 bg-zinc-900 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defi">DeFi Strategy</SelectItem>
                <SelectItem value="audit">Smart Contract Audit</SelectItem>
                <SelectItem value="analytics">On-chain Analytics</SelectItem>
                <SelectItem value="trading">Market Analysis</SelectItem>
                <SelectItem value="general">General Task</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Complexity</Label>
            <Select value={complexity} onValueChange={setComplexity}>
              <SelectTrigger className="h-9 border-zinc-700 bg-zinc-900 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-zinc-400">Task Description</Label>
            <Input
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="h-9 border-zinc-700 bg-zinc-900 text-sm"
              placeholder="Describe what you need the agent to do..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Max Budget (ETH equiv)</Label>
            <Input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="h-9 border-zinc-700 bg-zinc-900 text-sm"
              placeholder="0.1"
              type="number"
              step="0.01"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={runDecision}
              disabled={loading}
              className="h-9 w-full gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {loading ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <Brain className="size-3.5" />
              )}
              {loading ? "Analyzing..." : "Get AI Decision"}
            </Button>
          </div>
        </div>

        {/* Results */}
        {d && (
          <>
            <Separator className="bg-zinc-800" />

            {/* Recommended Agent */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <BadgeCheck className="size-3.5 text-indigo-400" />
                  Recommended Agent
                </span>
                <span className="text-[10px] text-zinc-500">
                  Confidence: {(d.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{d.recommendedAgent.name}</p>
                  <p className="text-[11px] text-zinc-500">{d.recommendedAgent.specialization}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{d.recommendedAgent.pricePerTask} ETH</p>
                  <p className="text-[11px] text-zinc-500">
                    {d.recommendedAgent.rating}/5.0 - {(d.recommendedAgent.completionRate * 100).toFixed(0)}% completion
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Route */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-2">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <ArrowRight className="size-3.5 text-green-400" />
                Payment Route
              </span>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px]">
                  {d.paymentRoute.sourceChainName}
                </Badge>
                <ArrowRight className="size-3 text-zinc-600" />
                {d.paymentRoute.tokenPath.map((token, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <ArrowRight className="size-2.5 text-zinc-700" />}
                    <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-[10px]">
                      {token}
                    </Badge>
                  </span>
                ))}
                <ArrowRight className="size-3 text-zinc-600" />
                <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px]">
                  {d.paymentRoute.destChainName}
                </Badge>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>Cost: {d.paymentRoute.estimatedCost} + {d.paymentRoute.estimatedGas} gas</span>
                <span>Route: {d.paymentRoute.routingType}</span>
              </div>
            </div>

            {/* Risk & Guardrails */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Shield className="size-3.5 text-yellow-400" />
                  Risk Assessment
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">{d.riskScore}</span>
                  <RiskBadge level={d.riskLevel} />
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${d.riskScore <= 25
                      ? "bg-green-500"
                      : d.riskScore <= 50
                        ? "bg-yellow-500"
                        : d.riskScore <= 75
                          ? "bg-orange-500"
                          : "bg-red-500"
                      }`}
                    style={{ width: `${d.riskScore}%` }}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Lock className="size-3.5 text-orange-400" />
                  Guardrails
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Max Slippage</span>
                    <span className="text-white">{d.guardrails.maxSlippage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Escrow Timeout</span>
                    <span className="text-white">{d.guardrails.escrowTimeout}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Approval Required</span>
                    <span className={d.guardrails.requiresApproval ? "text-orange-400" : "text-green-400"}>
                      {d.guardrails.requiresApproval ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Yield Optimization */}
            {d.yieldOptimization && (
              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-1">
                <span className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                  <TrendingUp className="size-3.5" />
                  Yield Optimization Detected
                </span>
                <p className="text-[11px] text-zinc-400">{d.yieldOptimization.idleFundsDetected}</p>
                <p className="text-[11px] text-white">{d.yieldOptimization.recommendedAction}</p>
                <p className="text-[10px] text-green-400">{d.yieldOptimization.estimatedAPY}% APY via {d.yieldOptimization.protocol}</p>
              </div>
            )}

            {/* Reasoning */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-1">
              <span className="text-xs font-semibold text-white">AI Reasoning (Explainable Output)</span>
              <pre className="whitespace-pre-wrap text-[11px] text-zinc-400 font-mono leading-relaxed">
                {d.reasoning}
              </pre>
              <p className="text-[10px] text-zinc-600 pt-1">Provider: {d.modelProvider}</p>
            </div>

            {/* Raw JSON */}
            <details className="group">
              <summary className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
                View raw JSON response
              </summary>
              <div className="mt-2">
                <JsonViewer data={result} maxHeight="400px" />
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Compute Inference Panel ----------

function InferencePanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [taskType, setTaskType] = useState("audit");
  const [prompt, setPrompt] = useState("Audit the AgentMarket PaymentRouter contract for security vulnerabilities");

  async function runInference() {
    setLoading(true);
    try {
      const res = await fetch("/api/0g/inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: 1,
          taskDescription: prompt,
          taskType,
          prompt,
          preferSpeed: false,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false });
    }
    setLoading(false);
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Cpu className="size-5 text-cyan-400" />
          0G Compute Inference
          <Badge variant="outline" className="ml-auto border-cyan-500/30 text-cyan-400 text-[10px]">
            AI Compute Track
          </Badge>
        </CardTitle>
        <CardDescription>
          Decentralized AI inference via 0G Compute Network with verifiable proofs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Form */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Task Type</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger className="h-9 border-zinc-700 bg-zinc-900 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="audit">Smart Contract Audit</SelectItem>
                <SelectItem value="analytics">On-chain Analytics</SelectItem>
                <SelectItem value="defi">DeFi Strategy</SelectItem>
                <SelectItem value="general">General Task</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={runInference}
              disabled={loading}
              className="h-9 w-full gap-2 bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              {loading ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <Cpu className="size-3.5" />
              )}
              {loading ? "Processing..." : "Run Inference"}
            </Button>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs text-zinc-400">Prompt / Task Description</Label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="h-9 border-zinc-700 bg-zinc-900 text-sm"
              placeholder="Describe the task for AI inference..."
            />
          </div>
        </div>

        {/* Results */}
        {result?.success && (
          <>
            <Separator className="bg-zinc-800" />

            {/* Provider Info */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-2">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Server className="size-3.5 text-cyan-400" />
                0G Compute Provider
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-zinc-500">Provider</span>
                  <p className="text-white font-medium">{result.provider?.name}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Model</span>
                  <p className="text-white font-medium text-[10px]">{result.provider?.model}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Region</span>
                  <p className="text-white">{result.provider?.region}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Verification</span>
                  <p className="text-cyan-400">{result.provider?.verificationMethod}</p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-600 font-mono truncate">
                Address: {result.provider?.address}
              </p>
            </div>

            {/* Performance & Cost */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Activity className="size-3.5 text-green-400" />
                  Performance
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Processing</span>
                    <span className="text-white">{result.performance?.processingTimeMs}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Input Tokens</span>
                    <span className="text-white">{result.performance?.inputTokens}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Output Tokens</span>
                    <span className="text-white">{result.performance?.outputTokens}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Zap className="size-3.5 text-yellow-400" />
                  Cost Comparison
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">0G Cost</span>
                    <span className="text-green-400">{result.cost?.totalCost} 0G</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Centralized</span>
                    <span className="text-red-400 line-through">{result.cost?.centralizedEquivalent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Savings</span>
                    <span className="text-green-400 font-bold">{result.cost?.savingsPercent}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Proof */}
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 space-y-2">
              <span className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" />
                Verification Proof ({result.verification?.method})
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-green-500/30 text-green-400 text-[10px]">
                  {result.verification?.verified ? "VERIFIED" : "PENDING"}
                </Badge>
                <span className="text-[10px] text-zinc-500">
                  Settlement: {result.network?.settlementType}
                </span>
              </div>
              <JsonViewer data={result.verification} maxHeight="200px" />
            </div>

            {/* Inference Result */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 space-y-2">
              <span className="text-xs font-semibold text-white">Inference Output</span>
              <pre className="overflow-auto whitespace-pre-wrap rounded-md bg-zinc-950 p-2 text-[11px] text-zinc-300 font-mono max-h-[300px]">
                {result.inference?.result}
              </pre>
            </div>

            {/* Network Info */}
            <div className="flex items-center gap-3 text-[10px] text-zinc-600">
              <span>Chain: {result.network?.chain}</span>
              <span>ID: {result.network?.chainId}</span>
              <a
                href="https://chainscan-galileo.0g.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-zinc-400 transition-colors ml-auto"
              >
                <ExternalLink className="size-2.5" />
                0G Explorer
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- iNFT Panel ----------

function INFTPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<INFTResult | null>(null);
  const [action, setAction] = useState("mint");
  const [agentId, setAgentId] = useState("5");
  const [ownerAddress, setOwnerAddress] = useState("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18");
  const [userAddress, setUserAddress] = useState("0x8ba1f109551bD432803012645Hac136c9A0D0e47");
  const [oracleType, setOracleType] = useState<"TEE" | "ZKP">("TEE");

  async function executeAction() {
    setLoading(true);
    try {
      let body: Record<string, unknown> = { action };

      switch (action) {
        case "mint":
          body = {
            ...body,
            agentMarketId: parseInt(agentId),
            ownerAddress,
            oracleType,
            agentName: `Agent #${agentId}`,
          };
          break;
        case "authorizeUsage":
          body = {
            ...body,
            agentMarketId: parseInt(agentId),
            userAddress,
          };
          break;
        case "transfer":
          body = {
            ...body,
            tokenId: 1,
            fromAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
            toAddress: userAddress,
          };
          break;
        case "listAll":
          break;
      }

      const res = await fetch("/api/0g/inft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false });
    }
    setLoading(false);
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Image className="size-5 text-purple-400" />
          iNFT Agent Marketplace
          <Badge variant="outline" className="ml-auto border-purple-500/30 text-purple-400 text-[10px]">
            iNFT Track
          </Badge>
        </CardTitle>
        <CardDescription>
          Mint AI agents as ERC-7857 iNFTs with encrypted intelligence and usage authorization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Selection */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { value: "mint", label: "Mint iNFT", icon: Image },
            { value: "authorizeUsage", label: "Authorize", icon: Unlock },
            { value: "transfer", label: "Transfer", icon: ArrowRight },
            { value: "listAll", label: "List All", icon: Activity },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setAction(value)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${action === value
                ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Dynamic Inputs */}
        {(action === "mint" || action === "authorizeUsage") && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Agent Market ID</Label>
              <Input
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="h-9 border-zinc-700 bg-zinc-900 text-sm"
                placeholder="1"
              />
            </div>
            {action === "mint" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Oracle Type</Label>
                  <Select value={oracleType} onValueChange={(v) => setOracleType(v as "TEE" | "ZKP")}>
                    <SelectTrigger className="h-9 border-zinc-700 bg-zinc-900 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEE">TEE (Trusted Execution)</SelectItem>
                      <SelectItem value="ZKP">ZKP (Zero-Knowledge Proof)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs text-zinc-400">Owner Address</Label>
                  <Input
                    value={ownerAddress}
                    onChange={(e) => setOwnerAddress(e.target.value)}
                    className="h-9 border-zinc-700 bg-zinc-900 text-sm font-mono"
                    placeholder="0x..."
                  />
                </div>
              </>
            )}
            {action === "authorizeUsage" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">User Address (Hirer)</Label>
                <Input
                  value={userAddress}
                  onChange={(e) => setUserAddress(e.target.value)}
                  className="h-9 border-zinc-700 bg-zinc-900 text-sm font-mono"
                  placeholder="0x..."
                />
              </div>
            )}
          </div>
        )}

        {action === "transfer" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Transfer To Address</Label>
              <Input
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                className="h-9 border-zinc-700 bg-zinc-900 text-sm font-mono"
                placeholder="0x..."
              />
            </div>
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-2">
              <p className="text-[10px] text-yellow-400 flex items-center gap-1">
                <AlertTriangle className="size-3" />
                Transfer involves oracle re-encryption. The new owner will receive access to the AI agent&apos;s encrypted intelligence.
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={executeAction}
          disabled={loading}
          className="w-full gap-2 bg-purple-600 hover:bg-purple-500 text-white"
        >
          {loading ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : action === "mint" ? (
            <Image className="size-3.5" />
          ) : action === "authorizeUsage" ? (
            <Unlock className="size-3.5" />
          ) : action === "transfer" ? (
            <ArrowRight className="size-3.5" />
          ) : (
            <Activity className="size-3.5" />
          )}
          {loading
            ? "Processing..."
            : action === "mint"
              ? "Mint Agent as iNFT"
              : action === "authorizeUsage"
                ? "Authorize Usage"
                : action === "transfer"
                  ? "Transfer iNFT"
                  : "List All iNFTs"}
        </Button>

        {/* Results */}
        {result && (
          <>
            <Separator className="bg-zinc-800" />

            {result.success ? (
              <div className="space-y-3">
                {/* Success Header */}
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">
                    {action === "mint"
                      ? `iNFT #${result.tokenId} Minted`
                      : action === "authorizeUsage"
                        ? "Usage Authorized"
                        : action === "transfer"
                          ? "Transfer Complete"
                          : `${(result as { totalMinted?: number }).totalMinted || 0} iNFTs Found`}
                  </span>
                  <Badge variant="outline" className="ml-auto border-zinc-700 text-[10px] text-zinc-500">
                    ERC-7857
                  </Badge>
                </div>

                {/* Transaction info if available */}
                {(result as { transaction?: { hash?: string; explorerUrl?: string } }).transaction && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-2 text-[10px] font-mono text-zinc-500">
                    <span className="text-zinc-400">Tx:</span>{" "}
                    {((result as { transaction?: { hash?: string } }).transaction?.hash || "").slice(0, 20)}...
                    <a
                      href={(result as { transaction?: { explorerUrl?: string } }).transaction?.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300"
                    >
                      <ExternalLink className="size-2.5" />
                      Explorer
                    </a>
                  </div>
                )}

                {/* Full JSON result */}
                <JsonViewer data={result} maxHeight="400px" />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertTriangle className="size-4" />
                {(result as { error?: string }).error || "Operation failed"}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- Page ----------

export default function OGPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400">
            <Zap className="size-4" />
            0G Labs Integration
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          0G AI <span className="text-indigo-400">Integration Suite</span>
        </h1>
        <p className="mt-2 max-w-3xl text-zinc-400">
          0G Labs for AgentMarket: DeFAI decision engine with structured guardrails,
          decentralized AI inference via 0G Compute, and tradeable AI agents as ERC-7857 iNFTs.
        </p>
      </div>

      {/* Track Overview Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: Brain,
            title: "DeFAI Track",
            prize: "$7K",
            color: "indigo",
            desc: "Structured AI decisions for agent hiring with risk guardrails and payment routing",
          },
          {
            icon: Cpu,
            title: "AI Compute Track",
            prize: "$7K",
            color: "cyan",
            desc: "Decentralized inference via 0G Compute with verifiable proofs (TEEML/ZKML/OPML)",
          },
          {
            icon: Image,
            title: "iNFT Track",
            prize: "$7K",
            color: "purple",
            desc: "Mint agents as ERC-7857 iNFTs with encrypted intelligence and usage authorization",
          },
        ].map(({ icon: Icon, title, prize, color, desc }) => (
          <div
            key={title}
            className={`rounded-xl border border-${color}-500/20 bg-${color}-500/5 p-4 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 text-${color}-400`}>
                <Icon className="size-5" />
                <span className="text-sm font-semibold">{title}</span>
              </div>
              <Badge variant="outline" className={`border-${color}-500/30 text-${color}-400 text-xs`}>
                {prize}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400">{desc}</p>
          </div>
        ))}
      </div>

      {/* Main Panels */}
      <div className="space-y-6">
        {/* DeFAI Decision Engine */}
        <DecisionPanel />

        {/* 0G Compute Inference */}
        <InferencePanel />

        {/* iNFT Agent Marketplace */}
        <INFTPanel />
      </div>

      {/* Links */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <a
          href="https://docs.0g.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
        >
          <ExternalLink className="size-4" />
          0G Labs Documentation
        </a>
        <a
          href="https://docs.0g.ai/concepts/inft"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
        >
          <ExternalLink className="size-4" />
          iNFT / ERC-7857 Docs
        </a>
        <a
          href="https://docs.0g.ai/concepts/compute"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
        >
          <ExternalLink className="size-4" />
          0G Compute Network
        </a>
      </div>
    </section>
  );
}
