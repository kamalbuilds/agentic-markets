"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useReadContract, useReadContracts, useAccount } from "wagmi";
import { formatEther } from "viem";
import { Search, Bot, Star, ArrowRight, Zap, Loader2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AGENT_REGISTRY_ABI } from "@/lib/contracts";
import { useChainContracts } from "@/lib/useChainContracts";

// ---------- types ----------
interface OnChainAgent {
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

// ---------- helpers ----------
function parseMetadata(uri: string): { name: string; category: string; description: string } {
  try {
    const parsed = JSON.parse(uri);
    return {
      name: parsed.name || `Agent`,
      category: parsed.category || "General",
      description: parsed.description || uri,
    };
  } catch {
    // If not JSON, use as description
    return {
      name: uri.length > 30 ? uri.slice(0, 30) + "..." : uri || "Agent",
      category: "General",
      description: uri || "On-chain AI agent",
    };
  }
}

function getAgentRating(totalRating: bigint, ratingCount: bigint): number {
  if (ratingCount === BigInt(0)) return 0;
  return Number(totalRating * BigInt(100) / ratingCount) / 100;
}

const CATEGORY_COLORS: Record<string, string> = {
  Analytics: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Trading: "bg-green-500/20 text-green-400 border-green-500/30",
  Content: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Security: "bg-red-500/20 text-red-400 border-red-500/30",
  NFT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DeFi: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  General: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-zinc-600"
          }`}
        />
      ))}
      <span className="ml-1 text-xs text-zinc-400">
        {rating > 0 ? rating.toFixed(1) : "New"}
      </span>
    </div>
  );
}

// ---------- page ----------
export default function AgentMarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { isConnected } = useAccount();
  const { contracts, chainMeta, chainId } = useChainContracts();

  // Read total agent count from on-chain registry
  const { data: nextAgentId, isLoading: countLoading } = useReadContract({
    address: contracts.agentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "nextAgentId",
  });

  const agentCount = nextAgentId ? Number(nextAgentId) - 1 : 0;

  // Build contract read calls for each agent
  const agentCalls = useMemo(() => {
    if (agentCount <= 0) return [];
    return Array.from({ length: agentCount }, (_, i) => ({
      address: contracts.agentRegistry,
      abi: AGENT_REGISTRY_ABI,
      functionName: "getAgent" as const,
      args: [BigInt(i + 1)] as const,
    }));
  }, [agentCount, contracts.agentRegistry]);

  const { data: agentResults, isLoading: agentsLoading } = useReadContracts({
    contracts: agentCalls,
  });

  // Parse on-chain agents
  const agents: OnChainAgent[] = useMemo(() => {
    if (!agentResults) return [];
    return agentResults
      .map((result, i) => {
        if (result.status !== "success" || !result.result) return null;
        const r = result.result as unknown as {
          owner: string;
          metadataURI: string;
          pricePerTask: bigint;
          isActive: boolean;
          totalTasks: bigint;
          totalRating: bigint;
          ratingCount: bigint;
          createdAt: bigint;
        };
        return {
          id: i + 1,
          owner: r.owner,
          metadataURI: r.metadataURI,
          pricePerTask: r.pricePerTask,
          isActive: r.isActive,
          totalTasks: r.totalTasks,
          totalRating: r.totalRating,
          ratingCount: r.ratingCount,
          createdAt: r.createdAt,
        };
      })
      .filter((a): a is OnChainAgent => a !== null && a.isActive);
  }, [agentResults]);

  // Filter by search
  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;
    const q = searchQuery.toLowerCase();
    return agents.filter((a) => {
      const meta = parseMetadata(a.metadataURI);
      return (
        meta.name.toLowerCase().includes(q) ||
        meta.category.toLowerCase().includes(q) ||
        meta.description.toLowerCase().includes(q)
      );
    });
  }, [agents, searchQuery]);

  const isLoading = countLoading || agentsLoading;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* ---------- header ---------- */}
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400">
          <Zap className="size-4" />
          Live on {chainMeta.name}
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Agent Marketplace
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Browse and hire autonomous AI agents registered on-chain. All data
          fetched directly from the AgentRegistry contract.
        </p>
      </div>

      {/* ---------- search / filter bar ---------- */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative w-full max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input
            type="text"
            placeholder="Search agents by name, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 rounded-lg border-zinc-800 bg-zinc-900/60 pl-10 text-white placeholder:text-zinc-500 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/30"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Bot className="size-4" />
          <span>
            {isLoading ? "Loading..." : `${filteredAgents.length} agent${filteredAgents.length !== 1 ? "s" : ""} on-chain`}
          </span>
        </div>
      </div>

      {/* ---------- agent grid ---------- */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Loader2 className="mb-4 size-12 animate-spin text-indigo-500" />
          <p className="text-lg font-medium text-zinc-400">
            Fetching agents from AgentRegistry...
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Reading from {chainMeta.name} (ID: {chainId})
          </p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bot className="mb-4 size-12 text-zinc-600" />
          <p className="text-lg font-medium text-zinc-400">
            {agents.length === 0
              ? "No agents registered yet"
              : "No agents match your search"}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {agents.length === 0
              ? "Register an agent from the Dashboard to get started"
              : "Try a different keyword or clear your search"}
          </p>
          {agents.length === 0 && (
            <Link href="/dashboard">
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-500">
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => {
            const meta = parseMetadata(agent.metadataURI);
            const rating = getAgentRating(agent.totalRating, agent.ratingCount);
            const priceStr = formatEther(agent.pricePerTask);

            return (
              <Card
                key={agent.id}
                className="group border-zinc-800 bg-zinc-900/50 transition-all hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                        <Bot className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-white">
                          {meta.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-[10px] ${
                            CATEGORY_COLORS[meta.category] ??
                            CATEGORY_COLORS.General
                          }`}
                        >
                          {meta.category}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400 text-[10px]">
                      #{agent.id}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  <CardDescription className="line-clamp-2 text-zinc-400">
                    {meta.description}
                  </CardDescription>

                  {/* stats row */}
                  <div className="flex items-center justify-between text-sm">
                    <StarRating rating={rating} />
                    <span className="text-xs text-zinc-500">
                      {Number(agent.totalTasks).toLocaleString()} tasks
                    </span>
                  </div>

                  {/* price */}
                  <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                    <Zap className="size-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-white">
                      {priceStr} {chainMeta.currencySymbol}
                    </span>
                    <span className="ml-auto text-xs text-zinc-500">
                      per task
                    </span>
                  </div>

                  {/* owner */}
                  <div className="text-[10px] text-zinc-600 truncate">
                    Owner: {agent.owner}
                  </div>
                </CardContent>

                <CardFooter>
                  <Link href={`/agents/${agent.id}`} className="w-full">
                    <Button className="w-full gap-2 bg-indigo-600 text-white hover:bg-indigo-500">
                      Hire Agent
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* ---------- on-chain status footer ---------- */}
      <div className="mt-12 flex items-center justify-center gap-2 text-xs text-zinc-600">
        <span
          className={`inline-block size-2 rounded-full ${
            agentCount > 0 ? "bg-green-500" : "bg-yellow-500"
          }`}
        />
        {agentCount > 0
          ? `${agentCount} agent${agentCount !== 1 ? "s" : ""} registered on AgentRegistry (${contracts.agentRegistry.slice(0, 10)}...)`
          : "Connected to AgentRegistry -- no agents registered yet"}
      </div>
    </section>
  );
}
