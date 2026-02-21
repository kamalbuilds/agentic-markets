import { NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { getAddress } from "viem";

// pieUSD on Kite Testnet
const PIE_USD = getAddress("0x105cE361E721aA4A604655debB0A7464C948E980");
const SERVICE_WALLET = getAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18");
const KITE_NETWORK = "eip155:2368";

// Agent wallet (server-side key for demo signing)
const AGENT_PK = (process.env.AGENT_PRIVATE_KEY ??
  "0x17b9bfede94175011d74b287cfc3d8b62bac54e21d0a45a179cb9eca807daa58") as `0x${string}`;

/**
 * POST /api/kite/sign-payment
 *
 * Generates a real ERC-3009 transferWithAuthorization signature for x402 v2 payment.
 * Uses the agent wallet's private key to sign EIP-712 typed data.
 * This simulates what a user's wallet (MetaMask, etc.) would do in production.
 *
 * Body:
 *   - amount (required) - amount in wei (e.g., "1000000000000000000" for 1 pieUSD)
 *   - resourceUrl (required) - URL of the resource being paid for
 */
export async function POST(request: NextRequest) {
  let body: { amount?: string; resourceUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { amount = "1000000000000000000", resourceUrl = "" } = body;

  try {
    const account = privateKeyToAccount(AGENT_PK);

    // Generate random nonce (32 bytes)
    const nonceBytes: number[] = [];
    for (let i = 0; i < 32; i++) nonceBytes.push(Math.floor(Math.random() * 256));
    const nonce = ("0x" + nonceBytes.map(b => b.toString(16).padStart(2, "0")).join("")) as `0x${string}`;

    const now = Math.floor(Date.now() / 1000);
    const validAfterTs = 0; // No lower bound — avoids block timestamp race conditions
    const validBefore = now + 3600; // 1 hour

    // EIP-712 domain from pieUSD's eip712Domain() function
    const domain = {
      name: "pieUSD" as const,
      version: "1" as const,
      chainId: 2368,
      verifyingContract: PIE_USD,
    };

    const types = {
      TransferWithAuthorization: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "validAfter", type: "uint256" },
        { name: "validBefore", type: "uint256" },
        { name: "nonce", type: "bytes32" },
      ],
    } as const;

    const message = {
      from: account.address,
      to: SERVICE_WALLET,
      value: BigInt(amount),
      validAfter: BigInt(validAfterTs),
      validBefore: BigInt(validBefore),
      nonce,
    };

    // Sign EIP-712 typed data (ERC-3009 transferWithAuthorization)
    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: "TransferWithAuthorization",
      message,
    });

    // Build x402 v2 PaymentPayload
    const paymentPayload = {
      x402Version: 2,
      resource: {
        url: resourceUrl,
        description: "AgentMarket on Kite AI",
      },
      accepted: {
        scheme: "exact",
        network: KITE_NETWORK,
        amount,
        asset: PIE_USD,
        payTo: SERVICE_WALLET,
        maxTimeoutSeconds: 300,
        extra: { name: "pieUSD", version: "1" },
      },
      payload: {
        signature,
        authorization: {
          from: account.address,
          to: SERVICE_WALLET,
          value: amount,
          validAfter: String(validAfterTs),
          validBefore: String(validBefore),
          nonce,
        },
      },
    };

    // Base64-encode for use as PAYMENT-SIGNATURE header
    const encoded = Buffer.from(JSON.stringify(paymentPayload)).toString("base64");

    return NextResponse.json(
      {
        paymentPayload,
        encoded,
        signer: account.address,
        domain,
        message: {
          from: account.address,
          to: SERVICE_WALLET,
          value: amount,
          validAfter: String(validAfterTs),
          validBefore: String(validBefore),
          nonce,
        },
        note: "Real ERC-3009 transferWithAuthorization signature via EIP-712 typed data",
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Signing failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 }
    );
  }
}
