/**
 * Integration test for Hedera DeFi MCP tools (read-only operations)
 * Tests swap quotes, pool info, token prices, and balance checks
 * against the live Hedera testnet.
 *
 * Run: npx tsx test-hedera-tools.ts
 */

import { createPublicClient, http, type Address, formatUnits } from "viem";

// ---------- Chain + Client ----------
const hederaTestnet = {
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet.hashio.io/api"] } },
} as const;

const client = createPublicClient({
  chain: hederaTestnet,
  transport: http(),
});

// ---------- Contracts ----------
const CONTRACTS = {
  saucerswapV1Router: "0x0000000000000000000000000000000000004b40" as Address,
  saucerswapV1Factory: "0x00000000000000000000000000000000000026E7" as Address,
  bonzoLendingPool: "0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62" as Address,
  whbar: "0x0000000000000000000000000000000000003aD2" as Address,
  sauce: "0x0000000000000000000000000000000000120f46" as Address,
  usdc: "0x0000000000000000000000000000000000001549" as Address,
  mockDDSC: "0xcD848BBfcE40332E93908D23A364C410177De876" as Address,
};

// ---------- ABIs ----------
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
    name: "factory",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const FACTORY_ABI = [
  {
    name: "getPair",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
    ],
    outputs: [{ name: "pair", type: "address" }],
  },
] as const;

const PAIR_ABI = [
  {
    name: "getReserves",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "reserve0", type: "uint112" },
      { name: "reserve1", type: "uint112" },
      { name: "blockTimestampLast", type: "uint32" },
    ],
  },
  {
    name: "token0",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "token1",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

const LENDING_ABI = [
  {
    name: "getUserAccountData",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "totalCollateralETH", type: "uint256" },
      { name: "totalDebtETH", type: "uint256" },
      { name: "availableBorrowsETH", type: "uint256" },
      { name: "currentLiquidationThreshold", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "healthFactor", type: "uint256" },
    ],
  },
] as const;

// ---------- Test Functions ----------
const results: { test: string; status: string; detail: string }[] = [];
const TEST_ADDRESS = "0x0000000000000000000000000000000000000001" as Address;

