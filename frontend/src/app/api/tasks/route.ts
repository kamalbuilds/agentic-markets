import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const TASK_STORE_PATH = path.resolve(process.cwd(), "../mcp-server/.task-store.json");

interface AgentTask {
  taskId: string;
  creatorAgent: string;
  assignedAgent: string | null;
  status: "open" | "accepted" | "submitted" | "approved" | "rejected";
  taskType: string;
  description: string;
  requirements: string[];
  reward: { amount: string; currency: string; chain: string };
  submission: {
    result: string;
    deliveredAt: string;
    qualityScore: number | null;
  } | null;
  review: {
    approved: boolean;
    rating: number;
    feedback: string;
    aiVerified: boolean;
    reviewedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

function loadTasks(): AgentTask[] {
  try {
    const raw = fs.readFileSync(TASK_STORE_PATH, "utf-8");
    const store = JSON.parse(raw);
    return store.tasks || [];
  } catch {
    return [];
  }
}

// GET /api/tasks?status=open&type=analytics
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const taskType = searchParams.get("type");

  let tasks = loadTasks();

  if (status && status !== "all") {
    tasks = tasks.filter(t => t.status === status);
  }
  if (taskType) {
    tasks = tasks.filter(t => t.taskType === taskType);
  }

  return NextResponse.json({
    success: true,
    count: tasks.length,
    tasks,
    stats: {
      total: loadTasks().length,
      open: loadTasks().filter(t => t.status === "open").length,
      accepted: loadTasks().filter(t => t.status === "accepted").length,
      submitted: loadTasks().filter(t => t.status === "submitted").length,
      approved: loadTasks().filter(t => t.status === "approved").length,
      rejected: loadTasks().filter(t => t.status === "rejected").length,
    }
  });
}

// POST /api/tasks - Create a task from the frontend
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { creatorAgent, taskType, description, requirements, rewardAmount, rewardCurrency, rewardChain } = body;

    if (!creatorAgent || !description) {
      return NextResponse.json({ success: false, error: "creatorAgent and description are required" }, { status: 400 });
    }

    let store: { nextTaskId: number; tasks: AgentTask[] };
    try {
      const raw = fs.readFileSync(TASK_STORE_PATH, "utf-8");
      store = JSON.parse(raw);
    } catch {
      store = { nextTaskId: 1, tasks: [] };
    }

    const task: AgentTask = {
      taskId: String(store.nextTaskId),
      creatorAgent,
      assignedAgent: null,
      status: "open",
      taskType: taskType || "general",
      description,
      requirements: requirements || [],
      reward: {
        amount: rewardAmount || "0",
        currency: rewardCurrency || "DDSC",
        chain: rewardChain || "adi",
      },
      submission: null,
      review: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.tasks.push(task);
    store.nextTaskId++;
    fs.writeFileSync(TASK_STORE_PATH, JSON.stringify(store, null, 2));

    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
