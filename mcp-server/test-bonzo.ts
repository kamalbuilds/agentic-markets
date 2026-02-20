/**
 * Live Bonzo Finance lending test on Hedera Testnet
 *
 * Uses @hashgraph/sdk for HTS-native token allowance (AccountAllowanceApproveTransaction)
 * and ContractExecuteTransaction for the deposit call.
 *
 * On Hedera, standard ERC20 approve does NOT grant allowance for smart contract
 * transferFrom on HTS tokens. You MUST use the native Hashgraph SDK.
 *
 * Run: bun test-bonzo.ts
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  parseUnits,
  type Address,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  Client,
  PrivateKey,
  AccountId,
  TokenId,
  ContractId,
  AccountAllowanceApproveTransaction,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  TokenAssociateTransaction,
  Long,
} from "@hashgraph/sdk";

// ---------- Chain (for read operations via viem) ----------
const hederaTestnet = {
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet.hashio.io/api"] } },
} as const;

// ---------- Account ----------
const PRIVATE_KEY_HEX = process.env.HEDERA_PRIVATE_KEY;
if (!PRIVATE_KEY_HEX) {
  console.error("ERROR: Set HEDERA_PRIVATE_KEY in .env");
  process.exit(1);
}

// Hedera SDK setup
const hederaPrivateKey = PrivateKey.fromStringECDSA(PRIVATE_KEY_HEX.replace("0x", ""));
const ACCOUNT_ID = AccountId.fromString("0.0.4729347");
const ACCOUNT_EVM = "0x1565aF2C2eF52b4A89180684a47C5260c716AbD1" as Address;

const hederaClient = Client.forTestnet();
hederaClient.setOperator(ACCOUNT_ID, hederaPrivateKey);

// Viem account for write fallbacks (HTS association)
const viemAccount = privateKeyToAccount(PRIVATE_KEY_HEX as `0x${string}`);

console.log(`\nWallet: ${ACCOUNT_EVM} (${ACCOUNT_ID.toString()})\n`);

// Viem clients
const publicClient = createPublicClient({
  chain: hederaTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account: viemAccount,
  chain: hederaTestnet,
  transport: http(),
});

// ---------- Contracts ----------
const USDC_EVM = "0x0000000000000000000000000000000000001549" as Address;
const BONZO_LENDING_POOL_EVM = "0x7710a96b01e02eD00768C3b39BfA7B4f1c128c62" as Address;
const A_USDC_EVM = "0xee72C37fEc48C9FeC6bbD0982ecEb7d7a038841e" as Address;

// Hedera entity IDs
const USDC_TOKEN_ID = TokenId.fromString("0.0.5449");
// Bonzo LendingPool as AccountId (for allowance spender)
const BONZO_SPENDER_ID = AccountId.fromString("0.0.5991622");
const BONZO_CONTRACT_ID = ContractId.fromString("0.0.5991622");

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

const HTS_ASSOCIATE_ABI = [
  {
    name: "associate",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [{ name: "responseCode", type: "int256" }],
  },
] as const;

const LENDING_POOL_ABI = [
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

// ---------- Helpers ----------
async function getLendingPosition() {
  const result = (await publicClient.readContract({
    address: BONZO_LENDING_POOL_EVM,
    abi: LENDING_POOL_ABI,
    functionName: "getUserAccountData",
    args: [ACCOUNT_EVM],
  })) as [bigint, bigint, bigint, bigint, bigint, bigint];

  return {
    totalCollateral: result[0],
    totalDebt: result[1],
    availableBorrows: result[2],
    liquidationThreshold: result[3],
    ltv: result[4],
    healthFactor: result[5],
  };
}

function printPosition(label: string, pos: Awaited<ReturnType<typeof getLendingPosition>>) {
  console.log(`  ${label}:`);
  console.log(`    Collateral:   ${formatEther(pos.totalCollateral)} ETH`);
  console.log(`    Debt:         ${formatEther(pos.totalDebt)} ETH`);
  console.log(`    Avail Borrow: ${formatEther(pos.availableBorrows)} ETH`);
  console.log(`    LTV:          ${pos.ltv.toString()}`);
  const hf = pos.healthFactor > parseUnits("1000", 18)
    ? "MAX (no debt)"
    : formatEther(pos.healthFactor);
  console.log(`    Health:       ${hf}`);
}

// ---------- Main ----------
async function main() {
  console.log("=".repeat(60));
  console.log("  Bonzo Finance Live Lending Test (Hashgraph SDK)");
  console.log("  LendingPool: " + BONZO_LENDING_POOL_EVM);
  console.log("  Account: " + ACCOUNT_ID.toString());
  console.log("=".repeat(60));

  // Step 1: Check USDC balance
  console.log("\n[1/6] Checking USDC balance...");
  const usdcBalance = await publicClient.readContract({
    address: USDC_EVM,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [ACCOUNT_EVM],
  });
  console.log(`  USDC balance: ${formatUnits(usdcBalance, 6)}`);

  if (usdcBalance === 0n) {
    console.error("\n  ERROR: No USDC. Run test-swap.ts first to get some USDC.");
    process.exit(1);
  }

  // Deposit half of USDC balance
  const depositAmount = usdcBalance / 2n;
  const depositAmountNum = Number(depositAmount); // Safe for USDC amounts (6 decimals)
  console.log(`  Will deposit: ${formatUnits(depositAmount, 6)} USDC (${depositAmountNum} raw)`);

  // Step 2: Current lending position
  console.log("\n[2/6] Current lending position...");
  const posBefore = await getLendingPosition();
  printPosition("Before", posBefore);

  // Step 3: Associate with aUSDC via EVM call (it's a contract, not HTS token)
  console.log("\n[3/6] Associating with aUSDC token (via EVM)...");
  try {
    const hash = await walletClient.writeContract({
      address: A_USDC_EVM,
      abi: HTS_ASSOCIATE_ABI,
      functionName: "associate",
      gas: 800_000n,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  Associated with aUSDC: ${hash.slice(0, 20)}...`);
  } catch (e: any) {
    const msg = e?.message || String(e);
    if (msg.includes("TOKEN_ALREADY_ASSOCIATED") || msg.includes("reverted")) {
      console.log("  Already associated with aUSDC");
    } else {
      console.log(`  aUSDC association: ${msg.slice(0, 120)}`);
    }
  }

  // Also ensure USDC association
  try {
    const assocTx = await new TokenAssociateTransaction()
      .setAccountId(ACCOUNT_ID)
      .setTokenIds([USDC_TOKEN_ID])
      .execute(hederaClient);
    const assocReceipt = await assocTx.getReceipt(hederaClient);
    console.log(`  USDC association: ${assocReceipt.status.toString()}`);
  } catch (e: any) {
    const msg = e?.message || String(e);
    if (msg.includes("TOKEN_ALREADY_ASSOCIATED") || msg.includes("ALREADY_ASSOCIATED")) {
      console.log("  Already associated with USDC");
    } else {
      console.log(`  USDC association note: ${msg.slice(0, 80)}`);
    }
  }

  // Step 4: Approve USDC via Hashgraph SDK native HTS allowance
  console.log("\n[4/6] Approving USDC via Hashgraph SDK (native HTS allowance)...");
  try {
    // Grant HTS-native allowance: let Bonzo LendingPool spend our USDC
    const approveTx = await new AccountAllowanceApproveTransaction()
      .approveTokenAllowance(
        USDC_TOKEN_ID,     // token
        ACCOUNT_ID,        // owner
        BONZO_SPENDER_ID,  // spender (contract as account)
        depositAmountNum * 10 // approve more than needed for safety
      )
      .execute(hederaClient);
    const approveReceipt = await approveTx.getReceipt(hederaClient);
    console.log(`  HTS allowance status: ${approveReceipt.status.toString()}`);
    console.log(`  Approved ${depositAmountNum * 10} raw USDC for Bonzo`);
  } catch (e: any) {
    console.log(`  HTS allowance error: ${(e?.message || String(e)).slice(0, 200)}`);
  }

  // Verify allowance via viem (might not reflect HTS allowance)
  const allowance = await publicClient.readContract({
    address: USDC_EVM,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [ACCOUNT_EVM, BONZO_LENDING_POOL_EVM],
  });
  console.log(`  ERC20 allowance view: ${formatUnits(allowance, 6)} USDC`);

  // Step 5: Deposit USDC into Bonzo via ContractExecuteTransaction
  console.log("\n[5/6] Depositing USDC into Bonzo Finance...");
  try {
    // Build function params: deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)
    const params = new ContractFunctionParameters()
      .addAddress(USDC_EVM)      // asset
      .addUint256(depositAmountNum)  // amount (Number, safe for USDC)
      .addAddress(ACCOUNT_EVM)   // onBehalfOf
      .addUint16(0);             // referralCode

    const depositTx = await new ContractExecuteTransaction()
      .setContractId(BONZO_CONTRACT_ID)
      .setGas(3_000_000)
      .setFunction("deposit", params)
      .execute(hederaClient);

    const depositReceipt = await depositTx.getReceipt(hederaClient);
    console.log(`  Deposit status: ${depositReceipt.status.toString()}`);
    console.log(`  Tx ID: ${depositTx.transactionId.toString()}`);
    console.log(`  HashScan: https://hashscan.io/testnet/transaction/${depositTx.transactionId.toString()}`);
  } catch (e: any) {
    const msg = e?.message || String(e);
    console.log(`  Deposit error: ${msg.slice(0, 400)}`);

    // If it's a CONTRACT_REVERT, try to get more details
    if (msg.includes("CONTRACT_REVERT")) {
      console.log("  Note: Contract reverted. This might mean:");
      console.log("    - HTS allowance wasn't properly recognized");
      console.log("    - The asset is not supported by this pool");
      console.log("    - The pool is paused or frozen");
    }
  }

  // Step 6: Check updated position
  console.log("\n[6/6] Updated lending position...");
  const posAfter = await getLendingPosition();
  printPosition("After", posAfter);

  // Check aUSDC balance
  try {
    const aUsdcBalance = await publicClient.readContract({
      address: A_USDC_EVM,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [ACCOUNT_EVM],
    });
    console.log(`\n  aUSDC balance: ${formatUnits(aUsdcBalance, 6)}`);
  } catch {
    console.log(`\n  aUSDC balance: (could not read)`);
  }

  // Summary
  const collateralChanged = posAfter.totalCollateral > posBefore.totalCollateral;
  console.log("\n" + "=".repeat(60));
  console.log("  BONZO DEPOSIT SUMMARY");
  console.log("=".repeat(60));
  console.log(`  Deposited:  ${formatUnits(depositAmount, 6)} USDC`);
  console.log(`  Collateral: ${formatEther(posBefore.totalCollateral)} → ${formatEther(posAfter.totalCollateral)} ETH`);
  console.log(`  Status:     ${collateralChanged ? "SUCCESS" : "NEEDS INVESTIGATION"}`);
  console.log("=".repeat(60));

  hederaClient.close();
}

main().catch((err) => {
  console.error("\nFATAL:", err.shortMessage || err.message || err);
  hederaClient.close();
  process.exit(1);
});
