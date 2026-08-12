"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, CreditCard, CheckCircle2 } from "lucide-react";
import { createProOrder, getBillingStatus } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const FREE_FEATURES = ["5 checks / month", "Text + document uploads", "PDF reports"];
const PRO_FEATURES = ["200 checks / month", "Bulk upload (up to 10 files)", "Everything in Free"];

export default function UpgradePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<"free" | "pro" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const token = localStorage.getItem("credence_token");
    if (!token) return;

    getBillingStatus(token)
      .then((status) => setPlan(status.plan))
      .catch(() => setPlan(null));
  }, [user, router, authLoading]);

  async function handleUpgrade() {
    const token = localStorage.getItem("credence_token");
    if (!token || !user) return;
    setError(null);
    setLoading(true);
    try {
      const order = await createProOrder(token);
      const razorpay = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: "Credence",
        description: "Upgrade to Pro plan",
        prefill: { email: user.email },
        theme: { color: "#a9790c" },
        handler: function () {
          // the actual plan upgrade happens server-side via the verified
          // webhook, not here - this just tells the user what to expect
          setPaymentSubmitted(true);
        },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout");
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col items-center gap-10 px-6 py-16">
      <div className="text-center">
        <p className="kicker mb-2 text-accent">Billing & Plans</p>
        <h1 className="font-serif text-4xl font-semibold text-ink sm:text-5xl">Choose your plan</h1>
        <p className="mt-3 text-sm text-ink-soft sm:text-base">Upgrade to unlock bulk checking and higher limits.</p>
      </div>

      {plan === "pro" ? (
        <div className="surface-card flex w-full max-w-md items-start gap-4 border-accent bg-accent-soft p-8">
          <Crown size={24} className="mt-0.5 shrink-0 text-accent-ink" />
          <div>
            <p className="text-lg font-semibold text-accent-ink">You're on the Pro plan.</p>
            <p className="mt-2 text-sm text-ink-soft">Your account has unlocked bulk uploads and 200 checks per month.</p>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-6 md:flex-row md:items-stretch lg:gap-8">
          <div className="surface-card flex flex-1 flex-col p-8 sm:p-10">
            <p className="font-serif text-2xl font-semibold text-ink">Free</p>
            <p className="mt-2 text-sm text-ink-soft">For occasional checks</p>
            <p className="my-6 text-3xl font-semibold text-ink">₹0<span className="text-sm font-normal text-ink-soft">/month</span></p>
            
            <ul className="flex flex-1 flex-col gap-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-ink-soft">
                  <Check size={16} className="shrink-0 text-ink-faint" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-md bg-surface-2 px-6 py-3 text-center text-sm font-medium text-ink-soft">
              Current plan
            </div>
          </div>

          <div className="surface-card relative flex flex-1 flex-col border-accent p-8 shadow-[0_8px_30px_rgba(200,160,50,0.15)] sm:p-10">
            <div className="absolute top-0 right-0 rounded-bl-lg bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-paper">
              Recommended
            </div>
            <p className="font-serif text-2xl font-semibold text-ink">Pro</p>
            <p className="mt-2 text-sm text-ink-soft">For professionals & educators</p>
            <p className="my-6 text-3xl font-semibold text-ink">₹499<span className="text-sm font-normal text-ink-soft">/month</span></p>

            <ul className="flex flex-1 flex-col gap-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-ink-soft">
                  <CheckCircle2 size={16} className="shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            
            {paymentSubmitted ? (
              <p className="mt-8 rounded-md bg-good-soft px-3 py-2 text-sm text-good text-center">
                Payment processing. Refresh this page in a few seconds.
              </p>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-md bg-ink px-6 py-3 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <CreditCard size={16} />
                {loading ? "Starting checkout..." : "Upgrade to Pro"}
              </button>
            )}
            {error && <p className="mt-3 rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
          </div>
        </div>
      )}
    </main>
  );
}

