"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Bot,
  Zap,
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  Loader2,
} from "lucide-react";
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
import {
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { PAYMENT_ROUTER_ABI, AGENT_REGISTRY_ABI, MOCK_DDSC_ABI } from "@/lib/contracts";
import { useChainContracts } from "@/lib/useChainContracts";
import { formatEther } from "viem";
import { toast } from "sonner";

// ---------- helpers ----------
function parseMetadata(uri: string): {
  name: string;
  category: string;
  description: string;
  longDescription: string;
  capabilities: string[];
} {
  try {
    const parsed = JSON.parse(uri);
    return {
      name: parsed.name || "Agent",
      category: parsed.category || "General",
      description: parsed.description || uri,
      longDescription:
        parsed.longDescription ||
        parsed.description ||
        "An autonomous AI agent registered on the AgentMarket marketplace.",
      capabilities: parsed.capabilities || [],
    };
  } catch {
    return {
      name: uri.length > 30 ? uri.slice(0, 30) + "..." : uri || "Agent",
      category: "General",
      description: uri || "On-chain AI agent",
      longDescription:
        uri || "An autonomous AI agent registered on the AgentMarket marketplace.",
      capabilities: [],
    };
  }
}

function getAgentRating(
  totalRating: bigint,
  ratingCount: bigint
): number {
  if (ratingCount === BigInt(0)) return 0;
  return Number((totalRating * BigInt(100)) / ratingCount) / 100;
}

// ---------- Category colour mapping ----------
const CATEGORY_COLORS: Record<string, string> = {
  Analytics: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Trading: "bg-green-500/20 text-green-400 border-green-500/30",
  Content: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Security: "bg-red-500/20 text-red-400 border-red-500/30",
  NFT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DeFi: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  General: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

function categoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.General;
}

// ---------- Truncate address ----------
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ---------- Transaction status type ----------
type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

// ---------- Page component ----------
export default function AgentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const agentId = BigInt(id);

  const { isConnected, address } = useAccount();
  const { contracts, chainMeta, isHedera, chainId } = useChainContracts();

  // --- Read agent data from on-chain registry ---
  const {
    data: agentData,
    isLoading: agentLoading,
    isError: agentError,
  } = useReadContract({
    address: contracts.agentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getAgent",
    args: [agentId],
  });

  // Parse on-chain agent data
  const agent = useMemo(() => {
    if (!agentData) return null;
    const r = agentData as unknown as {
      owner: string;
      metadataURI: string;
      pricePerTask: bigint;
      isActive: boolean;
      totalTasks: bigint;
      totalRating: bigint;
      ratingCount: bigint;
      createdAt: bigint;
    };
    // If owner is zero address, agent doesn't exist
    if (r.owner === "0x0000000000000000000000000000000000000000") return null;
    return {
      id,
      owner: r.owner,
      metadataURI: r.metadataURI,
      pricePerTask: r.pricePerTask,
      isActive: r.isActive,
      totalTasks: r.totalTasks,
      totalRating: r.totalRating,
      ratingCount: r.ratingCount,
      createdAt: r.createdAt,
    };
  }, [agentData, id]);

  const meta = useMemo(() => {
    if (!agent) return null;
    return parseMetadata(agent.metadataURI);
  }, [agent]);

  const rating = agent ? getAgentRating(agent.totalRating, agent.ratingCount) : 0;
  const priceStr = agent ? formatEther(agent.pricePerTask) : "0";

  // --- Contract write ---
  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // --- Wait for receipt ---
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  // --- Derive tx status ---
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");

  useEffect(() => {
    if (isConfirmed) {
      setTxStatus("success");
      toast.success("Payment confirmed! Agent hired successfully.");
    } else if (isConfirming) {
      setTxStatus("confirming");
    } else if (isWritePending) {
      setTxStatus("pending");
    } else if (isWriteError || isReceiptError) {
      setTxStatus("error");
      toast.error(writeError?.message?.split("\n")[0] ?? "Transaction failed.");
    }
  }, [isWritePending, isConfirming, isConfirmed, isWriteError, isReceiptError, writeError]);

  // --- Hire handler ---
  function handleHire() {
    if (!agent) return;
    resetWrite();
    setTxStatus("pending");

    if (isHedera) {
      // On Hedera, native msg.value doesn't work reliably.
      // Use ERC20 (DDSC) payment path instead.
      writeContract({
        address: contracts.paymentRouter,
        abi: PAYMENT_ROUTER_ABI,
        functionName: "payAgentERC20",
        args: [BigInt(agent.id), contracts.mockDDSC, agent.pricePerTask],
      });
    } else {
      writeContract({
        address: contracts.paymentRouter,
        abi: PAYMENT_ROUTER_ABI,
        functionName: "payAgent",
        args: [BigInt(agent.id)],
        value: agent.pricePerTask,
      });
    }
  }

  // --- ERC20 approve handler for Hedera ---
  function handleApproveAndHire() {
    if (!agent || !address) return;
    resetWrite();
    setTxStatus("pending");

    writeContract({
      address: contracts.mockDDSC,
      abi: MOCK_DDSC_ABI,
      functionName: "approve",
      args: [contracts.paymentRouter, agent.pricePerTask],
    });
  }

  // --- Loading state ---
  if (agentLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
        <p className="text-lg font-medium text-zinc-400">
          Fetching agent #{id} from AgentRegistry...
        </p>
        <p className="text-sm text-zinc-600">
          Reading from {chainMeta.name} (ID: {chainId})
        </p>
      </div>
    );
  }

  // --- 404 / error ---
  if (!agent || agentError || !meta) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <Bot className="h-16 w-16 text-neutral-600" />
        <h1 className="text-2xl font-bold text-white">Agent Not Found</h1>
        <p className="text-neutral-400">
          Agent #{id} does not exist on the AgentRegistry contract.
        </p>
        <Link href="/agents">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }

  const createdDate = new Date(Number(agent.createdAt) * 1000).toLocaleDateString();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/agents"
        className="mb-8 inline-flex items-center gap-2 text-sm text-neutral-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      {/* Two-column layout */}
      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ---- LEFT COLUMN (details) ---- */}
        <div className="lg:col-span-2 space-y-8">
          {/* Agent header card */}
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
                    <Bot className="h-7 w-7 text-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-2xl text-white">
                      {meta.name}
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      {meta.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`shrink-0 border ${categoryColor(meta.category)}`}
                  >
                    {meta.category}
                  </Badge>
                  {agent.isActive ? (
                    <Badge className="border-green-500/30 bg-green-500/10 text-green-400">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="border-red-500/30 bg-red-500/10 text-red-400">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs uppercase tracking-wider">
                      Rating
                    </span>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {rating > 0 ? rating.toFixed(1) : "New"}
                  </p>
                  <p className="text-[10px] text-zinc-500">
                    {Number(agent.ratingCount)} review{Number(agent.ratingCount) !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Zap className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs uppercase tracking-wider">
                      Tasks
                    </span>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {Number(agent.totalTasks).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className="text-xs uppercase tracking-wider">
                      Price
                    </span>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {priceStr} {chainMeta.currencySymbol}
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs uppercase tracking-wider">
                      Status
                    </span>
                  </div>
                  <p className={`mt-1 flex items-center gap-2 text-xl font-semibold ${agent.isActive ? "text-emerald-400" : "text-red-400"}`}>
                    <CheckCircle className="h-4 w-4" />
                    {agent.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About section */}
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="text-lg text-white">About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="leading-relaxed text-neutral-300">
                {meta.longDescription}
              </p>

              {meta.capabilities.length > 0 && (
                <>
                  <Separator className="bg-white/10" />
                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">
                      Capabilities
                    </h3>
                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {meta.capabilities.map((cap) => (
                        <li
                          key={cap}
                          className="flex items-center gap-2 text-sm text-neutral-300"
                        >
                          <CheckCircle className="h-4 w-4 shrink-0 text-indigo-400" />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              <Separator className="bg-white/10" />

              <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-neutral-400">
                <div>
                  <span className="text-neutral-500">Owner:</span>{" "}
                  <span className="font-mono text-neutral-300">
                    {truncateAddress(agent.owner)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Created:</span>{" "}
                  <span className="text-neutral-300">{createdDate}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Agent ID:</span>{" "}
                  <span className="font-mono text-neutral-300">#{agent.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- RIGHT COLUMN (hire + history) ---- */}
        <div className="space-y-8">
          {/* Hire card */}
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Hire This Agent
              </CardTitle>
              <CardDescription className="text-neutral-400">
                {isHedera
                  ? "Pay with DDSC (ERC-20) to start a task"
                  : `Pay with ${chainMeta.currencySymbol} to start a task`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price display */}
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-indigo-300">
                  Price per Task
                </p>
                <p className="mt-1 text-3xl font-bold text-white">
                  {priceStr}{" "}
                  <span className="text-lg font-normal text-indigo-400">
                    ADI
                  </span>
                </p>
              </div>

              {/* Action button */}
              {txStatus === "success" ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                    <CheckCircle className="mx-auto h-8 w-8 text-emerald-400" />
                    <p className="mt-2 font-semibold text-emerald-300">
                      Payment Successful!
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      Agent has been hired and your task is being processed.
                    </p>
                  </div>
                  {txHash && (
                    <a
                      href={`${chainMeta.explorerUrl}/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center text-xs font-mono text-indigo-400 transition-colors hover:bg-white/[0.06]"
                    >
                      View on Explorer
                      <br />
                      <span className="text-neutral-500">
                        {txHash.slice(0, 10)}...{txHash.slice(-8)}
                      </span>
                    </a>
                  )}
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      resetWrite();
                      setTxStatus("idle");
                    }}
                  >
                    Hire Again
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    size="lg"
                    disabled={
                      !isConnected ||
                      !agent.isActive ||
                      txStatus === "pending" ||
                      txStatus === "confirming"
                    }
                    onClick={handleHire}
                  >
                    {!isConnected ? (
                      "Connect Wallet First"
                    ) : !agent.isActive ? (
                      "Agent is Inactive"
                    ) : txStatus === "pending" ? (
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 animate-spin" />
                        Confirm in Wallet...
                      </span>
                    ) : txStatus === "confirming" ? (
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 animate-spin" />
                        Confirming on Chain...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        {isHedera
                          ? `Pay ${priceStr} DDSC (ERC-20)`
                          : `Pay ${priceStr} ${chainMeta.currencySymbol}`}
                      </span>
                    )}
                  </Button>

                  {txStatus === "error" && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-300">
                      Transaction failed. Please try again.
                    </div>
                  )}

                  {isHedera && txStatus === "idle" && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center text-xs text-amber-300">
                      Hedera does not support native msg.value payments. This will use DDSC (ERC-20). Ensure you have approved DDSC spending first.
                    </div>
                  )}

                  {/* Status indicator */}
                  {(txStatus === "pending" || txStatus === "confirming") && (
                    <div className="flex items-center justify-center gap-3 text-xs text-neutral-400">
                      <span
                        className={
                          txStatus === "pending"
                            ? "text-indigo-400"
                            : "text-emerald-400"
                        }
                      >
                        Wallet
                      </span>
                      <div className="h-px w-6 bg-white/20" />
                      <span
                        className={
                          txStatus === "confirming"
                            ? "text-indigo-400"
                            : "text-neutral-600"
                        }
                      >
                        Blockchain
                      </span>
                      <div className="h-px w-6 bg-white/20" />
                      <span className="text-neutral-600">Done</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* On-chain info card */}
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                On-Chain Info
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Data from AgentRegistry contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Contract</span>
                <span className="font-mono text-xs text-zinc-400">
                  {truncateAddress(contracts.agentRegistry)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Agent ID</span>
                <span className="text-zinc-300">#{id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Owner</span>
                <span className="font-mono text-xs text-zinc-400">
                  {truncateAddress(agent.owner)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Price (wei)</span>
                <span className="text-zinc-300">{agent.pricePerTask.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Tasks</span>
                <span className="text-zinc-300">{Number(agent.totalTasks)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Total Rating</span>
                <span className="text-zinc-300">{Number(agent.totalRating)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Rating Count</span>
                <span className="text-zinc-300">{Number(agent.ratingCount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Chain</span>
                <span className="text-zinc-300">{chainMeta.name} ({chainId})</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
