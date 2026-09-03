"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, X } from "lucide-react";

type Props = {
  bookingId: string;
  onClose: () => void;
};

export function ReviewModal({ bookingId, onClose }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, review }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");

      router.refresh();
      onClose();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-navy-900">
            Rate your experience
          </h2>
          <button
            onClick={onClose}
            className="text-ink-500 hover:text-navy-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    (hoverRating || rating) >= star
                      ? "fill-brand-amber-500 text-brand-amber-500"
                      : "text-cloud-300"
                  }`}
                />
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900">
              Review (Optional)
            </span>
            <textarea
              rows={3}
              placeholder="How was the service? Were they prompt and professional?"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="resize-none rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-cloud-200 py-2.5 text-sm font-semibold text-ink-700 hover:bg-cloud-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-brand-green-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-700 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
