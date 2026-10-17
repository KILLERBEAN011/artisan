import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Clock, Package, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ItemList, StatusPill, Timeline, fmtDate, naira, orderNo, type PlainOrder } from "@/components/marketplace/OrderParts";
import { ShipmentActions } from "@/components/marketplace/ShipmentActions";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { AUTO_CONFIRM_DAYS } from "@/lib/marketplace-config";
import { artisanNavItems, customerNavItems } from "@/lib/nav-items";
import { autoConfirmDue, toPlain } from "@/lib/orders";
import { getSessionUser } from "@/lib/products";
import { Order } from "@/models/Order";

export const metadata: Metadata = { title: "My orders" };
export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  await connectToDatabase();
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/dashboard/customer/orders");
  const session = await auth();
  await autoConfirmDue();

  const email = session?.user?.email?.toLowerCase();
  const docs = await Order.find({
    paymentStatus: { $in: ["paid", "amount_mismatch"] },
    // Older orders may only be linked by email
    $or: [{ buyerId: user._id }, ...(email ? [{ buyerEmail: email, buyerId: { $exists: false } }] : [])],
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  const orders = toPlain<PlainOrder[]>(docs);

  const href = "/dashboard/customer/orders";
  const nav = user.role === "artisan" ? artisanNavItems(href) : customerNavItems(href);

  return (
    <DashboardShell navItems={nav} userName={user.name} userRole={user.role === "artisan" ? "Artisan" : "Customer"}>
      <h1 className="font-display text-2xl font-bold text-navy-900 dark:text-white">My orders</h1>
      <p className="mt-1 text-sm text-ink-500">Things you bought on the marketplace.</p>

      {orders.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-cloud-200 bg-white px-6 py-16 text-center">
          <Package className="h-10 w-10 text-ink-300" aria-hidden="true" />
          <p className="font-display text-lg font-bold text-navy-900">No orders yet</p>
          <Link href="/marketplace" className="flex h-11 items-center rounded-lg bg-brand-green-600 px-5 text-sm font-bold text-white hover:bg-brand-green-700">
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          <div className="flex items-start gap-3 rounded-2xl bg-brand-green-100 p-4 text-sm text-ink-700">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-green-700" aria-hidden="true" />
            <p>
              Sellers are only paid after you press <strong>&ldquo;I received it&rdquo;</strong>. If you don&apos;t, the
              order counts as delivered {AUTO_CONFIRM_DAYS} days after it&apos;s sent, so report any problem before then.
            </p>
          </div>

          {orders.map((o) => (
            <article key={o._id} className="overflow-hidden rounded-2xl border border-cloud-200 bg-white">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-cloud-200 bg-cloud-50 px-4 py-3">
                <div>
                  <p className="font-display font-bold text-navy-900">Order {orderNo(o._id)}</p>
                  <p className="text-xs text-ink-500">
                    {fmtDate(o.paidAt || o.createdAt)} · {naira(o.totalAmount)} · to {o.deliveryAddress}
                  </p>
                </div>
                {o.paymentStatus === "amount_mismatch" && (
                  <span className="rounded-full bg-brand-amber-100 px-2.5 py-1 text-xs font-bold text-[#7a4a06]">
                    Payment being checked
                  </span>
                )}
              </header>

              <div className="divide-y divide-cloud-200">
                {o.shipments.map((s) => (
                  <section key={s._id} className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-navy-900">{s.sellerName}</p>
                      <StatusPill status={s.status} />
                    </div>

                    <ItemList items={o.items.filter((i) => i.sellerId === s.sellerId)} />

                    <p className="text-sm text-ink-700">
                      {s.deliveryLabel}
                      {s.deliveryFee ? ` · ${naira(s.deliveryFee)}` : ""}
                      {s.deliveryNote ? ` · ${s.deliveryNote}` : ""}
                    </p>

                    <Timeline s={s} />

                    {s.dispatchNote && (
                      <p className="rounded-lg bg-cloud-50 p-3 text-sm text-ink-700">
                        <strong>From the seller:</strong> {s.dispatchNote}
                      </p>
                    )}
                    {s.status === "dispatched" && s.autoConfirmAt && (
                      <p className="flex items-center gap-1.5 text-xs text-ink-500">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        Counts as delivered on {fmtDate(s.autoConfirmAt)} unless you report a problem.
                      </p>
                    )}
                    {s.status === "disputed" && (
                      <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>
                          You reported: &ldquo;{s.dispute?.reason}&rdquo;. The seller&apos;s payment is on hold and our team
                          will contact you.
                        </span>
                      </p>
                    )}
                    {s.status === "cancelled" && (
                      <p className="rounded-lg bg-cloud-50 p-3 text-sm text-ink-700">
                        Cancelled and refunded{s.cancelReason ? `: ${s.cancelReason}` : ""}. Refunds can take a few
                        working days to show.
                      </p>
                    )}

                    <ShipmentActions
                      orderId={o._id}
                      shipmentId={s._id}
                      status={s.status}
                      payoutStatus={s.payoutStatus}
                      mode="buyer"
                      deliveryMethod={s.deliveryMethod}
                    />
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
