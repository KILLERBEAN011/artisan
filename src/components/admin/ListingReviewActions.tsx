"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";

const QUICK_REASONS = [
  "Photos are blurry, dark or too few. Please add at least 3 clear photos.",
  "The description is missing important details (size, material, what's included).",
  "We need proof this branded item is genuine (receipt or invoice).",
  "This item isn't allowed on NaijaCraft.",
  "The price looks wrong. Please check it.",
];

type Props = {
  productId: string;
  status: "pending_review" | "live" | "rejected" | "archived";
  isFeatured: boolean;
};

export function ListingReviewActions({ productId, status, isFeatured }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function send(
    action: string,
    url: string,
    method: "POST" | "PATCH",
    body: object,
  ) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setRejecting(false);
      setReason("");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  const review = (action: "approve" | "reject") =>
    send(
      action,
      `/api/admin/products/${productId}/review`,
      "POST",
      action === "reject" ? { action, reason } : { action },
    );

  const patch = (action: string, body: object) =>
    send(action, `/api/products/${productId}`, "PATCH", body);

  const loading = busy !== null || isPending;
  const btn =
    "flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-60";
  const spinner = (
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
  );

  if (rejecting) {
    return (
      <div className="flex w-full flex-col gap-2">
        <label
          htmlFor={`reason-${productId}`}
          className="text-sm font-semibold text-navy-900"
        >
          Why are you rejecting it? The seller will see this.
        </label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className="rounded-full bg-cloud-100 px-3 py-1 text-left text-xs text-ink-700 hover:bg-cloud-200"
            >
              {r.split(".")[0]}
            </button>
          ))}
        </div>
        <textarea
          id={`reason-${productId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-cloud-200 p-2 text-sm focus:border-brand-green-600 focus:outline-none"
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setRejecting(false)}
            className={`${btn} text-ink-700 hover:bg-cloud-100`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || !reason.trim()}
            onClick={() => review("reject")}
            className={`${btn} bg-red-700 text-white hover:bg-red-800`}
          >
            {busy === "reject" ? (
              spinner
            ) : (
              <X className="h-4 w-4" aria-hidden="true" />
            )}
            Reject listing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {(status === "pending_review" || status === "rejected") && (
          <>
            {status === "pending_review" && (
              <button
                type="button"
                disabled={loading}
                onClick={() => setRejecting(true)}
                className={`${btn} border border-cloud-200 text-ink-700 hover:bg-cloud-100`}
              >
                Reject
              </button>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={() => review("approve")}
              className={`${btn} bg-brand-green-600 text-white hover:bg-brand-green-700`}
            >
              {busy === "approve" ? (
                spinner
              ) : (
                <Check className="h-4 w-4" aria-hidden="true" />
              )}
              {status === "rejected" ? "Approve anyway" : "Approve"}
            </button>
          </>
        )}

        {status === "live" && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => patch("feature", { isFeatured: !isFeatured })}
              className={`${btn} border border-cloud-200 text-ink-700 hover:bg-cloud-100`}
            >
              {busy === "feature" && spinner}
              {isFeatured ? "Unfeature" : "Feature"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (
                  confirm(
                    "Hide this listing from the marketplace? The seller can see it was hidden.",
                  )
                ) {
                  patch("hide", { status: "archived" });
                }
              }}
              className={`${btn} border border-cloud-200 text-red-700 hover:bg-red-50`}
            >
              {busy === "hide" && spinner}
              Hide
            </button>
          </>
        )}

        {status === "archived" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => patch("restore", { status: "live" })}
            className={`${btn} bg-brand-green-600 text-white hover:bg-brand-green-700`}
          >
            {busy === "restore" && spinner}
            Put back live
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
