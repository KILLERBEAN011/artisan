import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import { ClearCart } from "@/components/marketplace/ClearCart";
import { CATEGORIES, formatNaira } from "@/lib/marketplace";
import { AUTO_CONFIRM_DAYS } from "@/lib/marketplace-config";
import { confirmPayment, toPlain } from "@/lib/orders";
import { getSessionUser } from "@/lib/products";
import { Order } from "@/models/Order";

export const metadata: Metadata = { title: "Order confirmation" };
export const dynamic = "force-dynamic";

type Summary = {
  _id: string;
  totalAmount: number;
  deliveryAddress: string;
  buyerId?: string;
  shipments: { _id: string; sellerId: string; sellerName: string; deliveryLabel: string; itemsTotal: number; deliveryFee: number }[];
  items: { _id: string; name: string; quantity: number; sellerId: string }[];
};

/* Paystack sends the buyer here after paying: /checkout/complete?reference=NC-... */
export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const sp = await searchParams;
  const reference = (sp.reference || sp.trxref || "").slice(0, 100);
  const result = reference ? await confirmPayment(reference) : ({ status: "not_found" } as const);

  // Only show order details to the buyer who placed it
  let order: Summary | null = null;
  if (result.status === "paid") {
    const user = await getSessionUser();
    const doc = await Order.findById(result.orderId).lean();
    if (doc && user && String(doc.buyerId) === String(user._id)) order = toPlain<Summary>(doc);
  }

  const box = "mx-auto flex max-w-xl flex-col items-center gap-3 rounded-[20px] border border-cloud-200 bg-white p-8 text-center";
  const button = "flex h-12 items-center justify-center rounded-xl px-6 font-bold transition-colors";

  return (
    <div className="min-h-screen bg-cloud-50 font-body text-ink-900">
      <MarketplaceHeader categories={CATEGORIES} />
      <main className="px-4 py-10">
        {result.status === "paid" ? (
          <div className={box}>
            <ClearCart />
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-green-100">
              <CheckCircle2 className="h-9 w-9 text-brand-green-600" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-extrabold">Payment received. Thank you!</h1>
            {order && (
              <>
                <p className="text-sm text-ink-700">
                  Order <strong>#{order._id.slice(-6).toUpperCase()}</strong> · {formatNaira(order.totalAmount)} · Delivering to{" "}
                  {order.deliveryAddress}
                </p>
                <ul className="mt-2 w-full divide-y divide-cloud-200 rounded-xl border border-cloud-200 text-left text-sm">
                  {order.shipments.map((s) => (
                    <li key={s._id} className="p-3">
                      <p className="font-semibold">{s.sellerName}</p>
                      <p className="text-ink-700">
                        {order!.items
                          .filter((i) => i.sellerId === s.sellerId)
                          .map((i) => `${i.quantity} × ${i.name}`)
                          .join(", ")}
                      </p>
                      <p className="text-ink-500">
                        {s.deliveryLabel}
                        {s.deliveryFee ? ` · ${formatNaira(s.deliveryFee)}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-2 flex items-start gap-3 rounded-xl bg-brand-green-100 p-4 text-left text-sm text-ink-700">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-green-700" aria-hidden="true" />
              <span>
                NaijaCraft holds your money. Sellers are only paid after you press <strong>&ldquo;I received it&rdquo;</strong>{" "}
                (or {AUTO_CONFIRM_DAYS} days after they send it, if you don&apos;t report a problem).
              </span>
            </div>
            <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
              <Link href="/dashboard/customer/orders" className={`${button} flex-1 bg-brand-green-600 text-white hover:bg-brand-green-700`}>
                Track my order
              </Link>
              <Link href="/marketplace" className={`${button} flex-1 border border-cloud-200 text-navy-900 hover:bg-cloud-50`}>
                Keep shopping
              </Link>
            </div>
          </div>
        ) : result.status === "problem" ? (
          <div className={box}>
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-amber-100">
              <AlertTriangle className="h-8 w-8 text-brand-amber-600" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-extrabold">We&apos;re checking your payment</h1>
            <p className="text-sm text-ink-700">{result.message}</p>
            <p className="text-xs text-ink-500">Reference: {reference}</p>
            <Link href="/dashboard/customer/support" className={`${button} border border-cloud-200 text-navy-900 hover:bg-cloud-50`}>
              Contact support
            </Link>
          </div>
        ) : (
          <div className={box}>
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cloud-100">
              <Clock className="h-8 w-8 text-ink-500" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-extrabold">Payment not completed</h1>
            <p className="text-sm text-ink-700">
              We didn&apos;t receive a payment for this order, so nothing was charged. Your cart is still saved.
            </p>
            <p className="text-xs text-ink-500">
              If money left your account, don&apos;t pay again: refresh this page in a minute, or contact support with
              reference {reference || "(none)"}.
            </p>
            <Link href="/cart" className={`${button} bg-brand-green-600 text-white hover:bg-brand-green-700`}>
              Back to cart
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
