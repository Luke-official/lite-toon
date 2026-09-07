import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Connect Claude — TaskFlow · lite-toon",
  description: "Step-by-step guide to connect Claude to TaskFlow via MCP Connectors.",
};

const DEMO_PROMPTS = [
  {
    title: "Plan my week",
    prompt:
      'I have a product launch on Friday. Plan my week — create all the tasks I\'ll need, assign realistic priorities, and mark anything that sounds like a kickoff or planning activity as "in-progress".',
  },
  {
    title: "Batch status update",
    prompt:
      "I just finished standup. Mark all my in-progress tasks as done and create a new task: 'Prepare for tomorrow's review' with high priority.",
  },
  {
    title: "Smart triage",
    prompt:
      "Look at all my tasks and re-prioritize them: anything due in the next 2 days should be high priority, everything else medium or low. Update them all.",
  },
  {
    title: "Tag & organize",
    prompt:
      "Go through my tasks. Group the ones that are about documentation and add the tag 'docs' to them. Add 'devops' to anything infrastructure-related.",
  },
  {
    title: "Daily summary",
    prompt:
      "Give me a summary of my current tasks: how many are in each status, which high-priority ones are overdue or due today, and what I should focus on first.",
  },
  {
    title: "HITL demo",
    prompt:
      "Delete the task about scheduling standup — I don't need it anymore.",
  },
];

export default function ConnectPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--bg-border)", background: "var(--bg-surface)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            ✦ TaskFlow
          </Link>
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{
              background: "var(--accent-glow)",
              color: "var(--accent)",
              border: "1px solid var(--accent-dim)",
            }}
          >
            lite-toon demo
          </span>
        </div>
        <Link href="/" className="text-sm" style={{ color: "var(--text-secondary)" }}>
          ← Back to board
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 flex flex-col gap-12">
        {/* Hero */}
        <div>
          <h1 className="text-3xl font-bold mb-3">Connect Claude to TaskFlow</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Connect Claude to TaskFlow in under 5 minutes using{" "}
            <a
              href="https://claude.ai/customize/connectors/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "var(--accent)" }}
            >
              MCP Connectors
            </a>
            . Once connected, Claude can create, update, and manage your tasks autonomously —
            with HITL approval only for irreversible actions.
          </p>
        </div>

        {/* Steps */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-semibold">Setup steps</h2>

          {[
            {
              n: "1",
              title: "Create an account",
              body: (
                <>
                  Open{" "}
                  <Link href="/login" className="underline" style={{ color: "var(--accent)" }}>
                    the login page
                  </Link>{" "}
                  and register. This creates a user session and an OAuth client that Claude will use.
                </>
              ),
            },
            {
              n: "2",
              title: "Start the dev server",
              body: (
                <>
                  From the monorepo root, run:
                  <pre
                    className="mt-2 p-3 rounded-lg text-sm"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--success)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    npm run dev -w apps/demo
                  </pre>
                  The server starts at{" "}
                  <code style={{ color: "var(--ai-color)" }}>http://localhost:3000</code>.
                </>
              ),
            },
            {
              n: "3",
              title: "Add a connector in Claude",
              body: (
                <>
                  Go to{" "}
                  <a
                    href="https://claude.ai/customize/connectors/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: "var(--accent)" }}
                  >
                    claude.ai/customize/connectors
                  </a>{" "}
                  → <strong>Add connector</strong>. Paste the MCP URL:
                  <pre
                    className="mt-2 p-3 rounded-lg text-sm select-all"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--accent)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    http://localhost:3000/api/mcp
                  </pre>
                </>
              ),
            },
            {
              n: "4",
              title: "Authorize via OAuth",
              body: (
                <>
                  Claude will open the OAuth consent screen. Log in with the same credentials you
                  used in step 1. Grant the scopes <code style={{ color: "var(--ai-color)" }}>tasks:read</code>,{" "}
                  <code style={{ color: "var(--ai-color)" }}>tasks:write</code>, and optionally{" "}
                  <code style={{ color: "var(--ai-color)" }}>tasks:admin</code> (required for delete).
                </>
              ),
            },
            {
              n: "5",
              title: "Start talking to Claude",
              body: "You're live. Try one of the prompts below — then watch your task board update in real-time.",
            },
          ].map((step) => (
            <div key={step.n} className="glass p-5 flex gap-4">
              <div
                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid var(--accent-dim)" }}
              >
                {step.n}
              </div>
              <div>
                <h3 className="font-semibold mb-1">{step.title}</h3>
                <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {step.body}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Demo prompts */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Demo prompts</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Copy any of these into Claude to see lite-toon in action.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_PROMPTS.map((p) => (
              <div
                key={p.title}
                className="glass p-4 flex flex-col gap-2"
                style={p.title === "HITL demo" ? { borderColor: "rgba(248,113,113,0.3)" } : {}}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: p.title === "HITL demo" ? "var(--danger)" : "var(--accent)" }}
                  >
                    {p.title === "HITL demo" ? "⚠ HITL demo" : p.title}
                  </span>
                </div>
                <p className="text-sm italic" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  "{p.prompt}"
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="glass p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold">How it works</h2>
          <div
            className="text-sm p-4 rounded-lg font-mono"
            style={{ background: "var(--bg-base)", color: "var(--text-secondary)", lineHeight: 2 }}
          >
            <span style={{ color: "var(--text-muted)" }}>You (browser) ──→</span>{" "}
            <span style={{ color: "var(--success)" }}>/api/tasks/*</span>{" "}
            <span style={{ color: "var(--text-muted)" }}>(REST, session cookie)</span>
            <br />
            <span style={{ color: "var(--text-muted)" }}>Claude (AI) ────→</span>{" "}
            <span style={{ color: "var(--accent)" }}>/api/mcp</span>{" "}
            <span style={{ color: "var(--text-muted)" }}>(MCP, OAuth Bearer)</span>
            <br />
            <span style={{ color: "var(--text-muted)" }}>
              {"         "}Both call the same capability functions
            </span>
            <br />
            <span style={{ color: "var(--text-muted)" }}>
              {"         "}Destructive actions → HITL approval at{" "}
            </span>
            <Link href="/hitl" style={{ color: "var(--danger)" }}>
              /hitl
            </Link>
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            This dual-channel pattern is the core value of lite-toon: your web app gets a
            fully functional AI agent API without building a separate backend. The same
            capability code serves both humans and AI agents, with OAuth and HITL handling
            security across both.
          </p>
        </section>
      </main>
    </div>
  );
}
