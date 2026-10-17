"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Pencil, Send, Trash2 } from "lucide-react";
import type { ProductStatus } from "@/lib/product-options";

type Props = { productId: string; slug: string; status: ProductStatus };

/** Edit / submit / hide / delete buttons on a seller's own listing. */
export function SellerListingActions({ productId, slug, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function call(action: string, init: RequestInit, url = `/api/products/${productId}`) {
    setBusy(action);
    try {
      const res = await fetch(url, init);
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      toast.success(data.message || "Done.");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  const patch = (action: string, body: object) =>
    call(action, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  const btn =
    "flex h-10 flex-1 items-center justify-center gap-1.5 px-2 text-xs font-semibold transition-colors disabled:opacity-50";
  const spin = <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />;

  return (
    <div className="flex divide-x divide-cloud-200 border-t border-cloud-200 bg-cloud-50/60">
      <Link href={`/dashboard/products/${productId}/edit`} className={`${btn} text-navy-900 hover:bg-white`}>
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        Edit
      </Link>

      {(status === "draft" || status === "rejected") && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => patch("submit", { submit: true })}
          className={`${btn} text-brand-green-700 hover:bg-white`}
        >
          {busy === "submit" ? spin : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
          Submit
        </button>
      )}

      {status === "live" && (
        <>
          <Link href={`/marketplace/${slug}`} target="_blank" className={`${btn} text-navy-900 hover:bg-white`}>
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            View
          </Link>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => patch("hide", { archive: true })}
            className={`${btn} text-ink-700 hover:bg-white`}
          >
            {busy === "hide" ? spin : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
            Hide
          </button>
        </>
      )}

      {status === "archived" && (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => patch("unhide", { unarchive: true })}
          className={`${btn} text-brand-green-700 hover:bg-white`}
        >
          {busy === "unhide" ? spin : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
          Show again
        </button>
      )}

      <button
        type="button"
        disabled={busy !== null}
        onClick={() => {
          if (confirm("Delete this listing? This can't be undone.")) {
            call("delete", { method: "DELETE" });
          }
        }}
        className={`${btn} text-red-700 hover:bg-red-50`}
      >
        {busy === "delete" ? spin : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
        Delete
      </button>
    </div>
  );
}
