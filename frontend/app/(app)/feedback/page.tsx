"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText, Sparkles, PartyPopper, Quote, ListChecks } from "lucide-react";
import { checkWritingFeedback, FeedbackResult } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const WHAT_WE_FLAG = [
  { title: "Passive voice", desc: "Sentences where the subject doesn't act — flagged, not silently rewritten." },
  { title: "Weak or vague words", desc: "\"Very\", \"stuff\", \"a lot of\" — filler that dilutes precise writing." },
  { title: "Repetition", desc: "The same word or phrase leaning too hard within a short span of text." },
  { title: "Overlong sentences", desc: "Sentences that run long enough to lose the reader's thread." },
];

export default function FeedbackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("credence_token");
    if (!token) return;
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await checkWritingFeedback(token, text);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feedback check failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <p className="kicker mb-1.5">Style review</p>
        <h1 className="font-serif text-2xl font-semibold text-ink">Writing feedback</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Flags unclear, weak, repetitive, or passive sentences with an explanation — never rewrites your text
          for you.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        <form onSubmit={handleSubmit} className="surface-card flex w-full flex-col gap-4 p-6 sm:p-8">
          <textarea
            required
            rows={5}
            placeholder="Paste text to get feedback on..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="rounded-lg border border-line bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-md bg-ink px-6 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <MessageSquareText size={15} />
            {loading ? "Analyzing..." : "Get feedback"}
          </button>

          {error && <p className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
        </form>

        {!result && !loading && (
          <div className="flex flex-col gap-5 p-2">
            <p className="kicker px-1">What we flag</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WHAT_WE_FLAG.map((item) => (
                <div key={item.title} className="surface-card flex flex-col gap-1.5 p-5">
                  <p className="flex items-center gap-2 text-sm font-medium text-ink">
                    <ListChecks size={14} className="text-accent-ink" />
                    {item.title}
                  </p>
                  <p className="text-xs text-ink-soft">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(loading || result) && (
          <div className="surface-card flex min-w-0 flex-1 flex-col p-6 sm:p-8">
          {loading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center text-ink-faint">
              <MessageSquareText size={28} strokeWidth={1.5} className="animate-pulse" />
              <p className="text-sm">Reading your submission...</p>
            </div>
          )}

          {result && (
            <div className="flex flex-1 flex-col gap-3 p-6">
              <p className="flex items-center gap-1.5 kicker">
                <Sparkles size={13} className="text-ink-faint" />
                {result.flagged_count} of {result.sentence_count} sentence(s) flagged
              </p>
              {result.feedback.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                  <PartyPopper size={24} className="text-accent-ink" strokeWidth={1.5} />
                  <p className="text-sm text-ink-soft">No issues found — nice and clear.</p>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {result.feedback.map((item, i) => (
                  <div key={i} className="rounded-lg border border-line bg-paper p-4 text-sm">
                    <p className="mb-2 flex gap-1.5 text-ink-soft">
                      <Quote size={13} className="mt-0.5 shrink-0 text-ink-faint" />
                      {item.sentence}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {item.issues.map((issue, j) => (
                        <li key={j} className="flex gap-2 text-warn">
                          <span>·</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </main>
  );
}


