import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { AlertTriangle, Clock, MapPin, MessageCircle, Package, Phone } from "lucide-react";
import {
  ItemList,
  PayoutBreakdown,
  PayoutPill,
  StatusPill,
  Timeline,
  fmtDate,
  naira,
  orderNo,
  type PlainOrder,
  type PlainShipment,
} from "@/components/marketplace/OrderParts";
import { NotASellerYet, SellerPageShell } from "@/components/marketplace/SellerPageShell";
import { ShipmentActions } from "@/components/marketplace/ShipmentActions";
import { COMMISSION_RATE } from "@/lib/marketplace-config";
import { sellerEarnings, toPlain } from "@/lib/orders";
import { getSellerContext } from "@/lib/seller";
import { Order } from "@/models/Order";

export const metadata: Metadata = { title: "Shop orders" };
export const dynamic = "force-dynamic";

const TABS = [
  { key: "to_send", label: "To send", statuses: ["paid"] },
  { key: "sent", label: "Sent", statuses: ["dispatched"] },
  { key: "problems", label: "Problems", statuses: ["disputed"] },
  { key: "done", label: "Completed", statuses: ["delivered"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
] as const;

export default async function SellerOrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await getSellerContext("/dashboard/sales");
  if (ctx.admin) redirect("/admin/orders");
  if (!ctx.allowed) {
    return (
      <SellerPageShell ctx={ctx} activeHref="/dashboard/sales">
        <NotASellerYet status={ctx.user.seller?.status} />
      </SellerPageShell>
    );
  }

  const me = String(ctx.user._id);
  const earnings = await sellerEarnings(me); // also runs automatic confirmations
  const docs = await Order.find({ "shipments.sellerId": new mongoose.Types.ObjectId(me), paymentStatus: "paid" })
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();
  const orders = toPlain<PlainOrder[]>(docs);

  // One row per order, showing only my part
  const rows = orders.flatMap((o) =>
    o.shipments.filter((s) => s.sellerId === me).map((s) => ({ order: o, s })),
  );
  const count = (statuses: readonly string[]) => rows.filter((r) => statuses.includes(r.s.status)).length;

  const tabParam = (await searchParams).tab;
  const tab = TABS.find((t) => t.key === tabParam) ?? TABS[0];
  const shown = rows.filter((r) => (tab.statuses as readonly string[]).includes(r.s.status));

  return (
    <SellerPageShell ctx={ctx} activeHref="/dashboard/sales">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Shop orders</h1>
          <p className="mt-1 text-sm text-ink-500">
            Send each order, then press &ldquo;Mark as sent&rdquo;. You&apos;re paid after the buyer confirms delivery.
            NaijaCraft keeps {Math.round(COMMISSION_RATE * 100)}% of the item price; delivery fees are all yours.
          </p>
        </div>
        <Link href={ctx.listingsHref} className="text-sm font-semibold text-brand-green-600 hover:underline">
          My listings
        </Link>
      </div>

      <section aria-label="Your money" className="mt-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Held until delivery" value={naira(earnings.held)} hint="Buyers have paid; waiting for delivery" />
        <Stat label="Ready to pay out" value={naira(earnings.available)} hint="We transfer this to your bank" strong />
        <Stat label="Paid to you" value={naira(earnings.paidOut)} hint="Already sent to your bank" />
      </section>

      <nav aria-label="Order status" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = t.key === tab.key;
          const n = count(t.statuses);
          return (
            <Link
              key={t.key}
              href={`/dashboard/sales?tab=${t.key}`}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ${
                active ? "bg-navy-900 text-white" : "bg-white text-ink-700 ring-1 ring-cloud-200 hover:bg-cloud-100"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  active ? "text-white/80" : (t.key === "to_send" || t.key === "problems") && n > 0 ? "bg-brand-amber-100 text-[#7a4a06]" : "text-ink-500"
                }`}
              >
                {n}
              </span>
            </Link>
          );
        })}
      </nav>

      {shown.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-cloud-200 bg-white px-6 py-14 text-center">
          <Package className="h-9 w-9 text-ink-300" aria-hidden="true" />
          <p className="font-semibold text-navy-900">
            {tab.key === "to_send" ? "Nothing to send right now" : "Nothing here"}
          </p>
          {rows.length === 0 && (
            <p className="max-w-sm text-sm text-ink-500">
              When someone buys from you, the order appears here and we email you.
            </p>
          )}
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {shown.map(({ order: o, s }) => (
            <li key={s._id}>
              <SellerOrderCard o={o} s={s} />
            </li>
          ))}
        </ul>
      )}
    </SellerPageShell>
  );
}

function Stat({ label, value, hint, strong }: { label: string; value: string; hint: string; strong?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${strong ? "border-brand-green-600 bg-brand-green-100/40" : "border-cloud-200 bg-white"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold text-navy-900">{value}</p>
      <p className="text-xs text-ink-500">{hint}</p>
    </div>
  );
}

function SellerOrderCard({ o, s }: { o: PlainOrder; s: PlainShipment }) {
  const phoneDigits = o.buyerPhone.replace(/\D/g, "");
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-cloud-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display font-bold text-navy-900">
            Order {orderNo(o._id)} · {o.buyerName}
          </p>
          <p className="text-xs text-ink-500">Paid {fmtDate(o.paidAt || o.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusPill status={s.status} />
          <PayoutPill status={s.payoutStatus} />
        </div>
      </div>

      <ItemList items={o.items.filter((i) => i.sellerId === s.sellerId)} />

      {/* Where to send it (only shown while there's something to deliver) */}
      {["paid", "dispatched", "disputed"].includes(s.status) && (
        <div className="grid gap-2 rounded-xl border border-cloud-200 p-3 text-sm sm:grid-cols-2">
          <p className="flex items-start gap-2 sm:col-span-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
            <span>
              {o.deliveryAddress}
              {o.deliveryState ? `, ${o.deliveryState}` : ""}
            </span>
          </p>
          <a href={`tel:+${phoneDigits}`} className="flex items-center gap-2 font-medium text-brand-green-600 hover:underline">
            <Phone className="h-4 w-4" aria-hidden="true" /> {o.buyerPhone}
          </a>
          <a
            href={`https://wa.me/${phoneDigits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-medium text-brand-green-600 hover:underline"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp the buyer
          </a>
          <p className="text-ink-700 sm:col-span-2">
            <strong>Delivery:</strong> {s.deliveryLabel}
            {s.deliveryFee ? ` (${naira(s.deliveryFee)} paid to you)` : ""}
          </p>
        </div>
      )}

      <Timeline s={s} />

      {s.status === "dispatched" && s.autoConfirmAt && (
        <p className="flex items-center gap-1.5 text-xs text-ink-500">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          If the buyer doesn&apos;t respond, this counts as delivered on {fmtDate(s.autoConfirmAt)}.
        </p>
      )}
      {s.status === "disputed" && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            The buyer reported: &ldquo;{s.dispute?.reason}&rdquo;. Your payment is on hold while our team sorts it out.
          </span>
        </p>
      )}
      {s.status === "cancelled" && s.cancelReason && (
        <p className="rounded-lg bg-cloud-50 p-3 text-sm text-ink-700">Cancelled: {s.cancelReason}</p>
      )}
      {s.payoutStatus === "paid_out" && (
        <p className="text-xs text-ink-500">
          Paid to your bank on {fmtDate(s.paidOutAt)}
          {s.payoutNote ? ` · ${s.payoutNote}` : ""}
        </p>
      )}

      <PayoutBreakdown s={s} />

      <ShipmentActions
        orderId={o._id}
        shipmentId={s._id}
        status={s.status}
        payoutStatus={s.payoutStatus}
        mode="seller"
        deliveryMethod={s.deliveryMethod}
      />
    </article>
  );
}
