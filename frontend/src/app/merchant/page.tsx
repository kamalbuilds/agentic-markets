"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Store,
  Plus,
  DollarSign,
  ShoppingCart,
  Copy,
  CheckCircle,
  ExternalLink,
  QrCode,
  Download,
} from "lucide-react";
import {
  useWriteContract,
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { MERCHANT_VAULT_ABI } from "@/lib/contracts";
import { useChainContracts } from "@/lib/useChainContracts";
import { formatEther, zeroAddress } from "viem";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface MerchantData {
  owner: string;
  name: string;
  metadataURI: string;
  isActive: boolean;
  totalRevenue: bigint;
  totalOrders: bigint;
  createdAt: bigint;
}

export default function MerchantPortal() {
  const { address, isConnected } = useAccount();
  const { contracts, chainMeta } = useChainContracts();
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);

  // Check if the connected wallet is already a merchant
  const { data: merchantId, isLoading: isLoadingMerchant } = useReadContract({
    address: contracts.merchantVault,
    abi: MERCHANT_VAULT_ABI,
    functionName: "merchantByAddress",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const isMerchant =
    merchantId !== undefined && merchantId !== BigInt(0);

  // Fetch merchant details if registered
  const { data: merchantData } = useReadContract({
    address: contracts.merchantVault,
    abi: MERCHANT_VAULT_ABI,
    functionName: "getMerchant",
    args: isMerchant ? [merchantId!] : undefined,
    query: {
      enabled: isMerchant,
    },
  });

  // Fetch native ADI balance for the merchant
  const { data: nativeBalance } = useReadContract({
    address: contracts.merchantVault,
    abi: MERCHANT_VAULT_ABI,
    functionName: "getMerchantBalance",
    args: isMerchant ? [merchantId!, zeroAddress] : undefined,
    query: {
      enabled: isMerchant,
    },
  });

  // Register merchant write
  const {
    writeContract: registerMerchant,
    data: registerTxHash,
    isPending: isRegistering,
  } = useWriteContract();

  const { isLoading: isWaitingRegister, isSuccess: isRegisterSuccess } =
    useWaitForTransactionReceipt({
      hash: registerTxHash,
    });

  // Withdraw write
  const {
    writeContract: withdrawFunds,
    data: withdrawTxHash,
    isPending: isWithdrawing,
  } = useWriteContract();

  const { isLoading: isWaitingWithdraw, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({
      hash: withdrawTxHash,
    });

  const handleRegister = () => {
    if (!storeName.trim()) {
      toast.error("Please enter a store name");
      return;
    }

    registerMerchant(
      {
        address: contracts.merchantVault,
        abi: MERCHANT_VAULT_ABI,
        functionName: "registerMerchant",
        args: [storeName, description || ""],
      },
      {
        onSuccess: () => {
          toast.success("Registration transaction submitted!");
        },
        onError: (error) => {
          toast.error(
            error.message?.includes("User rejected")
              ? "Transaction rejected"
              : "Registration failed. Please try again."
          );
        },
      }
    );
  };

  const handleWithdraw = () => {
    withdrawFunds(
      {
        address: contracts.merchantVault,
        abi: MERCHANT_VAULT_ABI,
        functionName: "withdraw",
        args: [zeroAddress],
      },
      {
        onSuccess: () => {
          toast.success("Withdrawal transaction submitted!");
        },
        onError: (error) => {
          toast.error(
            error.message?.includes("User rejected")
              ? "Transaction rejected"
              : "Withdrawal failed. Please try again."
          );
        },
      }
    );
  };

  const merchant = merchantData as MerchantData | undefined;

  const checkoutUrl = isMerchant
    ? `/checkout/${merchantId!.toString()}`
    : "";

  // Full checkout URL for QR code
  const fullCheckoutUrl = useMemo(() => {
    if (typeof window === "undefined" || !isMerchant) return "";
    const base = `${window.location.origin}/checkout/${merchantId!.toString()}`;
    const params = new URLSearchParams();
    params.set("contract", contracts.merchantVault);
    params.set("chain", "99999");
    params.set("token", contracts.mockDDSC);
    return `${base}?${params.toString()}`;
  }, [isMerchant, merchantId]);

  // EIP-681 wallet payment URI
  const walletUri = useMemo(() => {
    if (!isMerchant) return "";
    return `ethereum:${contracts.merchantVault}@99999/checkout?uint256=${merchantId!.toString()}`;
  }, [isMerchant, merchantId]);

  const handleCopyUrl = () => {
    const fullUrl = `${window.location.origin}${checkoutUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Checkout URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMerchantQR = () => {
    const svgElement = document.getElementById("merchant-qr-code");
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `merchant-${merchantId!.toString()}-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
              <Store className="h-7 w-7 text-indigo-400" />
            </div>
            <CardTitle className="text-xl text-white">
              Merchant Portal
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Connect your wallet to register as a merchant or access your
              dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoadingMerchant) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-zinc-400">
            Loading merchant information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
          <Store className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Merchant Portal</h1>
          <p className="text-sm text-zinc-400">
            Register your store and accept crypto payments
          </p>
        </div>
      </div>

      <Tabs defaultValue={isMerchant ? "dashboard" : "register"}>
        <TabsList className="mb-6 w-full bg-zinc-900">
          <TabsTrigger value="register" className="flex-1">
            <Plus className="mr-1.5 h-4 w-4" />
            Register
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex-1">
            <ShoppingCart className="mr-1.5 h-4 w-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        {/* ==================== REGISTER TAB ==================== */}
        <TabsContent value="register">
          {isMerchant ? (
            <Card className="border-zinc-800 bg-zinc-950">
              <CardContent className="flex flex-col items-center gap-4 pt-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle className="h-7 w-7 text-emerald-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">
                    Already Registered
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    Your wallet is registered as Merchant #{merchantId!.toString()}.
                    Switch to the Dashboard tab to manage your store.
                  </p>
                </div>
                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                  Merchant ID: {merchantId!.toString()}
                </Badge>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-zinc-800 bg-zinc-950">
              <CardHeader>
                <CardTitle className="text-white">
                  Register Your Store
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Create a merchant account to accept crypto payments from
                  customers and AI agents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="storeName" className="text-zinc-300">
                    Store Name
                  </Label>
                  <Input
                    id="storeName"
                    placeholder="e.g. My Awesome Store"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-300">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your store and what you sell..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="border-zinc-700 bg-zinc-900 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500 resize-none"
                  />
                </div>

                <Separator className="bg-zinc-800" />

                {/* Transaction Status */}
                {registerTxHash && (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                    <div className="flex items-center gap-2 text-sm">
                      {isWaitingRegister ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                          <span className="text-zinc-300">
                            Confirming transaction...
                          </span>
                        </>
                      ) : isRegisterSuccess ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400">
                            Registration successful! Refresh to see your
                            dashboard.
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                          <span className="text-zinc-300">
                            Transaction submitted...
                          </span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      Tx: {registerTxHash}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleRegister}
                  disabled={isRegistering || isWaitingRegister || !storeName.trim()}
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isRegistering || isWaitingRegister ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {isRegistering
                        ? "Confirm in Wallet..."
                        : "Registering..."}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Register Merchant
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ==================== DASHBOARD TAB ==================== */}
        <TabsContent value="dashboard">
          {!isMerchant ? (
            <Card className="border-zinc-800 bg-zinc-950">
              <CardContent className="flex flex-col items-center gap-4 pt-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
                  <Store className="h-7 w-7 text-zinc-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">
                    Not Registered
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    You need to register as a merchant first. Switch to the
                    Register tab to get started.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Merchant Info */}
              <Card className="border-zinc-800 bg-zinc-950">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">
                        {merchant
                          ? merchant.name
                          : `Merchant #${merchantId!.toString()}`}
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        Merchant ID: {merchantId!.toString()}
                      </CardDescription>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-zinc-800 bg-zinc-950">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                        <DollarSign className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Total Revenue</p>
                        <p className="text-xl font-bold text-white">
                          {merchant
                            ? formatEther(merchant.totalRevenue)
                            : "0"}{" "}
                          <span className="text-sm font-normal text-zinc-500">
                            {chainMeta.currencySymbol}
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-950">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                        <ShoppingCart className="h-5 w-5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-400">Total Orders</p>
                        <p className="text-xl font-bold text-white">
                          {merchant
                            ? merchant.totalOrders.toString()
                            : "0"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Balance & Withdraw */}
              <Card className="border-zinc-800 bg-zinc-950">
                <CardHeader>
                  <CardTitle className="text-white">Balance</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Your available balance for withdrawal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                    <div>
                      <p className="text-sm text-zinc-400">Native {chainMeta.currencySymbol}</p>
                      <p className="text-2xl font-bold text-white">
                        {nativeBalance
                          ? formatEther(nativeBalance as bigint)
                          : "0.0"}{" "}
                        <span className="text-sm font-normal text-zinc-500">
                          {chainMeta.currencySymbol}
                        </span>
                      </p>
                    </div>
                    <Button
                      onClick={handleWithdraw}
                      disabled={
                        isWithdrawing ||
                        isWaitingWithdraw ||
                        !nativeBalance ||
                        (nativeBalance as bigint) === BigInt(0)
                      }
                      variant="outline"
                      className="border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300"
                    >
                      {isWithdrawing || isWaitingWithdraw ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                          {isWithdrawing ? "Confirm..." : "Withdrawing..."}
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4" />
                          Withdraw
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Withdraw tx status */}
                  {withdrawTxHash && (
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                      <div className="flex items-center gap-2 text-sm">
                        {isWaitingWithdraw ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                            <span className="text-zinc-300">
                              Confirming withdrawal...
                            </span>
                          </>
                        ) : isWithdrawSuccess ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-emerald-400" />
                            <span className="text-emerald-400">
                              Withdrawal successful!
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                            <span className="text-zinc-300">
                              Transaction submitted...
                            </span>
                          </>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        Tx: {withdrawTxHash}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Checkout Widget */}
              <Card className="border-zinc-800 bg-zinc-950">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-indigo-400" />
                    <div>
                      <CardTitle className="text-white">
                        Checkout Widget & QR Code
                      </CardTitle>
                      <CardDescription className="text-zinc-400">
                        Share the URL or QR code with customers to accept payments
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* QR Code Display */}
                  <div className="flex flex-col items-center gap-4 rounded-xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.06] to-transparent p-6">
                    <div className="rounded-2xl bg-white p-4 shadow-lg shadow-indigo-500/10">
                      <QRCodeSVG
                        id="merchant-qr-code"
                        value={fullCheckoutUrl || `${typeof window !== "undefined" ? window.location.origin : ""}/checkout/${merchantId!.toString()}`}
                        size={180}
                        level="H"
                        includeMargin={false}
                        bgColor="#FFFFFF"
                        fgColor="#1a1a2e"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-medium text-white">
                        {merchant?.name || `Merchant #${merchantId!.toString()}`}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Scan to open checkout page
                      </p>
                    </div>

                    {/* Payment details in QR section */}
                    <div className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">Contract</span>
                        <span className="font-mono text-xs text-zinc-400">
                          {contracts.merchantVault.slice(0, 6)}...{contracts.merchantVault.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">ERC20 (DDSC)</span>
                        <span className="font-mono text-xs text-zinc-400">
                          {contracts.mockDDSC.slice(0, 6)}...{contracts.mockDDSC.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">Chain</span>
                        <span className="text-xs text-zinc-400">{chainMeta.name}</span>
                      </div>
                    </div>

                    {/* Wallet URI */}
                    <div className="w-full rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                      <p className="mb-1 text-xs font-medium text-zinc-400">
                        EIP-681 Wallet URI
                      </p>
                      <p className="break-all font-mono text-xs text-zinc-500">
                        {walletUri}
                      </p>
                    </div>

                    {/* Download QR button */}
                    <Button
                      onClick={handleDownloadMerchantQR}
                      variant="outline"
                      size="sm"
                      className="border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300"
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Download QR Code
                    </Button>
                  </div>

                  <Separator className="bg-zinc-800" />

                  {/* URL section */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Embeddable URL</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={checkoutUrl}
                        className="border-zinc-700 bg-zinc-900 text-zinc-300 font-mono text-sm"
                      />
                      <Button
                        onClick={handleCopyUrl}
                        variant="outline"
                        size="icon"
                        className="shrink-0 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Preview Checkout
                  </a>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card className="border-zinc-800 bg-zinc-950">
                <CardHeader>
                  <CardTitle className="text-white">Recent Orders</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Latest checkout transactions for your store
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                      <ShoppingCart className="h-6 w-6 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-300">
                        No orders yet
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Orders will appear here when customers complete
                        checkout.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
