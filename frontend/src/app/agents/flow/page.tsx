"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bot,
  ArrowRight,
  Zap,
  Activity,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  CircleDot,
  ArrowLeftRight,
  Landmark,
  DollarSign,
  BarChart3,
  ShoppingCart,
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

// ---------- types ----------
interface AgentNode {
  id: string;
  name: string;
  role: string;
  status: "idle" | "thinking" | "executing" | "done";
  color: string;
  icon: typeof Bot;
}

interface AgentEvent {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  action: string;
  detail: string;
  txHash?: string;
  chain: "hedera" | "adi";
  status: "pending" | "success" | "failed";
  category: "swap" | "lend" | "balance" | "communicate" | "pay" | "analyze";
}

interface DeFiPosition {
  protocol: string;
  type: string;
  token: string;
  amount: string;
  value: string;
  apy?: string;
}

// ---------- mock data generators ----------
const EXPLORER_URLS = {
  hedera: "https://hashscan.io/testnet/transaction/",
  adi: "https://explorer.ab.testnet.adifoundation.ai/tx/",
};

function generateTxHash(): string {
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function createDemoEvents(): AgentEvent[] {
  const now = Date.now();
  return [
    {
      id: "evt-1",
      timestamp: now - 180000,
      agentId: "commerce",
      agentName: "Commerce Agent",
      action: "Received DDSC Payment",
      detail: "Earned 250 DDSC from task completion on ADI Chain",
      txHash: generateTxHash(),
      chain: "adi",
      status: "success",
      category: "pay",
    },
    {
      id: "evt-2",
      timestamp: now - 150000,
      agentId: "commerce",
      agentName: "Commerce Agent",
      action: "Requested DeFi Evaluation",
      detail: "Asked Analytics Agent to evaluate DDSC -> WHBAR swap opportunity",
      chain: "hedera",
      status: "success",
      category: "communicate",
    },
    {
      id: "evt-3",
      timestamp: now - 120000,
      agentId: "analytics",
      agentName: "Analytics Agent",
      action: "Fetched HBAR Price",
      detail: "Pyth Oracle: HBAR = $0.2847 (confidence: 0.12%)",
      chain: "hedera",
      status: "success",
      category: "analyze",
    },
    {
      id: "evt-4",
      timestamp: now - 100000,
      agentId: "analytics",
      agentName: "Analytics Agent",
      action: "Got Swap Quote",
      detail: "SaucerSwap: 200 DDSC -> 142.3 WHBAR (impact: 0.8%)",
      chain: "hedera",
      status: "success",
      category: "analyze",
    },
    {
      id: "evt-5",
      timestamp: now - 90000,
      agentId: "analytics",
      agentName: "Analytics Agent",
      action: "Checked Pool Liquidity",
      detail: "DDSC/WHBAR pool: $45K TVL, sufficient depth for 200 DDSC",
      chain: "hedera",
      status: "success",
      category: "analyze",
    },
    {
      id: "evt-6",
      timestamp: now - 80000,
      agentId: "analytics",
      agentName: "Analytics Agent",
      action: "Evaluation Complete",
      detail: 'Recommendation: EXECUTE swap. Expected return: +2.1% vs oracle. Risk: LOW',
      chain: "hedera",
      status: "success",
      category: "communicate",
    },
    {
      id: "evt-7",
      timestamp: now - 60000,
      agentId: "defi",
      agentName: "DeFi Agent",
      action: "Approved DDSC for SaucerSwap",
      detail: "Set unlimited allowance for SaucerSwap V1 Router",
      txHash: generateTxHash(),
      chain: "hedera",
      status: "success",
      category: "swap",
    },
    {
      id: "evt-8",
      timestamp: now - 45000,
      agentId: "defi",
      agentName: "DeFi Agent",
      action: "Swapped DDSC -> WHBAR",
      detail: "200 DDSC -> 143.1 WHBAR on SaucerSwap V1 (slippage: 0.56%)",
      txHash: generateTxHash(),
      chain: "hedera",
      status: "success",
      category: "swap",
    },
    {
      id: "evt-9",
      timestamp: now - 30000,
      agentId: "defi",
      agentName: "DeFi Agent",
      action: "Deposited to Bonzo Finance",
      detail: "Supplied 143.1 WHBAR as collateral (est. 8.2% APY)",
      txHash: generateTxHash(),
      chain: "hedera",
      status: "success",
      category: "lend",
    },
    {
      id: "evt-10",
      timestamp: now - 15000,
      agentId: "defi",
      agentName: "DeFi Agent",
      action: "Checked Lending Position",
      detail: "Health factor: 2.45, Collateral: $40.75, Debt: $0.00",
      chain: "hedera",
      status: "success",
      category: "balance",
    },
    {
      id: "evt-11",
      timestamp: now - 5000,
      agentId: "commerce",
      agentName: "Commerce Agent",
      action: "Treasury Update",
      detail: "Reserve: 50 DDSC (operating). Deployed: 143.1 WHBAR in Bonzo. Total value: $91.50",
      chain: "hedera",
      status: "success",
      category: "balance",
    },
  ];
}

const DEMO_POSITIONS: DeFiPosition[] = [
  { protocol: "Bonzo Finance", type: "Lending", token: "WHBAR", amount: "143.1", value: "$40.75", apy: "8.2%" },
  { protocol: "Wallet", type: "Reserve", token: "DDSC", amount: "50.0", value: "$13.61", apy: undefined },
  { protocol: "Wallet", type: "Reserve", token: "HBAR", amount: "2.5", value: "$0.71", apy: undefined },
];

// ---------- components ----------
function AgentTopology({ agents, events }: { agents: AgentNode[]; events: AgentEvent[] }) {
  // Find most recent event per agent for status
  const agentStatus = new Map<string, string>();
  events.slice(-4).forEach((e) => {
    agentStatus.set(e.agentId, e.action);
  });

  return (
    <div className="relative flex items-center justify-center gap-6 py-8 md:gap-12">
      {agents.map((agent, idx) => (
        <div key={agent.id} className="flex items-center gap-4 md:gap-8">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`relative flex size-16 items-center justify-center rounded-2xl border-2 md:size-20 ${
                agent.status === "executing"
                  ? `border-${agent.color}-400 bg-${agent.color}-500/20 shadow-lg shadow-${agent.color}-500/20`
                  : agent.status === "thinking"
                  ? `border-${agent.color}-400/50 bg-${agent.color}-500/10 animate-pulse`
                  : `border-zinc-700 bg-zinc-900`
              }`}
            >
              <agent.icon className={`size-7 md:size-8 text-${agent.color}-400`} />
              {agent.status !== "idle" && (
                <span className="absolute -right-1 -top-1 flex size-3">
                  <span className={`absolute inline-flex size-full animate-ping rounded-full bg-${agent.color}-400 opacity-75`} />
                  <span className={`relative inline-flex size-3 rounded-full bg-${agent.color}-500`} />
                </span>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-white md:text-sm">{agent.name}</p>
              <p className="text-[10px] text-zinc-500 md:text-xs">{agent.role}</p>
            </div>
            {agentStatus.has(agent.id) && (
              <p className="max-w-[120px] truncate text-center text-[9px] text-zinc-600 md:max-w-[160px]">
                {agentStatus.get(agent.id)}
              </p>
            )}
          </div>
          {idx < agents.length - 1 && (
            <div className="flex flex-col items-center gap-1">
              <ArrowLeftRight className="size-4 text-zinc-600" />
              <span className="text-[9px] text-zinc-700">a2a</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function EventFeed({ events }: { events: AgentEvent[] }) {
  const categoryIcons: Record<string, typeof Bot> = {
    swap: ArrowLeftRight,
    lend: Landmark,
    balance: DollarSign,
    communicate: Bot,
    pay: ShoppingCart,
    analyze: BarChart3,
  };

  const categoryColors: Record<string, string> = {
    swap: "text-green-400 bg-green-500/10 border-green-500/20",
    lend: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    balance: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    communicate: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    pay: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    analyze: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  };

  const agentColors: Record<string, string> = {
    commerce: "text-indigo-400",
    analytics: "text-cyan-400",
    defi: "text-green-400",
    merchant: "text-orange-400",
  };

  return (
    <div className="space-y-2">
      {events
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((event) => {
          const Icon = categoryIcons[event.category] || Activity;
          const colorClass = categoryColors[event.category] || "text-zinc-400 bg-zinc-500/10 border-zinc-500/20";
          const elapsed = Math.floor((Date.now() - event.timestamp) / 1000);
          const timeStr =
            elapsed < 60
              ? `${elapsed}s ago`
              : elapsed < 3600
              ? `${Math.floor(elapsed / 60)}m ago`
              : `${Math.floor(elapsed / 3600)}h ago`;

          return (
            <div
              key={event.id}
              className="group flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2.5 transition-colors hover:border-zinc-700"
            >
              <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border ${colorClass}`}>
                <Icon className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${agentColors[event.agentId] || "text-zinc-400"}`}>
                    {event.agentName}
                  </span>
                  <span className="text-[10px] text-zinc-600">{timeStr}</span>
                  <Badge
                    variant="outline"
                    className={`ml-auto text-[9px] ${
                      event.chain === "hedera"
                        ? "border-purple-500/30 text-purple-400"
                        : "border-indigo-500/30 text-indigo-400"
                    }`}
                  >
                    {event.chain === "hedera" ? "Hedera" : "ADI"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm font-medium text-white">{event.action}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{event.detail}</p>
                {event.txHash && (
                  <a
                    href={`${EXPLORER_URLS[event.chain]}${event.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[10px] text-zinc-600 transition-colors hover:text-zinc-400"
                  >
                    <ExternalLink className="size-2.5" />
                    {event.txHash.slice(0, 10)}...{event.txHash.slice(-6)}
                  </a>
                )}
              </div>
              <div className="mt-0.5 shrink-0">
                {event.status === "success" ? (
                  <CircleDot className="size-3.5 text-green-500" />
                ) : event.status === "pending" ? (
                  <RefreshCw className="size-3.5 animate-spin text-yellow-500" />
                ) : (
                  <CircleDot className="size-3.5 text-red-500" />
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}

function PositionsSummary({ positions }: { positions: DeFiPosition[] }) {
  const totalValue = positions.reduce((sum, p) => sum + parseFloat(p.value.replace("$", "")), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">Total Portfolio Value</span>
        <span className="text-lg font-bold text-white">${totalValue.toFixed(2)}</span>
      </div>
      <Separator className="bg-zinc-800" />
      {positions.map((pos, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-zinc-800">
              {pos.type === "Lending" ? (
                <TrendingUp className="size-4 text-green-400" />
              ) : (
                <DollarSign className="size-4 text-yellow-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-white">
                {pos.amount} {pos.token}
              </p>
              <p className="text-[10px] text-zinc-500">
                {pos.protocol} - {pos.type}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-white">{pos.value}</p>
            {pos.apy && <p className="text-[10px] text-green-400">{pos.apy} APY</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- page ----------
export default function AgentFlowPage() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isLive, setIsLive] = useState(true);

  const agents: AgentNode[] = [
    { id: "commerce", name: "Commerce", role: "Earns & Deploys", status: "done", color: "indigo", icon: ShoppingCart },
    { id: "analytics", name: "Analytics", role: "Evaluates & Recommends", status: "done", color: "cyan", icon: BarChart3 },
    { id: "defi", name: "DeFi", role: "Swaps & Lends", status: "executing", color: "green", icon: TrendingUp },
  ];

  useEffect(() => {
    setEvents(createDemoEvents());
  }, []);

  // Simulate live updates
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      const liveActions = [
        { action: "Health Factor Check", detail: "Bonzo position healthy: HF = 2.45", agentId: "defi", agentName: "DeFi Agent", category: "balance" as const },
        { action: "Price Monitor", detail: `HBAR = $${(0.28 + Math.random() * 0.02).toFixed(4)}`, agentId: "analytics", agentName: "Analytics Agent", category: "analyze" as const },
        { action: "Market Scan", detail: "Evaluating SAUCE/WHBAR LP opportunity", agentId: "analytics", agentName: "Analytics Agent", category: "analyze" as const },
        { action: "Balance Check", detail: `Reserve: 50 DDSC, Deployed: 143.1 WHBAR`, agentId: "commerce", agentName: "Commerce Agent", category: "balance" as const },
      ];
      const pick = liveActions[Math.floor(Math.random() * liveActions.length)];
      const newEvent: AgentEvent = {
        id: `live-${Date.now()}`,
        timestamp: Date.now(),
        agentId: pick.agentId,
        agentName: pick.agentName,
        action: pick.action,
        detail: pick.detail,
        chain: "hedera",
        status: "success",
        category: pick.category,
      };
      setEvents((prev) => [...prev.slice(-20), newEvent]);
    }, 8000);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-sm text-green-400">
            <Activity className="size-4" />
            Agent Flow Visualization
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-400">
            Hedera Testnet
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className={`ml-auto gap-1.5 border-zinc-700 text-xs ${isLive ? "text-green-400" : "text-zinc-500"}`}
          >
            <CircleDot className={`size-3 ${isLive ? "text-green-500 animate-pulse" : "text-zinc-600"}`} />
            {isLive ? "Live" : "Paused"}
          </Button>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Autonomous Agent DeFi Flow
        </h1>
        <p className="mt-2 max-w-3xl text-zinc-400">
          Real-time visualization of AI agents coordinating DeFi operations on Hedera.
          Commerce Agent earns DDSC, Analytics evaluates opportunities, DeFi Agent executes swaps and lending.
        </p>
      </div>

      {/* Agent Topology */}
      <Card className="mb-6 border-zinc-800 bg-zinc-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Bot className="size-4 text-indigo-400" />
            Agent Network
          </CardTitle>
          <CardDescription>
            Three autonomous agents coordinating treasury management via agent-to-agent communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AgentTopology agents={agents} events={events} />
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity Feed - 2 columns */}
        <div className="lg:col-span-2">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Activity className="size-4 text-green-400" />
                Activity Feed
                <Badge variant="outline" className="ml-auto border-zinc-700 text-[10px] text-zinc-500">
                  {events.length} events
                </Badge>
              </CardTitle>
              <CardDescription>
                Timestamped agent actions with on-chain transaction links
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              <EventFeed events={events} />
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* DeFi Positions */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <TrendingUp className="size-4 text-green-400" />
                DeFi Positions
              </CardTitle>
              <CardDescription>Current agent treasury allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <PositionsSummary positions={DEMO_POSITIONS} />
            </CardContent>
          </Card>

          {/* Strategy Info */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Zap className="size-4 text-yellow-400" />
                Active Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <p className="text-xs font-semibold text-white">Treasury Management</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Commerce Agent earns DDSC from tasks. 80% is swapped to WHBAR on SaucerSwap
                  and deposited to Bonzo Finance for 8.2% APY. 20% kept as operating reserve.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Protocol Risk</span>
                  <Badge variant="outline" className="border-green-500/30 text-[10px] text-green-400">
                    LOW
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Health Factor</span>
                  <span className="font-medium text-green-400">2.45</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Slippage Tolerance</span>
                  <span className="font-medium text-white">1%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Rebalance Interval</span>
                  <span className="font-medium text-white">5 min</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <ExternalLink className="size-4 text-zinc-400" />
                Explorer Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="https://hashscan.io/testnet"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <ExternalLink className="size-3" />
                HashScan (Hedera Testnet)
              </a>
              <a
                href="https://explorer.ab.testnet.adifoundation.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <ExternalLink className="size-3" />
                ADI Chain Explorer
              </a>
              <Link
                href="/agents"
                className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
              >
                <Bot className="size-3" />
                Agent Marketplace
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
