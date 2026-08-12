import Link from "next/link";
import { ArrowRight, Quote, GraduationCap, ClipboardCheck, PenTool } from "lucide-react";
import Faq from "@/components/Faq";

const AUDIENCES = [
  {
    icon: GraduationCap,
    title: "Students",
    desc: "Check a draft before submission — see exactly which passages need a citation or a rewrite, before a grader does.",
  },
  {
    icon: ClipboardCheck,
    title: "Educators & graders",
    desc: "Review submitted work with the matched source and similarity score attached, instead of a bare percentage to take on faith.",
  },
  {
    icon: PenTool,
    title: "Writers & researchers",
    desc: "Verify originality and screen for AI-generated passages before publishing or submitting for review.",
  },
];

const FEATURES = [
  {
    n: "01",
    title: "Similarity detection, with sources",
    desc: "Cross-checked against reference texts, your own prior submissions, and the open web. Every match ships with its source excerpt and a similarity score — a text-matching report, not a verdict.",
  },
  {
    n: "02",
    title: "AI-generation likelihood",
    desc: "Burstiness, word-entropy, and phrasing-pattern analysis, reported as a percentage with an honest confidence band — never a bare yes/no.",
  },
  {
    n: "03",
    title: "Image provenance",
    desc: "EXIF metadata, edge-artifact analysis, and C2PA content-credential lookups, cross-checked in a single pass over the file.",
  },
  {
    n: "04",
    title: "Writing feedback",
    desc: "Passive voice, vague language, repetition, and overlong sentences — flagged with the reasoning attached, never silently rewritten.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-12 lg:gap-16 lg:py-16">
        <div className="flex flex-col gap-7 lg:col-span-7 lg:pr-8">
          <span className="w-fit rounded-full border border-line/60 bg-surface/50 px-4 py-1.5 text-xs font-semibold tracking-wider text-ink-faint uppercase shadow-sm">
            Evidence, not verdicts
          </span>
          <h1 className="text-5xl leading-[1.05] font-semibold tracking-tight text-balance text-ink sm:text-6xl lg:text-[5rem] lg:leading-[1.1]">
            The evidence behind <span className="font-serif italic text-accent-ink">every</span> check.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
            Credence runs a similarity check against reference sources and an AI-generation
            likelihood estimate on text and images — then shows the matched excerpt, the score,
            and the reasoning behind every call. A text-matching report, not a verdict.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90"
            >
              Get started free
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-line px-6 py-3 text-sm font-medium text-ink hover:border-line-strong"
            >
              Log in
            </Link>
          </div>
        </div>

        <div className="group relative lg:col-span-5">
          {/* Ambient Glow */}
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-accent/20 to-transparent opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-70" />
          
          <div className="relative flex flex-col gap-8 rounded-2xl border border-line/50 bg-surface/90 p-8 shadow-xl backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(200,160,50,0.15)]">
            <div className="flex items-center justify-between">
              <span className="kicker">Sample Analysis</span>
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
              <div className="flex flex-col gap-2.5">
                <p className="kicker">Originality</p>
                <p className="font-serif text-5xl leading-none font-semibold tracking-tight text-good">
                  93%
                </p>
                <div className="relative mt-1 h-[4px] w-full max-w-[7rem] overflow-hidden rounded-full bg-line/60">
                  <div className="absolute inset-y-0 left-0 w-[93%] rounded-full bg-good transition-all duration-1000" />
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <p className="kicker">AI likelihood</p>
                <p className="font-serif text-5xl leading-none font-semibold tracking-tight text-good">
                  12%
                </p>
                <div className="relative mt-1 h-[4px] w-full max-w-[7rem] overflow-hidden rounded-full bg-line/60">
                  <div className="absolute inset-y-0 left-0 w-[12%] rounded-full bg-good transition-all duration-1000" />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line/60 bg-paper/50 p-5 text-sm transition-colors duration-300 group-hover:border-line-strong group-hover:bg-paper">
              <div className="mb-3 flex items-center justify-between text-xs text-ink-faint">
                <span className="font-medium">Matched Source</span>
                <span className="rounded-full bg-warn-soft/80 px-2.5 py-1 font-semibold text-warn">
                  61% similar
                </span>
              </div>
              <p className="flex gap-2 text-ink-soft leading-relaxed">
                <Quote size={14} className="mt-0.5 shrink-0 text-ink-faint" />
                &quot;...the matched excerpt appears here, alongside its source and similarity score.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="contents" className="scroll-mt-20 border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 py-16">
          <p className="kicker mb-6">Contents</p>
          {FEATURES.map((f) => (
            <div key={f.n} className="rule flex gap-6 py-7 first:border-t-0">
              <span className="font-mono text-sm text-ink-faint">{f.n}</span>
              <div className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-24">
                <h3 className="w-56 shrink-0 font-serif text-lg font-semibold text-ink">{f.title}</h3>
                <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="who" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-16">
          <p className="kicker mb-6">Who it's for</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="surface-card flex flex-col gap-3 p-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
                  <a.icon size={17} />
                </span>
                <h3 className="font-serif text-lg font-semibold text-ink">{a.title}</h3>
                <p className="text-sm text-ink-soft">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 border-t border-line bg-surface">
        <Faq />
      </section>
    </main>
  );
}
