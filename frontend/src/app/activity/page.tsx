"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReadContract } from "wagmi";
import { usePublicClient } from "wagmi";
import {
  AGENT_REGISTRY_ABI,
  PAYMENT_ROUTER_ABI,
  SUBSCRIPTION_MANAGER_ABI,
  MERCHANT_VAULT_ABI,
} from "@/lib/contracts";
import { useChainContracts } from "@/lib/useChainContracts";
import { formatEther, type Log } from "viem";
import {
  Activity,
  Bot,
  Coins,
  CreditCard,
  ArrowRightLeft,
  RefreshCw,
  Zap,
  Clock,
  TrendingUp,
  Network,
  Radio,
  Timer,
  ShieldCheck,
  CircleDot,
  ArrowRight,
  Star,
  Play,
  CheckCircle2,
  Loader2,
  Pause,
  Users,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActivityEvent {
  id: string;
  type: "agent_registered" | "payment_created" | "subscription_created" | "checkout_completed";
  timestamp: number;
  blockNumber: bigint;
  description: string;
  details: Record<string, string>;
  icon: typeof Bot;
  color: string;
}

interface AgentInfo {
  id: number;
  owner: string;
  metadataURI: string;
  pricePerTask: bigint;
  isActive: boolean;
  totalTasks: bigint;
  totalRating: bigint;
  ratingCount: bigint;
  createdAt: bigint;
}

interface SubscriptionInfo {
  id: number;
  subscriber: string;
  agentId: bigint;
  amount: bigint;
  interval: bigint;
  nextPayment: bigint;
  isActive: boolean;
  totalPaid: bigint;
  paymentCount: bigint;
  token: string;
}

type AgentState = "idle" | "processing" | "executing" | "completed";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr ?? "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(ts: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Due now";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// Deterministic "state" from on-chain data so the view is always derived
function deriveAgentState(agent: AgentInfo): AgentState {
  if (!agent.isActive) return "idle";
  const taskCount = Number(agent.totalTasks);
  // Simple heuristic: recently created with no tasks -> processing (registering)
  const nowish = Math.floor(Date.now() / 1000);
  const age = nowish - Number(agent.createdAt);
  if (taskCount === 0 && age < 600) return "processing";
  if (taskCount > 0 && age < 300) return "executing";
  if (taskCount > 0) return "completed";
  return "idle";
}

const stateConfig: Record<AgentState, { label: string; color: string; dotClass: string; icon: typeof Play }> = {
  idle: { label: "Idle", color: "text-gray-400", dotClass: "bg-gray-400", icon: Pause },
  processing: { label: "Processing", color: "text-yellow-400", dotClass: "bg-yellow-400 animate-pulse", icon: Loader2 },
  executing: { label: "Executing", color: "text-blue-400", dotClass: "bg-blue-400 animate-pulse", icon: Play },
  completed: { label: "Completed", color: "text-green-400", dotClass: "bg-green-400", icon: CheckCircle2 },
};

// ---------------------------------------------------------------------------
// Component: Live Activity Feed
// ---------------------------------------------------------------------------

function LiveActivityFeed({ events, loading }: { events: ActivityEvent[]; loading: boolean }) {
  return (
    <Card className="border-white/10 bg-gray-900/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
              <Radio className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-white">Live Agent Activity</CardTitle>
              <CardDescription className="text-neutral-500">
                Real-time on-chain events
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span className="text-xs text-green-400 font-medium">LIVE</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
            <p className="text-sm text-neutral-500">Scanning blockchain events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Activity className="h-8 w-8 text-neutral-600" />
            <p className="text-sm text-neutral-500">No events found yet. Activity will appear here as agents interact on-chain.</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
            {events.map((event, idx) => {
              const Icon = event.icon;
              return (
                <div
                  key={event.id}
                  className={`group flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-white/5 ${
                    idx === 0 ? "bg-white/[0.03]" : ""
                  }`}
                >
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${event.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {event.description}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {Object.entries(event.details).map(([key, val]) => (
                        <span
                          key={key}
                          className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-neutral-400"
                        >
                          <span className="text-neutral-600">{key}:</span> {val}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-neutral-600 mt-0.5">
                    {event.timestamp > 0 ? timeAgo(event.timestamp) : `#${event.blockNumber.toString()}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component: Agent Network Graph (CSS-based)
// ---------------------------------------------------------------------------

interface PaymentEdge {
  from: string;
  to: string;
  amount: string;
  agentId: string;
}

function AgentNetworkGraph({ agents, edges }: { agents: AgentInfo[]; edges: PaymentEdge[] }) {
  // Show up to 8 agents in a circle-ish layout
  const displayAgents = agents.slice(0, 8);
  const uniqueAddrs = Array.from(new Set(displayAgents.map((a) => a.owner)));

  // Assign positions in a circle
  const positions = uniqueAddrs.map((_, i) => {
    const angle = (2 * Math.PI * i) / Math.max(uniqueAddrs.length, 1) - Math.PI / 2;
    const rx = 38;
    const ry = 35;
    return {
      x: 50 + rx * Math.cos(angle),
      y: 50 + ry * Math.sin(angle),
    };
  });

  const addrIndex = (addr: string) => uniqueAddrs.indexOf(addr);

  return (
    <Card className="border-white/10 bg-gray-900/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
            <Network className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-white">Agent Network</CardTitle>
            <CardDescription className="text-neutral-500">
              Payment flows between agents
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {uniqueAddrs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Network className="h-8 w-8 text-neutral-600" />
            <p className="text-sm text-neutral-500">No agents registered yet.</p>
          </div>
        ) : (
          <div className="relative w-full" style={{ paddingBottom: "80%" }}>
            {/* SVG for connection lines */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="6"
                  markerHeight="4"
                  refX="5"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 6 2, 0 4" fill="#8b5cf6" opacity="0.6" />
                </marker>
              </defs>
              {edges.map((edge, i) => {
                const fromIdx = addrIndex(edge.from);
                const toIdx = addrIndex(edge.to);
                if (fromIdx === -1 || toIdx === -1) return null;
                const p1 = positions[fromIdx];
                const p2 = positions[toIdx];
                return (
                  <line
                    key={`edge-${i}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="#8b5cf6"
                    strokeWidth="0.3"
                    opacity="0.4"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>

            {/* Agent nodes */}
            {uniqueAddrs.map((addr, i) => {
              const pos = positions[i];
              const agentsAtAddr = displayAgents.filter((a) => a.owner === addr);
              const totalTasks = agentsAtAddr.reduce((s, a) => s + Number(a.totalTasks), 0);
              const isActive = agentsAtAddr.some((a) => a.isActive);
              return (
                <div
                  key={addr}
                  className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                  }}
                >
                  <div
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      isActive
                        ? "border-purple-500/60 bg-purple-500/20 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                        : "border-gray-600/40 bg-gray-800/60"
                    }`}
                  >
                    <Bot className={`h-4 w-4 ${isActive ? "text-purple-400" : "text-gray-500"}`} />
                    {isActive && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono whitespace-nowrap">
                    {shortAddr(addr)}
                  </span>
                  {totalTasks > 0 && (
                    <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-300 text-[9px] px-1.5 py-0">
                      {totalTasks} tasks
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component: Stats Dashboard
// ---------------------------------------------------------------------------

function StatsDashboard({
  totalPayments,
  totalVolume,
  activeAgentCount,
  activeSubscriptions,
  mostActiveAgent,
  currencySymbol,
}: {
  totalPayments: string;
  totalVolume: string;
  activeAgentCount: string;
  activeSubscriptions: string;
  mostActiveAgent: { id: number; tasks: number } | null;
  currencySymbol: string;
}) {
  const stats = [
    {
      label: "Agent-to-Agent Txns",
      value: totalPayments,
      icon: ArrowRightLeft,
      color: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      label: "Network Volume",
      value: totalVolume !== "..." ? `${totalVolume} ${currencySymbol}` : "...",
      icon: TrendingUp,
      color: "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      label: "Active Agents",
      value: activeAgentCount,
      icon: Bot,
      color: "bg-green-500/20",
      iconColor: "text-green-400",
    },
    {
      label: "Active Subscriptions",
      value: activeSubscriptions,
      icon: RefreshCw,
      color: "bg-indigo-500/20",
      iconColor: "text-indigo-400",
    },
  ];

  return (
    <Card className="border-white/10 bg-gray-900/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20">
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <CardTitle className="text-white">Multi-Agent Stats</CardTitle>
            <CardDescription className="text-neutral-500">
              Network-wide metrics
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map(({ label, value, icon: Icon, color, iconColor }) => (
            <div
              key={label}
              className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-4"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <span className="text-2xl font-bold text-white">{value}</span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                {label}
              </span>
            </div>
          ))}
        </div>
        {mostActiveAgent && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/20">
              <Star className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Most Active Agent</p>
              <p className="text-xs text-neutral-400">
                Agent #{mostActiveAgent.id} &mdash; {mostActiveAgent.tasks} tasks completed
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component: Agent State Machine View
// ---------------------------------------------------------------------------

function AgentStateMachineView({ agents }: { agents: AgentInfo[] }) {
  const displayAgents = agents.slice(0, 6);

  return (
    <Card className="border-white/10 bg-gray-900/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
            <CircleDot className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-white">Agent State Machine</CardTitle>
            <CardDescription className="text-neutral-500">
              Current state of each agent
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <CircleDot className="h-8 w-8 text-neutral-600" />
            <p className="text-sm text-neutral-500">No agents to display.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* State legend */}
            <div className="flex flex-wrap gap-4 mb-2 pb-3 border-b border-white/5">
              {(Object.keys(stateConfig) as AgentState[]).map((state) => {
                const cfg = stateConfig[state];
                return (
                  <div key={state} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${cfg.dotClass}`} />
                    <span className={`text-[11px] font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>

            {/* Agent rows */}
            {displayAgents.map((agent) => {
              const state = deriveAgentState(agent);
              const cfg = stateConfig[state];
              const StateIcon = cfg.icon;
              const avgRating =
                Number(agent.ratingCount) > 0
                  ? (Number(agent.totalRating) / Number(agent.ratingCount)).toFixed(1)
                  : "--";

              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
                >
                  {/* Agent id + state indicator */}
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800">
                    <Bot className="h-4 w-4 text-neutral-400" />
                    <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-gray-900 ${cfg.dotClass}`} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">Agent #{agent.id}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 border-current/20 ${cfg.color}`}
                      >
                        <StateIcon className="h-2.5 w-2.5 mr-0.5" />
                        {cfg.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 font-mono">
                      {shortAddr(agent.owner)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{Number(agent.totalTasks)}</p>
                      <p className="text-[10px] text-neutral-600">Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{avgRating}</p>
                      <p className="text-[10px] text-neutral-600">Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">
                        {formatEther(agent.pricePerTask).slice(0, 6)}
                      </p>
                      <p className="text-[10px] text-neutral-600">Price</p>
                    </div>
                  </div>

                  {/* State flow arrows */}
                  <div className="hidden lg:flex items-center gap-1 shrink-0 ml-2">
                    {(["idle", "processing", "executing", "completed"] as AgentState[]).map((s, i) => {
                      const sCfg = stateConfig[s];
                      const isCurrent = s === state;
                      const isPast =
                        (["idle", "processing", "executing", "completed"] as AgentState[]).indexOf(s) <=
                        (["idle", "processing", "executing", "completed"] as AgentState[]).indexOf(state);
                      return (
                        <div key={s} className="flex items-center gap-1">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ${
                              isCurrent
                                ? `${sCfg.dotClass} text-black`
                                : isPast
                                ? "bg-white/10 text-white/60"
                                : "bg-white/5 text-white/20"
                            }`}
                          >
                            {i + 1}
                          </span>
                          {i < 3 && (
                            <ArrowRight
                              className={`h-3 w-3 ${isPast ? "text-white/30" : "text-white/10"}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Component: Autonomous Operation Indicators
// ---------------------------------------------------------------------------

function AutonomousOperations({
  subscriptions,
  currencySymbol,
}: {
  subscriptions: SubscriptionInfo[];
  currencySymbol: string;
}) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeSubscriptions = subscriptions.filter((s) => s.isActive);
  // Sort by next payment ascending
  const sorted = [...activeSubscriptions].sort(
    (a, b) => Number(a.nextPayment) - Number(b.nextPayment)
  );

  return (
    <Card className="border-white/10 bg-gray-900/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
            <Timer className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <CardTitle className="text-white">Autonomous Operations</CardTitle>
            <CardDescription className="text-neutral-500">
              Scheduled payments and renewals
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Timer className="h-8 w-8 text-neutral-600" />
            <p className="text-sm text-neutral-500">No active autonomous operations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.slice(0, 6).map((sub) => {
              const nextTs = Number(sub.nextPayment);
              const secondsUntil = nextTs - now;
              const isDue = secondsUntil <= 0;
              const isUpcoming = secondsUntil > 0 && secondsUntil < 3600;
              const intervalHrs = Math.floor(Number(sub.interval) / 3600);

              return (
                <div
                  key={sub.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                    isDue
                      ? "border-red-500/30 bg-red-500/5"
                      : isUpcoming
                      ? "border-orange-500/20 bg-orange-500/5"
                      : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isDue ? "bg-red-500/20" : isUpcoming ? "bg-orange-500/20" : "bg-blue-500/20"
                    }`}
                  >
                    {isDue ? (
                      <Zap className="h-4 w-4 text-red-400 animate-pulse" />
                    ) : (
                      <Clock className={`h-4 w-4 ${isUpcoming ? "text-orange-400" : "text-blue-400"}`} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        Sub #{sub.id} {"->"} Agent #{Number(sub.agentId)}
                      </span>
                      {isDue && (
                        <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-300 text-[10px] px-1.5 py-0 animate-pulse">
                          EXECUTE NOW
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {formatEther(sub.amount)} {currencySymbol} every {intervalHrs > 0 ? `${intervalHrs}h` : `${Number(sub.interval)}s`}
                      {" | "}Paid {Number(sub.paymentCount)}x
                      {" | "}{shortAddr(sub.subscriber)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-mono font-bold ${
                        isDue ? "text-red-400" : isUpcoming ? "text-orange-400" : "text-blue-400"
                      }`}
                    >
                      {formatCountdown(Math.max(0, secondsUntil))}
                    </p>
                    <p className="text-[10px] text-neutral-600">next action</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page: /activity
// ---------------------------------------------------------------------------

export default function ActivityPage() {
  const { contracts, chainMeta, chainId } = useChainContracts();
  const publicClient = usePublicClient();

  // ---- On-chain reads ----
  const { data: activeAgentCount } = useReadContract({
    address: contracts.agentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getActiveAgentCount",
  });
  const { data: totalPayments } = useReadContract({
    address: contracts.paymentRouter,
    abi: PAYMENT_ROUTER_ABI,
    functionName: "totalPayments",
  });
  const { data: totalVolume } = useReadContract({
    address: contracts.paymentRouter,
    abi: PAYMENT_ROUTER_ABI,
    functionName: "totalVolume",
  });
  const { data: activeSubscriptions } = useReadContract({
    address: contracts.subscriptionManager,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "getActiveSubscriptionCount",
  });
  const { data: nextAgentId } = useReadContract({
    address: contracts.agentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "nextAgentId",
  });
  const { data: nextSubscriptionId } = useReadContract({
    address: contracts.subscriptionManager,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "nextSubscriptionId",
  });

  // ---- State for fetched data ----
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [subscriptionList, setSubscriptionList] = useState<SubscriptionInfo[]>([]);
  const [paymentEdges, setPaymentEdges] = useState<PaymentEdge[]>([]);

  // ---- Fetch agents ----
  const fetchAgents = useCallback(async () => {
    if (!publicClient || !nextAgentId) return;
    const count = Number(nextAgentId);
    const fetched: AgentInfo[] = [];
    for (let i = 1; i < count && i <= 20; i++) {
      try {
        const data = await publicClient.readContract({
          address: contracts.agentRegistry,
          abi: AGENT_REGISTRY_ABI,
          functionName: "getAgent",
          args: [BigInt(i)],
        });
        if (data) {
          const d = data as {
            owner: string;
            metadataURI: string;
            pricePerTask: bigint;
            isActive: boolean;
            totalTasks: bigint;
            totalRating: bigint;
            ratingCount: bigint;
            createdAt: bigint;
          };
          fetched.push({
            id: i,
            owner: d.owner,
            metadataURI: d.metadataURI,
            pricePerTask: d.pricePerTask,
            isActive: d.isActive,
            totalTasks: d.totalTasks,
            totalRating: d.totalRating,
            ratingCount: d.ratingCount,
            createdAt: d.createdAt,
          });
        }
      } catch {
        // skip
      }
    }
    setAgents(fetched);
  }, [publicClient, nextAgentId, contracts.agentRegistry]);

  // ---- Fetch subscriptions ----
  const fetchSubscriptions = useCallback(async () => {
    if (!publicClient || !nextSubscriptionId) return;
    const count = Number(nextSubscriptionId);
    const fetched: SubscriptionInfo[] = [];
    for (let i = 1; i < count && i <= 20; i++) {
      try {
        const data = await publicClient.readContract({
          address: contracts.subscriptionManager,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: "getSubscription",
          args: [BigInt(i)],
        });
        if (data) {
          const d = data as {
            subscriber: string;
            agentId: bigint;
            amount: bigint;
            interval: bigint;
            nextPayment: bigint;
            isActive: boolean;
            totalPaid: bigint;
            paymentCount: bigint;
            token: string;
          };
          fetched.push({
            id: i,
            subscriber: d.subscriber,
            agentId: d.agentId,
            amount: d.amount,
            interval: d.interval,
            nextPayment: d.nextPayment,
            isActive: d.isActive,
            totalPaid: d.totalPaid,
            paymentCount: d.paymentCount,
            token: d.token,
          });
        }
      } catch {
        // skip
      }
    }
    setSubscriptionList(fetched);
  }, [publicClient, nextSubscriptionId, contracts.subscriptionManager]);

  // ---- Fetch on-chain events ----
  const fetchEvents = useCallback(async () => {
    if (!publicClient) return;
    setEventsLoading(true);

    const allEvents: ActivityEvent[] = [];

    try {
      // Get recent block number safely
      let toBlock: bigint;
      try {
        toBlock = await publicClient.getBlockNumber();
      } catch {
        toBlock = BigInt(0);
      }
      // Scan a reasonable window of blocks (last ~5000 blocks)
      const fromBlock = toBlock > BigInt(5000) ? toBlock - BigInt(5000) : BigInt(0);

      // Fetch AgentRegistered events
      try {
        const agentLogs = await publicClient.getLogs({
          address: contracts.agentRegistry,
          event: {
            type: "event",
            name: "AgentRegistered",
            inputs: [
              { name: "agentId", type: "uint256", indexed: true },
              { name: "owner", type: "address", indexed: true },
              { name: "metadataURI", type: "string", indexed: false },
              { name: "pricePerTask", type: "uint256", indexed: false },
            ],
          },
          fromBlock,
          toBlock,
        });

        for (const log of agentLogs) {
          const args = log.args as {
            agentId?: bigint;
            owner?: string;
            metadataURI?: string;
            pricePerTask?: bigint;
          };
          allEvents.push({
            id: `agent-${log.transactionHash}-${log.logIndex}`,
            type: "agent_registered",
            timestamp: 0,
            blockNumber: log.blockNumber ?? BigInt(0),
            description: `Agent #${args.agentId?.toString() ?? "?"} registered by ${shortAddr(args.owner ?? "")}`,
            details: {
              Agent: `#${args.agentId?.toString() ?? "?"}`,
              Owner: shortAddr(args.owner ?? ""),
              Price: args.pricePerTask ? `${formatEther(args.pricePerTask)} ${chainMeta.currencySymbol}` : "?",
            },
            icon: Bot,
            color: "bg-green-500/20 text-green-400",
          });
        }
      } catch {
        // Some RPCs may not support getLogs well
      }

      // Fetch PaymentCreated events
      try {
        const payLogs = await publicClient.getLogs({
          address: contracts.paymentRouter,
          event: {
            type: "event",
            name: "PaymentCreated",
            inputs: [
              { name: "paymentId", type: "bytes32", indexed: true },
              { name: "payer", type: "address", indexed: true },
              { name: "payee", type: "address", indexed: true },
              { name: "amount", type: "uint256", indexed: false },
              { name: "token", type: "address", indexed: false },
              { name: "agentId", type: "uint256", indexed: false },
            ],
          },
          fromBlock,
          toBlock,
        });

        const edges: PaymentEdge[] = [];
        for (const log of payLogs) {
          const args = log.args as {
            paymentId?: string;
            payer?: string;
            payee?: string;
            amount?: bigint;
            token?: string;
            agentId?: bigint;
          };
          allEvents.push({
            id: `pay-${log.transactionHash}-${log.logIndex}`,
            type: "payment_created",
            timestamp: 0,
            blockNumber: log.blockNumber ?? BigInt(0),
            description: `Payment of ${args.amount ? formatEther(args.amount) : "?"} ${chainMeta.currencySymbol} to Agent #${args.agentId?.toString() ?? "?"}`,
            details: {
              From: shortAddr(args.payer ?? ""),
              To: shortAddr(args.payee ?? ""),
              Amount: args.amount ? `${formatEther(args.amount)} ${chainMeta.currencySymbol}` : "?",
              Agent: `#${args.agentId?.toString() ?? "?"}`,
            },
            icon: Coins,
            color: "bg-purple-500/20 text-purple-400",
          });
          if (args.payer && args.payee) {
            edges.push({
              from: args.payer,
              to: args.payee,
              amount: args.amount ? formatEther(args.amount) : "0",
              agentId: args.agentId?.toString() ?? "0",
            });
          }
        }
        setPaymentEdges(edges);
      } catch {
        // skip
      }

      // Fetch SubscriptionCreated events
      try {
        const subLogs = await publicClient.getLogs({
          address: contracts.subscriptionManager,
          event: {
            type: "event",
            name: "SubscriptionCreated",
            inputs: [
              { name: "subscriptionId", type: "uint256", indexed: true },
              { name: "subscriber", type: "address", indexed: true },
              { name: "agentId", type: "uint256", indexed: true },
              { name: "amount", type: "uint256", indexed: false },
              { name: "interval", type: "uint256", indexed: false },
            ],
          },
          fromBlock,
          toBlock,
        });

        for (const log of subLogs) {
          const args = log.args as {
            subscriptionId?: bigint;
            subscriber?: string;
            agentId?: bigint;
            amount?: bigint;
            interval?: bigint;
          };
          const intervalHrs = args.interval ? Math.floor(Number(args.interval) / 3600) : 0;
          allEvents.push({
            id: `sub-${log.transactionHash}-${log.logIndex}`,
            type: "subscription_created",
            timestamp: 0,
            blockNumber: log.blockNumber ?? BigInt(0),
            description: `Subscription #${args.subscriptionId?.toString() ?? "?"} created for Agent #${args.agentId?.toString() ?? "?"}`,
            details: {
              Subscriber: shortAddr(args.subscriber ?? ""),
              Agent: `#${args.agentId?.toString() ?? "?"}`,
              Amount: args.amount ? `${formatEther(args.amount)} ${chainMeta.currencySymbol}` : "?",
              Interval: intervalHrs > 0 ? `${intervalHrs}h` : `${Number(args.interval ?? 0)}s`,
            },
            icon: RefreshCw,
            color: "bg-blue-500/20 text-blue-400",
          });
        }
      } catch {
        // skip
      }

      // Fetch CheckoutCompleted events
      try {
        const checkoutLogs = await publicClient.getLogs({
          address: contracts.merchantVault,
          event: {
            type: "event",
            name: "CheckoutCompleted",
            inputs: [
              { name: "merchantId", type: "uint256", indexed: true },
              { name: "buyer", type: "address", indexed: true },
              { name: "token", type: "address", indexed: false },
              { name: "amount", type: "uint256", indexed: false },
              { name: "orderId", type: "bytes32", indexed: false },
            ],
          },
          fromBlock,
          toBlock,
        });

        for (const log of checkoutLogs) {
          const args = log.args as {
            merchantId?: bigint;
            buyer?: string;
            token?: string;
            amount?: bigint;
            orderId?: string;
          };
          allEvents.push({
            id: `checkout-${log.transactionHash}-${log.logIndex}`,
            type: "checkout_completed",
            timestamp: 0,
            blockNumber: log.blockNumber ?? BigInt(0),
            description: `Checkout at Merchant #${args.merchantId?.toString() ?? "?"} by ${shortAddr(args.buyer ?? "")}`,
            details: {
              Merchant: `#${args.merchantId?.toString() ?? "?"}`,
              Buyer: shortAddr(args.buyer ?? ""),
              Amount: args.amount ? `${formatEther(args.amount)} ${chainMeta.currencySymbol}` : "?",
            },
            icon: CreditCard,
            color: "bg-pink-500/20 text-pink-400",
          });
        }
      } catch {
        // skip
      }

      // Try to add block timestamps
      const blockCache = new Map<string, number>();
      for (const ev of allEvents) {
        const bn = ev.blockNumber;
        const key = bn.toString();
        if (blockCache.has(key)) {
          ev.timestamp = blockCache.get(key)!;
        } else {
          try {
            const block = await publicClient.getBlock({ blockNumber: bn });
            const ts = Number(block.timestamp);
            blockCache.set(key, ts);
            ev.timestamp = ts;
          } catch {
            // leave as 0
          }
        }
      }

      // Sort by block number descending
      allEvents.sort((a, b) => {
        if (b.blockNumber > a.blockNumber) return 1;
        if (b.blockNumber < a.blockNumber) return -1;
        return 0;
      });

      setEvents(allEvents);
    } catch {
      // ignore top-level errors
    } finally {
      setEventsLoading(false);
    }
  }, [
    publicClient,
    contracts.agentRegistry,
    contracts.paymentRouter,
    contracts.subscriptionManager,
    contracts.merchantVault,
    chainMeta.currencySymbol,
  ]);

  // ---- Run fetchers ----
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // ---- Refresh events periodically (30s) ----
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // ---- Derived data ----
  const mostActiveAgent = useMemo(() => {
    if (agents.length === 0) return null;
    const sorted = [...agents].sort((a, b) => Number(b.totalTasks) - Number(a.totalTasks));
    if (Number(sorted[0].totalTasks) === 0) return null;
    return { id: sorted[0].id, tasks: Number(sorted[0].totalTasks) };
  }, [agents]);

  return (
    <div className="relative min-h-screen bg-black">
      {/* Background gradient effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[40%] left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-purple-600/15 blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] h-[50vh] w-[50vh] rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute top-[60%] -right-[10%] h-[40vh] w-[40vh] rounded-full bg-blue-500/8 blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Page header */}
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge
                  variant="outline"
                  className="border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-300"
                >
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  Observer Mode
                </Badge>
                <Badge
                  variant="outline"
                  className="border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-300"
                >
                  <span className="relative mr-1 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  Connected: {chainMeta.name}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                Agent Activity{" "}
                <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
                  Observatory
                </span>
              </h1>
              <p className="mt-2 text-neutral-400 text-base">
                Real-time observation of autonomous agent flows, states, and on-chain interactions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Activity className="h-4 w-4" />
              <span>Auto-refreshing every 30s</span>
            </div>
          </div>
        </section>

        {/* Main content grid */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left column */}
            <div className="space-y-6">
              <LiveActivityFeed events={events} loading={eventsLoading} />
              <AgentStateMachineView agents={agents} />
            </div>
            {/* Right column */}
            <div className="space-y-6">
              <StatsDashboard
                totalPayments={totalPayments ? totalPayments.toString() : "..."}
                totalVolume={
                  totalVolume ? formatEther(totalVolume) : "..."
                }
                activeAgentCount={activeAgentCount ? activeAgentCount.toString() : "..."}
                activeSubscriptions={activeSubscriptions ? activeSubscriptions.toString() : "..."}
                mostActiveAgent={mostActiveAgent}
                currencySymbol={chainMeta.currencySymbol}
              />
              <AgentNetworkGraph agents={agents} edges={paymentEdges} />
              <AutonomousOperations
                subscriptions={subscriptionList}
                currencySymbol={chainMeta.currencySymbol}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
