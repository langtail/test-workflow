import { start } from "workflow/api";
import { reproWorkflow } from "@/lib/workflows/repro";

export async function POST() {
  try {
    const run = await start(reproWorkflow, []);

    return new Response(run.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Workflow-Run-Id": run.runId,
      },
    });
  } catch (error) {
    console.error("Failed to start workflow:", error);
    return new Response(JSON.stringify({ error: "Failed to start workflow" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
