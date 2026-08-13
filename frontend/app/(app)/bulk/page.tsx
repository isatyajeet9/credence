"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadCloud, X, ScanSearch, FileText, ChevronRight, Loader2, Play, Layers, Lock, Check, Crown } from "lucide-react";
import { checkBulk, CheckResult } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { scoreTone } from "@/lib/scoreTone";

const PRO_FEATURES = [
  "Up to 10 files in a single run",
  "200 checks / month instead of 5",
  "Everything in the Free plan",
];

const MAX_FILES = 10;

export default function BulkPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
  }, [user, router, authLoading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);
    setResults(null);
    try {
      const res = await checkBulk(localStorage.getItem("credence_token") as string, files);
      setResults(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk check failed");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  if (user.plan !== "pro") {
    return (
      <main className="mx-auto flex w-full max-w-[800px] flex-1 flex-col items-center justify-center gap-8 px-6 py-20 text-center">
        <div>
          <Layers size={40} className="mx-auto mb-4 text-ink-faint" />
          <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">Bulk Checker</h1>
          <p className="mt-3 text-sm text-ink-soft sm:text-base">
            Upload up to 10 documents at once and get an individual report for each in parallel. Built for grading a whole batch of submissions in one pass.
          </p>
        </div>

        <div className="surface-card flex w-full max-w-md flex-col items-center gap-5 border-accent p-8 text-left shadow-sm">
          <div className="flex w-full items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-accent-ink" />
              <p className="font-semibold text-ink">Pro plan required</p>
            </div>
            <p className="text-sm font-medium text-ink-soft">₹499/mo</p>
          </div>
          
          <ul className="flex w-full flex-col gap-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-ink-soft">
                <Check size={16} className="shrink-0 text-accent" />
                {f}
              </li>
            ))}
          </ul>
          
          <Link
            href="/upgrade"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90"
          >
            <Lock size={15} />
            Upgrade to Pro
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <p className="kicker mb-1.5">Batch Processing</p>
        <h1 className="font-serif text-3xl font-semibold text-ink">Bulk Plagiarism & AI Checker</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Upload up to {MAX_FILES} documents to process them in parallel.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <form onSubmit={handleSubmit} className="surface-card flex w-full flex-col items-center gap-6 p-8 sm:p-12">
          <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-paper/50 py-16 text-sm text-ink-soft transition-colors hover:border-accent hover:bg-paper">
            <Layers size={32} className="text-ink-faint" />
            <span className="font-medium text-ink">Choose files to upload</span>
            <span className="text-xs text-ink-faint">Up to {MAX_FILES} PDF or DOCX files</span>
            <input
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="hidden"
            />
          </label>
          {files.length > 0 && (
            <p className="text-sm text-ink-soft">{files.length} file(s) selected</p>
          )}
          <button
            type="submit"
            disabled={loading || files.length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? `Checking ${files.length} file(s)...` : "Run bulk check"}
          </button>

          {error && <p className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
        </form>

        {(loading || results) && (
          <div className="surface-card flex min-w-0 flex-1 flex-col p-6 sm:p-8">
          {loading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-ink-faint">
              <Layers size={28} strokeWidth={1.5} className="animate-pulse" />
              <p className="text-sm">Checking {files.length} file(s)...</p>
            </div>
          )}

          {results && (
            <div className="flex flex-col gap-2.5 p-6">
              <p className="kicker">
                Case log: {results.length} report{results.length > 1 ? "s" : ""}
              </p>
              {results.map((r, i) => {
                const oTone = scoreTone(r.originality_score ?? 0);
                const aiPercent = r.ai_likelihood_score !== null ? Math.round(r.ai_likelihood_score * 100) : null;
                const aiTone = aiPercent !== null ? scoreTone(aiPercent, true) : null;
                const accentClass = oTone.text.replace("text-", "border-");
                return (
                  <Link
                    key={r.check_id}
                    href={`/reports/${r.check_id}`}
                    className={`surface-card surface-card-hover flex items-center justify-between gap-3 border-l-[3px] px-5 py-4 text-sm ${accentClass}`}
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] tracking-widest text-ink-faint uppercase">
                        Case #{r.check_id.slice(0, 6)}
                      </p>
                      <p className="truncate font-serif text-base font-semibold text-ink">
                        {files[i]?.name ?? `File ${i + 1}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${oTone.bg} ${oTone.text}`}>
                        {r.originality_score !== null ? `${r.originality_score}% orig.` : "- orig."}
                      </span>
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${aiTone?.bg ?? "bg-surface-2"} ${aiTone?.text ?? "text-ink-faint"}`}>
                        {aiPercent !== null ? `${aiPercent}%` : "-"} AI
                      </span>
                      <ChevronRight size={16} className="text-ink-faint" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </main>
  );
}


