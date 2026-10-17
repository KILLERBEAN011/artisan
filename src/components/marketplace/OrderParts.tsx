import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { PAYOUT_STATUS_LABELS, SHIPMENT_STATUS_LABELS } from "@/lib/marketplace-config";

/* Shared, display-only pieces for buyer, seller and admin order pages. */

export type PlainItem = {
  _id: string;
  productId: string;
  sellerId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug?: string;
  options?: { name: string; value: string }[];
};

export type PlainShipment = {
  _id: string;
  sellerId: string;
  sellerName: string;
  official: boolean;
  itemsTotal: number;
  deliveryMethod: string;
  deliveryLabel: string;
  deliveryFee: number;
  deliveryNote?: string;
  status: string;
  dispatchNote?: string;
  dispatchedAt?: string;
  autoConfirmAt?: string;
  deliveredAt?: string;
  confirmedBy?: string;
  commissionRate: number;
  commission: number;
  sellerAmount: number;
  payoutStatus: string;
  releasedAt?: string;
  paidOutAt?: string;
  payoutNote?: string;
  dispute?: { reason?: string; openedAt?: string; resolvedAt?: string; resolution?: string; note?: string };
  cancelReason?: string;
};

export type PlainOrder = {
  _id: string;
  buyerId?: string;
  buyerEmail: string;
  buyerName: string;
  buyerPhone: string;
  deliveryAddress: string;
  deliveryState?: string;
  items: PlainItem[];
  shipments: PlainShipment[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  commissionTotal?: number;
  paystackReference: string;
  paymentStatus: string;
  paidAt?: string;
  stockIssue?: boolean;
  adminNote?: string;
  createdAt: string;
};

export const naira = (n: number) => `₦${Math.round(n || 0).toLocaleString("en-NG")}`;
export const orderNo = (id: string) => `#${id.slice(-6).toUpperCase()}`;
export const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "";

const STATUS_STYLE: Record<string, string> = {
  awaiting_payment: "bg-cloud-100 text-ink-700",
  paid: "bg-brand-amber-100 text-[#7a4a06]",
  dispatched: "bg-navy-100 text-navy-900",
  delivered: "bg-brand-green-100 text-brand-green-700",
  disputed: "bg-red-50 text-red-700",
  cancelled: "bg-cloud-100 text-ink-500",
};

const PAYOUT_STYLE: Record<string, string> = {
  held: "bg-brand-amber-100 text-[#7a4a06]",
  released: "bg-brand-green-100 text-brand-green-700",
  paid_out: "bg-cloud-100 text-ink-700",
  refunded: "bg-red-50 text-red-700",
  internal: "bg-navy-100 text-navy-900",
  pending: "bg-cloud-100 text-ink-500",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[status] ?? "bg-cloud-100 text-ink-700"}`}>
      {SHIPMENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function PayoutPill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${PAYOUT_STYLE[status] ?? "bg-cloud-100 text-ink-700"}`}>
      {PAYOUT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function ItemList({ items }: { items: PlainItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((i) => (
        <li key={i._id} className="flex items-center gap-3">
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-cloud-100">
            {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col text-sm">
            {i.slug ? (
              <Link href={`/marketplace/${i.slug}`} className="line-clamp-1 font-medium hover:text-brand-green-600">
                {i.name}
              </Link>
            ) : (
              <span className="line-clamp-1 font-medium">{i.name}</span>
            )}
            <span className="text-xs text-ink-500">
              {i.quantity} × {naira(i.price)}
              {i.options?.length ? ` · ${i.options.map((o) => `${o.name}: ${o.value}`).join(", ")}` : ""}
            </span>
          </span>
          <span className="text-sm font-semibold">{naira(i.price * i.quantity)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Paid → Sent → Delivered progress for one seller's part of an order. */
export function Timeline({ s }: { s: PlainShipment }) {
  if (s.status === "cancelled" || s.status === "disputed") return null;
  const steps = [
    { label: "Paid", done: true },
    { label: s.deliveryMethod === "pickup" ? "Ready" : "Sent", done: ["dispatched", "delivered"].includes(s.status), when: s.dispatchedAt },
    { label: "Delivered", done: s.status === "delivered", when: s.deliveredAt },
  ];
  return (
    <ol className="flex items-center gap-2 text-xs" aria-label="Order progress">
      {steps.map((step, i) => (
        <li key={step.label} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              step.done ? "bg-brand-green-600 text-white" : "bg-cloud-100 text-ink-500"
            }`}
          >
            {step.done ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
          </span>
          <span className={step.done ? "font-semibold text-ink-900" : "text-ink-500"}>
            {step.label}
            {step.done && step.when ? <span className="font-normal text-ink-500"> {fmtDate(step.when)}</span> : null}
          </span>
          {i < steps.length - 1 && <span className={`h-px w-6 ${steps[i + 1].done ? "bg-brand-green-600" : "bg-cloud-200"}`} />}
        </li>
      ))}
    </ol>
  );
}

/** Money breakdown for the seller (and admin). */
export function PayoutBreakdown({ s }: { s: PlainShipment }) {
  if (s.official) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-cloud-50 p-3 text-sm sm:grid-cols-4">
      <div>
        <dt className="text-xs text-ink-500">Items</dt>
        <dd className="font-semibold">{naira(s.itemsTotal)}</dd>
      </div>
      <div>
        <dt className="text-xs text-ink-500">Commission ({Math.round(s.commissionRate * 100)}%)</dt>
        <dd className="font-semibold">−{naira(s.commission)}</dd>
      </div>
      <div>
        <dt className="text-xs text-ink-500">Delivery</dt>
        <dd className="font-semibold">+{naira(s.deliveryFee)}</dd>
      </div>
      <div>
        <dt className="text-xs text-ink-500">Seller gets</dt>
        <dd className="font-display font-extrabold text-brand-green-700">{naira(s.sellerAmount)}</dd>
      </div>
    </dl>
  );
}
