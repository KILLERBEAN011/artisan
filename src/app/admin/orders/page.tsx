import Link from "next/link";
import { AlertTriangle, Banknote, MapPin, Phone } from "lucide-react";
import {
  ItemList,
  PayoutBreakdown,
  PayoutPill,
  StatusPill,
  fmtDate,
  naira,
  orderNo,
  type PlainOrder,
  type PlainShipment,
} from "@/components/marketplace/OrderParts";
import { ShipmentActions } from "@/components/marketplace/ShipmentActions";
import { connectToDatabase } from "@/lib/mongodb";
import { autoConfirmDue, bankDetailsFor, toPlain, type BankDetails } from "@/lib/orders";
import { Order } from "@/models/Order";

// Admins only: enforced by src/app/admin/layout.tsx
export const dynamic = "force-dynamic";

type Row = { order: PlainOrder; s: PlainShipment };

const TABS = [
  { key: "attention", label: "Needs attention" },
  { key: "payout", label: "To pay out" },
  { key: "active", label: "In progress" },
  { key: "done", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function tabOf({ order, s }: Row): TabKey[] {
  const tabs: TabKey[] = [];
  const open = ["paid", "dispatched", "disputed"].includes(s.status);
  if (s.status === "disputed" || order.paymentStatus === "amount_mismatch" || (order.stockIssue && open)) tabs.push("attention");
  if (s.payoutStatus === "released") tabs.push("payout");
  if (s.status === "paid" || s.status === "dispatched") tabs.push("active");
  if (s.status === "delivered") tabs.push("done");
  if (s.status === "cancelled") tabs.push("cancelled");
  return tabs;
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await connectToDatabase();
  await autoConfirmDue();

  const docs = await Order.find({ paymentStatus: { $in: ["paid", "amount_mismatch"] } })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  const orders = toPlain<PlainOrder[]>(docs);
  const rows: Row[] = orders.flatMap((order) => order.shipments.map((s) => ({ order, s })));

  const requested = (await searchParams).tab;
  const counts = Object.fromEntries(TABS.map((t) => [t.key, rows.filter((r) => tabOf(r).includes(t.key)).length])) as Record<TabKey, number>;
  const tab: TabKey =
    (TABS.find((t) => t.key === requested)?.key as TabKey | undefined) ??
    (counts.attention ? "attention" : counts.payout ? "payout" : "active");
  const shown = rows.filter((r) => tabOf(r).includes(tab));

  const sum = (pred: (r: Row) => boolean, pick: (r: Row) => number) => rows.filter(pred).reduce((n, r) => n + pick(r), 0);
  const held = sum((r) => r.s.payoutStatus === "held", (r) => r.s.sellerAmount);
  const toPay = sum((r) => r.s.payoutStatus === "released", (r) => r.s.sellerAmount);
  const commission = sum((r) => r.s.status === "delivered", (r) => r.s.commission);
  const storeSales = sum((r) => r.s.official && r.s.status === "delivered", (r) => r.s.itemsTotal + r.s.deliveryFee);

  const banks: Map<string, BankDetails> =
    tab === "payout" ? await bankDetailsFor([...new Set(shown.map((r) => r.s.sellerId))]) : new Map();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-navy-900">Marketplace Orders</h1>
      <p className="mt-1 text-sm text-ink-500">
        Each order is split by seller. Sellers mark their part as sent; buyers confirm delivery (or it&apos;s confirmed
        automatically). Then transfer the seller&apos;s money and press &ldquo;I&apos;ve paid the seller&rdquo;.
      </p>

      <section aria-label="Totals" className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Held for delivery" value={naira(held)} />
        <Stat label="To pay sellers" value={naira(toPay)} strong={toPay > 0} />
        <Stat label="Commission earned" value={naira(commission)} />
        <Stat label="Store sales delivered" value={naira(storeSales)} />
      </section>

      <nav aria-label="Order lists" className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t.key === tab;
          const n = counts[t.key];
          const urgent = (t.key === "attention" || t.key === "payout") && n > 0;
          return (
            <Link
              key={t.key}
              href={`/admin/orders?tab=${t.key}`}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
                active ? "bg-navy-900 text-white" : "bg-white text-ink-700 ring-1 ring-cloud-200 hover:bg-cloud-100"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/20" : urgent ? "bg-brand-amber-100 text-brand-amber-600" : "bg-cloud-100"}`}>
                {n}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 space-y-3">
        {shown.length === 0 ? (
          <p className="rounded-2xl border border-cloud-200 bg-white p-6 text-center text-sm text-ink-500">Nothing here.</p>
        ) : (
          shown.map((r) => <AdminOrderCard key={r.s._id} row={r} bank={banks.get(r.s.sellerId)} />)
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${strong ? "border-brand-amber-500 bg-brand-amber-100/50" : "border-cloud-200 bg-white"}`}>
      <p className="text-xs font-semibold text-ink-500">{label}</p>
      <p className="mt-1 font-display text-xl font-extrabold text-navy-900">{value}</p>
    </div>
  );
}

function AdminOrderCard({ row: { order: o, s }, bank }: { row: Row; bank?: BankDetails }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-cloud-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-display font-bold text-navy-900">
            Order {orderNo(o._id)} · {s.sellerName}
            {s.official && <span className="ml-2 rounded-md bg-navy-900 px-1.5 py-0.5 text-[10px] font-bold text-white">STORE</span>}
          </p>
          <p className="text-xs text-ink-500">
            Paid {fmtDate(o.paidAt || o.createdAt)} · Buyer {o.buyerName} ({o.buyerEmail}) · Ref {o.paystackReference}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusPill status={s.status} />
          <PayoutPill status={s.payoutStatus} />
        </div>
      </div>

      {o.paymentStatus === "amount_mismatch" && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Payment amount didn&apos;t match. {o.adminNote} Check it in Paystack before doing anything else.</span>
        </p>
      )}
      {o.stockIssue && ["paid", "dispatched"].includes(s.status) && (
        <p className="flex items-start gap-2 rounded-lg bg-brand-amber-100/60 p-3 text-sm text-[#7a4a06]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>An item sold out while this buyer was paying. Check the seller can still supply it, or cancel and refund.</span>
        </p>
      )}
      {s.status === "disputed" && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Buyer reported on {fmtDate(s.dispute?.openedAt)}: &ldquo;{s.dispute?.reason}&rdquo;. Contact both sides, then close it
            (pay the seller) or cancel and refund.
          </span>
        </p>
      )}

      <ItemList items={o.items.filter((i) => i.sellerId === s.sellerId)} />

      <div className="grid gap-2 rounded-xl border border-cloud-200 p-3 text-sm sm:grid-cols-2">
        <p className="flex items-start gap-2 sm:col-span-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
          {o.deliveryAddress}
          {o.deliveryState ? `, ${o.deliveryState}` : ""} · {s.deliveryLabel}
          {s.deliveryFee ? ` (${naira(s.deliveryFee)})` : ""}
        </p>
        <a href={`tel:${o.buyerPhone}`} className="flex items-center gap-2 font-medium text-brand-green-600 hover:underline">
          <Phone className="h-4 w-4" aria-hidden="true" /> {o.buyerPhone}
        </a>
        {s.dispatchNote && <p className="text-ink-700">Seller note: {s.dispatchNote}</p>}
      </div>

      {s.payoutStatus === "released" && (
        <div className="flex items-start gap-2 rounded-xl bg-brand-green-100/60 p-3 text-sm">
          <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-700" aria-hidden="true" />
          {bank?.accountNumber ? (
            <span>
              Transfer <strong>{naira(s.sellerAmount)}</strong> to <strong>{bank.bankName}</strong> · {bank.accountNumber} ·{" "}
              {bank.accountName}
            </span>
          ) : (
            <span className="text-brand-amber-600">
              This seller hasn&apos;t added bank details yet. Ask them to add them before paying out.
            </span>
          )}
        </div>
      )}
      {s.payoutStatus === "paid_out" && (
        <p className="text-xs text-ink-500">
          Paid out {fmtDate(s.paidOutAt)}
          {s.payoutNote ? ` · ${s.payoutNote}` : ""}
        </p>
      )}

      <PayoutBreakdown s={s} />

      <ShipmentActions
        orderId={o._id}
        shipmentId={s._id}
        status={s.status}
        payoutStatus={s.payoutStatus}
        official={s.official}
        mode="admin"
        deliveryMethod={s.deliveryMethod}
      />
    </article>
  );
}
