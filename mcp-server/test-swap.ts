/**
 * Live swap test on Hedera Testnet via SaucerSwap V1
 *
 * Uses swapExactETHForTokens to send native HBAR and receive USDC.
 * This avoids the WHBAR wrapping issue since the router handles it internally.
 *
 * Key Hedera quirks handled:
 *   - Manual gas limits (eth_estimateGas fails for HTS operations)
 *   - HTS token association required before receiving tokens
 *   - WHBAR (0x...003aD2) is an HTS token, NOT a WETH contract
 *
 * Run: bun test-swap.ts
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  type Address,
  formatEther,
  parseEther,
  encodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ---------- Chain ----------
const hederaTestnet = {
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet.hashio.io/api"] } },
} as const;

// ---------- Account ----------
const PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("ERROR: Set HEDERA_PRIVATE_KEY in .env");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
console.log(`\nWallet: ${account.address}\n`);

const publicClient = createPublicClient({
  chain: hederaTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: hederaTestnet,
  transport: http(),
});

// ---------- Contracts ----------
const WHBAR = "0x0000000000000000000000000000000000003aD2" as Address; // HTS WHBAR used in SaucerSwap pools
const USDC = "0x0000000000000000000000000000000000001549" as Address;
const ROUTER = "0x0000000000000000000000000000000000004b40" as Address;

// ---------- ABIs ----------
const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// HTS token association - call associate() on the token itself
const HTS_ASSOCIATE_ABI = [
  {
    name: "associate",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [{ name: "responseCode", type: "int256" }],
  },
] as const;

const ROUTER_ABI = [
  {
    name: "getAmountsOut",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "path", type: "address[]" },
    ],
    outputs: [{ name: "amounts", type: "uint256[]" }],
  },
  {
    name: "swapExactETHForTokens",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "amounts", type: "uint256[]" }],
  },
  {
    name: "swapExactTokensForTokens",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "amounts", type: "uint256[]" }],
  },
] as const;

// ---------- Helpers ----------
async function getBalances() {
  const [hbar, whbar, usdc] = await Promise.all([
    publicClient.getBalance({ address: account.address }),
    publicClient
      .readContract({
        address: WHBAR,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      })
      .catch(() => 0n),
    publicClient
      .readContract({
        address: USDC,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [account.address],
      })
      .catch(() => 0n),
  ]);
  return { hbar, whbar, usdc };
}

function printBalances(
  label: string,
  b: { hbar: bigint; whbar: bigint; usdc: bigint }
) {
  console.log(`  ${label}:`);
  console.log(`    HBAR:  ${formatEther(b.hbar)}`);
  console.log(`    WHBAR: ${formatUnits(b.whbar, 8)}`);
  console.log(`    USDC:  ${formatUnits(b.usdc, 6)}`);
}

// ---------- Main ----------
async function main() {
  console.log("=".repeat(60));
  console.log("  Hedera Live Swap Test - SaucerSwap V1");
  console.log("  Method: swapExactETHForTokens (HBAR → USDC)");
  console.log("=".repeat(60));

  // Step 1: Check balances
  console.log("\n[1/4] Checking balances...");
  const before = await getBalances();
  printBalances("Before", before);

  if (before.hbar < parseEther("2")) {
    console.error(
      "\n  ERROR: Wallet needs at least 2 HBAR. Fund it at https://portal.hedera.com/faucet"
    );
    console.error(`  Wallet address: ${account.address}`);
    process.exit(1);
  }

  // Step 2: Associate with USDC (required for HTS tokens on Hedera)
  console.log("\n[2/4] Associating with USDC token (HTS requirement)...");
  try {
    const assocHash = await walletClient.writeContract({
      address: USDC,
      abi: HTS_ASSOCIATE_ABI,
      functionName: "associate",
      gas: 800_000n, // Manual gas - eth_estimateGas fails for HTS ops
    });
    console.log(`  Associate tx: ${assocHash}`);
    const assocReceipt = await publicClient.waitForTransactionReceipt({
      hash: assocHash,
    });
    console.log(`  Status: ${assocReceipt.status}`);
  } catch (e: any) {
    const msg = e?.message || String(e);
    if (
      msg.includes("TOKEN_ALREADY_ASSOCIATED") ||
      msg.includes("already associated")
    ) {
      console.log("  Already associated with USDC");
    } else if (msg.includes("reverted")) {
      // On Hedera, association might revert if already done - that's OK
      console.log("  Association call reverted (likely already associated)");
    } else {
      console.log(`  Association attempt: ${msg.slice(0, 120)}`);
      console.log("  Continuing anyway (may already be associated)...");
    }
  }

  // Step 3: Get quote and swap HBAR → USDC using swapExactETHForTokens
  const swapHbarAmount = parseEther("1"); // 1 HBAR
  const swapHbarAmountIn8Dec = 1_0000_0000n; // 1 HBAR in 8 decimals for getAmountsOut

  console.log("\n[3/4] Swapping 1 HBAR → USDC on SaucerSwap...");

  // Get quote first (read-only, works fine)
  const amounts = await publicClient.readContract({
    address: ROUTER,
    abi: ROUTER_ABI,
    functionName: "getAmountsOut",
    args: [swapHbarAmountIn8Dec, [WHBAR, USDC]],
  });

  const expectedOut = amounts[amounts.length - 1];
  const minOut = (expectedOut * BigInt(9500)) / BigInt(10000); // 5% slippage for testnet
  console.log(`  Input:    1 HBAR`);
  console.log(`  Expected: ${formatUnits(expectedOut, 6)} USDC`);
  console.log(`  Min out:  ${formatUnits(minOut, 6)} USDC (5% slippage)`);

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 min

  const swapHash = await walletClient.writeContract({
    address: ROUTER,
    abi: ROUTER_ABI,
    functionName: "swapExactETHForTokens",
    args: [minOut, [WHBAR, USDC], account.address, deadline],
    value: swapHbarAmount, // Send 1 HBAR as native value
    gas: 3_000_000n, // Manual gas - skip eth_estimateGas
  });

  console.log(`  Swap tx: ${swapHash}`);
  const swapReceipt = await publicClient.waitForTransactionReceipt({
    hash: swapHash,
  });
  console.log(`  Status: ${swapReceipt.status}`);
  console.log(
    `  HashScan: https://hashscan.io/testnet/transaction/${swapHash}`
  );

  // Step 4: Final balances
  console.log("\n[4/4] Final balances...");
  const after = await getBalances();
  printBalances("After", after);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("  SWAP SUMMARY");
  console.log("=".repeat(60));
  const usdcGained = after.usdc - before.usdc;
  console.log(`  USDC gained: +${formatUnits(usdcGained, 6)}`);
  console.log(
    `  HBAR spent:  ${formatEther(before.hbar - after.hbar)} (including gas)`
  );
  console.log(
    `  Status:      ${swapReceipt.status === "success" ? "SUCCESS" : "FAILED"}`
  );
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("\nFATAL:", err.shortMessage || err.message || err);
  process.exit(1);
});
