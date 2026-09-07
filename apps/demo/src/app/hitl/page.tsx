"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type HitlStatus = "pending" | "approved" | "rejected" | "expired";

interface HitlRequest {
  id: string;
  capabilityName: string;
  params: any;
  status: HitlStatus;
  createdAt: number;
}

const CAPABILITY_LABELS: Record<string, string> = {
  deleteTask: "Delete task",
  nukeAllTasks: "Wipe entire board",
};

const CAPABILITY_WARNINGS: Record<string, string> = {
  deleteTask: "This task will be permanently deleted and cannot be recovered.",
  nukeAllTasks: "⚠️ This will permanently delete ALL tasks on the board. This cannot be undone.",
};

function HitlCard({ req, onApprove, onReject }: {
  req: HitlRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const label = CAPABILITY_LABELS[req.capabilityName] ?? req.capabilityName;
  const warning = CAPABILITY_WARNINGS[req.capabilityName];
  const isNuke = req.capabilityName === "nukeAllTasks";

  return (
    <div className="glass p-5 flex flex-col gap-4"
      style={{ borderColor: "rgba(248,113,113,0.3)" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--danger)" }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--danger)" }}>
              Awaiting approval
            </span>
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Claude wants to: <span style={{ color: isNuke ? "var(--danger)" : "var(--warning)" }}>{label}</span>
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {new Date(req.createdAt).toLocaleTimeString()} · ID: {req.id.slice(0, 8)}…
          </p>
        </div>
      </div>

      {warning && (
        <p className="text-sm px-3 py-2 rounded-lg"
          style={{ background: "rgba(248,113,113,0.08)", color: "var(--danger)", border: "1px solid rgba(248,113,113,0.2)" }}>
          {warning}
        </p>
      )}

      <div className="glass-elevated p-3 rounded-lg">
        <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Parameters</p>
        <pre className="text-xs overflow-x-auto" style={{ color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
          {JSON.stringify(req.params, null, 2)}
        </pre>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onApprove(req.id)}
          className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all-200 hover:opacity-90"
          style={{ background: "var(--success)", color: "#0a0a0a" }}
        >
          ✓ Approve
        </button>
        <button
          onClick={() => onReject(req.id)}
          className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all-200 hover:opacity-90"
          style={{ background: "rgba(248,113,113,0.15)", color: "var(--danger)", border: "1px solid rgba(248,113,113,0.3)" }}
        >
          ✕ Reject
        </button>
      </div>
    </div>
  );
}

export default function HitlDashboard() {
  const [requests, setRequests] = useState<HitlRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/hitl/pending");
    if (res.ok) setRequests(await res.json());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [load]);

  const approve = async (id: string) => {
    setRequests(r => r.filter(x => x.id !== id));
    await fetch("/api/hitl/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  const reject = async (id: string) => {
    setRequests(r => r.filter(x => x.id !== id));
    await fetch("/api/hitl/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      <header className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>✦ TaskFlow</Link>
          <span className="text-xs px-2 py-0.5 rounded"
            style={{ background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid var(--accent-dim)" }}>
            lite-toon demo
          </span>
        </div>
        <Link href="/" className="text-sm" style={{ color: "var(--text-secondary)" }}>← Back to board</Link>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Approval Queue</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Claude is asking for permission to perform an irreversible action.
            Review the request below and approve or reject it.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--bg-border)", borderTopColor: "var(--accent)" }} />
          </div>
        ) : requests.length === 0 ? (
          <div className="glass flex flex-col items-center justify-center py-20 text-center">
            <div className="text-4xl mb-3">✓</div>
            <h2 className="text-lg font-semibold mb-1">All clear</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Claude is operating autonomously — no approvals needed right now.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {requests.map(req => (
              <HitlCard key={req.id} req={req} onApprove={approve} onReject={reject} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
