"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Send } from "lucide-react";

type Props = {
  bookingId: string;
  viewerRole: "customer" | "artisan";
  status: string;
  amountNaira: number;
};

export function QuoteActions({ bookingId, viewerRole, status, amountNaira }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patchBooking(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }

    // Re-fetch server-rendered content so the status badge, amount, and this
    // panel all reflect the new state.
    router.refresh();
  }

  async function handleSendQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    await patchBooking({ action: "send-quote", amountNaira: Number(amount) });
  }

  async function handleAcceptQuote() {
    await patchBooking({ action: "accept-quote" });
  }

  // Artisan, job still needs a price set.
  if (viewerRole === "artisan" && status === "awaiting-quote") {
    return (
      <div className="mb-4 rounded-2xl border border-cloud-200 bg-white p-4">
        <h2 className="font-display text-sm font-bold text-navy-900">Send a quote</h2>
        <p className="mt-1 text-sm text-ink-500">
          Set a price for this job. The customer will be able to accept it once sent.
        </p>
        <form onSubmit={handleSendQuote} className="mt-3 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            <span className="text-sm text-ink-700">NGN</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 15000"
              className="w-32 rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            {loading ? "Sending..." : "Send Quote"}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // Customer, a quote is waiting for their response.
  if (viewerRole === "customer" && status === "quote-sent") {
    return (
      <div className="mb-4 rounded-2xl border border-brand-green-100 bg-brand-green-100/40 p-4">
        <h2 className="font-display text-sm font-bold text-navy-900">Quote received</h2>
        <p className="mt-1 font-display text-2xl font-bold text-brand-green-700">
          NGN {amountNaira.toLocaleString()}
        </p>
        <button
          type="button"
          onClick={handleAcceptQuote}
          disabled={loading}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
        >
          <Check className="h-3.5 w-3.5" />
          {loading ? "Accepting..." : "Accept Quote"}
        </button>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // Nothing actionable for this viewer/status combination — e.g. artisan
  // waiting on the customer to accept, or customer waiting on a quote.
  if (status === "quote-sent" && viewerRole === "artisan") {
    return (
      <p className="mb-4 text-sm text-ink-500">
        Quote sent — waiting on the customer to accept.
      </p>
    );
  }

  return null;
}
