"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote } from "lucide-react";

export function ReleaseFundsButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRelease() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "release-funds" }),
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
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleRelease}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-brand-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
      >
        <Banknote className="h-3.5 w-3.5" />
        {loading ? "Releasing..." : "Release Funds"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
