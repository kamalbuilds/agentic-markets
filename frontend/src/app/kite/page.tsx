"use client";

import { useState, useEffect } from "react";
import {
  Bot,
  Zap,
  Shield,
  Star,
  ArrowRight,
  Loader2,
  CheckCircle,
  Clock,
  Users,
  Key,
  Fingerprint,
  Network,
  CreditCard,
  Eye,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ---------- types ----------
interface KiteAgent {
  id: string;
  name?: string;
  registryId?: number;
  owner?: string;
  metadataURI?: string;
  category: string;
  description?: string;
  capabilities?: string[];
  pricePerTask: string;
  pricePerTaskFormatted?: string;
  reputation: number;
  totalTasks: number;
  ratingCount?: number;
  did: string;
  status: string;
  isActive?: boolean;
  createdAt?: string;
}

interface AgentReputation {
  agentId: string;
  registryId?: number;
  owner?: string;
  metadataURI?: string;
  did: string;
  identityTier: string;
  score: number;
  totalTransactions: number;
  ratingCount?: number;
  successRate?: number;
  standingIntentActive?: boolean;
  isActive?: boolean;
  dimensions?: {
    reliability: number;
    quality: number;
    speed: number;
    value: number;
  };
}

interface HireResult {
  taskId: string;
  agentId: string;
  task: string;
  status: string;
  result: {
    message: string;
    estimatedCompletion: string;
  };
}

// ---------- constants ----------
const KITE_TEST_USDT = "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63";
const FACILITATOR_ADDRESS = "0x12343e649e6b2b2b77649DFAb88f103c02F3C78b";

const CATEGORY_COLORS: Record<string, string> = {
  Analytics: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Security: "bg-red-500/20 text-red-400 border-red-500/30",
  Content: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  DeFi: "bg-green-500/20 text-green-400 border-green-500/30",
  NFT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
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
      <span className="ml-1 text-xs text-zinc-400">{rating.toFixed(1)}</span>
    </div>
  );
}

function formatUSDT(wei: string): string {
  try {
    const value = Number(BigInt(wei)) / 1e18;
    return value.toFixed(value < 1 ? 2 : 0);
  } catch {
    return "0";
  }
}

