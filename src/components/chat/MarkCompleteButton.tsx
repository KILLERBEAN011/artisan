"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

type Props = {
  bookingId: string;
  viewerRole: "customer" | "artisan";
  status: string;
  escrowFunded: boolean;
};

export function MarkCompleteButton({ bookingId, viewerRole, status, escrowFunded }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only relevant once the job is scheduled and actually paid for.
  if (status !== "scheduled" || !escrowFunded) return null;

  if (viewerRole !== "customer") {
    return (
      <p className="mb-4 text-sm text-ink-500">Waiting on the customer to confirm completion.</p>
    );
  }

  async function handleMarkComplete() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-complete" }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mb-4 rounded-2xl border border-cloud-200 bg-white p-4">
      <h2 className="font-display text-sm font-bold text-navy-900">Job done?</h2>
      <p className="mt-1 text-sm text-ink-500">
        Once you confirm the job is complete, the artisan becomes eligible for payout.
      </p>
      <button
        type="button"
        onClick={handleMarkComplete}
        disabled={loading}
        className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {loading ? "Marking complete..." : "Mark Job Complete"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
