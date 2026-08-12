"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import Logo from "./Logo";

export default function PublicNavbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("credence_theme") as "light" | "dark" | null;
    setTheme(stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("credence_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-6">
        <Link href="/">
          <Logo />
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            className="flex h-9 w-9 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {!isAuthPage && (
            <>
              <Link href="/login" className="hidden px-2 text-sm font-medium text-ink-soft hover:text-ink sm:block">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 sm:px-4 sm:py-2"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
