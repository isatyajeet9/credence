"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code is incorrect or has expired");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="surface-card flex w-full max-w-sm flex-col gap-4 p-8">
        <div className="mb-2">
          <p className="kicker mb-1.5">Password reset</p>
          <h1 className="font-serif text-2xl font-semibold text-ink">Enter your reset code</h1>
          <p className="mt-1 text-sm text-ink-soft">Check your email for the 6-digit code.</p>
        </div>

        {done ? (
          <>
            <p className="rounded-md bg-good-soft px-3 py-2 text-sm text-good">
              Password updated. You can log in with your new password now.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-1 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
            >
              Go to log in
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-soft">Email</span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-soft">Reset code</span>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="rounded-md border border-line bg-paper px-3 py-2 text-center text-lg tracking-[0.5em] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-ink-soft">New password</span>
              <input
                type="password"
                required
                minLength={8}
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
              />
            </label>

            {error && <p className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="mt-1 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-ink-soft">
          <Link href="/login" className="font-medium text-accent-ink hover:underline">
            Back to log in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
