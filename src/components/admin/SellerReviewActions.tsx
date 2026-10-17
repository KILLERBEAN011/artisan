"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";

const REJECT_REASONS = [
  "The ID photo is blurry or cut off. Please upload a clear photo with all four corners.",
  "The name on your ID doesn't match your account name.",
  "The bank account name doesn't match your ID.",
  "Please tell us more about what you sell and where you get it.",
];

const SUSPEND_REASONS = [
  "Selling fake or replica items.",
  "Asking buyers to pay outside NaijaCraft.",
  "Repeated complaints about orders not delivered.",
];

type Props = { sellerId: string; status: "pending" | "approved" | "rejected" | "suspended" };

export function SellerReviewActions({ sellerId, status }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [mode, setMode] = useState<"reject" | "suspend" | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function act(action: string, body: object = {}) {
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...body }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMode(null);
      setReason("");
      setMessage({ ok: true, text: data.message || "Done." });
      startTransition(() => router.refresh());
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusy(null);
    }
  }

  const btn = "flex h-10 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-60";
  const spin = <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />;

  if (mode) {
    const quick = mode === "reject" ? REJECT_REASONS : SUSPEND_REASONS;
    return (
      <div className="flex w-full flex-col gap-2">
        <label htmlFor={`sr-${sellerId}`} className="text-sm font-semibold text-navy-900">
          {mode === "reject" ? "What should they fix?" : "Why are you suspending this shop?"} They&apos;ll get this by email.
        </label>
        <div className="flex flex-wrap gap-1.5">
          {quick.map((r) => (
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
          id={`sr-${sellerId}`}
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-cloud-200 p-2 text-sm focus:border-brand-green-600 focus:outline-none"
        />
        {mode === "suspend" && (
          <p className="text-xs text-ink-500">Suspending also hides all of this seller&apos;s live listings.</p>
        )}
        {message && !message.ok && <p className="text-sm text-red-700">{message.text}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setMode(null)} className={`${btn} text-ink-700 hover:bg-cloud-100`}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy !== null || !reason.trim()}
            onClick={() => act(mode, { reason })}
            className={`${btn} bg-red-700 text-white hover:bg-red-800`}
          >
            {busy === mode && spin}
            {mode === "reject" ? "Reject application" : "Suspend shop"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-2">
        {status === "pending" && (
          <button type="button" disabled={busy !== null} onClick={() => setMode("reject")} className={`${btn} border border-cloud-200 text-ink-700 hover:bg-cloud-100`}>
            Reject
          </button>
        )}
        {(status === "pending" || status === "rejected") && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => act("approve")}
            className={`${btn} bg-brand-green-600 text-white hover:bg-brand-green-700`}
          >
            {busy === "approve" ? spin : <Check className="h-4 w-4" aria-hidden="true" />}
            {status === "rejected" ? "Approve anyway" : "Approve seller"}
          </button>
        )}
        {status === "approved" && (
          <button type="button" disabled={busy !== null} onClick={() => setMode("suspend")} className={`${btn} border border-cloud-200 text-red-700 hover:bg-red-50`}>
            Suspend
          </button>
        )}
        {status === "suspended" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => act("reinstate")}
            className={`${btn} bg-brand-green-600 text-white hover:bg-brand-green-700`}
          >
            {busy === "reinstate" && spin}
            Reinstate
          </button>
        )}
      </div>
      {message && <p className={`text-sm ${message.ok ? "text-brand-green-700" : "text-red-700"}`}>{message.text}</p>}
    </div>
  );
}
