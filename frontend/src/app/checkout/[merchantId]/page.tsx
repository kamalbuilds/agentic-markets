"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  CheckCircle,
  Loader2,
  Zap,
  Shield,
  QrCode,
  Download,
  Copy,
  ArrowLeftRight,
  DollarSign,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  useWriteContract,
  useReadContract,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";
import { MERCHANT_VAULT_ABI } from "@/lib/contracts";
import { useChainContracts } from "@/lib/useChainContracts";
import { useCryptoPrice } from "@/lib/useCryptoPrice";
import { parseEther, keccak256, toHex, zeroAddress } from "viem";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

interface MerchantOnChain {
  owner: string;
  name: string;
  metadataURI: string;
  isActive: boolean;
  totalRevenue: bigint;
  totalOrders: bigint;
  createdAt: bigint;
}

type TxStatus = "idle" | "pending" | "confirming" | "success" | "error";

export default function CheckoutPage() {
  const params = useParams();
  const merchantId = params.merchantId as string;
  const { address, isConnected } = useAccount();
  const { contracts, chainMeta, isHedera } = useChainContracts();

  const EXPLORER_URL = chainMeta.explorerUrl;

  const [amount, setAmount] = useState("");
  const [fiatAmount, setFiatAmount] = useState("");
  const [inputMode, setInputMode] = useState<"crypto" | "fiat">("crypto");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");

  // Price conversion hook
  const {
    price: cryptoPrice,
    isLoading: isPriceLoading,
    cryptoToUsd,
    usdToCrypto,
    refresh: refreshPrice,
  } = useCryptoPrice(isHedera, chainMeta.currencySymbol);

  const isContractDeployed =
    contracts.merchantVault !== zeroAddress;

  const { data: merchantData, isLoading: isMerchantLoading } = useReadContract({
    address: contracts.merchantVault,
    abi: MERCHANT_VAULT_ABI,
    functionName: "getMerchant",
    args: [BigInt(merchantId)],
    query: {
      enabled: isContractDeployed,
    },
  });

  const merchant = merchantData as MerchantOnChain | undefined;
  const merchantName = merchant?.name || `Merchant #${merchantId}`;
  const merchantExists = merchant && merchant.owner !== zeroAddress;

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  // Update status based on wagmi states
  const currentStatus: TxStatus = isConfirmed
    ? "success"
    : isConfirming
    ? "confirming"
    : isWritePending
    ? "pending"
    : txStatus;

  const [showQR, setShowQR] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  // Compute the USD equivalent of the current crypto amount
  const usdEquivalent = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return null;
    return cryptoToUsd(amount);
  }, [amount, cryptoToUsd]);

  // Format USD for display
  const formatUsd = useCallback((val: number | null): string => {
    if (val === null) return "";
    if (val < 0.01 && val > 0) return `~$${val.toFixed(6)} USD`;
    return `~$${val.toFixed(2)} USD`;
  }, []);

  // Handle crypto amount change (in crypto mode)
  const handleCryptoAmountChange = useCallback(
    (value: string) => {
      setAmount(value);
      if (value && parseFloat(value) > 0) {
        const usd = cryptoToUsd(value);
        setFiatAmount(usd !== null ? usd.toFixed(2) : "");
      } else {
        setFiatAmount("");
      }
    },
    [cryptoToUsd]
  );

  // Handle fiat amount change (in fiat mode)
  const handleFiatAmountChange = useCallback(
    (value: string) => {
      setFiatAmount(value);
      if (value && parseFloat(value) > 0) {
        const crypto = usdToCrypto(value);
        setAmount(crypto !== null ? crypto.toFixed(6) : "");
      } else {
        setAmount("");
      }
    },
    [usdToCrypto]
  );

  // Toggle input mode
  const toggleInputMode = useCallback(() => {
    setInputMode((prev) => (prev === "crypto" ? "fiat" : "crypto"));
  }, []);

  const generateOrderId = () => {
    if (!address) return "0x" as `0x${string}`;
    const packed = `${address}-${merchantId}-${Date.now()}`;
    return keccak256(toHex(packed));
  };

  // Build the payment URL for QR code encoding
  const paymentUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = `${window.location.origin}/checkout/${merchantId}`;
    const params = new URLSearchParams();
    if (amount && parseFloat(amount) > 0) {
      params.set("amount", amount);
    }
    params.set("contract", contracts.merchantVault);
    params.set("chain", "99999");
    // For ERC20 payments, include the token address
    params.set("token", contracts.mockDDSC);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [merchantId, amount]);

  // Build an EIP-681 style payment URI for wallet scanning
  const walletPaymentUri = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) {
      // Without an amount, just encode the checkout contract address on the chain
      return `ethereum:${contracts.merchantVault}@99999`;
    }
    try {
      const weiValue = parseEther(amount);
      return `ethereum:${contracts.merchantVault}@99999/checkout?uint256=${merchantId}&value=${weiValue.toString()}`;
    } catch {
      return `ethereum:${contracts.merchantVault}@99999`;
    }
  }, [merchantId, amount]);

  const handleCopyPaymentUrl = () => {
    navigator.clipboard.writeText(paymentUrl);
    setQrCopied(true);
    toast.success("Payment URL copied!");
    setTimeout(() => setQrCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svgElement = document.getElementById("checkout-qr-code");
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
      link.download = `checkout-merchant-${merchantId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleCheckout = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!isContractDeployed) {
      toast.error("MerchantVault contract is not yet deployed");
      return;
    }

    try {
      setTxStatus("pending");
      const orderId = generateOrderId();

      writeContract(
        {
          address: contracts.merchantVault,
          abi: MERCHANT_VAULT_ABI,
          functionName: "checkout",
          args: [BigInt(merchantId), orderId],
          value: parseEther(amount),
        },
        {
          onSuccess: () => {
            setTxStatus("confirming");
            toast.success("Transaction submitted!");
          },
          onError: (err) => {
            setTxStatus("error");
            toast.error(err.message || "Transaction failed");
          },
        }
      );
    } catch {
      setTxStatus("error");
      toast.error("Failed to submit transaction");
    }
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="border-white/10 bg-black/60 backdrop-blur-xl">
            {/* Header */}
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <ShoppingCart className="h-7 w-7 text-indigo-400" />
              </div>
              <CardTitle className="text-2xl text-white">
                {isMerchantLoading ? "Loading..." : merchantName}
              </CardTitle>
              <CardDescription className="text-neutral-400">
                {merchantExists ? `Secure checkout on ${chainMeta.name}` : isContractDeployed ? "Merchant not found" : "Contract not deployed"}
              </CardDescription>
              <div className="flex justify-center pt-2">
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                >
                  <Zap className="mr-1 h-3 w-3" />
                  {isHedera ? "ERC-20 Payments on Hedera" : "Gas-free \u00B7 Sponsored by ADI Paymaster"}
                </Badge>
              </div>
            </CardHeader>

            <Separator className="bg-white/10" />

            {/* Content */}
            <CardContent className="space-y-6 pt-6">
              {/* Merchant Info */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Merchant ID</span>
                  <span className="font-mono text-sm text-white">
                    #{merchantId}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Network</span>
                  <span className="text-sm text-white">{chainMeta.name}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-neutral-400">Status</span>
                  <Badge
                    variant="outline"
                    className={
                      merchantExists
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    }
                  >
                    {!isContractDeployed ? "Not Deployed" : merchantExists ? "Live" : "Not Found"}
                  </Badge>
                </div>
              </div>

              {/* Price Feed Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      cryptoPrice.isLive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                    }
                  >
                    <TrendingUp className="mr-1 h-3 w-3" />
                    {cryptoPrice.source}
                  </Badge>
                  {isPriceLoading && (
                    <Loader2 className="h-3 w-3 animate-spin text-neutral-500" />
                  )}
                </div>
                <button
                  onClick={refreshPrice}
                  className="flex items-center gap-1 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
                  title="Refresh price"
                >
                  <RefreshCw className="h-3 w-3" />
                </button>
              </div>

              {/* Rate Display */}
              {cryptoPrice.usdPrice > 0 && (
                <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                  <p className="text-xs text-neutral-500">
                    1 {chainMeta.currencySymbol} = ${cryptoPrice.usdPrice < 0.01 ? cryptoPrice.usdPrice.toFixed(6) : cryptoPrice.usdPrice.toFixed(4)} USD
                  </p>
                </div>
              )}

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-neutral-300">
                    Payment Amount
                  </label>
                  <button
                    onClick={toggleInputMode}
                    disabled={currentStatus === "pending" || currentStatus === "confirming"}
                    className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-neutral-200 disabled:opacity-40"
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                    {inputMode === "crypto" ? "Pay in USD" : `Pay in ${chainMeta.currencySymbol}`}
                  </button>
                </div>

                {inputMode === "crypto" ? (
                  /* Crypto input mode */
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => handleCryptoAmountChange(e.target.value)}
                        disabled={currentStatus === "pending" || currentStatus === "confirming"}
                        className="h-14 border-white/10 bg-white/[0.05] pr-16 text-2xl font-semibold text-white placeholder:text-neutral-600 focus:border-indigo-500/50"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-indigo-400">
                        {chainMeta.currencySymbol}
                      </span>
                    </div>
                    {/* USD equivalent */}
                    {usdEquivalent !== null && usdEquivalent > 0 && (
                      <div className="flex items-center gap-1.5 pl-1">
                        <DollarSign className="h-3 w-3 text-neutral-500" />
                        <p className="text-sm text-neutral-400">
                          {amount} {chainMeta.currencySymbol}{" "}
                          <span className="text-indigo-400">
                            ({formatUsd(usdEquivalent)})
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fiat (USD) input mode */
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={fiatAmount}
                        onChange={(e) => handleFiatAmountChange(e.target.value)}
                        disabled={currentStatus === "pending" || currentStatus === "confirming"}
                        className="h-14 border-white/10 bg-white/[0.05] pr-16 text-2xl font-semibold text-white placeholder:text-neutral-600 focus:border-indigo-500/50"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-emerald-400">
                        USD
                      </span>
                    </div>
                    {/* Crypto equivalent */}
                    {amount && parseFloat(amount) > 0 && (
                      <div className="flex items-center gap-1.5 pl-1">
                        <ArrowLeftRight className="h-3 w-3 text-neutral-500" />
                        <p className="text-sm text-neutral-400">
                          You will pay{" "}
                          <span className="font-semibold text-indigo-400">
                            {parseFloat(amount).toFixed(6)} {chainMeta.currencySymbol}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Security note */}
              <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                <p className="text-xs leading-relaxed text-neutral-500">
                  This transaction is secured by {chainMeta.name} smart contracts.
                  {isHedera
                    ? " On Hedera, use ERC-20 (DDSC) for payments."
                    : " Gas fees are sponsored by the ADI Paymaster -- you pay nothing extra."}
                </p>
              </div>

              {/* QR Code Section */}
              {merchantExists && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowQR(!showQR)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-indigo-400" />
                      <span className="text-sm font-medium text-neutral-300">
                        {showQR ? "Hide" : "Show"} Payment QR Code
                      </span>
                    </div>
                    <svg
                      className={`h-4 w-4 text-neutral-500 transition-transform ${showQR ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showQR && (
                    <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.08] to-transparent p-5">
                      <div className="flex flex-col items-center gap-4">
                        {/* QR Code */}
                        <div className="rounded-2xl bg-white p-4 shadow-lg shadow-indigo-500/10">
                          <QRCodeSVG
                            id="checkout-qr-code"
                            value={paymentUrl || `${typeof window !== "undefined" ? window.location.origin : ""}/checkout/${merchantId}`}
                            size={200}
                            level="H"
                            includeMargin={false}
                            bgColor="#FFFFFF"
                            fgColor="#1a1a2e"
                          />
                        </div>

                        {/* QR Info */}
                        <div className="w-full space-y-2 text-center">
                          <p className="text-sm font-medium text-neutral-300">
                            Scan to pay {merchantName}
                          </p>
                          {amount && parseFloat(amount) > 0 && (
                            <p className="text-xs text-indigo-400">
                              Amount: {amount} {chainMeta.currencySymbol}
                            </p>
                          )}
                          <p className="text-xs text-neutral-500">
                            Chain: {chainMeta.name}
                          </p>
                        </div>

                        {/* Payment Details */}
                        <div className="w-full rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-500">Contract</span>
                            <span className="font-mono text-xs text-neutral-400">
                              {contracts.merchantVault.slice(0, 6)}...{contracts.merchantVault.slice(-4)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-500">ERC20 Token</span>
                            <span className="font-mono text-xs text-neutral-400">
                              {contracts.mockDDSC.slice(0, 6)}...{contracts.mockDDSC.slice(-4)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-500">Merchant ID</span>
                            <span className="font-mono text-xs text-neutral-400">#{merchantId}</span>
                          </div>
                        </div>

                        {/* EIP-681 URI for wallet scanning */}
                        <div className="w-full rounded-lg border border-white/5 bg-white/[0.02] p-3">
                          <p className="mb-1.5 text-xs font-medium text-neutral-400">Wallet Payment URI</p>
                          <p className="break-all font-mono text-xs text-neutral-500">
                            {walletPaymentUri}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex w-full gap-2">
                          <Button
                            onClick={handleCopyPaymentUrl}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-white/10 bg-white/[0.05] text-neutral-300 hover:bg-white/10 hover:text-white"
                          >
                            {qrCopied ? (
                              <CheckCircle className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {qrCopied ? "Copied!" : "Copy URL"}
                          </Button>
                          <Button
                            onClick={handleDownloadQR}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-white/10 bg-white/[0.05] text-neutral-300 hover:bg-white/10 hover:text-white"
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Save QR
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction Status */}
              {currentStatus === "success" && txHash && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                  <CheckCircle className="mx-auto mb-2 h-10 w-10 text-emerald-400" />
                  <p className="text-lg font-semibold text-emerald-300">
                    Payment Complete!
                  </p>
                  <p className="mt-1 text-sm text-neutral-400">
                    Your payment of {amount} {chainMeta.currencySymbol}
                    {usdEquivalent !== null && usdEquivalent > 0
                      ? ` (${formatUsd(usdEquivalent)})`
                      : ""}{" "}
                    was successful.
                  </p>
                  <a
                    href={`${EXPLORER_URL}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                  >
                    View on Explorer
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                  <p className="mt-2 break-all font-mono text-xs text-neutral-500">
                    {txHash}
                  </p>
                </div>
              )}

              {currentStatus === "error" && writeError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-sm font-medium text-red-400">
                    Transaction Failed
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {writeError.message.slice(0, 120)}...
                  </p>
                </div>
              )}
            </CardContent>

            <Separator className="bg-white/10" />

            {/* Footer */}
            <CardFooter className="flex-col gap-4 pt-6">
              {!isConnected ? (
                <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                  <p className="text-sm font-medium text-amber-300">
                    Connect your wallet to proceed
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Use the wallet button in the header
                  </p>
                </div>
              ) : currentStatus === "success" ? (
                <Button
                  onClick={() => {
                    setTxStatus("idle");
                    setAmount("");
                    setFiatAmount("");
                    setInputMode("crypto");
                  }}
                  className="h-12 w-full rounded-xl bg-indigo-600 text-base font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Make Another Payment
                </Button>
              ) : (
                <Button
                  onClick={handleCheckout}
                  disabled={
                    !amount ||
                    parseFloat(amount) <= 0 ||
                    currentStatus === "pending" ||
                    currentStatus === "confirming" ||
                    !isContractDeployed ||
                    !merchantExists
                  }
                  className="h-12 w-full rounded-xl bg-indigo-600 text-base font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-40"
                >
                  {currentStatus === "pending" || currentStatus === "confirming" ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {currentStatus === "pending"
                        ? "Confirm in Wallet..."
                        : "Confirming on Chain..."}
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Pay {amount ? `${amount} ${chainMeta.currencySymbol}` : "Now"}
                    </>
                  )}
                </Button>
              )}

              {/* Branding */}
              <div className="flex items-center gap-2 pt-2">
                <div className="flex h-5 w-5 items-center justify-center rounded bg-indigo-500/20">
                  <Zap className="h-2.5 w-2.5 text-indigo-400" />
                </div>
                <span className="text-xs text-neutral-500">
                  Powered by{" "}
                  <span className="font-medium text-neutral-400">
                    Agent<span className="text-indigo-400">Market</span>
                  </span>{" "}
                  on {chainMeta.name}
                </span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
