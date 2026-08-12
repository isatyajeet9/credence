"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("credence_theme") as "light" | "dark" | null;
    setTheme(stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("credence_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle color theme"
      className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
