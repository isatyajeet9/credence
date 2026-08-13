"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FilePlus2, Inbox, ChevronRight } from "lucide-react";
import { listChecks, CheckHistoryItem } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { scoreTone } from "@/lib/scoreTone";

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checks, setChecks] = useState<CheckHistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const token = localStorage.getItem("credence_token");
    if (!token) return;
    listChecks(token)
      .then(setChecks)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load reports"));
  }, [user, router, loading]);

  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex w-full flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="kicker mb-1.5">Case Log</p>
            <h1 className="font-serif text-3xl font-semibold text-ink">Case History</h1>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
          >
            <FilePlus2 size={15} />
            New analysis
          </Link>
        </div>

        {error && <p className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}

        {checks === null && !error && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="surface-card h-[68px] animate-pulse p-4">
                <div className="h-3 w-1/3 rounded bg-surface-2" />
                <div className="mt-3 h-2.5 w-1/4 rounded bg-surface-2" />
              </div>
            ))}
          </div>
        )}

        {checks && checks.length === 0 && (
          <div className="surface-card flex flex-col items-center gap-2 p-10 text-center">
            <Inbox size={28} className="text-ink-faint" strokeWidth={1.5} />
            <p className="text-sm text-ink-soft">No case history yet.</p>
            <Link href="/dashboard" className="text-sm font-medium text-accent-ink hover:underline">
              Run your first analysis
            </Link>
          </div>
        )}

        {checks && checks.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {checks.map((c) => {
              const oTone = scoreTone(c.originality_score ?? 0);
              const aiPercent = c.ai_likelihood_score !== null ? Math.round(c.ai_likelihood_score * 100) : null;
              const aiTone = aiPercent !== null ? scoreTone(aiPercent, true) : null;
              const accentClass = oTone.text.replace("text-", "border-");
              return (
                <Link
                  key={c.check_id}
                  href={`/reports/${c.check_id}`}
                  className={`surface-card surface-card-hover flex items-center justify-between gap-4 border-l-[3px] px-5 py-4 text-sm ${accentClass}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-serif text-base font-semibold text-ink">
                      {c.original_filename || "Pasted text"}
                    </p>
                    <p className="text-xs text-ink-faint">{new Date(c.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-md px-2 py-1 text-xs font-medium ${oTone.bg} ${oTone.text}`}>
                      {c.originality_score ?? "-"}% orig.
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
    </main>
  );
}

