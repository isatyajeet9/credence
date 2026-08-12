"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup, verifyEmail, resendOtp } from "@/lib/api";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup(email, password, fullName);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await verifyEmail(email, code);
      localStorage.setItem("credence_token", result.access_token);
      localStorage.setItem("credence_user", JSON.stringify(result.user));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code is incorrect or has expired");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError(null);
    setNotice(null);
    try {
      const result = await resendOtp(email);
      setNotice(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resend the code");
    }
  }

  if (step === "otp") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <form onSubmit={handleVerify} className="surface-card flex w-full max-w-sm flex-col gap-4 p-8">
          <div className="mb-2">
            <p className="kicker mb-1.5">Verify email</p>
            <h1 className="font-serif text-2xl font-semibold text-ink">Check your email</h1>
            <p className="mt-1 text-sm text-ink-soft">
              We sent a 6-digit code to <span className="text-ink">{email}</span>. Enter it below to finish creating your account.
            </p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ink-soft">Verification code</span>
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

          {error && <p className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
          {notice && <p className="rounded-md bg-good-soft px-3 py-2 text-sm text-good">{notice}</p>}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="mt-1 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & continue"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            className="text-center text-sm text-accent-ink hover:underline"
          >
            Resend code
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <form onSubmit={handleSignup} className="surface-card flex w-full max-w-sm flex-col gap-4 p-8">
        <div className="mb-2">
          <p className="kicker mb-1.5">New account</p>
          <h1 className="font-serif text-2xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-ink-soft">
            One account type for everyone — Free plan by default.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-ink-soft">Full name (optional)</span>
          <input
            type="text"
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </label>
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
          <span className="text-xs font-medium text-ink-soft">Password</span>
          <input
            type="password"
            required
            minLength={8}
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </label>

        {error && (
          <p className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>

        <GoogleDivider />
        <div className="flex justify-center">
          <GoogleSignInButton onError={setError} />
        </div>

        <p className="text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent-ink hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}

function GoogleDivider() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  return (
    <div className="flex items-center gap-3 text-xs text-ink-faint">
      <div className="h-px flex-1 bg-line" />
      or
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}
