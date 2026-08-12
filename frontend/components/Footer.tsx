import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-12 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-2">
          <Logo size={24} textClassName="text-lg" />
          <p className="max-w-xs text-sm text-ink-soft">
            Similarity checking and AI-generation likelihood estimation, with the evidence shown alongside
            every score.
          </p>
        </div>

        <div className="flex flex-wrap gap-12">
          <div className="flex flex-col gap-2">
            <p className="kicker">Product</p>
            <Link href="/signup" className="text-sm text-ink-soft hover:text-ink">
              Get started
            </Link>
            <Link href="/login" className="text-sm text-ink-soft hover:text-ink">
              Log in
            </Link>
            <a href="#faq" className="text-sm text-ink-soft hover:text-ink">
              FAQ
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <p className="kicker">About</p>
            <a href="#who" className="text-sm text-ink-soft hover:text-ink">
              Who it's for
            </a>
            <a href="#contents" className="text-sm text-ink-soft hover:text-ink">
              How it works
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-6 py-4 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Credence. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
