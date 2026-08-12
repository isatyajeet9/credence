"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileCheck2,
  FileText,
  Layers,
  ImageIcon,
  MessageSquareText,
  LogOut,
  Menu,
  X,
  Crown,
  Moon,
  Sun,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import Logo from "./Logo";

const LINKS = [
  { href: "/dashboard", label: "Plagiarism Check", icon: FileCheck2 },
  { href: "/reports", label: "Case History", icon: FileText },
  { href: "/bulk", label: "Batch Checking", icon: Layers },
  { href: "/image-check", label: "Image Analysis", icon: ImageIcon },
  { href: "/feedback", label: "Feedback", icon: MessageSquareText },
];

export default function AppNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("credence_theme") as "light" | "dark" | null;
    setTheme(storedTheme ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("credence_theme", next);
    document.documentElement.setAttribute("data-theme", next);
  }

  // Logout is now handled by useAuth()

  const initial = (user?.full_name || user?.email || "?").trim().charAt(0).toUpperCase();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function AccountPanel() {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{user?.full_name || user?.email}</p>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                user?.plan === "pro" ? "bg-accent-soft text-accent-ink" : "bg-surface-2 text-ink-faint"
              }`}
            >
              {user?.plan}
            </span>
          </div>
        </div>

        <div className="my-0.5 border-t border-line" />

        {user?.plan === "free" && (
          <Link
            href="/upgrade"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-accent-ink transition-colors hover:bg-surface-2"
          >
            <Crown size={15} />
            Upgrade to Pro
          </Link>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>
    );
  }

  return (
    <>
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-6">
        <Link href="/dashboard" className="shrink-0">
          <Logo />
        </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => {
              const active = isActive(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 border-b-2 px-3 py-5 text-sm font-medium transition-colors ${
                    active
                      ? "border-accent text-ink"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  <Icon size={15} strokeWidth={2} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

        <div className="flex shrink-0 items-center gap-2">
          {mounted && (
            <button
              onClick={toggleTheme}
              aria-label="Toggle color theme"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}

          {mounted && user && (
            <div ref={menuRef} className="relative hidden shrink-0 md:block">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Account menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-md py-1.5 pr-2 pl-1.5 transition-colors hover:bg-surface-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink">
                  {initial}
                </span>
                <ChevronDown size={14} className="text-ink-faint" />
              </button>

              {menuOpen && (
                <div className="surface-card absolute right-0 top-13 flex w-64 flex-col p-2">
                  <AccountPanel />
                </div>
              )}
            </div>
          )}

          {mounted && user && (
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink md:hidden"
            >
              <Menu size={18} />
            </button>
          )}
        </div>
      </div>
    </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col gap-6 bg-surface px-4 py-5 shadow-xl">
            <div className="flex items-center justify-between px-1">
              <Logo />
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle color theme"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink"
                >
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {LINKS.map((link) => {
                const active = isActive(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 rounded-r-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "border-accent bg-accent-soft/60 text-accent-ink"
                        : "border-transparent text-ink-soft hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <Icon size={16} strokeWidth={2} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-line pt-3">
              <AccountPanel />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
