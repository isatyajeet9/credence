"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="surface-card flex w-full max-w-sm flex-col gap-4 p-8">
        <div className="mb-2">
          <p className="kicker mb-1.5">Password reset</p>
          <h1 className="font-serif text-2xl font-semibold text-ink">Reset your password</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Enter your email and we&apos;ll send you a code to reset your password.
          </p>
        </div>

        {sent ? (
          <>
            <p className="rounded-md bg-good-soft px-3 py-2 text-sm text-good">
              If an account exists for that email, a reset code has been sent.
            </p>
            <button
              onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
              className="mt-1 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90"
            >
              I have my code
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

            {error && <p className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset code"}
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
