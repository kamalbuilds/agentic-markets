"use client";

import { useState } from "react";
import { EmbeddableCheckout } from "@/components/EmbeddableCheckout";

const CODE_BASIC = `import { EmbeddableCheckout } from "@/components/EmbeddableCheckout";

<EmbeddableCheckout
  merchantId={1}
  amount="0.01"
/>`;

const CODE_FULL = `import { EmbeddableCheckout } from "@/components/EmbeddableCheckout";

<EmbeddableCheckout
  merchantId={1}
  amount="0.5"
  title="My Store"
  theme="dark"
  compact={false}
  onSuccess={(txHash) => {
    console.log("Payment successful:", txHash);
  }}
  onError={(error) => {
    console.error("Payment failed:", error);
  }}
/>`;

const CODE_IFRAME = `<!-- Embed via iframe (for non-React sites) -->
<iframe
  src="https://your-app.com/checkout/1?amount=0.01"
  width="400"
  height="520"
  frameborder="0"
  style="border-radius: 16px; overflow: hidden;"
/>`;

const CODE_API = `// Fetch merchant details via API
const res = await fetch("/api/checkout?merchantId=1&chainId=99999");
const data = await res.json();

// Response:
// {
//   merchantId: 1,
//   chainId: 99999,
//   name: "ADI Chain Testnet",
//   address: "0x809039A3...",
//   token: "0x66bfba26...",
//   currencySymbol: "ADI",
//   explorerUrl: "https://explorer.ab.testnet.adifoundation.ai",
//   supportsNativePayments: true,
//   embedSnippet: '<EmbeddableCheckout merchantId={1} amount="0.01" />'
// }`;

export default function EmbedDemoPage() {
  const [merchantId, setMerchantId] = useState(1);
  const [amount, setAmount] = useState("0.01");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [compact, setCompact] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "full" | "iframe" | "api">("basic");
  const [copiedCode, setCopiedCode] = useState(false);

  const codeMap = {
    basic: CODE_BASIC,
    full: CODE_FULL,
    iframe: CODE_IFRAME,
    api: CODE_API,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeMap[activeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-[50vh] w-[50vh] -translate-x-1/2 rounded-full bg-indigo-600/8 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[30vh] w-[30vh] rounded-full bg-purple-600/6 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-indigo-400"
            >
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span className="text-sm font-medium text-indigo-300">
              Embeddable Checkout
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Drop-in Payment Component
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">
            Add merchant payments to any web frontend with a single React
            component. Supports wallet connection, live price conversion, and
            on-chain checkout -- all in a compact, embeddable widget.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left: Live preview */}
          <div>
            <h2 className="mb-6 text-lg font-semibold text-white">
              Live Preview
            </h2>

            {/* Configuration controls */}
            <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="mb-4 text-sm font-medium text-neutral-300">
                Configuration
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs text-neutral-500">
                    Merchant ID
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={merchantId}
                    onChange={(e) =>
                      setMerchantId(parseInt(e.target.value) || 1)
                    }
                    className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white placeholder:text-neutral-600 focus:border-indigo-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-neutral-500">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white placeholder:text-neutral-600 focus:border-indigo-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-neutral-500">
                    Theme
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        theme === "dark"
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                          : "border-white/10 bg-white/[0.03] text-neutral-400 hover:bg-white/[0.06]"
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        theme === "light"
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                          : "border-white/10 bg-white/[0.03] text-neutral-400 hover:bg-white/[0.06]"
                      }`}
                    >
                      Light
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-neutral-500">
                    Layout
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCompact(false)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        !compact
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                          : "border-white/10 bg-white/[0.03] text-neutral-400 hover:bg-white/[0.06]"
                      }`}
                    >
                      Full
                    </button>
                    <button
                      onClick={() => setCompact(true)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        compact
                          ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                          : "border-white/10 bg-white/[0.03] text-neutral-400 hover:bg-white/[0.06]"
                      }`}
                    >
                      Compact
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Live widget */}
            <div className="flex justify-center rounded-xl border border-white/10 bg-neutral-950/50 p-8">
              <EmbeddableCheckout
                merchantId={merchantId}
                amount={amount}
                theme={theme}
                compact={compact}
                onSuccess={(txHash) =>
                  console.log("[EmbedDemo] Payment success:", txHash)
                }
                onError={(error) =>
                  console.error("[EmbedDemo] Payment error:", error)
                }
              />
            </div>
          </div>

          {/* Right: Code snippets */}
          <div>
            <h2 className="mb-6 text-lg font-semibold text-white">
              Integration Guide
            </h2>

            {/* Tab bar */}
            <div className="mb-4 flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
              {(
                [
                  { key: "basic", label: "Basic" },
                  { key: "full", label: "Full Props" },
                  { key: "iframe", label: "iframe" },
                  { key: "api", label: "API" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-indigo-500/15 text-indigo-300"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code block */}
            <div className="relative rounded-xl border border-white/10 bg-[#0d0d14]">
              <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
                <span className="text-xs text-neutral-500">
                  {activeTab === "api" ? "api-usage.ts" : activeTab === "iframe" ? "embed.html" : "checkout.tsx"}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  {copiedCode ? (
                    <>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-neutral-300">
                <code>{codeMap[activeTab]}</code>
              </pre>
            </div>

            {/* Props reference */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="mb-4 text-sm font-medium text-white">
                Props Reference
              </h3>
              <div className="space-y-3">
                {[
                  {
                    name: "merchantId",
                    type: "number",
                    required: true,
                    desc: "On-chain merchant ID to pay",
                  },
                  {
                    name: "amount",
                    type: "string",
                    required: true,
                    desc: 'Payment amount in native currency (e.g. "0.01")',
                  },
                  {
                    name: "title",
                    type: "string",
                    required: false,
                    desc: "Override the displayed merchant name",
                  },
                  {
                    name: "theme",
                    type: '"dark" | "light"',
                    required: false,
                    desc: 'Color theme (defaults to "dark")',
                  },
                  {
                    name: "compact",
                    type: "boolean",
                    required: false,
                    desc: "Compact layout with smaller footprint",
                  },
                  {
                    name: "onSuccess",
                    type: "(txHash: string) => void",
                    required: false,
                    desc: "Called after successful payment confirmation",
                  },
                  {
                    name: "onError",
                    type: "(error: string) => void",
                    required: false,
                    desc: "Called when payment fails",
                  },
                ].map((prop) => (
                  <div
                    key={prop.name}
                    className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-semibold text-indigo-400">
                          {prop.name}
                        </code>
                        <code className="text-xs text-neutral-500">
                          {prop.type}
                        </code>
                        {prop.required && (
                          <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                            required
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {prop.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="mb-4 text-sm font-medium text-white">
                Features
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "wallet", label: "RainbowKit Wallet" },
                  { icon: "refresh", label: "Live Fiat Conversion" },
                  { icon: "shield", label: "On-Chain Security" },
                  { icon: "zap", label: "Gas-Free Payments" },
                  { icon: "globe", label: "Multi-Chain Support" },
                  { icon: "code", label: "Drop-In Component" },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/10">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span className="text-xs text-neutral-300">
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
