"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Check, Send } from "lucide-react";

type Props = {
  artisanId: string;
  serviceTitle: string;
  className?: string;
};

export function RequestQuoteButton({ artisanId, serviceTitle, className }: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleRequestQuote() {
    if (!session) {
      router.push("/login");
      return;
    }

    setStatus("loading");
    setError(null);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artisanId, title: serviceTitle }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong requesting this quote.");
      setStatus("error");
      return;
    }

    setStatus("success");
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={handleRequestQuote}
        disabled={status === "loading" || status === "success"}
        className={
          className ??
          "flex items-center justify-center gap-2 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-70"
        }
      >
        {status === "success" ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Quote Requested
          </>
        ) : (
          <>
            <Send className="h-3.5 w-3.5" />
            {status === "loading" ? "Sending..." : "Request Quote"}
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
