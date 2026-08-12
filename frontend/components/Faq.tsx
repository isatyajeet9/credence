"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const FAQS = [
  {
    q: "What does the similarity score actually mean?",
    a: "It's the percentage of your submission that matches text found in reference sources, your own prior submissions, or the open web. A high match isn't automatically plagiarism (quotes and common phrasing match too), and a low score isn't automatic proof of originality. It's evidence to review, not a verdict.",
  },
  {
    q: "How does this differ from other detection tools?",
    a: "Most commercial tools operate as a 'black box', giving you a bare percentage or a yes/no verdict that you have to take on faith. Credence is built on the philosophy of 'evidence over verdicts' — we provide similarity matching and a heuristic AI-likelihood estimate with the exact reasoning and sources always shown alongside the score.",
  },
  {
    q: "How does the AI-generation likelihood estimate work?",
    a: "It scores signals like sentence-length uniformity, word-entropy, and phrasing patterns that tend to differ between human and AI-generated text. It is a heuristic, not a trained classifier, so every result ships with a confidence band and is meant to prompt a closer look — not to be treated as a certain answer.",
  },
  {
    q: "Is my document stored or shared with anyone?",
    a: "Submitted text and files are stored in your account so you can revisit past reports, and are used to check future submissions against your own history. They are not shared with third parties.",
  },
  {
    q: "What file types are supported?",
    a: "Pasted text, PDF, and DOCX documents for the plagiarism and AI-likelihood checks; JPEG, PNG, and WEBP images for the image-provenance check.",
  },
  {
    q: "Who is this for?",
    a: "Students checking a draft before submission, and anyone reviewing written or visual work who wants the matched source and reasoning behind a score — not just a number.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col px-6 py-16">
      <p className="kicker mb-6">Frequently asked</p>
      {FAQS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="rule first:border-t-0">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
              aria-expanded={isOpen}
            >
              <span className="font-serif text-lg font-semibold text-ink">{item.q}</span>
              <Plus
                size={18}
                className={`shrink-0 text-ink-faint transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
              />
            </button>
            {isOpen && <p className="max-w-2xl pb-6 text-sm text-ink-soft">{item.a}</p>}
          </div>
        );
      })}
    </div>
  );
}
