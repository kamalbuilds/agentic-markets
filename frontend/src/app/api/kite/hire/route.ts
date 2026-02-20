import { NextRequest, NextResponse } from "next/server";

// Kite AI x402 Constants
const SERVICE_WALLET = process.env.KITE_SERVICE_WALLET ?? "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
const KITE_TEST_USDT = "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63";
const FACILITATOR_URL = "https://facilitator.pieverse.io";

function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * POST /api/kite/hire
 *
 * x402-compatible agent hiring endpoint using Kite's gokite-aa scheme.
 * Returns 402 with payment requirements if no X-PAYMENT header is provided.
 * Executes agent hiring with task assignment if payment is verified.
 *
 * Body:
 *   - agentId (required) - the ID of the agent to hire
 *   - task (required) - description of the task to perform
 *   - maxBudget (optional) - maximum USDT budget for the task
 */
export async function POST(request: NextRequest) {
  const xPayment = request.headers.get("x-payment");

  // No payment header: return 402 with payment requirements
  if (!xPayment) {
    return NextResponse.json(
      {
        error: "X-PAYMENT header is required",
        accepts: [
          {
            scheme: "gokite-aa",
            network: "kite-testnet",
            maxAmountRequired: "5000000000000000000", // 5 USDT
            resource: `${request.url}`,
            description: "AgentMarket - Hire an AI Agent on Kite AI",
            mimeType: "application/json",
            outputSchema: {
              input: {
                discoverable: true,
                method: "POST",
                body: {
                  agentId: {
                    description: "The ID of the agent to hire",
                    required: true,
                    type: "string",
                  },
                  task: {
                    description: "Description of the task to perform",
                    required: true,
                    type: "string",
                  },
                  maxBudget: {
                    description: "Maximum USDT budget for the task",
                    required: false,
                    type: "string",
                  },
                },
                type: "http",
              },
              output: {
                properties: {
                  taskId: { description: "Unique task identifier", type: "string" },
                  agentId: { description: "Hired agent ID", type: "string" },
                  status: { description: "Task status", type: "string" },
                  result: { description: "Task result or initial response", type: "object" },
                },
                required: ["taskId", "agentId", "status"],
                type: "object",
              },
            },
            payTo: SERVICE_WALLET,
            maxTimeoutSeconds: 300,
            asset: KITE_TEST_USDT,
            extra: null,
            merchantName: "AgentMarket",
          },
        ],
        x402Version: 1,
      },
      {
        status: 402,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT",
        },
      }
    );
  }

  // Parse request body
  let body: { agentId?: string; task?: string; maxBudget?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Required: { agentId, task }" },
      { status: 400 }
    );
  }

  const { agentId, task } = body;

  if (!agentId || !task) {
    return NextResponse.json(
      { error: "Missing required fields: agentId and task" },
      { status: 400 }
    );
  }

  // Verify payment via Pieverse facilitator
  try {
    const decoded = JSON.parse(Buffer.from(xPayment, "base64").toString());
    const { authorization, signature } = decoded;

    // Step 1: Verify payment
    const verifyResponse = await fetch(`${FACILITATOR_URL}/v2/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorization,
        signature,
        network: "kite-testnet",
      }),
    });

    if (!verifyResponse.ok) {
      throw new Error("Payment verification failed - falling through to demo mode");
    }

    // Step 2: Settle payment
    const settleResponse = await fetch(`${FACILITATOR_URL}/v2/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorization,
        signature,
        network: "kite-testnet",
      }),
    });

    if (!settleResponse.ok) {
      throw new Error("Payment settlement failed - falling through to demo mode");
    }

    // Payment verified - execute task
    const taskId = generateTaskId();

    return NextResponse.json(
      {
        taskId,
        agentId,
        task,
        status: "accepted",
        result: {
          message: `Agent ${agentId} has accepted the task and is processing.`,
          estimatedCompletion: new Date(Date.now() + 60000).toISOString(),
        },
        payment: {
          settled: true,
          network: "kite-testnet",
          amount: "5000000000000000000",
          asset: KITE_TEST_USDT,
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "X-PAYMENT-RESPONSE": Buffer.from(
            JSON.stringify({
              settled: true,
              network: "kite-testnet",
              taskId,
              timestamp: Date.now(),
            })
          ).toString("base64"),
        },
      }
    );
  } catch (error) {
    // Demo mode - allow without actual payment
    const taskId = generateTaskId();

    return NextResponse.json(
      {
        taskId,
        agentId,
        task,
        status: "accepted",
        result: {
          message: `Agent ${agentId} has accepted the task and is processing.`,
          estimatedCompletion: new Date(Date.now() + 60000).toISOString(),
        },
        payment: {
          settled: false,
          demo: true,
          note: "Demo mode - payment verification skipped",
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-PAYMENT",
    },
  });
}
