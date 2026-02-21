"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Clock,
  Zap,
  Loader2,
  Bot,
  Wallet,
  Activity,
  XCircle,
  Plus,
  Play,
  CheckCircle2,
  Circle,
  Timer,
  CalendarClock,
  Info,
  ArrowRight,
  ExternalLink,
  Shield,
  Repeat,
  Coins,
} from "lucide-react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi";
import {
  SUBSCRIPTION_MANAGER_ABI,
  AGENT_REGISTRY_ABI,
  MOCK_DDSC_ABI,
} from "@/lib/contracts";
import { useChainContracts } from "@/lib/useChainContracts";
import { formatEther, parseEther, zeroAddress } from "viem";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatInterval(seconds: bigint): string {
  const s = Number(seconds);
  if (s >= 2592000) return `${Math.floor(s / 2592000)} month${Math.floor(s / 2592000) > 1 ? "s" : ""}`;
  if (s >= 604800) return `${Math.floor(s / 604800)} week${Math.floor(s / 604800) > 1 ? "s" : ""}`;
  if (s >= 86400) return `${Math.floor(s / 86400)} day${Math.floor(s / 86400) > 1 ? "s" : ""}`;
  if (s >= 3600) return `${Math.floor(s / 3600)} hour${Math.floor(s / 3600) > 1 ? "s" : ""}`;
  return `${s} seconds`;
}

function formatTimestamp(ts: bigint): string {
  if (ts === BigInt(0)) return "N/A";
  const date = new Date(Number(ts) * 1000);
  return date.toLocaleString();
}

