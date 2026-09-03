"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AvailabilityToggle({
  initialStatus,
}: {
  initialStatus: boolean;
}) {
  const router = useRouter();
  const [isAvailable, setIsAvailable] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  async function handleToggle(newStatus: boolean) {
    if (newStatus === isAvailable) return;
    setLoading(true);

    try {
      const res = await fetch("/api/artisans/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setIsAvailable(newStatus);
      router.refresh(); // Refresh to ensure the rest of the app syncs up
    } catch (error) {
      console.error(error);
      alert("Could not update availability. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        onClick={() => handleToggle(true)}
        disabled={loading}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          isAvailable
            ? "bg-brand-green-600 text-white shadow-sm"
            : "border border-cloud-200 text-navy-900 hover:bg-cloud-50"
        }`}
      >
        {loading && isAvailable ? "Updating..." : "Active / Open for Jobs"}
      </button>
      <button
        type="button"
        onClick={() => handleToggle(false)}
        disabled={loading}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          !isAvailable
            ? "bg-red-600 text-white shadow-sm"
            : "border border-cloud-200 text-navy-900 hover:bg-cloud-50"
        }`}
      >
        {loading && !isAvailable ? "Updating..." : "Busy"}
      </button>
    </div>
  );
}
