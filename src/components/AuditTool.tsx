"use client";

import { useState } from "react";

type Status = "pass" | "warn" | "fail";
type Check = {
  id: string;
  name: string;
  status: Status;
  value: string | null;
  summary: string;
  why: string;
  fix: string;
};
type Report = {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  redirects: { from: string; status: number; to: string }[];
  scannedAt: string;
  score: number;
  grade: string;
  checks: Check[];
};

const BADGE: Record<Status, string> = {
  pass: "border-green/30 bg-green-soft text-green-strong",
  warn: "border-amber-600/30 bg-amber-50 text-amber-800",
  fail: "border-red-600/30 bg-red-50 text-red-800",
};
const LABEL: Record<Status, string> = { pass: "pass", warn: "warn", fail: "fail" };
const GRADE_COLOR: Record<string, string> = {
  A: "text-green",
  B: "text-green",
  C: "text-amber-700",
  D: "text-amber-700",
  F: "text-red-700",
};

export default function AuditTool() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !url.trim()) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong.");
      else setReport(data);
    } catch {
      setError("Couldn't reach the auditor. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const counts = report
    ? {
        pass: report.checks.filter((c) => c.status === "pass").length,
        warn: report.checks.filter((c) => c.status === "warn").length,
        fail: report.checks.filter((c) => c.status === "fail").length,
      }
    : null;

  return (
    <div>
      <form onSubmit={run} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="audit-url" className="sr-only">
          Website address
        </label>
        <input
          id="audit-url"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          maxLength={2048}
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="rounded-lg bg-accent px-4 py-2 font-mono text-sm font-medium text-white hover:bg-accent-strong disabled:opacity-50"
        >
          {loading ? "scanning…" : "audit"}
        </button>
      </form>

      <div aria-live="polite" className="mt-6">
        {error && (
          <p className="rounded-lg border border-red-600/30 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        )}

        {report && counts && (
          <div className="space-y-5">
            <div className="flex items-center gap-5 rounded-lg border border-line bg-surface p-4">
              <p className={`font-mono text-6xl font-bold ${GRADE_COLOR[report.grade] ?? ""}`} aria-label={`Grade ${report.grade}`}>
                {report.grade}
              </p>
              <div className="min-w-0 text-sm">
                <p className="truncate font-mono text-foreground">{report.finalUrl}</p>
                <p className="text-muted">
                  Score {report.score}/100 · {counts.pass} pass · {counts.warn} warn · {counts.fail} fail · HTTP {report.status}
                </p>
                {report.redirects.length > 0 && (
                  <p className="text-muted">
                    Followed {report.redirects.length} redirect{report.redirects.length > 1 ? "s" : ""} from {report.requestedUrl}
                  </p>
                )}
              </div>
            </div>

            <ul className="space-y-3">
              {report.checks.map((c) => (
                <li key={c.id} className="rounded-lg border border-line p-4">
                  <details>
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block font-mono text-sm font-semibold">{c.name}</span>
                        <span className="block text-sm text-muted">{c.summary}</span>
                      </span>
                      <span className={`shrink-0 rounded border px-2 py-0.5 font-mono text-xs ${BADGE[c.status]}`}>
                        {LABEL[c.status]}
                      </span>
                    </summary>
                    <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
                      {c.value && (
                        <p>
                          <span className="font-mono text-xs text-muted">sent: </span>
                          <code className="break-all font-mono text-xs">{c.value}</code>
                        </p>
                      )}
                      <p>
                        <span className="font-semibold">Why it matters. </span>
                        <span className="text-muted">{c.why}</span>
                      </p>
                      {c.status !== "pass" && (
                        <p>
                          <span className="font-semibold">How to fix. </span>
                          <span className="text-muted">{c.fix}</span>
                        </p>
                      )}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
