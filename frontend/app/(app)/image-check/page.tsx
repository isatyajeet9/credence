"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, ShieldCheck, ShieldQuestion, ScanLine, ScanSearch } from "lucide-react";
import { checkImage, CheckResult } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { scoreTone, aiLikelihoodLabel } from "@/lib/scoreTone";
import ScoreGauge from "@/components/ScoreGauge";

export default function ImageCheckPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !file) return;
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await checkImage(localStorage.getItem("credence_token") as string, file);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image check failed");
    } finally {
      setLoading(false);
    }
  }

  const aiPercent =
    result?.ai_likelihood_score !== null && result?.ai_likelihood_score !== undefined
      ? Math.round(result.ai_likelihood_score * 100)
      : null;
  const aiTone = aiPercent !== null ? scoreTone(aiPercent, true) : null;
  const hasManifest = result?.result_json?.provenance?.has_manifest;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">Image Provenance & AI Detector</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Upload an image to scan EXIF metadata, detect AI generation artifacts, and verify C2PA content credentials.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <form onSubmit={handleSubmit} className="surface-card flex w-full flex-col items-center gap-6 p-8 sm:p-12">
          <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-paper/50 py-16 text-sm text-ink-soft transition-colors hover:border-accent hover:bg-paper">
            <ImagePlus size={32} className="text-ink-faint" />
            <span className="font-medium text-ink">Choose an image to upload</span>
            <span className="text-xs text-ink-faint">JPEG, PNG, WEBP</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 rounded-lg border border-line object-contain"
            />
          )}
          <button
            type="submit"
            disabled={loading || !file}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-6 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <ScanSearch size={15} />
            {loading ? "Analyzing..." : "Run analysis"}
          </button>

          {error && <p className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
        </form>

        {(loading || result) && (
          <div className="surface-card flex min-w-0 flex-1 flex-col p-6 sm:p-8">

          {loading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-ink-faint">
              <ScanSearch size={28} strokeWidth={1.5} className="animate-pulse" />
              <p className="text-sm">Analyzing your image...</p>
            </div>
          )}

          {result && !loading && (
            <div className="flex flex-col items-center gap-8 p-6 sm:p-10">
              <div className="flex justify-center py-2">
                <ScoreGauge
                  value={aiPercent ?? 0}
                  toneClass={aiTone?.text ?? "text-ink-faint"}
                  label="AI-generation likelihood"
                  sublabel={`${result.ai_confidence_band ?? "n/a"} confidence`}
                  qualifier={aiPercent !== null ? aiLikelihoodLabel(aiPercent) : undefined}
                />
              </div>

              {result.result_json?.ai_text_reasons && (
                <ul className="flex w-full max-w-2xl flex-col gap-2 rounded-xl bg-paper px-6 py-4 border border-line">
                  {result.result_json.ai_text_reasons.map((reason, i) => (
                    <li key={i} className="flex gap-2 text-sm text-ink-soft">
                      <span className="text-accent mt-0.5">·</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex w-full max-w-2xl items-start gap-3 rounded-xl bg-paper px-6 py-4 border border-line">
                {hasManifest ? (
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-good" />
                ) : (
                  <ShieldQuestion size={18} className="mt-0.5 shrink-0 text-ink-faint" />
                )}
                <div>
                  <p className="text-sm font-medium text-ink">Provenance Data</p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {hasManifest
                      ? "C2PA content-credentials manifest found."
                      : "No C2PA content-credentials manifest found in this file."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </main>
  );
}

