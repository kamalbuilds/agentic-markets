"use client";

import { useState, useMemo, useCallback } from "react";
import {
  useWriteContract,
  useReadContract,
  useAccount,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { MERCHANT_VAULT_ABI } from "@/lib/contracts";
import { useChainContracts } from "@/lib/useChainContracts";
import { useCryptoPrice } from "@/lib/useCryptoPrice";
import { parseEther, keccak256, toHex, zeroAddress } from "viem";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export interface EmbeddableCheckoutProps {
  /** The on-chain merchant ID to pay */
  merchantId: number;
  /** Payment amount in native currency (e.g. "0.01") */
  amount: string;
  /** Optional: override the displayed title */
  title?: string;
  /** Optional: dark or light theme */
  theme?: "dark" | "light";
  /** Optional: callback after successful payment */
  onSuccess?: (txHash: string) => void;
  /** Optional: callback on payment error */
  onError?: (error: string) => void;
  /** Optional: compact mode with even smaller footprint */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmbeddableCheckout({
  merchantId,
  amount,
  title,
  theme = "dark",
  onSuccess,
  onError,
  compact = false,
}: EmbeddableCheckoutProps) {
  const { address, isConnected } = useAccount();
  const { contracts, chainMeta, isHedera } = useChainContracts();

  const EXPLORER_URL = chainMeta.explorerUrl;

  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Price conversion
  const {
    price: cryptoPrice,
    cryptoToUsd,
  } = useCryptoPrice(isHedera, chainMeta.currencySymbol);

  const isContractDeployed = contracts.merchantVault !== zeroAddress;

  // Read merchant data
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
  const merchantName = title || merchant?.name || `Merchant #${merchantId}`;
  const merchantExists = merchant && merchant.owner !== zeroAddress;

  // USD equivalent
  const usdEquivalent = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return null;
    return cryptoToUsd(amount);
  }, [amount, cryptoToUsd]);

  const formatUsd = useCallback((val: number | null): string => {
    if (val === null) return "";
    if (val < 0.01 && val > 0) return `$${val.toFixed(6)}`;
    return `$${val.toFixed(2)}`;
  }, []);

  // Transaction
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

  const currentStatus: TxStatus = isConfirmed
    ? "success"
    : isConfirming
    ? "confirming"
    : isWritePending
    ? "pending"
    : txStatus;

  // Trigger success callback
  useMemo(() => {
    if (isConfirmed && txHash && onSuccess) {
      onSuccess(txHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, txHash]);

  // Trigger error callback
  useMemo(() => {
    if (writeError && onError) {
      onError(writeError.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError]);

  const generateOrderId = () => {
    if (!address) return "0x" as `0x${string}`;
    const packed = `${address}-${merchantId}-${Date.now()}`;
    return keccak256(toHex(packed));
  };

  const handleCheckout = async () => {
    if (!isConnected || !address) return;
    if (!amount || parseFloat(amount) <= 0) return;
    if (!isContractDeployed) return;

    try {
      setTxStatus("pending");
      setErrorMsg(null);
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
          },
          onError: (err) => {
            setTxStatus("error");
            setErrorMsg(err.message || "Transaction failed");
            if (onError) onError(err.message || "Transaction failed");
          },
        }
      );
    } catch {
      setTxStatus("error");
      setErrorMsg("Failed to submit transaction");
      if (onError) onError("Failed to submit transaction");
    }
  };

  const handleReset = () => {
    setTxStatus("idle");
    setErrorMsg(null);
  };

  // Theme classes
  const isDark = theme === "dark";
  const bg = isDark
    ? "background: linear-gradient(145deg, #0a0a0f 0%, #111119 100%)"
    : "background: linear-gradient(145deg, #ffffff 0%, #f8f9fc 100%)";
  const textPrimary = isDark ? "#ffffff" : "#0f0f14";
  const textSecondary = isDark ? "#a0a0b0" : "#6b7280";
  const textMuted = isDark ? "#6b6b80" : "#9ca3af";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const cardBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const accentColor = "#6366f1";
  const accentLight = isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)";
  const successColor = "#10b981";
  const successLight = isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)";
  const errorColor = "#ef4444";
  const errorLight = isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)";
  const surfaceBg = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 400,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        borderRadius: 16,
        border: `1px solid ${cardBorder}`,
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset"
          : "0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.8) inset",
        overflow: "hidden",
      }}
    >
      {/* Card body */}
      <div style={{ ...parseStyle(bg), padding: compact ? "20px" : "28px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: compact ? 16 : 20,
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: accentLight,
              border: `1px solid ${accentColor}33`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={accentColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: textPrimary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {isMerchantLoading ? "Loading..." : merchantName}
            </div>
            <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>
              {merchantExists
                ? `Secure checkout on ${chainMeta.name}`
                : isContractDeployed
                ? "Merchant not found"
                : "Contract not deployed"}
            </div>
          </div>
          {/* Live badge */}
          {merchantExists && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: successColor,
                background: successLight,
                border: `1px solid ${successColor}33`,
                padding: "3px 8px",
                borderRadius: 6,
                letterSpacing: "0.02em",
              }}
            >
              LIVE
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: borderColor,
            marginBottom: compact ? 16 : 20,
          }}
        />

        {/* Amount display */}
        <div
          style={{
            background: surfaceBg,
            border: `1px solid ${borderColor}`,
            borderRadius: 12,
            padding: compact ? "14px 16px" : "18px 20px",
            marginBottom: compact ? 12 : 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            Payment Amount
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: compact ? 28 : 32,
                fontWeight: 700,
                color: textPrimary,
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {amount}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: accentColor,
              }}
            >
              {chainMeta.currencySymbol}
            </span>
          </div>
          {usdEquivalent !== null && usdEquivalent > 0 && (
            <div
              style={{
                fontSize: 13,
                color: textSecondary,
                marginTop: 4,
              }}
            >
              {formatUsd(usdEquivalent)} USD
            </div>
          )}
        </div>

        {/* Order details */}
        {!compact && (
          <div
            style={{
              background: surfaceBg,
              border: `1px solid ${borderColor}`,
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: textMuted }}>
                Merchant ID
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: textSecondary,
                  fontFamily: "monospace",
                }}
              >
                #{merchantId}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: textMuted }}>Network</span>
              <span
                style={{ fontSize: 12, fontWeight: 500, color: textSecondary }}
              >
                {chainMeta.name}
              </span>
            </div>
            {cryptoPrice.usdPrice > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 12, color: textMuted }}>Rate</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: textSecondary,
                  }}
                >
                  1 {chainMeta.currencySymbol} ={" "}
                  {cryptoPrice.usdPrice < 0.01
                    ? `$${cryptoPrice.usdPrice.toFixed(6)}`
                    : `$${cryptoPrice.usdPrice.toFixed(4)}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* SUCCESS STATE */}
        {currentStatus === "success" && txHash && (
          <div
            style={{
              background: successLight,
              border: `1px solid ${successColor}33`,
              borderRadius: 12,
              padding: "20px 16px",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke={successColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: "0 auto 10px" }}
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: successColor,
                marginBottom: 4,
              }}
            >
              Payment Complete!
            </div>
            <div style={{ fontSize: 12, color: textSecondary, marginBottom: 8 }}>
              {amount} {chainMeta.currencySymbol}
              {usdEquivalent ? ` (${formatUsd(usdEquivalent)})` : ""} paid
              successfully
            </div>
            <a
              href={`${EXPLORER_URL}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: accentColor,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              View on Explorer &rarr;
            </a>
            <div
              style={{
                fontSize: 10,
                color: textMuted,
                fontFamily: "monospace",
                wordBreak: "break-all",
                marginTop: 8,
              }}
            >
              {txHash}
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {(currentStatus === "error" || errorMsg) && currentStatus !== "success" && (
          <div
            style={{
              background: errorLight,
              border: `1px solid ${errorColor}33`,
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <div
              style={{ fontSize: 13, fontWeight: 500, color: errorColor }}
            >
              Transaction Failed
            </div>
            <div
              style={{
                fontSize: 11,
                color: textMuted,
                marginTop: 4,
                wordBreak: "break-word",
              }}
            >
              {errorMsg
                ? errorMsg.slice(0, 120)
                : writeError
                ? writeError.message.slice(0, 120)
                : "Unknown error"}
              ...
            </div>
          </div>
        )}

        {/* ACTION BUTTON */}
        {!isConnected ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: compact ? 12 : 16,
            }}
          >
            <ConnectButton
              label="Connect Wallet to Pay"
              showBalance={false}
              chainStatus="icon"
            />
          </div>
        ) : currentStatus === "success" ? (
          <button
            onClick={handleReset}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: "none",
              background: accentColor,
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: compact ? 12 : 16,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Make Another Payment
          </button>
        ) : (
          <button
            onClick={handleCheckout}
            disabled={
              !amount ||
              parseFloat(amount) <= 0 ||
              currentStatus === "pending" ||
              currentStatus === "confirming" ||
              !isContractDeployed ||
              !merchantExists
            }
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              border: "none",
              background:
                !amount ||
                parseFloat(amount) <= 0 ||
                currentStatus === "pending" ||
                currentStatus === "confirming" ||
                !isContractDeployed ||
                !merchantExists
                  ? isDark
                    ? "#2a2a3a"
                    : "#d1d5db"
                  : accentColor,
              color:
                !amount ||
                parseFloat(amount) <= 0 ||
                !isContractDeployed ||
                !merchantExists
                  ? textMuted
                  : "#ffffff",
              fontSize: 15,
              fontWeight: 600,
              cursor:
                currentStatus === "pending" || currentStatus === "confirming"
                  ? "wait"
                  : "pointer",
              marginBottom: compact ? 12 : 16,
              transition: "opacity 0.15s, background 0.15s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (
                amount &&
                parseFloat(amount) > 0 &&
                currentStatus !== "pending" &&
                currentStatus !== "confirming"
              ) {
                e.currentTarget.style.opacity = "0.9";
              }
            }}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            {currentStatus === "pending" || currentStatus === "confirming" ? (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{
                    animation: "embeddable-checkout-spin 1s linear infinite",
                  }}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {currentStatus === "pending"
                  ? "Confirm in Wallet..."
                  : "Confirming on Chain..."}
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                Pay {amount} {chainMeta.currencySymbol}
                {usdEquivalent
                  ? ` (${formatUsd(usdEquivalent)})`
                  : ""}
              </>
            )}
          </button>
        )}

        {/* Security note */}
        {!compact && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "10px 12px",
              background: surfaceBg,
              border: `1px solid ${borderColor}`,
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={accentColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span
              style={{
                fontSize: 11,
                lineHeight: "1.5",
                color: textMuted,
              }}
            >
              Secured by {chainMeta.name} smart contracts.{" "}
              {isHedera
                ? "ERC-20 payments on Hedera."
                : "Gas fees sponsored by ADI Paymaster."}
            </span>
          </div>
        )}

        {/* Branding footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            paddingTop: compact ? 4 : 8,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: accentLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill={accentColor}
              stroke="none"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <span style={{ fontSize: 11, color: textMuted }}>
            Powered by{" "}
            <span style={{ fontWeight: 500, color: textSecondary }}>
              Agent<span style={{ color: accentColor }}>Market</span>
            </span>
          </span>
        </div>
      </div>

      {/* Spinner keyframes injected via style tag */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes embeddable-checkout-spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `,
        }}
      />
    </div>
  );
}

/**
 * Utility: parse a CSS style string like "background: ..." into a React CSSProperties object.
 * Only handles the single-property case used above.
 */
function parseStyle(css: string): React.CSSProperties {
  const style: Record<string, string> = {};
  const parts = css.split(";").filter(Boolean);
  for (const part of parts) {
    const colonIdx = part.indexOf(":");
    if (colonIdx === -1) continue;
    const key = part
      .slice(0, colonIdx)
      .trim()
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    style[key] = part.slice(colonIdx + 1).trim();
  }
  return style as React.CSSProperties;
}

export default EmbeddableCheckout;
