"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type TaskStatus = "todo" | "in-progress" | "done";
type TaskPriority = "low" | "medium" | "high";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  dueDate?: string;
  createdAt: number;
  updatedAt: number;
  lastModifiedBy: "human" | "ai";
}

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "todo",        label: "Todo",        color: "var(--text-secondary)" },
  { status: "in-progress", label: "In Progress", color: "var(--warning)" },
  { status: "done",        label: "Done",         color: "var(--success)" },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high:   "#f87171",
  medium: "#fbbf24",
  low:    "#34d399",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: "High", medium: "Medium", low: "Low",
};

function formatDue(dueDate?: string): string | null {
  if (!dueDate) return null;
  const d = new Date(dueDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff}d`;
}

function TaskCard({ task, onStatusChange, onDelete, onClick }: {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
}) {
  const dueStr = formatDue(task.dueDate);
  const isOverdue = dueStr?.includes("overdue") ?? false;

  return (
    <div
      onClick={() => onClick(task)}
      className="glass p-4 cursor-pointer hover:border-[var(--accent-dim)] transition-all-200 group relative"
      style={{ borderRadius: 10 }}
    >
      {/* AI badge */}
      {task.lastModifiedBy === "ai" && (
        <span className="ai-badge absolute top-3 right-3">✦ AI</span>
      )}

      {/* Priority dot */}
      <div className="flex items-start gap-2 mb-2 pr-10">
        <span
          className="mt-1 shrink-0 w-2 h-2 rounded-full"
          style={{ background: PRIORITY_COLORS[task.priority] }}
          title={PRIORITY_LABELS[task.priority] + " priority"}
        />
        <h3 className="text-sm font-medium leading-snug" style={{ color: "var(--text-primary)" }}>
          {task.title}
        </h3>
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 pl-4">
          {task.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--bg-border)" }}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Due date */}
      {dueStr && (
        <p className="text-xs pl-4" style={{ color: isOverdue ? "var(--danger)" : "var(--text-muted)" }}>
          {dueStr}
        </p>
      )}

      {/* Quick actions - appear on hover */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center justify-between px-3 py-2 opacity-0 group-hover:opacity-100 transition-all-200"
        onClick={e => e.stopPropagation()}
        style={{ borderTop: "1px solid var(--bg-border)", borderRadius: "0 0 10px 10px", background: "var(--bg-elevated)" }}
      >
        <div className="flex gap-1">
          {COLUMNS.filter(c => c.status !== task.status).map(c => (
            <button
              key={c.status}
              onClick={() => onStatusChange(task.id, c.status)}
              className="text-xs px-2 py-1 rounded transition-all-200 hover:opacity-80"
              style={{ background: "var(--bg-border)", color: "var(--text-secondary)" }}
            >
              → {c.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="text-xs px-2 py-1 rounded transition-all-200"
          style={{ color: "var(--danger)", background: "rgba(248,113,113,0.08)" }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function AddTaskForm({ status, onAdd }: { status: TaskStatus; onAdd: (title: string, status: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const submit = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), status);
    setTitle("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-sm py-2 rounded-lg transition-all-200 flex items-center gap-2 justify-center"
        style={{ color: "var(--text-muted)", border: "1px dashed var(--bg-border)" }}
      >
        <span style={{ fontSize: 16 }}>+</span> Add task
      </button>
    );
  }

  return (
    <div className="glass p-3 flex flex-col gap-2" style={{ borderRadius: 10 }}>
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
        placeholder="Task title…"
        className="w-full bg-transparent text-sm outline-none"
        style={{ color: "var(--text-primary)" }}
      />
      <div className="flex gap-2">
        <button onClick={submit} className="text-xs px-3 py-1.5 rounded-md font-medium transition-all-200"
          style={{ background: "var(--accent)", color: "#fff" }}>
          Add
        </button>
        <button onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 rounded-md transition-all-200"
          style={{ color: "var(--text-secondary)", background: "var(--bg-border)" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function TaskDetailPanel({ task, onClose, onUpdate, onDelete }: {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");

  const save = () => {
    onUpdate(task.id, { title, description });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="glass-elevated w-full max-w-lg p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: PRIORITY_COLORS[task.priority] }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{PRIORITY_LABELS[task.priority]} priority</span>
            {task.lastModifiedBy === "ai" && <span className="ai-badge">✦ AI</span>}
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>✕</button>
        </div>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="text-lg font-semibold bg-transparent outline-none w-full"
          style={{ color: "var(--text-primary)", borderBottom: "1px solid var(--bg-border)", paddingBottom: 8 }}
        />

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Add a description…"
          rows={4}
          className="w-full bg-transparent text-sm outline-none resize-none"
          style={{ color: "var(--text-secondary)" }}
        />

        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--bg-base)", color: "var(--text-muted)", border: "1px solid var(--bg-border)" }}>
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 justify-between pt-2" style={{ borderTop: "1px solid var(--bg-border)" }}>
          <button
            onClick={() => { onDelete(task.id); onClose(); }}
            className="text-sm px-3 py-1.5 rounded-md"
            style={{ color: "var(--danger)", background: "rgba(248,113,113,0.08)" }}
          >
            Delete task
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-md"
              style={{ color: "var(--text-secondary)", background: "var(--bg-border)" }}>
              Cancel
            </button>
            <button onClick={save} className="text-sm px-4 py-1.5 rounded-md font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingHitl, setPendingHitl] = useState(0);

  const loadData = useCallback(async () => {
    const [tasksRes, meRes, hitlRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/me"),
      fetch("/api/hitl/pending"),
    ]);

    if (tasksRes.ok) {
      const d = await tasksRes.json();
      setTasks(d.tasks ?? []);
    }
    if (meRes.ok) {
      const d = await meRes.json();
      setUsername(d.username ?? null);
    } else {
      setUsername(null);
    }
    if (hitlRes.ok) {
      const d = await hitlRes.json();
      setPendingHitl(Array.isArray(d) ? d.length : 0);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // Poll every 5s so AI-created tasks appear on the board automatically
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleAddTask = async (title: string, status: TaskStatus) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, status }),
    });
    if (res.ok) loadData();
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, lastModifiedBy: "human" } : t));
  };

  const handleUpdate = async (id: string, patch: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const isLoggedIn = username !== null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}>
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            ✦ TaskFlow
          </span>
          <span className="text-xs px-2 py-0.5 rounded"
            style={{ background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid var(--accent-dim)" }}>
            lite-toon demo
          </span>
        </div>

        <nav className="flex items-center gap-4">
          {pendingHitl > 0 && (
            <Link href="/hitl" className="flex items-center gap-1.5 text-sm transition-all-200 hover:opacity-80"
              style={{ color: "var(--warning)" }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--warning)" }} />
              {pendingHitl} pending approval{pendingHitl > 1 ? "s" : ""}
            </Link>
          )}
          <Link href="/connect" className="text-sm transition-all-200 hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}>
            Connect Claude
          </Link>
          {isLoggedIn ? (
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>@{username}</span>
          ) : (
            <Link href="/login" className="text-sm px-3 py-1.5 rounded-md font-medium transition-all-200 hover:opacity-90"
              style={{ background: "var(--accent)", color: "#fff" }}>
              Sign in
            </Link>
          )}
        </nav>
      </header>

      {/* Board */}
      <main className="flex-1 p-6 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--bg-border)", borderTopColor: "var(--accent)" }} />
          </div>
        ) : !isLoggedIn ? (
          <div className="max-w-md mx-auto mt-20 text-center">
            <div className="text-5xl mb-4">✦</div>
            <h1 className="text-2xl font-bold mb-2">AI-powered task management</h1>
            <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
              Sign in to start managing tasks — then connect Claude to take over
              the busywork while you focus on what matters.
            </p>
            <Link href="/login" className="inline-block px-6 py-3 rounded-xl font-semibold transition-all-200 hover:opacity-90"
              style={{ background: "var(--accent)", color: "#fff" }}>
              Get started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.status);
              return (
                <div key={col.status} className="flex flex-col gap-3">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {col.label}
                      </h2>
                      <span className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="flex flex-col gap-2 min-h-[120px]">
                    {colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        onDelete={handleDelete}
                        onClick={setSelectedTask}
                      />
                    ))}
                  </div>

                  {/* Add task */}
                  <AddTaskForm status={col.status} onAdd={handleAddTask} />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
