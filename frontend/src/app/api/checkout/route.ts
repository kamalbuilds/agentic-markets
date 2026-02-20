import { NextRequest, NextResponse } from "next/server";
import {
  CONTRACT_ADDRESSES,
  CHAIN_META,
  DEFAULT_CHAIN_ID,
} from "@/lib/contracts";

/**
 * GET /api/checkout?merchantId=X&chainId=Y
 *
 * Returns merchant checkout configuration as JSON.
 *
 * Query params:
 *   - merchantId (required) - the on-chain merchant ID
 *   - chainId (optional)    - target chain ID (defaults to 99999 / ADI Testnet)
 *   - amount  (optional)    - suggested payment amount
 *
 * Response:
 *   { merchantId, chainId, name, address, token, currencySymbol, explorerUrl, amount? }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantIdParam = searchParams.get("merchantId");
  const chainIdParam = searchParams.get("chainId");
  const amountParam = searchParams.get("amount");

  if (!merchantIdParam) {
    return NextResponse.json(
      { error: "Missing required query parameter: merchantId" },
      { status: 400 }
    );
  }

  const merchantId = parseInt(merchantIdParam, 10);
  if (isNaN(merchantId) || merchantId < 0) {
    return NextResponse.json(
      { error: "Invalid merchantId: must be a non-negative integer" },
      { status: 400 }
    );
  }

  const chainId = chainIdParam
    ? parseInt(chainIdParam, 10)
    : DEFAULT_CHAIN_ID;

  const contracts = CONTRACT_ADDRESSES[chainId];
  const chainMeta = CHAIN_META[chainId];

  if (!contracts || !chainMeta) {
    return NextResponse.json(
      {
        error: `Unsupported chainId: ${chainId}. Supported: ${Object.keys(CONTRACT_ADDRESSES).join(", ")}`,
      },
      { status: 400 }
    );
  }

  const response: Record<string, unknown> = {
    merchantId,
    chainId,
    name: chainMeta.name,
    address: contracts.merchantVault,
    token: contracts.mockDDSC,
    currencySymbol: chainMeta.currencySymbol,
    explorerUrl: chainMeta.explorerUrl,
    supportsNativePayments: chainMeta.supportsNativePayments,
  };

  if (amountParam) {
    const amount = parseFloat(amountParam);
    if (!isNaN(amount) && amount > 0) {
      response.amount = amountParam;
    }
  }

  // Embed info for the embeddable component
  response.embedSnippet = `<EmbeddableCheckout merchantId={${merchantId}} amount="${amountParam || "0.01"}" />`;

  return NextResponse.json(response, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * OPTIONS handler for CORS preflight.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
