"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ReviewModal } from "@/components/shared/ReviewModal";

export function LeaveReviewButton({ bookingId }: { bookingId: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-brand-green-100 px-4 py-2 text-sm font-semibold text-brand-green-700 transition-colors hover:bg-brand-green-200"
      >
        <Star className="h-4 w-4" />
        Leave a Review
      </button>

      {isModalOpen && (
        <ReviewModal
          bookingId={bookingId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