async function testSwapQuote() {
  const testName = "hedera_get_swap_quote (WHBAR -> USDC)";
  try {
    const amountIn = BigInt(10) * BigInt(10 ** 8); // 10 WHBAR (8 decimals)
    const path = [CONTRACTS.whbar, CONTRACTS.usdc];

    const amounts = await client.readContract({
      address: CONTRACTS.saucerswapV1Router,
      abi: ROUTER_ABI,
      functionName: "getAmountsOut",
      args: [amountIn, path],
    });

    const amountOut = amounts[amounts.length - 1];
    const amountOutFormatted = formatUnits(amountOut, 6); // USDC has 6 decimals

    results.push({
      test: testName,
      status: "PASS",
      detail: `10 WHBAR -> ${amountOutFormatted} USDC`,
    });
  } catch (error) {
    results.push({
      test: testName,
      status: "FAIL",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

async function testGetPoolInfo() {
  const testName = "hedera_get_pool_info (WHBAR/USDC)";
  try {
    const pairAddress = await client.readContract({
      address: CONTRACTS.saucerswapV1Factory,
      abi: FACTORY_ABI,
      functionName: "getPair",
      args: [CONTRACTS.whbar, CONTRACTS.usdc],
    });

    if (pairAddress === "0x0000000000000000000000000000000000000000") {
      results.push({ test: testName, status: "WARN", detail: "No WHBAR/USDC pair exists on testnet" });
      return;
    }

    const [reserves, token0, token1] = await Promise.all([
      client.readContract({ address: pairAddress, abi: PAIR_ABI, functionName: "getReserves" }),
      client.readContract({ address: pairAddress, abi: PAIR_ABI, functionName: "token0" }),
      client.readContract({ address: pairAddress, abi: PAIR_ABI, functionName: "token1" }),
    ]);

    results.push({
      test: testName,
      status: "PASS",
      detail: `Pair: ${pairAddress.slice(0, 10)}... | Reserve0: ${reserves[0].toString()} | Reserve1: ${reserves[1].toString()} | token0: ${token0.slice(0, 10)}... | token1: ${token1.slice(0, 10)}...`,
    });
  } catch (error) {
    results.push({
      test: testName,
      status: "FAIL",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

async function testTokenPrice() {
  const testName = "hedera_get_token_price (HBAR via Pyth)";
  try {
    const feedId = "0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd";
    const response = await fetch(
      `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`
    );
    const data = await response.json();

    if (!data.parsed || data.parsed.length === 0) {
      throw new Error("No price data returned");
    }

    const priceData = data.parsed[0].price;
    const price = Number(priceData.price) * Math.pow(10, priceData.expo);
    const confidence = Number(priceData.conf) * Math.pow(10, priceData.expo);

    results.push({
      test: testName,
      status: "PASS",
      detail: `HBAR = $${price.toFixed(6)} (confidence: $${confidence.toFixed(6)})`,
    });
  } catch (error) {
    results.push({
      test: testName,
      status: "FAIL",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

async function testHbarBalance() {
  const testName = "hedera_get_hbar_balance (sample address)";
  try {
    // Use the AgentRegistry contract address as a test - it exists for sure
    const testAddr = "0xf53D927D6D19c7A67cF5126aA7EED0b4c0185850" as Address;

    const hbarBalance = await client.getBalance({ address: testAddr });

    // Try reading ERC20 balances
    const tokens = [
      { name: "WHBAR", address: CONTRACTS.whbar, decimals: 8 },
      { name: "USDC", address: CONTRACTS.usdc, decimals: 6 },
    ];

    const tokenBalances: string[] = [];
    for (const token of tokens) {
      try {
        const bal = await client.readContract({
          address: token.address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [testAddr],
        });
        tokenBalances.push(`${token.name}: ${formatUnits(bal, token.decimals)}`);
      } catch {
        tokenBalances.push(`${token.name}: read failed (may not be HTS-compatible via EVM)`);
      }
    }

    results.push({
      test: testName,
      status: "PASS",
      detail: `HBAR: ${formatUnits(hbarBalance, 18)} | ${tokenBalances.join(" | ")}`,
    });
  } catch (error) {
    results.push({
      test: testName,
      status: "FAIL",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

async function testLendingPosition() {
  const testName = "hedera_get_lending_position (Bonzo Finance)";
  try {
    const data = await client.readContract({
      address: CONTRACTS.bonzoLendingPool,
      abi: LENDING_ABI,
      functionName: "getUserAccountData",
      args: [TEST_ADDRESS],
    });

    results.push({
      test: testName,
      status: "PASS",
      detail: `Collateral: ${formatUnits(data[0], 18)} ETH | Debt: ${formatUnits(data[1], 18)} ETH | HealthFactor: ${formatUnits(data[5], 18)}`,
    });
  } catch (error) {
    results.push({
      test: testName,
      status: "FAIL",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

async function testRouterFactory() {
  const testName = "SaucerSwap Router.factory() call";
  try {
    const factory = await client.readContract({
      address: CONTRACTS.saucerswapV1Router,
      abi: ROUTER_ABI,
      functionName: "factory",
    });

    const matches = factory.toLowerCase() === CONTRACTS.saucerswapV1Factory.toLowerCase();
    results.push({
      test: testName,
      status: matches ? "PASS" : "WARN",
      detail: `Router returns factory: ${factory} | Expected: ${CONTRACTS.saucerswapV1Factory} | Match: ${matches}`,
    });
  } catch (error) {
    results.push({
      test: testName,
      status: "FAIL",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

async function testERC20Reads() {
  const testName = "ERC20 decimals/symbol reads (WHBAR, USDC)";
  try {
    const details: string[] = [];
    for (const [name, addr] of [["WHBAR", CONTRACTS.whbar], ["USDC", CONTRACTS.usdc]] as const) {
      try {
        const [decimals, symbol] = await Promise.all([
          client.readContract({ address: addr, abi: ERC20_ABI, functionName: "decimals" }),
          client.readContract({ address: addr, abi: ERC20_ABI, functionName: "symbol" }),
        ]);
        details.push(`${name}: symbol=${symbol}, decimals=${decimals}`);
      } catch (e) {
        details.push(`${name}: read failed - ${e instanceof Error ? e.message.slice(0, 60) : "unknown"}`);
      }
    }
    results.push({
      test: testName,
      status: details.every(d => d.includes("symbol=")) ? "PASS" : "WARN",
      detail: details.join(" | "),
    });
  } catch (error) {
    results.push({
      test: testName,
      status: "FAIL",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

// ---------- Run All Tests ----------
async function main() {
  console.log("=".repeat(70));
  console.log("  Hedera DeFi MCP Tools - Integration Test");
  console.log("  Network: Hedera Testnet (Chain ID 296)");
  console.log("  RPC: https://testnet.hashio.io/api");
  console.log("=".repeat(70));
  console.log();

  const tests = [
    testRouterFactory,
    testERC20Reads,
    testSwapQuote,
    testGetPoolInfo,
    testTokenPrice,
    testHbarBalance,
    testLendingPosition,
  ];

  for (const test of tests) {
    await test();
  }

  console.log();
  for (const r of results) {
    const icon = r.status === "PASS" ? "OK" : r.status === "WARN" ? "!!" : "XX";
    console.log(`  [${icon}] ${r.test}`);
    console.log(`       ${r.detail}`);
    console.log();
  }

  const passed = results.filter(r => r.status === "PASS").length;
  const warned = results.filter(r => r.status === "WARN").length;
  const failed = results.filter(r => r.status === "FAIL").length;

  console.log("=".repeat(70));
  console.log(`  Results: ${passed} passed, ${warned} warnings, ${failed} failed (${results.length} total)`);
  console.log("=".repeat(70));

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