// ---------- page ----------
export default function KiteAIPage() {
  const [agents, setAgents] = useState<KiteAgent[]>([]);
  const [reputations, setReputations] = useState<AgentReputation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hireResult, setHireResult] = useState<HireResult | null>(null);
  const [hiringAgent, setHiringAgent] = useState<string | null>(null);
  const [x402Step, setX402Step] = useState(0);
  const [demoActive, setDemoActive] = useState(false);

  // Fetch agents and reputations on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsRes, repRes] = await Promise.all([
          fetch("/api/kite/discover", {
            headers: { "X-PAYMENT": btoa(JSON.stringify({ authorization: { demo: true }, signature: "0x" })) },
          }),
          fetch("/api/kite/reputation"),
        ]);

        if (agentsRes.ok) {
          const data = await agentsRes.json();
          setAgents(data.agents || []);
        }

        if (repRes.ok) {
          const data = await repRes.json();
          setReputations(data.agents || []);
        }
      } catch (err) {
        console.error("Failed to fetch Kite data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Hire agent function
  async function handleHire(agentId: string) {
    setHiringAgent(agentId);
    setHireResult(null);

    try {
      const res = await fetch("/api/kite/hire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PAYMENT": btoa(JSON.stringify({ authorization: { demo: true }, signature: "0x" })),
        },
        body: JSON.stringify({
          agentId,
          task: "Perform a comprehensive analysis of the current Kite AI ecosystem",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setHireResult(data);
      }
    } catch (err) {
      console.error("Failed to hire agent:", err);
    } finally {
      setHiringAgent(null);
    }
  }

  // x402 demo flow
  function runX402Demo() {
    setDemoActive(true);
    setX402Step(0);

    const steps = [1, 2, 3, 4, 5, 6];
    steps.forEach((step, i) => {
      setTimeout(() => {
        setX402Step(step);
        if (step === 6) {
          setTimeout(() => setDemoActive(false), 3000);
        }
      }, (i + 1) * 1200);
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* ---------- header ---------- */}
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-400">
          <Network className="size-4" />
          Kite AI Testnet (Chain ID: 2368)
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Kite AI <span className="text-cyan-400">Integration</span>
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg text-zinc-400">
          Agent-native payments and identity on Kite AI. Agents discover, authenticate,
          and pay each other using x402 protocol with gokite-aa scheme and Kite Passport
          verifiable identity.
        </p>
      </div>

      {/* ---------- network info cards ---------- */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
              <Network className="size-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Network</p>
              <p className="text-sm font-semibold text-white">Kite AI Testnet</p>
              <p className="text-[10px] text-zinc-600">Chain ID: 2368</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/15 text-green-400">
              <CreditCard className="size-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Payment Scheme</p>
              <p className="text-sm font-semibold text-white">gokite-aa (x402)</p>
              <p className="text-[10px] text-zinc-600">Test USDT Token</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
              <Fingerprint className="size-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Identity</p>
              <p className="text-sm font-semibold text-white">Kite Passport</p>
              <p className="text-[10px] text-zinc-600">BIP-32 Derived</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400">
              <Shield className="size-5" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Facilitator</p>
              <p className="text-sm font-semibold text-white">Pieverse</p>
              <p className="text-[10px] text-zinc-600 truncate max-w-[140px]">{FACILITATOR_ADDRESS}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ---------- tabs ---------- */}
      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="bg-zinc-900/80 border border-zinc-800">
          <TabsTrigger value="discover" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Bot className="mr-2 size-4" />
            Agent Discovery
          </TabsTrigger>
          <TabsTrigger value="identity" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Fingerprint className="mr-2 size-4" />
            Kite Passport
          </TabsTrigger>
          <TabsTrigger value="x402" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400">
            <Zap className="mr-2 size-4" />
            x402 Payment Flow
          </TabsTrigger>
          <TabsTrigger value="reputation" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
            <Star className="mr-2 size-4" />
            Reputation
          </TabsTrigger>
        </TabsList>

        {/* ===== DISCOVER TAB ===== */}
        <TabsContent value="discover" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Available Agents</h2>
              <p className="text-sm text-zinc-400">
                Discover and hire AI agents on Kite AI. All endpoints are x402-gated with gokite-aa scheme.
              </p>
            </div>
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              {agents.length} agents
            </Badge>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Loader2 className="mb-4 size-12 animate-spin text-cyan-500" />
              <p className="text-lg font-medium text-zinc-400">
                Discovering agents on Kite AI...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  className="group border-zinc-800 bg-zinc-900/50 transition-all hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
                          <Bot className="size-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-white">
                            {agent.name ?? agent.metadataURI ?? agent.id}
                          </CardTitle>
                          <Badge
                            variant="outline"
                            className={`mt-1 text-[10px] ${
                              CATEGORY_COLORS[agent.category] ?? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                            }`}
                          >
                            {agent.category}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400 text-[10px]">
                        {agent.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-4">
                    <CardDescription className="line-clamp-2 text-zinc-400">
                      {agent.description ?? agent.metadataURI ?? "On-chain agent"}
                    </CardDescription>

                    <div className="flex flex-wrap gap-1.5">
                      {(agent.capabilities ?? []).map((cap) => (
                        <span
                          key={cap}
                          className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <StarRating rating={agent.reputation ?? 0} />
                      <span className="text-xs text-zinc-500">
                        {(agent.totalTasks ?? 0).toLocaleString()} tasks
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                      <CreditCard className="size-4 text-cyan-400" />
                      <span className="text-sm font-semibold text-white">
                        {formatUSDT(agent.pricePerTask)} USDT
                      </span>
                      <span className="ml-auto text-xs text-zinc-500">per task</span>
                    </div>

                    <div className="text-[10px] text-zinc-600 truncate">
                      DID: {agent.did}
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full gap-2 bg-cyan-600 text-white hover:bg-cyan-500"
                      onClick={() => handleHire(agent.id)}
                      disabled={hiringAgent === agent.id}
                    >
                      {hiringAgent === agent.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Hiring...
                        </>
                      ) : (
                        <>
                          Hire Agent
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* Hire Result */}
          {hireResult && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="size-5" />
                  Agent Hired Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-zinc-500">Task ID:</span>
                    <p className="font-mono text-xs text-white">{hireResult.taskId}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Agent:</span>
                    <p className="text-white">{hireResult.agentId}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Status:</span>
                    <p className="text-green-400">{hireResult.status}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500">Est. Completion:</span>
                    <p className="text-white">
                      {new Date(hireResult.result.estimatedCompletion).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-zinc-400">{hireResult.result.message}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== IDENTITY TAB ===== */}
        <TabsContent value="identity" className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Kite Passport Identity System</h2>
            <p className="text-sm text-zinc-400">
              Three-tier hierarchical identity built on BIP-32 key derivation for verifiable agent identity.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* User Tier */}
            <Card className="border-purple-500/30 bg-zinc-900/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                    <Users className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-white">User Identity</CardTitle>
                    <p className="text-xs text-purple-400">Root Authority</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                  <p className="text-xs text-zinc-400">DID Format</p>
                  <p className="font-mono text-sm text-purple-300">did:kite:alice.eth</p>
                </div>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <Key className="mt-0.5 size-3.5 text-purple-400 shrink-0" />
                    Private keys in secure enclaves, NEVER exposed
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="mt-0.5 size-3.5 text-purple-400 shrink-0" />
                    Can revoke all delegated permissions in single tx
                  </li>
                  <li className="flex items-start gap-2">
                    <Fingerprint className="mt-0.5 size-3.5 text-purple-400 shrink-0" />
                    Signs Standing Intents (SI) to authorize agents
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Agent Tier */}
            <Card className="border-cyan-500/30 bg-zinc-900/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                    <Bot className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Agent Identity</CardTitle>
                    <p className="text-xs text-cyan-400">Delegated Authority</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <p className="text-xs text-zinc-400">DID Format</p>
                  <p className="font-mono text-sm text-cyan-300 break-all">did:kite:alice.eth/chatgpt/portfolio-v1</p>
                </div>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <Key className="mt-0.5 size-3.5 text-cyan-400 shrink-0" />
                    Deterministic address derived via BIP-32
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="mt-0.5 size-3.5 text-cyan-400 shrink-0" />
                    Provable ownership without key exposure
                  </li>
                  <li className="flex items-start gap-2">
                    <Fingerprint className="mt-0.5 size-3.5 text-cyan-400 shrink-0" />
                    Creates Delegation Tokens (DT) for sessions
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Session Tier */}
            <Card className="border-orange-500/30 bg-zinc-900/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                    <Clock className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Session Identity</CardTitle>
                    <p className="text-xs text-orange-400">Ephemeral Authority</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                  <p className="text-xs text-zinc-400">Key Type</p>
                  <p className="font-mono text-sm text-orange-300">Random key, 60s TTL</p>
                </div>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2">
                    <Key className="mt-0.5 size-3.5 text-orange-400 shrink-0" />
                    Random keys with perfect forward secrecy
                  </li>
                  <li className="flex items-start gap-2">
                    <Shield className="mt-0.5 size-3.5 text-orange-400 shrink-0" />
                    Auto-expire after use
                  </li>
                  <li className="flex items-start gap-2">
                    <Fingerprint className="mt-0.5 size-3.5 text-orange-400 shrink-0" />
                    Cannot be reversed to derive parent keys
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Authorization Chain */}
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-white">Cryptographic Authorization Chain</CardTitle>
              <CardDescription>Three-layer signature verification for secure agent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-2">
                <div className="flex-1 rounded-lg border border-purple-500/20 bg-purple-500/5 p-4">
                  <p className="text-xs font-semibold text-purple-400">Standing Intent (SI)</p>
                  <p className="mt-1 text-xs text-zinc-400">User authorizes agent with caps and expiry</p>
                  <pre className="mt-2 rounded bg-black/30 p-2 text-[10px] text-zinc-300 overflow-x-auto">
{`SI = sign_user(
  iss: user_addr,
  sub: agent_did,
  caps: {max_tx:100}
)`}
                  </pre>
                </div>
                <ArrowRight className="hidden md:block size-5 text-zinc-600 shrink-0" />
                <div className="flex-1 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <p className="text-xs font-semibold text-cyan-400">Delegation Token (DT)</p>
                  <p className="mt-1 text-xs text-zinc-400">Agent authorizes session for specific op</p>
                  <pre className="mt-2 rounded bg-black/30 p-2 text-[10px] text-zinc-300 overflow-x-auto">
{`DT = sign_agent(
  iss: agent_did,
  sub: session_key,
  op: op_details
)`}
                  </pre>
                </div>
                <ArrowRight className="hidden md:block size-5 text-zinc-600 shrink-0" />
                <div className="flex-1 rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                  <p className="text-xs font-semibold text-orange-400">Session Signature (SS)</p>
                  <p className="mt-1 text-xs text-zinc-400">Session executes with all 3 signatures</p>
                  <pre className="mt-2 rounded bg-black/30 p-2 text-[10px] text-zinc-300 overflow-x-auto">
{`Verify: SI + DT + SS
-> Execute on-chain
-> Settled via Pieverse`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== X402 PAYMENT FLOW TAB ===== */}
        <TabsContent value="x402" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">x402 Payment Flow (gokite-aa)</h2>
              <p className="text-sm text-zinc-400">
                HTTP-native payments using Kite&apos;s gokite-aa scheme with Pieverse facilitator.
              </p>
            </div>
            <Button
              onClick={runX402Demo}
              disabled={demoActive}
              className="bg-green-600 hover:bg-green-500"
            >
              {demoActive ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Zap className="mr-2 size-4" />
                  Run Live Demo
                </>
              )}
            </Button>
          </div>

          {/* x402 flow steps */}
          <div className="space-y-3">
            {[
              {
                step: 1,
                label: "Client Agent sends request",
                detail: "GET /api/kite/discover (no X-PAYMENT header)",
                icon: Bot,
                color: "cyan",
              },
              {
                step: 2,
                label: "Service returns 402 Payment Required",
                detail: 'Response includes gokite-aa payment requirements, asset: Test USDT',
                icon: CreditCard,
                color: "red",
              },
              {
                step: 3,
                label: "Client obtains authorization via Kite Passport",
                detail: "Signs payment with Standing Intent + Delegation Token",
                icon: Fingerprint,
                color: "purple",
              },
              {
                step: 4,
                label: "Client retries with X-PAYMENT header",
                detail: "Base64-encoded JSON with authorization + signature",
                icon: Key,
                color: "yellow",
              },
              {
                step: 5,
                label: "Server verifies and settles via Pieverse",
                detail: `POST /v2/verify then /v2/settle at ${FACILITATOR_ADDRESS.slice(0, 10)}...`,
                icon: Shield,
                color: "orange",
              },
              {
                step: 6,
                label: "200 OK - Resource delivered",
                detail: "Agent list returned with X-PAYMENT-RESPONSE header",
                icon: CheckCircle,
                color: "green",
              },
            ].map(({ step, label, detail, icon: Icon, color }) => {
              const isActive = demoActive && x402Step >= step;
              const isCurrent = demoActive && x402Step === step;

              return (
                <div
                  key={step}
                  className={`flex items-center gap-4 rounded-lg border p-4 transition-all duration-500 ${
                    isCurrent
                      ? `border-${color}-500/50 bg-${color}-500/10 shadow-lg shadow-${color}-500/10`
                      : isActive
                      ? `border-${color}-500/20 bg-${color}-500/5`
                      : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? `bg-${color}-500/20 text-${color}-400`
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {isCurrent ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : isActive ? (
                      <CheckCircle className="size-5" />
                    ) : (
                      <Icon className="size-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        isActive ? "text-white" : "text-zinc-400"
                      }`}
                    >
                      Step {step}: {label}
                    </p>
                    <p className="text-xs text-zinc-500">{detail}</p>
                  </div>
                  <div className="text-xs">
                    {isActive && !isCurrent && (
                      <Badge variant="outline" className="border-green-500/30 text-green-400">
                        Done
                      </Badge>
                    )}
                    {isCurrent && (
                      <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 animate-pulse">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Technical details */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-sm text-white">Kite vs Standard x402</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  {[
                    ["Scheme", "exact", "gokite-aa"],
                    ["Network", "eip155:8453", "kite-testnet"],
                    ["Price Format", '"$0.01"', "maxAmountRequired (wei)"],
                    ["Asset", "Implicit USDC", "Explicit Test USDT addr"],
                    ["Payment Header", "PAYMENT-SIGNATURE (V2)", "X-PAYMENT (V1)"],
                    ["Facilitator", "CDP / x402.org", "Pieverse"],
                  ].map(([field, standard, kite]) => (
                    <div key={field} className="grid grid-cols-3 gap-2 border-b border-zinc-800 pb-2">
                      <span className="text-zinc-500">{field}</span>
                      <span className="text-zinc-400">{standard}</span>
                      <span className="text-cyan-400">{kite}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-sm text-white">X-PAYMENT Header Format</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg bg-black/50 p-3 text-[10px] text-zinc-300 overflow-x-auto">
{`// Base64-encoded JSON:
{
  "authorization": {
    "from": "0xAgentAddress",
    "to": "0xServiceProvider",
    "value": "1000000000000000000",
    "validAfter": 1708000000,
    "validBefore": 1708003600,
    "nonce": "0x..."
  },
  "signature": "0x..."
}`}
                </pre>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500">
                  <Eye className="size-3" />
                  <span>Asset: {KITE_TEST_USDT}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== REPUTATION TAB ===== */}
        <TabsContent value="reputation" className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Agent Reputation System</h2>
            <p className="text-sm text-zinc-400">
              Reputation derived from cryptographic proofs of actual on-chain behavior.
              Portable across services on Kite AI.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="mb-4 size-12 animate-spin text-yellow-500" />
              <p className="text-zinc-400">Loading reputation data...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reputations.map((rep) => {
                const agent = agents.find((a) => a.id === rep.agentId);
                return (
                  <Card key={rep.agentId} className="border-zinc-800 bg-zinc-900/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-400">
                            <Bot className="size-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {agent?.name ?? rep.agentId}
                            </p>
                            <p className="font-mono text-[10px] text-zinc-500">{rep.did}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px]">
                            {rep.identityTier} Tier
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${rep.standingIntentActive !== false ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
                            {rep.standingIntentActive !== false ? "SI Active" : "SI Inactive"}
                          </Badge>
                          {rep.isActive !== undefined && (
                            <Badge variant="outline" className={`text-[10px] ${rep.isActive ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"}`}>
                              {rep.isActive ? "Active" : "Inactive"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                          <p className="text-[10px] text-zinc-500">Reputation Score</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Star className="size-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-lg font-bold text-white">{rep.score.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                          <p className="text-[10px] text-zinc-500">Total Transactions</p>
                          <p className="mt-1 text-lg font-bold text-white">
                            {rep.totalTransactions.toLocaleString()}
                          </p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                          <p className="text-[10px] text-zinc-500">Success Rate</p>
                          <p className="mt-1 text-lg font-bold text-green-400">
                            {rep.successRate ?? (rep.dimensions?.reliability ? Math.round(rep.dimensions.reliability) : 0)}%
                          </p>
                        </div>
                        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                          <p className="text-[10px] text-zinc-500">Identity</p>
                          <p className="mt-1 text-lg font-bold text-purple-400">
                            Verified
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ---------- footer ---------- */}
      <div className="mt-12 flex flex-col items-center justify-center gap-2 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-green-500" />
          Connected to Kite AI Testnet (Chain ID: 2368) via {" "}
          <a
            href="https://testnet.kitescan.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-500 hover:underline"
          >
            KiteScan
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span>RPC: https://rpc-testnet.gokite.ai/</span>
          <span>Facilitator: Pieverse ({FACILITATOR_ADDRESS.slice(0, 10)}...)</span>
        </div>
      </div>
    </section>
  );
}
