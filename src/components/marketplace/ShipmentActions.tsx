"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, Check, Loader2, Send } from "lucide-react";
import { DISPUTE_REASONS } from "@/lib/marketplace-config";

type Mode = "buyer" | "seller" | "admin";

type Props = {
  orderId: string;
  shipmentId: string;
  status: string;
  payoutStatus: string;
  official?: boolean;
  mode: Mode;
  deliveryMethod?: string;
};

/** The buttons for one seller's part of an order, depending on who is looking. */
export function ShipmentActions({ orderId, shipmentId, status, payoutStatus, official, mode, deliveryMethod }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState<null | "dispatch" | "dispute" | "refund" | "mark_paid_out" | "resolve_release">(null);
  const [text, setText] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function act(action: string, note?: string) {
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/shipments/${shipmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setForm(null);
      setText("");
      setMessage({ ok: true, text: data.message || "Done." });
      startTransition(() => router.refresh());
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Something went wrong." });
    } finally {
      setBusy(null);
    }
  }

  const btn = "flex h-11 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-60";
  const primary = `${btn} bg-brand-green-600 text-white hover:bg-brand-green-700`;
  const outline = `${btn} border border-cloud-200 bg-white text-navy-900 hover:bg-cloud-50`;
  const danger = `${btn} border border-red-200 bg-white text-red-700 hover:bg-red-50`;
  const spin = <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />;

  // ---- Forms that need a note ----
  if (form) {
    const config = {
      dispatch: {
        label: deliveryMethod === "pickup" ? "Pickup details (where and when)" : "Delivery note (optional): courier, waybill number, rider's phone…",
        placeholder: deliveryMethod === "pickup" ? "e.g. Ready at UI second gate, 2–6pm" : "e.g. Sent with GIG, waybill 12345",
        submit: "Mark as sent",
        required: deliveryMethod === "pickup",
        quick: [] as string[],
      },
      dispute: {
        label: "What went wrong? The seller and our team will see this.",
        placeholder: "Tell us what happened",
        submit: "Report problem",
        required: true,
        quick: DISPUTE_REASONS,
      },
      refund: {
        label: "Reason for cancelling and refunding (the buyer and seller will see it)",
        placeholder: "e.g. Seller couldn't supply the item",
        submit: "Cancel and refund",
        required: true,
        quick: ["Seller couldn't supply the item", "Item not delivered", "Not as described"],
      },
      mark_paid_out: {
        label: "Transfer reference (optional, shown to the seller)",
        placeholder: "e.g. GTB transfer 0123456789",
        submit: "Mark as paid",
        required: false,
        quick: [] as string[],
      },
      resolve_release: {
        label: "How was it resolved? (optional)",
        placeholder: "e.g. Buyer received the item after a delay",
        submit: "Close and pay seller",
        required: false,
        quick: [] as string[],
      },
    }[form];

    return (
      <div className="flex w-full flex-col gap-2">
        <label htmlFor={`note-${shipmentId}`} className="text-sm font-semibold text-navy-900">
          {config.label}
        </label>
        {config.quick.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {config.quick.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setText((t) => (t ? t : q + ". "))}
                className="rounded-full bg-cloud-100 px-3 py-1 text-xs text-ink-700 hover:bg-cloud-200"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <textarea
          id={`note-${shipmentId}`}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={config.placeholder}
          className="w-full rounded-lg border border-cloud-200 p-2.5 text-sm focus:border-brand-green-600 focus:outline-none"
        />
        {form === "refund" && (
          <p className="text-xs text-ink-500">
            This cancels this seller&apos;s part and puts the items back in stock. Then refund the buyer in your Paystack
            dashboard (Transactions → this payment → Refund).
          </p>
        )}
        {message && !message.ok && <p className="text-sm text-red-700">{message.text}</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setForm(null)} className={outline}>
            Back
          </button>
          <button
            type="button"
            disabled={busy !== null || (config.required && text.trim().length < (form === "dispute" ? 10 : 3))}
            onClick={() => act(form, text)}
            className={form === "refund" || form === "dispute" ? `${btn} bg-red-700 text-white hover:bg-red-800` : primary}
          >
            {busy === form && spin}
            {config.submit}
          </button>
        </div>
      </div>
    );
  }

  // ---- Buttons ----
  const buttons: React.ReactNode[] = [];

  if (mode === "buyer") {
    if (status === "paid" || status === "dispatched") {
      buttons.push(
        <button key="confirm" type="button" disabled={busy !== null} onClick={() => act("confirm")} className={primary}>
          {busy === "confirm" ? spin : <Check className="h-4 w-4" aria-hidden="true" />}I received it
        </button>,
        <button key="dispute" type="button" disabled={busy !== null} onClick={() => setForm("dispute")} className={outline}>
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Report a problem
        </button>,
      );
    }
  }

  if (mode === "seller" || (mode === "admin" && official)) {
    if (status === "paid") {
      buttons.push(
        <button key="dispatch" type="button" disabled={busy !== null} onClick={() => setForm("dispatch")} className={primary}>
          <Send className="h-4 w-4" aria-hidden="true" />
          {deliveryMethod === "pickup" ? "Ready for pickup" : "Mark as sent"}
        </button>,
      );
    }
  }

  if (mode === "admin") {
    if (status === "disputed") {
      buttons.push(
        <button key="release" type="button" disabled={busy !== null} onClick={() => setForm("resolve_release")} className={primary}>
          Close dispute, pay seller
        </button>,
      );
    }
    if (status === "paid" || status === "dispatched") {
      buttons.push(
        <button key="aconfirm" type="button" disabled={busy !== null} onClick={() => act("confirm")} className={outline}>
          {busy === "confirm" && spin}
          Confirm delivery
        </button>,
      );
    }
    if (status === "paid" || status === "dispatched" || status === "disputed") {
      buttons.push(
        <button key="refund" type="button" disabled={busy !== null} onClick={() => setForm("refund")} className={danger}>
          Cancel &amp; refund
        </button>,
      );
    }
    if (payoutStatus === "released") {
      buttons.push(
        <button key="paid" type="button" disabled={busy !== null} onClick={() => setForm("mark_paid_out")} className={primary}>
          I&apos;ve paid the seller
        </button>,
      );
    }
  }

  if (buttons.length === 0 && !message) return null;

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      {buttons.length > 0 && <div className="flex flex-wrap gap-2 sm:justify-end">{buttons}</div>}
      {message && <p className={`text-sm ${message.ok ? "text-brand-green-700" : "text-red-700"}`}>{message.text}</p>}
    </div>
  );
}
