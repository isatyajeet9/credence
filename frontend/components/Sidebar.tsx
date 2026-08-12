"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileCheck2, FileText, Layers, ImageIcon, MessageSquareText, LogOut, Menu, X, Crown } from "lucide-react";
import type { UserOut } from "@/lib/api";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "/dashboard", label: "Check", icon: FileCheck2 },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/bulk", label: "Bulk", icon: Layers },
  { href: "/image-check", label: "Image", icon: ImageIcon },
  { href: "/feedback", label: "Feedback", icon: MessageSquareText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserOut | null>(null);
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("credence_user");
    setUser(stored ? JSON.parse(stored) : null);
  }, [pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  function logout() {
    localStorage.removeItem("credence_token");
    localStorage.removeItem("credence_user");
    setUser(null);
    router.push("/login");
  }

  const initial = (user?.full_name || user?.email || "?").trim().charAt(0).toUpperCase();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => {
          const active = isActive(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
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
    );
  }

  function UserCluster() {
    return (
      <div className="flex flex-col gap-3 border-t border-line pt-3">
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink">
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

        {user?.plan === "free" && (
          <Link
            href="/upgrade"
            className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-accent-ink transition-colors hover:border-line-strong"
          >
            <Crown size={14} />
            Upgrade to Pro
          </Link>
        )}

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button
            onClick={logout}
            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-medium text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-line bg-surface px-4 py-5 md:flex">
        <div className="flex flex-col gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 px-1">
            <span className="font-serif text-lg font-semibold tracking-tight text-ink">Credence</span>
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          </Link>
          {mounted && <NavLinks />}
        </div>
        {mounted && <UserCluster />}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur-sm md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-serif text-lg font-semibold tracking-tight text-ink">Credence</span>
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink"
        >
          <Menu size={18} />
        </button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col justify-between bg-surface px-4 py-5 shadow-xl">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-1">
                <span className="font-serif text-lg font-semibold tracking-tight text-ink">Credence</span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>
              {mounted && <NavLinks onNavigate={() => setDrawerOpen(false)} />}
            </div>
            {mounted && <UserCluster />}
          </div>
        </div>
      )}
    </>
  );
}
