"use client";

import { useState } from "react";
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
} from "@/lib/contracts";
import { useChainContracts } from "@/lib/useChainContracts";
import { formatEther, parseEther, zeroAddress } from "viem";
import { toast } from "sonner";

// isDeployed is now computed inside the component

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

export default function SubscriptionsPage() {
  const { address, isConnected } = useAccount();
  const { contracts, chainMeta, chainId } = useChainContracts();

  const EXPLORER_URL = chainMeta.explorerUrl;

  const isDeployed =
    contracts.subscriptionManager !== zeroAddress &&
    contracts.subscriptionManager !== ("0x0000000000000000000000000000000000000000" as `0x${string}`);

  // Global stats
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

  // Build subscription read calls for all subscriptions
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

  // Subscribe form
  const [showForm, setShowForm] = useState(false);
  const [subAgentId, setSubAgentId] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subInterval, setSubInterval] = useState("3600");
  const { writeContract: subscribe, isPending: isSubscribing } = useWriteContract();
  const { writeContract: cancelSub, isPending: isCancelling } = useWriteContract();

  const handleSubscribe = () => {
    if (!address) return;
    if (!subAgentId || !subAmount) {
      toast.error("Please fill in all fields");
      return;
    }
    const amountWei = parseEther(subAmount);
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
      }
    );
  };

  const handleCancel = (subId: number) => {
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
      }
    );
  };

  const totalAgents = nextAgentId ? Number(nextAgentId) - 1 : 0;

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
              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
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

              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
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

              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
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

              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
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

            {/* HSS info banner */}
            <Card className="border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm">
              <CardContent className="flex items-start gap-4 pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Clock className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Hedera Schedule Service Integration</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                    Subscriptions use Hedera&apos;s HSS (system contract at 0x16b) to automatically
                    schedule recurring payments. On non-Hedera chains, payments can be triggered
                    manually via <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-indigo-300">executePayment()</code>.
                    The contract gracefully detects HSS availability at runtime.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Subscribe form */}
            {showForm && (
              <Card className="border-indigo-500/20 bg-black/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Create Subscription</CardTitle>
                  <CardDescription className="text-neutral-400">
                    Subscribe to an AI agent with recurring payments.
                  </CardDescription>
                </CardHeader>
                <Separator className="bg-white/10" />
                <CardContent className="space-y-4 pt-6">
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
                      <label className="text-sm font-medium text-neutral-300">Amount ({chainMeta.currencySymbol})</label>
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
                    <Button
                      onClick={handleSubscribe}
                      disabled={isSubscribing}
                      className="rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-500 transition-colors"
                    >
                      {isSubscribing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Subscribing...</>
                      ) : (
                        <><RefreshCw className="mr-2 h-4 w-4" />Subscribe</>
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
            <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white">All Subscriptions</CardTitle>
                <CardDescription className="text-neutral-400">
                  {totalSubs} subscription{totalSubs !== 1 ? "s" : ""} on-chain
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
                  <div className="grid gap-3">
                    {allSubsData?.map((result, idx) => {
                      if (result.status !== "success" || !result.result) return null;
                      const sub = result.result as unknown as {
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
                      const subId = idx + 1;
                      const isOwner = address && sub.subscriber.toLowerCase() === address.toLowerCase();

                      return (
                        <div
                          key={subId}
                          className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                              <Bot className="h-5 w-5 text-indigo-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white">
                                  Sub #{subId} &rarr; Agent #{sub.agentId.toString()}
                                </p>
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
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                                <span>{formatEther(sub.amount)} {sub.token === "0x0000000000000000000000000000000000000000" ? chainMeta.currencySymbol : "DDSC"} / {formatInterval(sub.interval)}</span>
                                <span>Paid: {formatEther(sub.totalPaid)} {sub.token === "0x0000000000000000000000000000000000000000" ? chainMeta.currencySymbol : "DDSC"} ({sub.paymentCount.toString()} payments)</span>
                                <span>Next: {formatTimestamp(sub.nextPayment)}</span>
                              </div>
                              <p className="mt-1 font-mono text-xs text-neutral-600">
                                Subscriber: {sub.subscriber.slice(0, 6)}...{sub.subscriber.slice(-4)}
                              </p>
                            </div>
                          </div>
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
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract info */}
            <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-400">SubscriptionManager Contract</p>
                  <a
                    href={`${EXPLORER_URL}/address/${contracts.subscriptionManager}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {contracts.subscriptionManager}
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
