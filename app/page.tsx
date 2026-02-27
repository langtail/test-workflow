"use client";

import { useState, useCallback } from "react";

export default function Home() {
  const [runId, setRunId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [error, setError] = useState<string | null>(null);

  const startWorkflow = useCallback(async () => {
    setLoading(true);
    setChunks([]);
    setRunId(null);
    setStatus("running");
    setError(null);

    try {
      const response = await fetch("/api/workflow/start", {
        method: "POST",
      });

      const workflowRunId = response.headers.get("X-Workflow-Run-Id");
      if (workflowRunId) {
        setRunId(workflowRunId);
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log("Stream done");
          setStatus("completed");
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          console.log("Received chunk:", chunk);
          setChunks((prev) => [...prev, chunk]);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Failed:", errorMessage);
      setError(errorMessage);
      setStatus("failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Workflow Bug Repro</h1>
        <p className="text-slate-400 mb-8">
          Minimal reproducible example for step response hanging bug
        </p>

        <button
          onClick={startWorkflow}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 rounded font-medium"
        >
          {loading ? "Running..." : "Start Workflow"}
        </button>

        {runId && (
          <div className="mt-8 space-y-4">
            <div>
              <span className="text-slate-400">Run ID: </span>
              <code className="text-cyan-400">{runId}</code>
            </div>

            <div>
              <span className="text-slate-400">Status: </span>
              <span className={
                status === "completed" ? "text-green-400" :
                status === "failed" ? "text-red-400" :
                "text-yellow-400"
              }>
                {status}
              </span>
            </div>

            {error && (
              <div>
                <span className="text-slate-400">Error: </span>
                <span className="text-red-400">{error}</span>
              </div>
            )}

            {chunks.length > 0 && (
              <div>
                <div className="text-slate-400 mb-2">Stream Output:</div>
                <pre className="bg-slate-800 p-4 rounded text-sm text-green-400 overflow-auto max-h-96">
                  {chunks.join("")}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
