"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UploadCloud,
  X,
  ScanSearch,
  Quote,
  AlertTriangle,
  ScanLine,
  FileText,
  ChevronRight,
  Gauge,
} from "lucide-react";
import { checkText, checkDocument, listChecks, CheckResult, CheckHistoryItem } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { scoreTone, originalityLabel, aiLikelihoodLabel } from "@/lib/scoreTone";
import ScoreGauge from "@/components/ScoreGauge";

const PLAN_LIMITS: Record<string, number> = { free: 5, pro: 200 };
const MAX_TEXT_CHARS = 200_000;

const SOURCE_LABELS: Record<string, string> = {
  reference_corpus: "Reference source",
  own_submission: "Your earlier submission",
  web: "Web source",
};

const SAMPLE_TEXT =
  "The rapid growth of renewable energy technologies has fundamentally reshaped global electricity markets over the past decade. Solar and wind capacity have expanded faster than most forecasts predicted, driven largely by falling equipment costs and supportive policy frameworks. However, integrating these variable sources into existing grids still presents significant technical and economic challenges that utilities are only beginning to address.";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<CheckHistoryItem[] | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("credence_token");
    if (!token) return;
    listChecks(token)
      .then(setRecent)
      .catch(() => setRecent([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("credence_token");
    if (!token) {
      router.push("/login");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = file ? await checkDocument(token, file) : await checkText(token, text);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check failed");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  const matches = result?.result_json?.matches ?? [];
  const aiPercent =
    result?.ai_likelihood_score !== null && result?.ai_likelihood_score !== undefined
      ? Math.round(result.ai_likelihood_score * 100)
      : null;
  const originalityTone = result ? scoreTone(result.originality_score ?? 0) : null;
  const aiTone = aiPercent !== null ? scoreTone(aiPercent, true) : null;

  const now = new Date();
  const usedThisMonth = (recent ?? []).filter((c) => {
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const limit = PLAN_LIMITS[user.plan] ?? 5;
  const usagePercent = Math.min(100, Math.round((usedThisMonth / limit) * 100));

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <p className="kicker mb-1.5">Welcome back, {user.full_name || user.email}</p>
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Plagiarism Checker
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Paste text or upload a document to run a similarity check and an AI-generation
          likelihood estimate.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <form onSubmit={handleSubmit} className="surface-card flex w-full flex-col gap-4 p-6 sm:p-8">
          <textarea
            rows={5}
            maxLength={MAX_TEXT_CHARS}
            placeholder="Paste text to check..."
            value={text}
            disabled={!!file}
            onChange={(e) => setText(e.target.value)}
            className="rounded-lg border border-line bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft disabled:opacity-50"
          />

          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            <span className="text-ink-faint">or</span>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-line bg-paper px-3 py-1.5 text-ink-soft hover:border-line-strong">
              <UploadCloud size={14} />
              Choose file
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            {file && (
              <span className="flex items-center gap-1.5 rounded-md bg-surface-2 py-1 pl-2.5 pr-1.5 text-ink">
                {file.name}
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  aria-label="Remove file"
                  className="rounded p-0.5 text-ink-faint hover:bg-line hover:text-ink"
                >
                  <X size={13} />
                </button>
              </span>
            )}
            {!file && text.length === 0 && (
              <button
                type="button"
                onClick={() => setText(SAMPLE_TEXT)}
                className="text-xs font-medium text-accent-ink hover:underline"
              >
                Try a sample
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
            <span className="font-mono text-xs text-ink-faint">
              {file ? file.name : `${(text.trim() ? text.trim().split(/\s+/).length : 0).toLocaleString()} words`}
            </span>
            <button
              type="submit"
              disabled={loading || (!file && text.trim().length === 0)}
              className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <ScanSearch size={15} />
              {loading ? "Analyzing..." : "Run analysis"}
            </button>
          </div>

          {error && <p className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
        </form>

        {(loading || result) && (
          <div className="surface-card flex min-w-0 flex-1 flex-col p-6 sm:p-8">

          {loading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-ink-faint">
              <ScanSearch size={28} strokeWidth={1.5} className="animate-pulse" />
              <p className="text-sm">Analyzing your submission...</p>
            </div>
          )}

          {result && !loading && (
            <div className="flex flex-col items-center gap-8 p-6 sm:p-10">
              {result.result_json?.low_confidence && (
                <p className="flex items-center gap-2 rounded-md bg-warn-soft px-3 py-2 text-xs text-warn">
                  <AlertTriangle size={13} />
                  Low confidence: {result.result_json.low_confidence_reason}
                </p>
              )}

              <div className="flex flex-wrap justify-center gap-8 py-2">
                <ScoreGauge
                  value={result.originality_score ?? 0}
                  toneClass={originalityTone?.text ?? "text-ink-faint"}
                  label="Originality"
                  qualifier={originalityTone ? originalityLabel(result.originality_score ?? 0) : undefined}
                />
                <ScoreGauge
                  value={aiPercent ?? 0}
                  toneClass={aiTone?.text ?? "text-ink-faint"}
                  label="AI likelihood"
                  sublabel={`${result.ai_confidence_band ?? "n/a"} confidence`}
                  qualifier={aiPercent !== null ? aiLikelihoodLabel(aiPercent) : undefined}
                />
              </div>

              {result.result_json?.ai_text_reasons && result.result_json.ai_text_reasons.length > 0 && (
                <div className="w-full max-w-3xl">
                  <p className="kicker mb-2">Why this AI-likelihood score</p>
                  <ul className="flex flex-col gap-2 rounded-xl bg-paper px-6 py-4 border border-line">
                    {result.result_json.ai_text_reasons.map((reason, i) => (
                      <li key={i} className="flex gap-2 text-sm text-ink-soft">
                        <span className="text-accent mt-0.5">·</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {matches.length > 0 && (
                <div className="flex w-full max-w-3xl flex-col gap-3">
                  <p className="kicker">
                    Evidence log — {matches.length} exhibit{matches.length > 1 ? "s" : ""}
                  </p>
                  {matches.map((match, i) => (
                    <div key={i} className="rounded-xl border border-line bg-paper p-5 text-sm">
                      <div className="mb-3 flex items-center justify-between text-xs text-ink-faint">
                        <span className="font-medium">
                          Exhibit {String.fromCharCode(65 + i)} — {SOURCE_LABELS[match.source_type] ?? match.source_type}:{" "}
                          {match.source_reference}
                        </span>
                        <span className="rounded-full bg-warn-soft px-2.5 py-1 font-medium text-warn">
                          {match.similarity_score}% similar
                        </span>
                      </div>
                      <p className="flex gap-2 text-ink-soft">
                        <Quote size={14} className="mt-0.5 shrink-0 text-ink-faint" />
                        {match.matched_excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {matches.length === 0 && result.originality_score !== null && (
                <div className="w-full max-w-3xl rounded-xl border border-line bg-good-soft/30 p-6 text-center text-sm text-good">
                  No matching sources found. The text appears completely original.
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>

      <div className="grid grid-cols-1 gap-6 border-t border-line pt-8 lg:grid-cols-[280px_1fr]">
        <div className="surface-card flex flex-col gap-3 p-6">
          <p className="kicker">This month</p>
          <div className="flex items-baseline gap-2">
            <Gauge size={18} className="text-ink-faint" />
            <p className="font-serif text-3xl font-semibold text-ink">
              {usedThisMonth}
              <span className="text-lg font-normal text-ink-faint"> / {limit}</span>
            </p>
          </div>
          <div className="relative h-[3px] w-full overflow-hidden bg-line">
            <div
              className={`absolute inset-y-0 left-0 ${usagePercent >= 90 ? "bg-bad" : "bg-accent"}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className="text-xs text-ink-faint">
            checks used on the {user.plan} plan
            {user.plan === "free" && (
              <>
                {" — "}
                <Link href="/upgrade" className="font-medium text-accent-ink hover:underline">
                  go Pro
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="kicker">Recent case log</p>
            {recent && recent.length > 0 && (
              <Link href="/reports" className="text-xs font-medium text-accent-ink hover:underline">
                View all
              </Link>
            )}
          </div>

          {recent === null && (
            <div className="flex flex-col gap-2">
              {[0, 1].map((i) => (
                <div key={i} className="surface-card h-[52px] animate-pulse p-4">
                  <div className="h-3 w-1/3 rounded bg-surface-2" />
                </div>
              ))}
            </div>
          )}

          {recent && recent.length === 0 && (
            <div className="surface-card flex items-center gap-2 px-5 py-4 text-sm text-ink-faint">
              <FileText size={16} />
              No reports yet — run your first check above.
            </div>
          )}

          {recent && recent.length > 0 && (
            <div className="flex flex-col gap-2">
              {recent.slice(0, 4).map((c) => {
                const oTone = scoreTone(c.originality_score ?? 0);
                const accentClass = oTone.text.replace("text-", "border-");
                return (
                  <Link
                    key={c.check_id}
                    href={`/reports/${c.check_id}`}
                    className={`surface-card surface-card-hover flex items-center justify-between gap-3 border-l-[3px] px-5 py-4 text-sm ${accentClass}`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FileText size={15} className="shrink-0 text-ink-faint" />
                      <span className="truncate text-ink">{c.original_filename || "Pasted text"}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${oTone.bg} ${oTone.text}`}>
                        {c.originality_score ?? "—"}%
                      </span>
                      <ChevronRight size={14} className="text-ink-faint" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
