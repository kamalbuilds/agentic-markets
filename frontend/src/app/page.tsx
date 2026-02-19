"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Globe,
  Coins,
  Wallet,
  Search,
  ArrowRight,
  Bot,
  Store,
  Activity,
  Users,
  ChevronRight,
  Shield,
} from "lucide-react";
import { useReadContract } from "wagmi";
import { CONTRACTS, AGENT_REGISTRY_ABI, PAYMENT_ROUTER_ABI, MERCHANT_VAULT_ABI } from "@/lib/contracts";
import { formatEther } from "viem";

const features = [
  {
    title: "Zero Gas Fees",
    description:
      "Custom ERC-4337 paymaster sponsors all transactions. Users never pay gas — the protocol covers it.",
    icon: Zap,
    gradient: "from-indigo-500/20 to-purple-500/20",
    iconColor: "text-indigo-400",
    borderColor: "border-indigo-500/20 hover:border-indigo-500/40",
  },
  {
    title: "Cross-Chain Commerce",
    description:
      "Agents operate across ADI Chain, Hedera, and Kite AI. Seamless interoperability for autonomous transactions.",
    icon: Globe,
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400",
    borderColor: "border-purple-500/20 hover:border-purple-500/40",
  },
  {
    title: "DDSC Stablecoin",
    description:
      "Pay with UAE Dirham-backed stablecoin, launched February 2026. Stable, regulated, and built for agent commerce.",
    icon: Coins,
    gradient: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-400",
    borderColor: "border-pink-500/20 hover:border-pink-500/40",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect Your Wallet",
    description:
      "Link your wallet through RainbowKit. Supports MetaMask, WalletConnect, and more.",
    icon: Wallet,
  },
  {
    number: "02",
    title: "Browse or Register an AI Agent",
    description:
      "Discover autonomous agents in the marketplace or register your own as a merchant.",
    icon: Search,
  },
  {
    number: "03",
    title: "Pay & Transact with Zero Gas",
    description:
      "Execute payments and agent-to-agent transactions — all gas fees are sponsored by the protocol.",
    icon: Shield,
  },
];

const bounties = ["ADI Chain", "Hedera", "Kite AI", "ERC-4337"];

export default function Home() {
  const { data: activeAgents } = useReadContract({
    address: CONTRACTS.agentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getActiveAgentCount",
  });
  const { data: totalPayments } = useReadContract({
    address: CONTRACTS.paymentRouter,
    abi: PAYMENT_ROUTER_ABI,
    functionName: "totalPayments",
  });
  const { data: totalVolume } = useReadContract({
    address: CONTRACTS.paymentRouter,
    abi: PAYMENT_ROUTER_ABI,
    functionName: "totalVolume",
  });
  const { data: merchantCount } = useReadContract({
    address: CONTRACTS.merchantVault,
    abi: MERCHANT_VAULT_ABI,
    functionName: "nextMerchantId",
  });

  const stats = [
    { label: "Active Agents", value: activeAgents ? activeAgents.toString() : "...", icon: Bot },
    { label: "Total Payments", value: totalPayments ? totalPayments.toString() : "...", icon: Activity },
    { label: "Total Volume", value: totalVolume ? `${formatEther(totalVolume)} ADI` : "...", icon: Coins },
    { label: "Merchants", value: merchantCount ? (Number(merchantCount) - 1).toString() : "...", icon: Users },
  ];

  return (
    <div className="relative min-h-screen bg-black">
      {/* Background gradient effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[40%] left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute top-[20%] -left-[10%] h-[50vh] w-[50vh] rounded-full bg-purple-600/10 blur-[100px]" />
        <div className="absolute top-[60%] -right-[10%] h-[40vh] w-[40vh] rounded-full bg-indigo-500/8 blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* ====== HERO SECTION ====== */}
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pt-36">
          <div className="flex flex-col items-center text-center">
            {/* ETHDenver badge */}
            <Badge
              variant="outline"
              className="mb-6 border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300"
            >
              <Zap className="mr-1 h-3 w-3" />
              ETHDenver 2026
            </Badge>

            <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
              AI Agent Commerce.{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Zero Gas Fees.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-400 sm:text-xl">
              Autonomous AI agents that discover, negotiate, and pay each other
              across chains. Built on ADI Chain with ERC-4337 account
              abstraction.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-indigo-600 px-8 text-base font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                <Link href="/agents">
                  <Bot className="mr-2 h-5 w-5" />
                  Browse Agents
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-xl border-white/15 bg-white/5 px-8 text-base font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <Link href="/merchant">
                  <Store className="mr-2 h-5 w-5" />
                  Become a Merchant
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ====== STATS BAR ====== */}
        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:grid-cols-4 sm:gap-6">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Icon className="h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-2xl font-bold text-white sm:text-3xl">
                  {value}
                </span>
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ====== FEATURES GRID ====== */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Built for the Agent Economy
            </h2>
            <p className="mt-4 text-lg text-neutral-400">
              Everything AI agents need to transact autonomously.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map(
              ({
                title,
                description,
                icon: Icon,
                gradient,
                iconColor,
                borderColor,
              }) => (
                <Card
                  key={title}
                  className={`group relative overflow-hidden border bg-black/40 backdrop-blur-sm transition-all duration-300 ${borderColor}`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <CardHeader className="relative">
                    <div
                      className={`mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}
                    >
                      <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                    <CardTitle className="text-xl text-white">
                      {title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-neutral-400">
                      {description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            )}
          </div>
        </section>

        {/* ====== HOW IT WORKS ====== */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-neutral-400">
              Three steps to start transacting with AI agents.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map(({ number, title, description, icon: Icon }, index) => (
              <div key={number} className="relative flex flex-col items-center text-center">
                {/* Connector line between steps */}
                {index < steps.length - 1 && (
                  <div className="absolute left-[calc(50%+3rem)] top-8 hidden h-px w-[calc(100%-6rem)] bg-gradient-to-r from-indigo-500/40 to-transparent md:block" />
                )}
                <div className="relative mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
                    <Icon className="h-7 w-7 text-indigo-400" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    {number}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {title}
                </h3>
                <p className="max-w-xs text-sm leading-relaxed text-neutral-400">
                  {description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA under How It Works */}
          <div className="mt-12 flex justify-center">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl bg-indigo-600 px-8 text-base font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              <Link href="/agents">
                Get Started
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ====== BOUNTY BADGES ====== */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center backdrop-blur-sm">
            <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
              Built for ETHDenver 2026 Bounties
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {bounties.map((name) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="border-indigo-500/30 bg-indigo-500/10 px-5 py-2 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20"
                >
                  {name}
                </Badge>
              ))}
            </div>
            <p className="max-w-lg text-sm leading-relaxed text-neutral-500">
              AgentMarket integrates ADI Chain for zero-gas commerce, Hedera for
              consensus, Kite AI for agent intelligence, and ERC-4337 for
              account abstraction.
            </p>
          </div>
        </section>

        {/* ====== FOOTER ====== */}
        <footer className="border-t border-white/10 py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/20">
                <Zap className="h-3 w-3 text-indigo-400" />
              </div>
              <span className="text-sm font-semibold text-white">
                Agent<span className="text-indigo-400">Market</span>
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              ETHDenver 2026 &middot; Built on ADI Chain &middot; Zero Gas Commerce
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
