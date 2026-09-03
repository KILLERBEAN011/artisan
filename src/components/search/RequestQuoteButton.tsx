"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Send, X } from "lucide-react";

type Props = {
  artisanId: string;
  serviceTitle: string;
  className?: string;
};

export function RequestQuoteButton({
  artisanId,
  serviceTitle,
  className,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Check Auth before opening the modal
  function handleButtonClick() {
    if (!session) {
      router.push("/login");
      return;
    }
    setIsOpen(true);
  }

  // 2. Submit the message to the backend
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!message.trim()) {
      setError("Please describe what you need done.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Passing both the title (from your old code) and the new initialMessage
        body: JSON.stringify({
          artisanId,
          title: serviceTitle,
          initialMessage: message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Something went wrong requesting this quote.",
        );
      }

      // 3. Redirect directly to the new chat room!
      router.push(`/bookings/${data.booking._id}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        className={
          className ??
          "flex items-center justify-center gap-2 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700"
        }
      >
        <Send className="h-3.5 w-3.5" />
        Request Quote
      </button>

      {/* The Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-navy-900">
                Request Quote
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-ink-500 transition-colors hover:text-navy-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-ink-600">
              You are requesting a quote for:{" "}
              <span className="font-semibold text-navy-900">
                {serviceTitle}
              </span>
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900">
                  Job Description
                </span>
                <textarea
                  rows={4}
                  required
                  placeholder="E.g., I need a 2-bedroom apartment painted this weekend."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
                />
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 rounded-lg border border-cloud-200 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-cloud-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-brand-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
