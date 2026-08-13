"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Quote, AlertTriangle } from "lucide-react";
import { getCheck, reportPdfUrl, CheckResult } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { scoreTone, originalityLabel, aiLikelihoodLabel } from "@/lib/scoreTone";
import ScoreGauge from "@/components/ScoreGauge";

const SOURCE_LABELS: Record<string, string> = {
  reference_corpus: "Reference source",
  own_submission: "Your earlier submission",
  web: "Web source",
};

export default function ReportDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const token = localStorage.getItem("credence_token");
    if (!token) return;
    getCheck(token, params.id)
      .then(setResult)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load report"));
  }, [params.id, user, router, loading]);

  async function handleDownload() {
    const token = localStorage.getItem("credence_token");
    if (!token) return;
    setDownloading(true);
    try {
      const res = await fetch(reportPdfUrl(params.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Could not download PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `credence-report-${params.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-4 px-6 py-10">
        <div className="flex w-full max-w-2xl flex-col gap-4">
          <p className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>
          <Link href="/reports" className="text-sm font-medium text-accent-ink hover:underline">
            Back to reports
          </Link>
        </div>
      </main>
    );
  }

  if (!result) return null;

  const matches = result.result_json?.matches ?? [];
  const aiPercent =
    result.ai_likelihood_score !== null && result.ai_likelihood_score !== undefined
      ? Math.round(result.ai_likelihood_score * 100)
      : null;
  const originalityTone = scoreTone(result.originality_score ?? 0);
  const aiTone = aiPercent !== null ? scoreTone(aiPercent, true) : null;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col items-center gap-6 px-6 py-10">
      <div className="flex w-full max-w-3xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link href="/reports" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
          <ArrowLeft size={15} />
          All reports
        </Link>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Download size={14} />
          {downloading ? "Preparing..." : "Download PDF"}
        </button>
      </div>

      <div className="surface-card flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <p className="kicker">Analysis Report</p>
          </div>
          <p className="text-xs text-ink-faint">{new Date(result.created_at).toLocaleString()}</p>
        </div>

        {result.result_json?.low_confidence && (
          <p className="flex items-center gap-2 rounded-md bg-warn-soft px-3 py-2 text-xs text-warn">
            <AlertTriangle size={13} />
            Low confidence: {result.result_json.low_confidence_reason}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-8 py-6">
          <ScoreGauge
            value={result.originality_score ?? 0}
            toneClass={originalityTone.text}
            label="Originality"
            qualifier={originalityLabel(result.originality_score ?? 0)}
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
          <div>
            <p className="kicker mb-2">Why this AI-likelihood score</p>
            <ul className="flex flex-col gap-1.5">
              {result.result_json.ai_text_reasons.map((reason, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink-soft">
                  <span className="text-accent">·</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {matches.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="kicker">
              Evidence log: {matches.length} exhibit{matches.length > 1 ? "s" : ""}
            </p>
            {matches.map((match, i) => (
              <div key={i} className="rounded-lg border border-line bg-paper p-4 text-sm">
                <div className="mb-2 flex items-center justify-between text-xs text-ink-faint">
                  <span>
                    Exhibit {String.fromCharCode(65 + i)}: {SOURCE_LABELS[match.source_type] ?? match.source_type}:{" "}
                    {match.source_reference}
                  </span>
                  <span className="rounded-full bg-warn-soft px-2 py-0.5 font-medium text-warn">
                    {match.similarity_score}% similar
                  </span>
                </div>
                <p className="flex gap-1.5 text-ink-soft">
                  <Quote size={13} className="mt-0.5 shrink-0 text-ink-faint" />
                  {match.matched_excerpt}
                </p>
              </div>
            ))}
          </div>
        )}

        {matches.length === 0 && result.originality_score !== null && (
          <p className="text-sm text-ink-faint">No matching sources found.</p>
        )}
      </div>
      </div>
    </main>
  );
}

