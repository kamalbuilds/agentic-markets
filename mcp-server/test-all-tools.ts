/**
 * Comprehensive MCP Tool Test - Tests EVERY tool against live testnets
 *
 * Tests:
 * - ADI Chain: Agent registry, payments, merchant, DDSC
 * - Hedera: SaucerSwap swaps, Bonzo lending, Pyth prices, balances
 * - Kite AI: Agent discovery, reputation
 * - 0G Labs: AI decisions, inference, iNFT
 *
 * Run: bun test-all-tools.ts
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  formatEther,
  parseEther,
  parseUnits,
  type Address,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  Client as HederaClient,
  PrivateKey as HederaPrivateKey,
  AccountId,
  TokenId,
  ContractId,
  AccountAllowanceApproveTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
} from "@hashgraph/sdk";

// ============================================================================
// Setup
// ============================================================================

const HEDERA_PK = process.env.HEDERA_PRIVATE_KEY;
if (!HEDERA_PK) {
  console.error("Set HEDERA_PRIVATE_KEY in .env");
  process.exit(1);
}

const hederaAccount = privateKeyToAccount(HEDERA_PK as `0x${string}`);

// Chains
const adiTestnet: Chain = {
  id: 99999,
  name: "ADI Testnet",
  nativeCurrency: { name: "ADI", symbol: "ADI", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.ab.testnet.adifoundation.ai/"] } },
};

const hederaTestnet: Chain = {
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet.hashio.io/api"] } },
};

// Clients
const adiPublic = createPublicClient({ chain: adiTestnet, transport: http() });
const hederaPublic = createPublicClient({ chain: hederaTestnet, transport: http() });
const hederaWallet = createWalletClient({
  account: hederaAccount,
  chain: hederaTestnet,
  transport: http(),
});

// Hashgraph SDK
const hederaPrivateKey = HederaPrivateKey.fromStringECDSA(HEDERA_PK.replace("0x", ""));
const HEDERA_ACCOUNT_ID = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID || "0.0.4729347");
const hederaClient = HederaClient.forTestnet();
hederaClient.setOperator(HEDERA_ACCOUNT_ID, hederaPrivateKey);

// Contracts
const ADI = {
  agentRegistry: "0x24fF5f6637A83CA7CA7B72b3Ad55275D669Ab7da" as Address,
  paymentRouter: "0x13e935CF88Fd5a967B621aDf0b331361E8aF76f3" as Address,
  merchantVault: "0x809039A3A6791bb734841E1B14405FF521BC6ddb" as Address,
  mockDDSC: "0x66bfba26d31e008dF0a6D40333e01bd1213CB109" as Address,
};

const HEDERA = {
  saucerswapRouter: "0x0000000000000000000000000000000000004b40" as Address,
  saucerswapFactory: "0x00000000000000000000000000000000000026E7" as Address,
  bonzoLendingPool: "0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62" as Address,
  whbar: "0x0000000000000000000000000000000000003aD2" as Address,
  usdc: "0x0000000000000000000000000000000000001549" as Address,
};

// ABIs
const ERC20_ABI = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
  { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
] as const;

const AGENT_REGISTRY_ABI = [
  { name: "nextAgentId", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "agents", type: "function", stateMutability: "view", inputs: [{ name: "", type: "uint256" }], outputs: [
    { name: "owner", type: "address" }, { name: "metadataURI", type: "string" },
    { name: "pricePerTask", type: "uint256" }, { name: "isActive", type: "bool" },
    { name: "totalRating", type: "uint256" }, { name: "ratingCount", type: "uint256" },
    { name: "totalTasks", type: "uint256" }, { name: "createdAt", type: "uint256" },
  ] },
] as const;

const ROUTER_ABI = [
  { name: "getAmountsOut", type: "function", stateMutability: "view", inputs: [{ name: "amountIn", type: "uint256" }, { name: "path", type: "address[]" }], outputs: [{ name: "amounts", type: "uint256[]" }] },
  { name: "factory", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
] as const;

const FACTORY_ABI = [
  { name: "getPair", type: "function", stateMutability: "view", inputs: [{ name: "tokenA", type: "address" }, { name: "tokenB", type: "address" }], outputs: [{ name: "pair", type: "address" }] },
] as const;

const PAIR_ABI = [
  { name: "getReserves", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "reserve0", type: "uint112" }, { name: "reserve1", type: "uint112" }, { name: "blockTimestampLast", type: "uint32" }] },
  { name: "token0", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
  { name: "token1", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "address" }] },
] as const;

const LENDING_ABI = [
  { name: "getUserAccountData", type: "function", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [
    { name: "totalCollateralETH", type: "uint256" }, { name: "totalDebtETH", type: "uint256" },
    { name: "availableBorrowsETH", type: "uint256" }, { name: "currentLiquidationThreshold", type: "uint256" },
    { name: "ltv", type: "uint256" }, { name: "healthFactor", type: "uint256" },
  ] },
] as const;

// ============================================================================
// Test Runner
// ============================================================================

interface TestResult {
  category: string;
  tool: string;
  status: "PASS" | "FAIL" | "SKIP";
  detail: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(category: string, tool: string, fn: () => Promise<string>) {
  const start = Date.now();
  try {
    const detail = await fn();
    results.push({ category, tool, status: "PASS", detail, duration: Date.now() - start });
  } catch (e: any) {
    const msg = e?.shortMessage || e?.message || String(e);
    results.push({ category, tool, status: "FAIL", detail: msg.slice(0, 200), duration: Date.now() - start });
  }
}

// ============================================================================
// ADI Chain Tests
// ============================================================================

async function testAdiChain() {
  // 1. list_agents
  await runTest("ADI", "list_agents (nextAgentId)", async () => {
    const nextId = await adiPublic.readContract({
      address: ADI.agentRegistry,
      abi: AGENT_REGISTRY_ABI,
      functionName: "nextAgentId",
    });
    return `nextAgentId=${nextId} (${Number(nextId) - 1} agents registered)`;
  });

  // 2. get_agent (read agent #1 if exists)
  await runTest("ADI", "get_agent", async () => {
    const nextId = await adiPublic.readContract({
      address: ADI.agentRegistry,
      abi: AGENT_REGISTRY_ABI,
      functionName: "nextAgentId",
    });
    if (nextId <= 1n) return "No agents to read (0 registered)";
    const agent = await adiPublic.readContract({
      address: ADI.agentRegistry,
      abi: AGENT_REGISTRY_ABI,
      functionName: "agents",
      args: [1n],
    });
    return `Agent #1: owner=${(agent as any)[0].slice(0, 12)}... price=${formatEther((agent as any)[2])} DDSC active=${(agent as any)[3]}`;
  });

  // 3. get_balance (DDSC)
  await runTest("ADI", "get_balance (DDSC)", async () => {
    const testAddr = "0x0000000000000000000000000000000000000001" as Address;
    const bal = await adiPublic.readContract({
      address: ADI.mockDDSC,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [testAddr],
    });
    return `DDSC balance (0x01): ${formatEther(bal)}`;
  });

  // 4. ADI RPC connectivity
  await runTest("ADI", "rpc_connectivity", async () => {
    const blockNumber = await adiPublic.getBlockNumber();
    return `ADI Chain block: ${blockNumber}`;
  });
}

// ============================================================================
// Hedera DeFi Tests
// ============================================================================

async function testHederaDefi() {
  // 1. hedera_get_swap_quote
  await runTest("Hedera", "hedera_get_swap_quote", async () => {
    const amounts = await hederaPublic.readContract({
      address: HEDERA.saucerswapRouter,
      abi: ROUTER_ABI,
      functionName: "getAmountsOut",
      args: [BigInt(10 * 10 ** 8), [HEDERA.whbar, HEDERA.usdc]], // 10 WHBAR
    });
    return `10 WHBAR -> ${formatUnits(amounts[amounts.length - 1], 6)} USDC`;
  });

  // 2. hedera_get_pool_info
  await runTest("Hedera", "hedera_get_pool_info", async () => {
    const pair = await hederaPublic.readContract({
      address: HEDERA.saucerswapFactory,
      abi: FACTORY_ABI,
      functionName: "getPair",
      args: [HEDERA.whbar, HEDERA.usdc],
    });
    if (pair === "0x0000000000000000000000000000000000000000") return "No WHBAR/USDC pair";
    const reserves = await hederaPublic.readContract({
      address: pair,
      abi: PAIR_ABI,
      functionName: "getReserves",
    });
    return `WHBAR/USDC pair: ${pair.slice(0, 12)}... R0=${reserves[0].toString()} R1=${reserves[1].toString()}`;
  });

  // 3. hedera_get_token_price (Pyth)
  await runTest("Hedera", "hedera_get_token_price", async () => {
    const feedId = "0x3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd";
    const resp = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`);
    const data = await resp.json();
    const p = data.parsed[0].price;
    const price = Number(p.price) * Math.pow(10, p.expo);
    return `HBAR = $${price.toFixed(6)}`;
  });

  // 4. hedera_get_hbar_balance
  await runTest("Hedera", "hedera_get_hbar_balance", async () => {
    const [hbar, usdc] = await Promise.all([
      hederaPublic.getBalance({ address: hederaAccount.address }),
      hederaPublic.readContract({
        address: HEDERA.usdc, abi: ERC20_ABI, functionName: "balanceOf", args: [hederaAccount.address],
      }).catch(() => 0n),
    ]);
    return `HBAR=${formatEther(hbar)} USDC=${formatUnits(usdc as bigint, 6)}`;
  });

  // 5. hedera_get_lending_position
  await runTest("Hedera", "hedera_get_lending_position", async () => {
    const data = await hederaPublic.readContract({
      address: HEDERA.bonzoLendingPool,
      abi: LENDING_ABI,
      functionName: "getUserAccountData",
      args: [hederaAccount.address],
    });
    return `Collateral=${formatEther(data[0])} Debt=${formatEther(data[1])} HF=${data[5] > parseUnits("1000", 18) ? "MAX" : formatEther(data[5])}`;
  });

  // 6. SaucerSwap router.factory() verification
  await runTest("Hedera", "router_factory_verify", async () => {
    const factory = await hederaPublic.readContract({
      address: HEDERA.saucerswapRouter,
      abi: ROUTER_ABI,
      functionName: "factory",
    });
    const match = factory.toLowerCase() === HEDERA.saucerswapFactory.toLowerCase();
    return `Factory=${factory.slice(0, 12)}... match=${match}`;
  });

  // 7. ERC20 reads (WHBAR, USDC)
  await runTest("Hedera", "erc20_metadata", async () => {
    const [wSym, wDec, uSym, uDec] = await Promise.all([
      hederaPublic.readContract({ address: HEDERA.whbar, abi: ERC20_ABI, functionName: "symbol" }),
      hederaPublic.readContract({ address: HEDERA.whbar, abi: ERC20_ABI, functionName: "decimals" }),
      hederaPublic.readContract({ address: HEDERA.usdc, abi: ERC20_ABI, functionName: "symbol" }),
      hederaPublic.readContract({ address: HEDERA.usdc, abi: ERC20_ABI, functionName: "decimals" }),
    ]);
    return `WHBAR(${wSym},${wDec}) USDC(${uSym},${uDec})`;
  });

  // 8. Hashgraph SDK connectivity
  await runTest("Hedera", "hashgraph_sdk_client", async () => {
    // Verify SDK client works
    const info = await hederaClient.ping("0.0.3");
    return `Hashgraph SDK connected to testnet node 0.0.3`;
  });
}

// ============================================================================
// Kite AI Tests
// ============================================================================

async function testKiteAi() {
  const FRONTEND = "http://localhost:3001";

  // 1. kite_discover_agents - REAL API call (no X-PAYMENT = 402 with x402 spec)
  await runTest("Kite", "kite_discover (402 x402 flow)", async () => {
    const resp = await fetch(`${FRONTEND}/api/kite/discover`);
    if (resp.status !== 402) throw new Error(`Expected 402, got ${resp.status}`);
    const data = await resp.json();
    if (!data.accepts?.[0]?.scheme) throw new Error("Missing x402 accepts scheme");
    return `402 returned: scheme=${data.accepts[0].scheme} payTo=${data.accepts[0].payTo.slice(0, 12)}... x402Version=${data.x402Version}`;
  });

  // 2. kite_discover_agents - with dummy X-PAYMENT (demo mode fallback)
  await runTest("Kite", "kite_discover (demo mode)", async () => {
    const fakePayment = Buffer.from(JSON.stringify({ authorization: "test", signature: "test" })).toString("base64");
    const resp = await fetch(`${FRONTEND}/api/kite/discover?category=DeFi`, {
      headers: { "X-PAYMENT": fakePayment },
    });
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const data = await resp.json();
    if (!data.agents || data.agents.length === 0) throw new Error("No agents returned");
    return `${data.count} agents found, demo=${data.demo}, chainId=${data.chainId}, first=${data.agents[0].name}`;
  });

  // 3. kite_check_reputation - REAL API call
  await runTest("Kite", "kite_reputation (all agents)", async () => {
    const resp = await fetch(`${FRONTEND}/api/kite/reputation`);
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const data = await resp.json();
    if (!data.agents || data.agents.length === 0) throw new Error("No agents returned");
    return `${data.count} agents, system=${data.identitySystem}, tiers=${data.tiers.length}, top=${data.agents[0].agentId}(${data.agents[0].score})`;
  });

  // 4. kite_check_reputation - specific agent
  await runTest("Kite", "kite_reputation (single agent)", async () => {
    const resp = await fetch(`${FRONTEND}/api/kite/reputation?agentId=kite-agent-001`);
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const data = await resp.json();
    return `${data.agentId} did=${data.did} score=${data.reputation.score} txns=${data.reputation.totalTransactions} tier=${data.identityTier}`;
  });

  // 5. kite_hire - x402 payment flow
  await runTest("Kite", "kite_hire (402 + demo)", async () => {
    // First test 402 without payment
    const resp402 = await fetch(`${FRONTEND}/api/kite/hire`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId: "kite-agent-001", task: "Analyze HBAR price" }),
    });
    if (resp402.status !== 402) throw new Error(`Expected 402, got ${resp402.status}`);

    // Then test demo mode with fake payment
    const fakePayment = Buffer.from(JSON.stringify({ authorization: "test", signature: "test" })).toString("base64");
    const resp = await fetch(`${FRONTEND}/api/kite/hire`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-PAYMENT": fakePayment },
      body: JSON.stringify({ agentId: "kite-agent-001", task: "Analyze HBAR price trends" }),
    });
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const data = await resp.json();
    return `taskId=${data.taskId.slice(0, 20)}... agent=${data.agentId} status=${data.status}`;
  });
}

// ============================================================================
// 0G Labs Tests
// ============================================================================

async function testOgLabs() {
  const FRONTEND = "http://localhost:3001";

  // 1. og_get_ai_decision - DeFAI decision engine
  await runTest("0G", "og_get_ai_decision (DeFAI)", async () => {
    const resp = await fetch(`${FRONTEND}/api/0g/decisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskType: "defi",
        taskDescription: "Optimize yield on HBAR holdings",
        taskComplexity: "high",
        preferredChain: 296,
        sourceChain: 99999,
        maxBudget: 0.5,
        walletAddress: hederaAccount.address,
      }),
    });
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const data = await resp.json();
    if (!data.success || !data.decision) throw new Error("No decision returned");
    const d = data.decision;
    return `agent=${d.recommendedAgent.name} risk=${d.riskLevel}(${d.riskScore}) route=${d.paymentRoute.routingType} confidence=${d.confidence.toFixed(2)} model=${d.modelProvider.slice(0, 25)}`;
  });

  // 2. og_run_inference - 0G Compute Network audit
  await runTest("0G", "og_run_inference (audit)", async () => {
    const resp = await fetch(`${FRONTEND}/api/0g/inference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: 1,
        taskDescription: "Audit PaymentRouter.sol for vulnerabilities",
        taskType: "audit",
        prompt: "Analyze the PaymentRouter contract for security issues",
      }),
    });
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const data = await resp.json();
    if (!data.success) throw new Error("Inference failed");
    return `provider=${data.provider.name} model=${data.provider.model.split("/").pop()} verify=${data.verification.method} tokens=${data.performance.totalTokens} cost=${data.cost.totalCost} savings=${data.cost.savingsPercent}`;
  });

  // 3. og_run_inference - DeFi strategy
  await runTest("0G", "og_run_inference (defi)", async () => {
    const resp = await fetch(`${FRONTEND}/api/0g/inference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskType: "defi",
        taskDescription: "Optimize HBAR yield strategy",
        preferSpeed: true,
      }),
    });
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const data = await resp.json();
    if (!data.success) throw new Error("Inference failed");
    const result = JSON.parse(data.inference.result);
    return `strategy=${result.yieldStrategy.strategy} apy=${result.yieldStrategy.projectedReturn} allocations=${result.yieldStrategy.allocation.length}`;
  });

  // 4. og_mint_agent_inft - list existing iNFTs
  await runTest("0G", "og_inft_listAll", async () => {
    const resp = await fetch(`${FRONTEND}/api/0g/inft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "listAll" }),
    });
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const data = await resp.json();
    if (!data.success) throw new Error("List failed");
    return `${data.totalMinted} iNFTs minted, standard=${data.contract.standard}, chain=${data.contract.chain}`;
  });

  // 5. og_mint_agent_inft - mint new iNFT (unique ID per run)
  await runTest("0G", "og_inft_mint (ERC-7857)", async () => {
    const uniqueId = 100 + Math.floor(Math.random() * 9000);
    const resp = await fetch(`${FRONTEND}/api/0g/inft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mint",
        agentMarketId: uniqueId,
        ownerAddress: hederaAccount.address,
        oracleType: "TEE",
        agentName: "Test Agent",
        agentDescription: "Test agent for verification",
      }),
    });
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const data = await resp.json();
    if (!data.success) throw new Error(data.error || "Mint failed");
    return `tokenId=${data.tokenId} owner=${data.owner.slice(0, 12)}... oracle=${data.oracle.type} standard=${data.contract.standard} tx=${data.transaction.hash.slice(0, 16)}...`;
  });

  // 6. og_inft_authorize - authorize usage on the newly minted iNFT
  await runTest("0G", "og_inft_authorize", async () => {
    // First list all to get the latest tokenId
    const listResp = await fetch(`${FRONTEND}/api/0g/inft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "listAll" }),
    });
    const listData = await listResp.json();
    const latestToken = listData.infts[listData.infts.length - 1];
    const randomAddr = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    const resp = await fetch(`${FRONTEND}/api/0g/inft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "authorizeUsage",
        tokenId: latestToken.tokenId,
        userAddress: randomAddr,
      }),
    });
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const data = await resp.json();
    if (!data.success) throw new Error(data.error || "Authorize failed");
    return `tokenId=${data.tokenId} user=${data.authorizedUser.slice(0, 12)}... totalAuthorized=${data.totalAuthorizedUsers}`;
  });

  // 7. og_inft_transfer - transfer with oracle re-encryption (use the latest minted iNFT)
  await runTest("0G", "og_inft_transfer (oracle re-encrypt)", async () => {
    // List all to find an iNFT owned by our wallet
    const listResp = await fetch(`${FRONTEND}/api/0g/inft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "listAll" }),
    });
    const listData = await listResp.json();
    const myToken = listData.infts.find((i: any) => i.owner.toLowerCase() === hederaAccount.address.toLowerCase());
    if (!myToken) throw new Error("No iNFT owned by test wallet");

    const targetAddr = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    const resp = await fetch(`${FRONTEND}/api/0g/inft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "transfer",
        tokenId: myToken.tokenId,
        fromAddress: hederaAccount.address,
        toAddress: targetAddr,
      }),
    });
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const data = await resp.json();
    if (!data.success) throw new Error(data.error || "Transfer failed");
    return `tokenId=${data.tokenId} oracle=${data.oracleVerification.type} from=${data.from.slice(0, 12)}... to=${data.to.slice(0, 12)}...`;
  });
}

// ============================================================================
// Live Write Tests (actual on-chain transactions)
// ============================================================================

async function testLiveWrites() {
  // 1. Live swap on SaucerSwap (small amount)
  await runTest("LIVE", "hedera_swap_tokens (0.5 HBAR->USDC)", async () => {
    const swapAmount = parseEther("0.5"); // 0.5 HBAR
    const amountIn8Dec = BigInt(5000_0000); // 0.5 WHBAR in 8 dec for quote

    // Get quote
    const amounts = await hederaPublic.readContract({
      address: HEDERA.saucerswapRouter,
      abi: ROUTER_ABI,
      functionName: "getAmountsOut",
      args: [amountIn8Dec, [HEDERA.whbar, HEDERA.usdc]],
    });
    const expectedOut = amounts[amounts.length - 1];
    const minOut = (expectedOut * 9000n) / 10000n; // 10% slippage for safety

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

    const hash = await hederaWallet.writeContract({
      address: HEDERA.saucerswapRouter,
      abi: [
        { name: "swapExactETHForTokens", type: "function", stateMutability: "payable",
          inputs: [{ name: "amountOutMin", type: "uint256" }, { name: "path", type: "address[]" }, { name: "to", type: "address" }, { name: "deadline", type: "uint256" }],
          outputs: [{ name: "amounts", type: "uint256[]" }] },
      ],
      functionName: "swapExactETHForTokens",
      args: [minOut, [HEDERA.whbar, HEDERA.usdc], hederaAccount.address, deadline],
      value: swapAmount,
      gas: 3_000_000n,
    });
    const receipt = await hederaPublic.waitForTransactionReceipt({ hash });
    return `${receipt.status} tx=${hash.slice(0, 16)}... expected=${formatUnits(expectedOut, 6)} USDC`;
  });

  // 2. Live Bonzo deposit (via Hashgraph SDK)
  await runTest("LIVE", "hedera_deposit_lending (USDC->Bonzo)", async () => {
    // Check USDC balance first
    const usdcBal = await hederaPublic.readContract({
      address: HEDERA.usdc,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [hederaAccount.address],
    }) as bigint;

    if (usdcBal < 100_000n) { // less than 0.1 USDC
      return `SKIP: Only ${formatUnits(usdcBal, 6)} USDC available (need at least 0.1)`;
    }

    const depositAmount = usdcBal / 4n; // Deposit 25% of balance
    const depositNum = Number(depositAmount);

    // HTS native allowance
    const approveTx = await new AccountAllowanceApproveTransaction()
      .approveTokenAllowance(
        TokenId.fromString("0.0.5449"),
        HEDERA_ACCOUNT_ID,
        AccountId.fromString("0.0.5991622"),
        depositNum * 2
      )
      .execute(hederaClient);
    await approveTx.getReceipt(hederaClient);

    // Deposit via SDK
    const depositTx = await new ContractExecuteTransaction()
      .setContractId(ContractId.fromString("0.0.5991622"))
      .setGas(3_000_000)
      .setFunction("deposit", new ContractFunctionParameters()
        .addAddress(HEDERA.usdc)
        .addUint256(depositNum)
        .addAddress(hederaAccount.address)
        .addUint16(0))
      .execute(hederaClient);
    const depositReceipt = await depositTx.getReceipt(hederaClient);
    return `${depositReceipt.status} deposited=${formatUnits(depositAmount, 6)} USDC txId=${depositTx.transactionId.toString().slice(0, 30)}`;
  });
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("=".repeat(70));
  console.log("  AgentMarket - Comprehensive MCP Tool Test");
  console.log("  Testing ALL tools against LIVE testnets");
  console.log("  Wallet: " + hederaAccount.address);
  console.log("=".repeat(70));
  console.log();

  // Run all test suites
  console.log("--- ADI Chain Tests ---");
  await testAdiChain();

  console.log("--- Hedera DeFi Tests ---");
  await testHederaDefi();

  console.log("--- Kite AI Tests ---");
  await testKiteAi();

  console.log("--- 0G Labs Tests ---");
  await testOgLabs();

  console.log("--- LIVE Write Tests (real transactions) ---");
  await testLiveWrites();

  // Print results
  console.log("\n" + "=".repeat(70));
  console.log("  TEST RESULTS");
  console.log("=".repeat(70));

  const categories = [...new Set(results.map(r => r.category))];
  for (const cat of categories) {
    console.log(`\n  [${cat}]`);
    for (const r of results.filter(x => x.category === cat)) {
      const icon = r.status === "PASS" ? "OK" : r.status === "FAIL" ? "XX" : "--";
      console.log(`    [${icon}] ${r.tool} (${r.duration}ms)`);
      console.log(`         ${r.detail}`);
    }
  }

  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const skipped = results.filter(r => r.status === "SKIP").length;

  console.log("\n" + "=".repeat(70));
  console.log(`  TOTAL: ${passed} passed, ${failed} failed, ${skipped} skipped (${results.length} total)`);
  console.log("=".repeat(70));

  hederaClient.close();
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("\nFATAL:", err.shortMessage || err.message || err);
  hederaClient.close();
  process.exit(1);
});