function getCountdown(nextPayment: bigint): string {
  if (nextPayment === BigInt(0)) return "N/A";
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(nextPayment) - now;
  if (diff <= 0) return "Overdue";
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

type ScheduleLifecycle = "created" | "pending" | "executed" | "failed" | "manual" | "cancelled";

function getScheduleLifecycle(
  sub: SubscriptionData,
  isHedera: boolean,
  scheduleId: string | undefined,
): { lifecycle: ScheduleLifecycle; label: string; color: string; icon: string } {
  const now = Math.floor(Date.now() / 1000);
  const nextPay = Number(sub.nextPayment);

  if (!sub.isActive) {
    return {
      lifecycle: "cancelled",
      label: "Cancelled",
      color: "border-neutral-500/30 bg-neutral-500/10 text-neutral-400",
      icon: "x",
    };
  }

  if (isHedera && scheduleId && scheduleId !== zeroAddress) {
    // HSS lifecycle: Created -> Pending -> Executed/Failed
    if (Number(sub.paymentCount) > BigInt(0) && nextPay > now) {
      // Has executed at least one payment and next is in the future
      return {
        lifecycle: "executed",
        label: "Executed (HSS)",
        color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        icon: "check",
      };
    }
    if (nextPay <= now && nextPay > 0) {
      return {
        lifecycle: "pending",
        label: "Pending Execution",
        color: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        icon: "clock",
      };
    }
    if (Number(sub.paymentCount) === 0) {
      return {
        lifecycle: "created",
        label: "Created (HSS)",
        color: "border-blue-500/30 bg-blue-500/10 text-blue-300",
        icon: "plus",
      };
    }
    return {
      lifecycle: "created",
      label: "Scheduled (HSS)",
      color: "border-blue-500/30 bg-blue-500/10 text-blue-300",
      icon: "calendar",
    };
  }

  if (nextPay <= now && nextPay > 0) {
    return {
      lifecycle: "pending",
      label: "Payment Due",
      color: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      icon: "clock",
    };
  }

  if (!isHedera) {
    return {
      lifecycle: "manual",
      label: "Manual",
      color: "border-purple-500/30 bg-purple-500/10 text-purple-300",
      icon: "play",
    };
  }

  return {
    lifecycle: "created",
    label: "Scheduled (HSS)",
    color: "border-blue-500/30 bg-blue-500/10 text-blue-300",
    icon: "calendar",
  };
}

// ---------------------------------------------------------------------------
// Explorer URL helpers
// ---------------------------------------------------------------------------

function getHashScanScheduleUrl(scheduleAddress: string): string {
  return `https://hashscan.io/testnet/contract/${scheduleAddress}`;
}

function getHashScanContractUrl(contractAddress: string): string {
  return `https://hashscan.io/testnet/contract/${contractAddress}`;
}

function getHashScanAccountUrl(accountAddress: string): string {
  return `https://hashscan.io/testnet/account/${accountAddress}`;
}

function getExplorerAddressUrl(explorerUrl: string, address: string): string {
  return `${explorerUrl}/address/${address}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubscriptionData {
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

// ---------------------------------------------------------------------------
// Countdown Timer Component
// ---------------------------------------------------------------------------

function CountdownTimer({ nextPayment }: { nextPayment: bigint }) {
  const [countdown, setCountdown] = useState(getCountdown(nextPayment));

  useEffect(() => {
    if (nextPayment === BigInt(0)) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(nextPayment));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextPayment]);

  const isOverdue = countdown === "Overdue";

  return (
    <div className="flex items-center gap-1.5">
      <Timer className={`h-3.5 w-3.5 ${isOverdue ? "text-red-400" : "text-blue-400"}`} />
      <span className={`text-xs font-medium ${isOverdue ? "text-red-400" : "text-blue-300"}`}>
        {isOverdue ? "Overdue - Execute Now" : countdown}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule Timeline Component
// ---------------------------------------------------------------------------

function ScheduleTimeline({
  sub,
  isHedera,
}: {
  sub: SubscriptionData;
  isHedera: boolean;
}) {
  const now = Math.floor(Date.now() / 1000);
  const nextPay = Number(sub.nextPayment);
  const interval = Number(sub.interval);
  const paymentCount = Number(sub.paymentCount);

  // Calculate past payments timeline points
  const pastPayments = Math.min(paymentCount, 4);
  const timelinePoints: Array<{
    label: string;
    type: "past" | "current" | "future";
    time: string;
  }> = [];

  // Past payment dots
  for (let i = pastPayments; i > 0; i--) {
    const pastTime = nextPay - interval * i;
    timelinePoints.push({
      label: `#${paymentCount - i + 1}`,
      type: "past",
      time: pastTime > 0 ? new Date(pastTime * 1000).toLocaleDateString() : "",
    });
  }

  // Current period
  timelinePoints.push({
    label: nextPay <= now ? "Due Now" : "Current",
    type: "current",
    time: nextPay > 0 ? new Date(nextPay * 1000).toLocaleDateString() : "",
  });

  // Next scheduled
  if (sub.isActive) {
    timelinePoints.push({
      label: isHedera ? "HSS Auto" : "Manual",
      type: "future",
      time: nextPay + interval > 0 ? new Date((nextPay + interval) * 1000).toLocaleDateString() : "",
    });
  }

  return (
    <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className="mb-2 flex items-center gap-1.5">
        <CalendarClock className="h-3.5 w-3.5 text-indigo-400" />
        <span className="text-xs font-medium text-neutral-300">Schedule Timeline</span>
      </div>
      <div className="relative flex items-center justify-between">
        {/* Connecting line */}
        <div className="absolute left-3 right-3 top-1/2 h-px bg-gradient-to-r from-emerald-500/40 via-blue-500/40 to-purple-500/40" />

        {timelinePoints.map((point, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center gap-1">
            {point.type === "past" && (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
            {point.type === "current" && (
              <div className="relative">
                <Circle className="h-4 w-4 text-blue-400 fill-blue-400/30" />
                <div className="absolute inset-0 animate-ping">
                  <Circle className="h-4 w-4 text-blue-400/50" />
                </div>
              </div>
            )}
            {point.type === "future" && (
              <Circle className="h-4 w-4 text-purple-400/50" />
            )}
            <span className={`text-[10px] font-medium ${point.type === "past"
                ? "text-emerald-400/70"
                : point.type === "current"
                  ? "text-blue-300"
                  : "text-purple-400/50"
              }`}>
              {point.label}
            </span>
            <span className="text-[9px] text-neutral-600">{point.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HSS Info Section Component
// ---------------------------------------------------------------------------

function HSSInfoSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
            <Clock className="h-6 w-6 text-indigo-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold text-white">Hedera Schedule Service (HSS)</p>
              <Badge
                variant="outline"
                className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
              >
                System Contract 0x16b
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              Subscriptions leverage Hedera&apos;s native HSS to automatically schedule and execute
              recurring payments on-chain without external cron jobs or keepers.
            </p>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2 h-7"
            >
              <Info className="mr-1.5 h-3.5 w-3.5" />
              {expanded ? "Show less" : "How it works"}
            </Button>

            {expanded && (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Repeat className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">Self-Rescheduling Loop</span>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Each payment execution automatically schedules the next payment via HSS.
                      The contract calls{" "}
                      <code className="rounded bg-white/10 px-1 py-0.5 text-indigo-300">
                        IScheduleService(0x16b).scheduleNativeAutoRenew()
                      </code>{" "}
                      creating a perpetual payment loop until cancelled.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-medium text-white">Capacity-Aware Scheduling</span>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      If the HSS schedule queue is full, the contract uses exponential backoff
                      with jitter to retry scheduling. This ensures reliable subscription
                      continuity even under high network load.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-medium text-white">ERC20 + Native Support</span>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      On Hedera, subscriptions use ERC20 tokens (like DDSC) via{" "}
                      <code className="rounded bg-white/10 px-1 py-0.5 text-indigo-300">
                        subscribeToERC20()
                      </code>. On ADI chain, native value payments with{" "}
                      <code className="rounded bg-white/10 px-1 py-0.5 text-indigo-300">
                        subscribeTo()
                      </code>{" "}
                      are used.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Play className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-medium text-white">Manual Fallback</span>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      If HSS is unavailable or on non-Hedera chains, anyone can call{" "}
                      <code className="rounded bg-white/10 px-1 py-0.5 text-indigo-300">
                        executePayment()
                      </code>{" "}
                      or{" "}
                      <code className="rounded bg-white/10 px-1 py-0.5 text-indigo-300">
                        executeERC20Payment()
                      </code>{" "}
                      to trigger the payment manually.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <a
                    href="https://docs.hedera.com/hedera/core-concepts/smart-contracts/hedera-service-solidity-libraries/hss-schedule-service"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-3 py-1.5 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/10"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Hedera HSS Documentation
                  </a>
                  <a
                    href="https://hashscan.io/testnet/contract/0x16b"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-500/10"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View 0x16b on HashScan
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Lifecycle Stepper Component
// ---------------------------------------------------------------------------

function LifecycleStepper({
  lifecycle,
}: {
  lifecycle: ScheduleLifecycle;
}) {
  const steps: Array<{
    key: ScheduleLifecycle;
    label: string;
  }> = [
      { key: "created", label: "Created" },
      { key: "pending", label: "Pending" },
      { key: "executed", label: "Executed" },
    ];

  const currentIndex = lifecycle === "cancelled"
    ? -1
    : lifecycle === "failed"
      ? 2
      : lifecycle === "manual"
        ? -1
        : steps.findIndex((s) => s.key === lifecycle);

  if (lifecycle === "manual" || lifecycle === "cancelled") return null;

  return (
    <div className="flex items-center gap-1 mt-2">
      {steps.map((step, i) => {
        const isActive = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const isFailed = lifecycle === "failed" && i === 2;
        return (
          <div key={step.key} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`h-px w-4 ${isActive ? "bg-emerald-500/60" : "bg-white/10"
                  }`}
              />
            )}
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${isFailed
                    ? "bg-red-500 ring-2 ring-red-500/30"
                    : isCurrent
                      ? "bg-blue-400 ring-2 ring-blue-400/30"
                      : isActive
                        ? "bg-emerald-400"
                        : "bg-white/20"
                  }`}
              />
              <span
                className={`text-[10px] font-medium ${isFailed
                    ? "text-red-400"
                    : isCurrent
                      ? "text-blue-300"
                      : isActive
                        ? "text-emerald-400/70"
                        : "text-neutral-600"
                  }`}
              >
                {isFailed ? "Failed" : step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transaction Links Component
// ---------------------------------------------------------------------------

function TransactionLinks({
  subId,
  sub,
  scheduleId,
  isHedera,
  explorerUrl,
  subscriptionManagerAddress,
}: {
  subId: number;
  sub: SubscriptionData;
  scheduleId: string | undefined;
  isHedera: boolean;
  explorerUrl: string;
  subscriptionManagerAddress: string;
}) {
  const hasSchedule = scheduleId && scheduleId !== zeroAddress;

  return (
    <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className="mb-2 flex items-center gap-1.5">
        <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
        <span className="text-xs font-medium text-neutral-300">Transaction Links</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Schedule entity link (Hedera only) */}
        {isHedera && hasSchedule && (
          <a
            href={getHashScanScheduleUrl(scheduleId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5 px-2.5 py-1.5 text-[11px] font-medium text-blue-300 transition-colors hover:bg-blue-500/10 hover:border-blue-500/30"
          >
            <CalendarClock className="h-3 w-3" />
            HSS Schedule
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>
        )}

        {/* Subscription Manager contract link */}
        {isHedera ? (
          <a
            href={getHashScanContractUrl(subscriptionManagerAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1.5 text-[11px] font-medium text-indigo-300 transition-colors hover:bg-indigo-500/10 hover:border-indigo-500/30"
          >
            <Shield className="h-3 w-3" />
            Contract
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>
        ) : (
          <a
            href={getExplorerAddressUrl(explorerUrl, subscriptionManagerAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 px-2.5 py-1.5 text-[11px] font-medium text-purple-300 transition-colors hover:bg-purple-500/10 hover:border-purple-500/30"
          >
            <Shield className="h-3 w-3" />
            Contract
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>
        )}

        {/* Subscriber account link */}
        {isHedera ? (
          <a
            href={getHashScanAccountUrl(sub.subscriber)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/10 hover:border-emerald-500/30"
          >
            <Wallet className="h-3 w-3" />
            Subscriber
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>
        ) : (
          <a
            href={getExplorerAddressUrl(explorerUrl, sub.subscriber)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/10 hover:border-emerald-500/30"
          >
            <Wallet className="h-3 w-3" />
            Subscriber
            <ExternalLink className="h-2.5 w-2.5 opacity-60" />
          </a>
        )}

        {/* ERC20 token contract link */}
        {sub.token !== zeroAddress && (
          isHedera ? (
            <a
              href={getHashScanContractUrl(sub.token)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1.5 text-[11px] font-medium text-cyan-300 transition-colors hover:bg-cyan-500/10 hover:border-cyan-500/30"
            >
              <Coins className="h-3 w-3" />
              Token
              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
            </a>
          ) : (
            <a
              href={getExplorerAddressUrl(explorerUrl, sub.token)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1.5 text-[11px] font-medium text-cyan-300 transition-colors hover:bg-cyan-500/10 hover:border-cyan-500/30"
            >
              <Coins className="h-3 w-3" />
              Token
              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
            </a>
          )
        )}

        {/* Payment execution info */}
        {Number(sub.paymentCount) > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-neutral-400">
            <Activity className="h-3 w-3" />
            {sub.paymentCount.toString()} payment{Number(sub.paymentCount) !== 1 ? "s" : ""} executed
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function SubscriptionsPage() {
  const { address, isConnected } = useAccount();
  const { contracts, chainMeta, chainId, isHedera } = useChainContracts();

  const EXPLORER_URL = chainMeta.explorerUrl;

  const isDeployed =
    contracts.subscriptionManager !== zeroAddress &&
    contracts.subscriptionManager !== ("0x0000000000000000000000000000000000000000" as `0x${string}`);

  // ---------------------------------------------------------------------------
  // Global stats reads
  // ---------------------------------------------------------------------------

  const { data: nextSubId } = useReadContract({
    address: contracts.subscriptionManager,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "nextSubscriptionId",
    chainId: chainId,
    query: { enabled: isDeployed },
  });

  const { data: activeCount } = useReadContract({
    address: contracts.subscriptionManager,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "getActiveSubscriptionCount",
    chainId: chainId,
    query: { enabled: isDeployed },
  });

  const { data: platformFee } = useReadContract({
    address: contracts.subscriptionManager,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "platformFeeBps",
    chainId: chainId,
    query: { enabled: isDeployed },
  });

  const { data: userSubIds } = useReadContract({
    address: contracts.subscriptionManager,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "getUserSubscriptions",
    args: address ? [address] : undefined,
    chainId: chainId,
    query: { enabled: isDeployed && isConnected && !!address },
  });

  // Read total agents for subscribe form
  const { data: nextAgentId } = useReadContract({
    address: contracts.agentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "nextAgentId",
    chainId: chainId,
  });

  // ---------------------------------------------------------------------------
  // All subscriptions
  // ---------------------------------------------------------------------------

  const totalSubs = nextSubId ? Number(nextSubId) - 1 : 0;
  const subCalls = Array.from({ length: totalSubs }, (_, i) => ({
    address: contracts.subscriptionManager as `0x${string}`,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "getSubscription" as const,
    args: [BigInt(i + 1)] as const,
    chainId: chainId,
  }));

  const { data: allSubsData } = useReadContracts({
    contracts: subCalls,
    query: { enabled: isDeployed && totalSubs > 0 },
  });

  // Read schedule IDs for all subscriptions (HSS tracking)
  const scheduleCalls = Array.from({ length: totalSubs }, (_, i) => ({
    address: contracts.subscriptionManager as `0x${string}`,
    abi: SUBSCRIPTION_MANAGER_ABI,
    functionName: "subscriptionScheduleIds" as const,
    args: [BigInt(i + 1)] as const,
    chainId: chainId,
  }));

  const { data: allScheduleIds } = useReadContracts({
    contracts: scheduleCalls,
    query: { enabled: isDeployed && totalSubs > 0 && isHedera },
  });

  // ---------------------------------------------------------------------------
  // Subscribe form state
  // ---------------------------------------------------------------------------

  const [showForm, setShowForm] = useState(false);
  const [subAgentId, setSubAgentId] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subInterval, setSubInterval] = useState("3600");
  const [subMode, setSubMode] = useState<"native" | "erc20">(isHedera ? "erc20" : "native");

  // Sync default sub mode when chain changes
  useEffect(() => {
    setSubMode(isHedera ? "erc20" : "native");
  }, [isHedera]);

  const { writeContract: subscribe, isPending: isSubscribing } = useWriteContract();
  const { writeContract: cancelSub, isPending: isCancelling } = useWriteContract();
  const { writeContract: executePay, isPending: isExecuting } = useWriteContract();
  const { writeContract: approveTx, isPending: isApproving } = useWriteContract();

  const totalAgents = nextAgentId ? Number(nextAgentId) - 1 : 0;

  // ---------------------------------------------------------------------------
  // Approve ERC20 for subscription
  // ---------------------------------------------------------------------------

  const handleApproveERC20 = useCallback(() => {
    if (!address || !subAmount) return;
    const amountWei = parseEther(subAmount);
    // Approve a large amount so multiple payments can go through
    const approveAmount = amountWei * BigInt(1000);
    approveTx(
      {
        address: contracts.mockDDSC,
        abi: MOCK_DDSC_ABI,
        functionName: "approve",
        args: [contracts.subscriptionManager, approveAmount],
      },
      {
        onSuccess: () => toast.success("ERC20 approval granted!"),
        onError: (err) => toast.error(err.message || "Approval failed"),
      },
    );
  }, [address, subAmount, approveTx, contracts.mockDDSC, contracts.subscriptionManager]);

  // ---------------------------------------------------------------------------
  // Subscribe handlers
  // ---------------------------------------------------------------------------

  const handleSubscribe = useCallback(() => {
    if (!address) return;
    if (!subAgentId || !subAmount) {
      toast.error("Please fill in all fields");
      return;
    }
    const amountWei = parseEther(subAmount);

    if (subMode === "erc20") {
      // ERC20 subscription (Hedera)
      subscribe(
        {
          address: contracts.subscriptionManager,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: "subscribeToERC20",
          args: [BigInt(subAgentId), contracts.mockDDSC, amountWei, BigInt(subInterval)],
        },
        {
          onSuccess: () => {
            toast.success("ERC20 Subscription created! HSS will auto-schedule payments.");
            setShowForm(false);
            setSubAgentId("");
            setSubAmount("");
          },
          onError: (err) => toast.error(err.message || "Subscription failed"),
        },
      );
    } else {
      // Native subscription (ADI)
      subscribe(
        {
          address: contracts.subscriptionManager,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: "subscribeTo",
          args: [BigInt(subAgentId), amountWei, BigInt(subInterval)],
          value: amountWei,
        },
        {
          onSuccess: () => {
            toast.success("Subscription created!");
            setShowForm(false);
            setSubAgentId("");
            setSubAmount("");
          },
          onError: (err) => toast.error(err.message || "Subscription failed"),
        },
      );
    }
  }, [address, subAgentId, subAmount, subMode, subInterval, subscribe, contracts]);

  const handleCancel = useCallback(
    (subId: number) => {
      cancelSub(
        {
          address: contracts.subscriptionManager,
          abi: SUBSCRIPTION_MANAGER_ABI,
          functionName: "cancelSubscription",
          args: [BigInt(subId)],
        },
        {
          onSuccess: () => toast.success(`Subscription #${subId} cancelled`),
          onError: (err) => toast.error(err.message || "Cancel failed"),
        },
      );
    },
    [cancelSub, contracts.subscriptionManager],
  );

  const handleExecutePayment = useCallback(
    (subId: number, isERC20: boolean) => {
      if (isERC20) {
        executePay(
          {
            address: contracts.subscriptionManager,
            abi: SUBSCRIPTION_MANAGER_ABI,
            functionName: "executeERC20Payment",
            args: [BigInt(subId)],
          },
          {
            onSuccess: () => toast.success(`Payment executed for Sub #${subId}`),
            onError: (err) => toast.error(err.message || "Execution failed"),
          },
        );
      } else {
        // For native, we need to send value
        // Find the sub data to get the amount
        const subData = allSubsData?.[subId - 1];
        const sub = subData?.status === "success" ? (subData.result as unknown as SubscriptionData) : null;
        const value = sub ? sub.amount : BigInt(0);
        executePay(
          {
            address: contracts.subscriptionManager,
            abi: SUBSCRIPTION_MANAGER_ABI,
            functionName: "executePayment",
            args: [BigInt(subId)],
            value: value,
          },
          {
            onSuccess: () => toast.success(`Payment executed for Sub #${subId}`),
            onError: (err) => toast.error(err.message || "Execution failed"),
          },
        );
      }
    },
    [executePay, contracts.subscriptionManager, allSubsData],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative min-h-screen bg-black">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[40%] left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] h-[40vh] w-[40vh] rounded-full bg-purple-600/8 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
            <p className="mt-1 text-neutral-400">
              Recurring payments to AI agents via Hedera Schedule Service (HSS)
            </p>
            {isHedera && (
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-blue-500/30 bg-blue-500/10 text-blue-300"
                >
                  <Zap className="mr-1 h-3 w-3" />
                  HSS Active
                </Badge>
                <span className="text-xs text-neutral-500">
                  Auto-scheduling via system contract 0x16b
                </span>
              </div>
            )}
            {!isHedera && isDeployed && (
              <div className="mt-2 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-purple-500/30 bg-purple-500/10 text-purple-300"
                >
                  <Play className="mr-1 h-3 w-3" />
                  Manual Mode
                </Badge>
                <span className="text-xs text-neutral-500">
                  {chainMeta.name} &mdash; payments triggered manually
                </span>
              </div>
            )}
          </div>
          {isConnected && isDeployed && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Subscription
            </Button>
          )}
        </div>

        {!isDeployed ? (
          <Card className="border-amber-500/20 bg-black/40 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center py-12">
              <RefreshCw className="mb-4 h-12 w-12 text-amber-400/60" />
              <p className="text-lg font-medium text-amber-300">SubscriptionManager Not Deployed</p>
              <p className="mt-2 text-sm text-neutral-500">
                The SubscriptionManager contract has not been deployed yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-white/10 bg-gray-900/60 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-neutral-400">
                    <Activity className="h-4 w-4 text-indigo-400" />
                    Total Subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">{totalSubs}</p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-gray-900/60 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-neutral-400">
                    <RefreshCw className="h-4 w-4 text-emerald-400" />
                    Active
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">
                    {activeCount !== undefined ? Number(activeCount).toString() : "..."}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-gray-900/60 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-neutral-400">
                    <Zap className="h-4 w-4 text-purple-400" />
                    Platform Fee
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">
                    {platformFee !== undefined ? `${Number(platformFee) / 100}%` : "..."}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-gray-900/60 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-neutral-400">
                    <Wallet className="h-4 w-4 text-pink-400" />
                    Your Subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">
                    {userSubIds && Array.isArray(userSubIds) ? (userSubIds as bigint[]).length : 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* HSS Info Section */}
            <HSSInfoSection />

            {/* Subscribe form with ERC20 vs Native toggle */}
            {showForm && (
              <Card className="border-indigo-500/20 bg-gray-900/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Create Subscription</CardTitle>
                  <CardDescription className="text-neutral-400">
                    {isHedera
                      ? "Subscribe with ERC20 tokens. HSS will automatically schedule recurring payments."
                      : "Subscribe with native tokens. Payments are triggered manually or by bots."}
                  </CardDescription>
                </CardHeader>
                <Separator className="bg-white/10" />
                <CardContent className="space-y-4 pt-6">
                  {/* Payment mode tabs */}
                  <Tabs
                    value={subMode}
                    onValueChange={(v) => setSubMode(v as "native" | "erc20")}
                  >
                    <TabsList className="bg-gray-800/80">
                      <TabsTrigger
                        value="erc20"
                        className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-neutral-400"
                      >
                        <Coins className="mr-1.5 h-3.5 w-3.5" />
                        ERC20 {isHedera && "(Recommended)"}
                      </TabsTrigger>
                      <TabsTrigger
                        value="native"
                        className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-neutral-400"
                      >
                        <Wallet className="mr-1.5 h-3.5 w-3.5" />
                        Native
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="erc20" className="mt-4">
                      <div className="rounded-lg border border-blue-500/10 bg-blue-500/5 px-3 py-2 mb-4">
                        <p className="text-xs text-blue-300 flex items-center gap-1.5">
                          <Info className="h-3 w-3" />
                          {isHedera
                            ? "ERC20 subscriptions on Hedera use HSS for automatic scheduling. Token: DDSC"
                            : "ERC20 subscriptions use the DDSC mock token. Approve first, then subscribe."}
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="native" className="mt-4">
                      <div className="rounded-lg border border-purple-500/10 bg-purple-500/5 px-3 py-2 mb-4">
                        <p className="text-xs text-purple-300 flex items-center gap-1.5">
                          <Info className="h-3 w-3" />
                          Native {chainMeta.currencySymbol} payments. Value sent with transaction.
                          {isHedera && " Note: Hedera recommends ERC20 for HSS compatibility."}
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-300">Agent ID</label>
                      <Select value={subAgentId} onValueChange={setSubAgentId}>
                        <SelectTrigger className="border-white/10 bg-white/[0.05] text-white">
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: totalAgents }, (_, i) => (
                            <SelectItem key={i + 1} value={String(i + 1)}>
                              Agent #{i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-300">
                        Amount ({subMode === "erc20" ? "DDSC" : chainMeta.currencySymbol})
                      </label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="0.005"
                        value={subAmount}
                        onChange={(e) => setSubAmount(e.target.value)}
                        className="border-white/10 bg-white/[0.05] text-white placeholder:text-neutral-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-300">Interval</label>
                      <Select value={subInterval} onValueChange={setSubInterval}>
                        <SelectTrigger className="border-white/10 bg-white/[0.05] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3600">Hourly</SelectItem>
                          <SelectItem value="86400">Daily</SelectItem>
                          <SelectItem value="604800">Weekly</SelectItem>
                          <SelectItem value="2592000">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    {subMode === "erc20" && (
                      <Button
                        onClick={handleApproveERC20}
                        disabled={isApproving}
                        variant="outline"
                        className="rounded-xl border-indigo-500/30 bg-indigo-500/10 font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                      >
                        {isApproving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve DDSC
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={handleSubscribe}
                      disabled={isSubscribing}
                      className="rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-500 transition-colors"
                    >
                      {isSubscribing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Subscribe ({subMode === "erc20" ? "ERC20" : "Native"})
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowForm(false)}
                      className="text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All subscriptions list */}
            <Card className="border-white/10 bg-gray-900/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white">All Subscriptions</CardTitle>
                <CardDescription className="text-neutral-400">
                  {totalSubs} subscription{totalSubs !== 1 ? "s" : ""} on-chain
                  {isHedera && "HSS auto-scheduling enabled"}
                </CardDescription>
              </CardHeader>
              <Separator className="bg-white/10" />
              <CardContent className="pt-6">
                {totalSubs === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
                    <RefreshCw className="mx-auto mb-3 h-10 w-10 text-neutral-600" />
                    <p className="font-medium text-neutral-300">No Subscriptions Yet</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Create a subscription to start recurring payments to an AI agent.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {allSubsData?.map((result, idx) => {
                      if (result.status !== "success" || !result.result) return null;
                      const sub = result.result as unknown as SubscriptionData;
                      const subId = idx + 1;
                      const isOwner = address && sub.subscriber.toLowerCase() === address.toLowerCase();
                      const isERC20 = sub.token !== zeroAddress;
                      const scheduleId = allScheduleIds?.[idx]?.status === "success"
                        ? (allScheduleIds[idx].result as unknown as string)
                        : undefined;
                      const scheduleInfo = getScheduleLifecycle(sub, isHedera, scheduleId);
                      const now = Math.floor(Date.now() / 1000);
                      const isDue = sub.isActive && Number(sub.nextPayment) > 0 && Number(sub.nextPayment) <= now;

                      return (
                        <div
                          key={subId}
                          className="rounded-xl border border-white/10 bg-gray-800/40 p-5 transition-colors hover:border-white/15"
                        >
                          {/* Top row: Sub info + badges */}
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                                <Bot className="h-5 w-5 text-indigo-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-white">
                                    Sub #{subId}
                                    <ArrowRight className="mx-1.5 inline h-3 w-3 text-neutral-600" />
                                    Agent #{sub.agentId.toString()}
                                  </p>
                                  {/* Active / Cancelled badge */}
                                  <Badge
                                    variant="outline"
                                    className={
                                      sub.isActive
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                        : "border-red-500/30 bg-red-500/10 text-red-300"
                                    }
                                  >
                                    {sub.isActive ? "Active" : "Cancelled"}
                                  </Badge>
                                  {/* Schedule lifecycle badge */}
                                  <Badge variant="outline" className={scheduleInfo.color}>
                                    {scheduleInfo.lifecycle === "created" && (
                                      <CalendarClock className="mr-1 h-3 w-3" />
                                    )}
                                    {scheduleInfo.lifecycle === "pending" && (
                                      <Clock className="mr-1 h-3 w-3" />
                                    )}
                                    {scheduleInfo.lifecycle === "executed" && (
                                      <CheckCircle2 className="mr-1 h-3 w-3" />
                                    )}
                                    {scheduleInfo.lifecycle === "failed" && (
                                      <XCircle className="mr-1 h-3 w-3" />
                                    )}
                                    {scheduleInfo.lifecycle === "manual" && (
                                      <Play className="mr-1 h-3 w-3" />
                                    )}
                                    {scheduleInfo.lifecycle === "cancelled" && (
                                      <XCircle className="mr-1 h-3 w-3" />
                                    )}
                                    {scheduleInfo.label}
                                  </Badge>
                                  {/* Token type badge */}
                                  <Badge
                                    variant="outline"
                                    className={
                                      isERC20
                                        ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                                        : "border-orange-500/30 bg-orange-500/10 text-orange-300"
                                    }
                                  >
                                    {isERC20 ? "ERC20" : "Native"}
                                  </Badge>
                                </div>

                                {/* Payment details row */}
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                                  <span className="flex items-center gap-1">
                                    <Coins className="h-3 w-3 text-neutral-600" />
                                    {formatEther(sub.amount)} {isERC20 ? "DDSC" : chainMeta.currencySymbol} / {formatInterval(sub.interval)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Activity className="h-3 w-3 text-neutral-600" />
                                    Paid: {formatEther(sub.totalPaid)} {isERC20 ? "DDSC" : chainMeta.currencySymbol}
                                    {" "}({sub.paymentCount.toString()} payment{Number(sub.paymentCount) !== 1 ? "s" : ""})
                                  </span>
                                  <span>Next: {formatTimestamp(sub.nextPayment)}</span>
                                </div>

                                {/* Countdown timer */}
                                {sub.isActive && sub.nextPayment > BigInt(0) && (
                                  <div className="mt-2">
                                    <CountdownTimer nextPayment={sub.nextPayment} />
                                  </div>
                                )}

                                {/* Subscriber address with explorer link */}
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-neutral-600">
                                  <a
                                    href={isHedera
                                      ? getHashScanAccountUrl(sub.subscriber)
                                      : getExplorerAddressUrl(EXPLORER_URL, sub.subscriber)
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 hover:text-indigo-400 transition-colors"
                                  >
                                    Subscriber: {sub.subscriber.slice(0, 6)}...{sub.subscriber.slice(-4)}
                                    <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                                  </a>
                                  {scheduleId && scheduleId !== zeroAddress && (
                                    <a
                                      href={getHashScanScheduleUrl(scheduleId)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-blue-500/70 hover:text-blue-400 transition-colors"
                                    >
                                      Schedule: {scheduleId.slice(0, 6)}...{scheduleId.slice(-4)}
                                      <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                                    </a>
                                  )}
                                </div>

                                {/* Lifecycle stepper for HSS subscriptions */}
                                {isHedera && scheduleId && scheduleId !== zeroAddress && (
                                  <LifecycleStepper lifecycle={scheduleInfo.lifecycle} />
                                )}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Manual Execute Buttonshown when payment is due */}
                              {isDue && (
                                <Button
                                  size="sm"
                                  onClick={() => handleExecutePayment(subId, isERC20)}
                                  disabled={isExecuting}
                                  className="rounded-lg bg-amber-600 font-medium text-white hover:bg-amber-500 transition-colors"
                                >
                                  {isExecuting ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Play className="mr-1.5 h-3.5 w-3.5" />
                                  )}
                                  Execute {isERC20 ? "ERC20" : ""} Payment
                                </Button>
                              )}

                              {/* Manual fallback: always show execute button on non-Hedera for active subs */}
                              {!isHedera && sub.isActive && !isDue && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleExecutePayment(subId, isERC20)}
                                  disabled={isExecuting}
                                  className="rounded-lg border-purple-500/30 bg-purple-500/5 text-purple-300 hover:bg-purple-500/10 transition-colors"
                                >
                                  {isExecuting ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Play className="mr-1.5 h-3.5 w-3.5" />
                                  )}
                                  Manual Execute
                                </Button>
                              )}

                              {/* Cancel button */}
                              {isOwner && sub.isActive && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancel(subId)}
                                  disabled={isCancelling}
                                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                >
                                  <XCircle className="mr-1.5 h-4 w-4" />
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Schedule Timeline */}
                          {sub.isActive && Number(sub.paymentCount) >= 0 && (
                            <ScheduleTimeline sub={sub} isHedera={isHedera} />
                          )}

                          {/* Transaction Links */}
                          <TransactionLinks
                            subId={subId}
                            sub={sub}
                            scheduleId={scheduleId}
                            isHedera={isHedera}
                            explorerUrl={EXPLORER_URL}
                            subscriptionManagerAddress={contracts.subscriptionManager}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract info */}
            <Card className="border-white/10 bg-gray-900/60 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-400">SubscriptionManager Contract</p>
                    <a
                      href={isHedera
                        ? getHashScanContractUrl(contracts.subscriptionManager)
                        : getExplorerAddressUrl(EXPLORER_URL, contracts.subscriptionManager)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {contracts.subscriptionManager}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {isHedera && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-neutral-400">HSS System Contract</p>
                      <a
                        href="https://hashscan.io/testnet/contract/0x16b"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        0x000000000000000000000000000000000000016b
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-400">Chain</p>
                    <span className="text-xs text-neutral-300">
                      {chainMeta.name} (ID: {chainId})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
