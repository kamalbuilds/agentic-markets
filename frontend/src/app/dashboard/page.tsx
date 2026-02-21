"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Wallet,
  Bot,
  ShoppingCart,
  Clock,
  ArrowUpRight,
  Zap,
  Shield,
  TrendingUp,
  Loader2,
  Plus,
} from "lucide-react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
} from "wagmi";
import {
  AGENT_REGISTRY_ABI,
  PAYMENT_ROUTER_ABI,
  ADI_PAYMASTER_ABI,
  MOCK_DDSC_ABI,
} from "@/lib/contracts";
import { useChainContracts } from "@/lib/useChainContracts";
import { formatEther, zeroAddress, parseEther } from "viem";
import { toast } from "sonner";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { contracts, chainMeta, chainId, isHedera } = useChainContracts();

  const EXPLORER_URL = chainMeta.explorerUrl;

  // Whether contracts are deployed (not zero address)
  const isDeployed = {
    agentRegistry: contracts.agentRegistry !== zeroAddress,
    paymentRouter: contracts.paymentRouter !== zeroAddress,
    adiPaymaster: contracts.adiPaymaster !== zeroAddress,
    mockDDSC: contracts.mockDDSC !== zeroAddress,
  };

  // ── Native ADI balance ──
  const { data: nativeBalance } = useBalance({
    address,
    chainId: chainId,
  });

  // ── DDSC balance ──
  const { data: ddscBalance, refetch: refetchDdsc } = useReadContract({
    address: contracts.mockDDSC,
    abi: MOCK_DDSC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: chainId,
    query: { enabled: isConnected && isDeployed.mockDDSC && !!address },
  });

  // ── Payment data ──
  const { data: userPayments } = useReadContract({
    address: contracts.paymentRouter,
    abi: PAYMENT_ROUTER_ABI,
    functionName: "getUserPayments",
    args: address ? [address] : undefined,
    chainId: chainId,
    query: { enabled: isConnected && isDeployed.paymentRouter && !!address },
  });

  const { data: totalVolume } = useReadContract({
    address: contracts.paymentRouter,
    abi: PAYMENT_ROUTER_ABI,
    functionName: "totalVolume",
    chainId: chainId,
    query: { enabled: isDeployed.paymentRouter },
  });

  // ── Agent data ──
  const { data: ownerAgents, refetch: refetchAgents } = useReadContract({
    address: contracts.agentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getOwnerAgents",
    args: address ? [address] : undefined,
    chainId: chainId,
    query: { enabled: isConnected && isDeployed.agentRegistry && !!address },
  });

  const { data: totalAgents } = useReadContract({
    address: contracts.agentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getActiveAgentCount",
    chainId: chainId,
    query: { enabled: isDeployed.agentRegistry },
  });

  // ── Paymaster data ──
  const { data: sponsorshipInfo } = useReadContract({
    address: contracts.adiPaymaster,
    abi: ADI_PAYMASTER_ABI,
    functionName: "getSponsorshipInfo",
    args: address ? [address] : undefined,
    chainId: chainId,
    query: { enabled: isConnected && isDeployed.adiPaymaster && !!address },
  });

  const { data: paymasterDeposit } = useReadContract({
    address: contracts.adiPaymaster,
    abi: ADI_PAYMASTER_ABI,
    functionName: "getDeposit",
    chainId: chainId,
    query: { enabled: isDeployed.adiPaymaster },
  });

  const { data: totalSponsored } = useReadContract({
    address: contracts.adiPaymaster,
    abi: ADI_PAYMASTER_ABI,
    functionName: "totalSponsored",
    chainId: chainId,
    query: { enabled: isDeployed.adiPaymaster },
  });

  // ── Write hooks ──
  const { writeContract: claimDdsc, isPending: isClaimingDdsc } =
    useWriteContract();
  const { writeContract: registerAgent, isPending: isRegistering } =
    useWriteContract();

  // ── Agent registration form state ──
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentDescription, setAgentDescription] = useState("");
  const [agentPrice, setAgentPrice] = useState("");

  // ── Handlers ──
  const handleClaimDdsc = () => {
    if (!address) return;
    if (!isDeployed.mockDDSC) {
      toast.error("MockDDSC contract is not yet deployed");
      return;
    }
    claimDdsc(
      {
        address: contracts.mockDDSC,
        abi: MOCK_DDSC_ABI,
        functionName: "faucet",
        args: [address, parseEther("1000")],
      },
      {
        onSuccess: () => {
          toast.success("Claimed 1,000 DDSC test tokens!");
          refetchDdsc();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to claim DDSC");
        },
      }
    );
  };

  const handleRegisterAgent = () => {
    if (!address) return;
    if (!isDeployed.agentRegistry) {
      toast.error("AgentRegistry contract is not yet deployed");
      return;
    }
    if (!agentName.trim()) {
      toast.error("Please enter an agent name");
      return;
    }
    if (!agentPrice || parseFloat(agentPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    // Encode name + description as a simple JSON metadata URI
    const metadataURI = JSON.stringify({
      name: agentName,
      description: agentDescription,
    });

    registerAgent(
      {
        address: contracts.agentRegistry,
        abi: AGENT_REGISTRY_ABI,
        functionName: "registerAgent",
        args: [metadataURI, parseEther(agentPrice)],
      },
      {
        onSuccess: () => {
          toast.success("Agent registered successfully!");
          setAgentName("");
          setAgentDescription("");
          setAgentPrice("");
          setShowRegisterForm(false);
          refetchAgents();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to register agent");
        },
      }
    );
  };

  // ── Derived values ──
  const nativeBalanceFormatted = nativeBalance
    ? parseFloat(formatEther(nativeBalance.value)).toFixed(4)
    : "0.0000";

  const ddscBalanceFormatted =
    ddscBalance !== undefined && ddscBalance !== null
      ? parseFloat(formatEther(ddscBalance as bigint)).toFixed(2)
      : "0.00";

  const userPaymentCount =
    userPayments && Array.isArray(userPayments)
      ? (userPayments as unknown[]).length
      : 0;

  const totalVolumeFormatted =
    totalVolume !== undefined && totalVolume !== null
      ? parseFloat(formatEther(totalVolume as bigint)).toFixed(2)
      : "0.00";

  const agentIds =
    ownerAgents && Array.isArray(ownerAgents)
      ? (ownerAgents as bigint[])
      : [];

  const sponsorCount =
    sponsorshipInfo && Array.isArray(sponsorshipInfo)
      ? Number(sponsorshipInfo[0])
      : 0;
  const sponsorRemaining =
    sponsorshipInfo && Array.isArray(sponsorshipInfo)
      ? Number(sponsorshipInfo[1])
      : 0;
  const isWhitelisted =
    sponsorshipInfo && Array.isArray(sponsorshipInfo)
      ? Boolean(sponsorshipInfo[2])
      : false;

  const paymasterDepositFormatted =
    paymasterDeposit !== undefined && paymasterDeposit !== null
      ? parseFloat(formatEther(paymasterDeposit as bigint)).toFixed(4)
      : "0.0000";

  const totalSponsoredCount =
    totalSponsored !== undefined && totalSponsored !== null
      ? Number(totalSponsored)
      : 0;

  const maxSponsored = 100; // Display max for progress bar
  const sponsorProgress = Math.min(
    (sponsorRemaining / maxSponsored) * 100,
    100
  );

  // ── Not connected state ──
  if (!isConnected) {
    return (
      <div className="relative min-h-screen bg-black">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
        </div>
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <Card className="w-full max-w-md border-white/10 bg-black/60 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
                <Wallet className="h-7 w-7 text-indigo-400" />
              </div>
              <CardTitle className="text-2xl text-white">
                Connect Your Wallet
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Connect your wallet using the button in the header to access
                your AgentMarket dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Badge
                variant="outline"
                className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
              >
                <Zap className="mr-1 h-3 w-3" />
                Zero gas fees on {chainMeta.name}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div className="relative min-h-screen bg-black">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[40%] left-1/2 h-[80vh] w-[80vh] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] h-[40vh] w-[40vh] rounded-full bg-purple-600/8 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-neutral-400">
            Welcome back,{" "}
            <span className="font-mono text-sm text-indigo-400">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="border border-white/10 bg-white/[0.03]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600/20 data-[state=active]:text-indigo-300">
              <TrendingUp className="mr-1.5 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-indigo-600/20 data-[state=active]:text-indigo-300">
              <Bot className="mr-1.5 h-4 w-4" />
              My Agents
            </TabsTrigger>
            <TabsTrigger value="paymaster" className="data-[state=active]:bg-indigo-600/20 data-[state=active]:text-indigo-300">
              <Shield className="mr-1.5 h-4 w-4" />
              Paymaster
            </TabsTrigger>
          </TabsList>

          {/* ====== OVERVIEW TAB ====== */}
          <TabsContent value="overview" className="space-y-6">
            {/* Balance cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* ADI Balance */}
              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-neutral-400">
                    <Wallet className="h-4 w-4 text-indigo-400" />
                    {chainMeta.currencySymbol} Balance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">
                    {nativeBalanceFormatted}
                  </p>
                  <p className="text-xs text-neutral-500">Native Token</p>
                </CardContent>
              </Card>

              {/* DDSC Balance */}
              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-neutral-400">
                    <Zap className="h-4 w-4 text-purple-400" />
                    DDSC Balance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">
                    {isDeployed.mockDDSC ? ddscBalanceFormatted : "--"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {isDeployed.mockDDSC ? "Stablecoin" : "Not Deployed"}
                  </p>
                </CardContent>
              </Card>

              {/* Total Payments */}
              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-neutral-400">
                    <ShoppingCart className="h-4 w-4 text-emerald-400" />
                    My Payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">
                    {isDeployed.paymentRouter ? userPaymentCount : "--"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {isDeployed.paymentRouter
                      ? "Transactions"
                      : "Not Deployed"}
                  </p>
                </CardContent>
              </Card>

              {/* Platform Volume */}
              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-neutral-400">
                    <TrendingUp className="h-4 w-4 text-pink-400" />
                    Platform Volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">
                    {isDeployed.paymentRouter
                      ? `${totalVolumeFormatted} ${chainMeta.currencySymbol}`
                      : "--"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {isDeployed.paymentRouter ? "All Time" : "Not Deployed"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Claim DDSC Card */}
            <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white">
                  Test Token Faucet
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Claim free DDSC test tokens to try out AgentMarket payments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-neutral-300">
                      Current DDSC Balance:{" "}
                      <span className="font-semibold text-white">
                        {isDeployed.mockDDSC ? `${ddscBalanceFormatted} DDSC` : "Contract not deployed"}
                      </span>
                    </p>
                    <p className="text-xs text-neutral-500">
                      Each claim gives you 1,000 DDSC tokens
                    </p>
                  </div>
                  <Button
                    onClick={handleClaimDdsc}
                    disabled={isClaimingDdsc || !isDeployed.mockDDSC}
                    className="rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-500 transition-colors"
                  >
                    {isClaimingDdsc ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Claim Test DDSC
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="group border-white/10 bg-black/40 backdrop-blur-sm transition-all hover:border-indigo-500/30">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                    <Bot className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Browse Agents</p>
                    <p className="text-sm text-neutral-400">
                      {isDeployed.agentRegistry
                        ? `${totalAgents ? Number(totalAgents) : 0} active agents`
                        : "Registry not deployed"}
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-neutral-500 transition-colors group-hover:text-indigo-400" />
                </CardContent>
              </Card>

              <Card className="group border-white/10 bg-black/40 backdrop-blur-sm transition-all hover:border-purple-500/30">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                    <Clock className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      Transaction History
                    </p>
                    <p className="text-sm text-neutral-400">
                      {userPaymentCount} transactions recorded
                    </p>
                  </div>
                  <a
                    href={
                      address
                        ? `${EXPLORER_URL}/address/${address}`
                        : EXPLORER_URL
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowUpRight className="h-5 w-5 text-neutral-500 transition-colors group-hover:text-purple-400" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ====== MY AGENTS TAB ====== */}
          <TabsContent value="agents" className="space-y-6">
            {/* Agent list or empty state */}
            <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-white">
                      My Registered Agents
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                      AI agents you have registered on the AgentMarket
                      platform.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowRegisterForm(!showRegisterForm)}
                    variant="outline"
                    className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:text-indigo-200"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Register Agent
                  </Button>
                </div>
              </CardHeader>

              <Separator className="bg-white/10" />

              <CardContent className="pt-6">
                {!isDeployed.agentRegistry ? (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                    <Bot className="mx-auto mb-3 h-10 w-10 text-amber-400/60" />
                    <p className="font-medium text-amber-300">
                      AgentRegistry Not Deployed
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      The AgentRegistry contract has not been deployed yet.
                      Agent data will appear here once deployed.
                    </p>
                  </div>
                ) : agentIds.length === 0 ? (
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
                    <Bot className="mx-auto mb-3 h-10 w-10 text-neutral-600" />
                    <p className="font-medium text-neutral-300">
                      No Agents Registered
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      You haven&apos;t registered any agents yet. Click
                      &quot;Register Agent&quot; above to get started.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {agentIds.map((agentId) => (
                      <AgentRow
                        key={agentId.toString()}
                        agentId={agentId}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Registration form */}
            {showRegisterForm && (
              <Card className="border-indigo-500/20 bg-black/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-white">
                    Register New Agent
                  </CardTitle>
                  <CardDescription className="text-neutral-400">
                    Fill in the details to register your AI agent on the
                    marketplace.
                  </CardDescription>
                </CardHeader>

                <Separator className="bg-white/10" />

                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">
                      Agent Name
                    </label>
                    <Input
                      placeholder="My Trading Bot"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="border-white/10 bg-white/[0.05] text-white placeholder:text-neutral-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">
                      Description
                    </label>
                    <Textarea
                      placeholder="Describe what your agent does..."
                      value={agentDescription}
                      onChange={(e) => setAgentDescription(e.target.value)}
                      rows={3}
                      className="border-white/10 bg-white/[0.05] text-white placeholder:text-neutral-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">
                      Price per Task ({chainMeta.currencySymbol})
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="0.01"
                        value={agentPrice}
                        onChange={(e) => setAgentPrice(e.target.value)}
                        className="border-white/10 bg-white/[0.05] pr-14 text-white placeholder:text-neutral-600"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-indigo-400">
                        {chainMeta.currencySymbol}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="gap-3 pt-2">
                  <Button
                    onClick={handleRegisterAgent}
                    disabled={isRegistering || !isDeployed.agentRegistry}
                    className="rounded-xl bg-indigo-600 font-semibold text-white hover:bg-indigo-500 transition-colors"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Bot className="mr-2 h-4 w-4" />
                        Register Agent
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowRegisterForm(false)}
                    className="text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          {/* ====== PAYMASTER TAB ====== */}
          <TabsContent value="paymaster" className="space-y-6">
            {/* Paymaster status */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Sponsorship count */}
              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-neutral-400">
                    <Zap className="h-4 w-4 text-indigo-400" />
                    Sponsored Txns (You)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">
                    {isDeployed.adiPaymaster ? sponsorCount : "--"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {isDeployed.adiPaymaster
                      ? "Transactions sponsored for you"
                      : "Not Deployed"}
                  </p>
                </CardContent>
              </Card>

              {/* Remaining */}
              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-neutral-400">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    Remaining Sponsored
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">
                    {isDeployed.adiPaymaster ? sponsorRemaining : "--"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {isDeployed.adiPaymaster
                      ? "Free transactions left"
                      : "Not Deployed"}
                  </p>
                </CardContent>
              </Card>

              {/* Whitelisted */}
              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-neutral-400">
                    <Shield className="h-4 w-4 text-purple-400" />
                    Whitelist Status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant="outline"
                    className={
                      isWhitelisted
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-neutral-500/30 bg-neutral-500/10 text-neutral-300"
                    }
                  >
                    {isDeployed.adiPaymaster
                      ? isWhitelisted
                        ? "Whitelisted"
                        : "Not Whitelisted"
                      : "Unknown"}
                  </Badge>
                  <p className="mt-2 text-xs text-neutral-500">
                    {isWhitelisted
                      ? "Your transactions are gas-sponsored"
                      : "Contact the team to get whitelisted"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Paymaster Info Card */}
            <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-white">
                  ADI Paymaster Info
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  ERC-4337 Paymaster that sponsors gas fees for AgentMarket
                  users.
                </CardDescription>
              </CardHeader>

              <Separator className="bg-white/10" />

              <CardContent className="space-y-6 pt-6">
                {!isDeployed.adiPaymaster ? (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                    <Shield className="mx-auto mb-3 h-10 w-10 text-amber-400/60" />
                    <p className="font-medium text-amber-300">
                      Paymaster Not Deployed
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      The ADI Paymaster contract has not been deployed yet.
                      Sponsorship data will appear here once deployed.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Paymaster Deposit */}
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div>
                        <p className="text-sm text-neutral-400">
                          Paymaster Deposit
                        </p>
                        <p className="text-xl font-bold text-white">
                          {paymasterDepositFormatted} {chainMeta.currencySymbol}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                        <Wallet className="h-6 w-6 text-indigo-400" />
                      </div>
                    </div>

                    {/* Total Sponsored */}
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <div>
                        <p className="text-sm text-neutral-400">
                          Total Sponsored Transactions
                        </p>
                        <p className="text-xl font-bold text-white">
                          {totalSponsoredCount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                        <TrendingUp className="h-6 w-6 text-emerald-400" />
                      </div>
                    </div>

                    {/* Remaining progress bar */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-300">
                          Your Remaining Sponsored Txns
                        </p>
                        <span className="text-sm font-semibold text-indigo-400">
                          {sponsorRemaining} / {maxSponsored}
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-500"
                          style={{ width: `${sponsorProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-neutral-500">
                        The ADI Paymaster sponsors gas fees so you never have
                        to pay for transactions. When your remaining count
                        reaches zero, contact the team for a refill.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* How it works */}
            <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                    <Zap className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      How Gas-Free Transactions Work
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                      AgentMarket uses an ERC-4337 compliant Paymaster deployed
                      on {chainMeta.name}. When you submit a transaction, the Paymaster
                      verifies your whitelist status and sponsors the gas fee on
                      your behalf. You only pay for the actual value of your
                      transactiongas is always free.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Agent Row sub-component ──
function AgentRow({ agentId }: { agentId: bigint }) {
  const { contracts: rowContracts, chainMeta: rowChainMeta, chainId: rowChainId } = useChainContracts();
  const { data: agentData } = useReadContract({
    address: rowContracts.agentRegistry,
    abi: AGENT_REGISTRY_ABI,
    functionName: "getAgent",
    args: [agentId],
    chainId: rowChainId,
  });

  // Parse metadata
  let agentName = `Agent #${agentId.toString()}`;
  let agentDesc = "";
  if (agentData) {
    const agent = agentData as {
      owner: string;
      metadataURI: string;
      pricePerTask: bigint;
      isActive: boolean;
      totalTasks: bigint;
      totalRating: bigint;
      ratingCount: bigint;
      createdAt: bigint;
    };
    try {
      const meta = JSON.parse(agent.metadataURI);
      agentName = meta.name || agentName;
      agentDesc = meta.description || "";
    } catch {
      agentName = agent.metadataURI || agentName;
    }

    return (
      <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-indigo-500/20">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
          <Bot className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-white">{agentName}</p>
            <Badge
              variant="outline"
              className={
                agent.isActive
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }
            >
              {agent.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {agentDesc && (
            <p className="mt-0.5 truncate text-sm text-neutral-500">
              {agentDesc}
            </p>
          )}
          <div className="mt-1 flex items-center gap-4 text-xs text-neutral-500">
            <span>
              Price: {formatEther(agent.pricePerTask)} {rowChainMeta.currencySymbol}
            </span>
            <span>Tasks: {agent.totalTasks.toString()}</span>
            <span>ID: #{agentId.toString()}</span>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
      </div>
      <div>
        <p className="text-sm text-neutral-400">Loading agent #{agentId.toString()}...</p>
      </div>
    </div>
  );
}
