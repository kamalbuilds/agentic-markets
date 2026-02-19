import { defineChain } from "viem";

export const adiTestnet = defineChain({
  id: 99999,
  name: "ADI Chain Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "ADI",
    symbol: "ADI",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.ab.testnet.adifoundation.ai/"],
    },
  },
  blockExplorers: {
    default: {
      name: "ADI Explorer",
      url: "https://explorer.ab.testnet.adifoundation.ai",
    },
  },
  testnet: true,
});

export const kiteAiTestnet = defineChain({
  id: 2368,
  name: "Kite AI Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "KITE",
    symbol: "KITE",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-testnet.gokite.ai/"],
    },
  },
  blockExplorers: {
    default: {
      name: "KiteScan",
      url: "https://testnet.kitescan.ai",
    },
  },
  testnet: true,
});

export const hederaTestnet = defineChain({
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "HBAR",
    symbol: "HBAR",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.hashio.io/api"],
    },
  },
  blockExplorers: {
    default: {
      name: "HashScan",
      url: "https://hashscan.io/testnet",
    },
  },
  testnet: true,
});
