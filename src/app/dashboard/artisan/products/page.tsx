import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { AlertTriangle, Package, PlusCircle, Truck } from "lucide-react";
import { NotASellerYet, SellerPageShell } from "@/components/marketplace/SellerPageShell";
import { SellerListingActions } from "@/components/marketplace/SellerListingActions";
import { formatNaira } from "@/lib/marketplace";
import { LISTING_TYPE_LABELS, STATUS_LABELS, type ProductStatus } from "@/lib/product-options";
import { getSellerContext } from "@/lib/seller";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

export const metadata: Metadata = { title: "My shop" };
export const dynamic = "force-dynamic";

const TABS: { key: "all" | ProductStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "pending_review", label: "In review" },
  { key: "rejected", label: "Needs changes" },
  { key: "draft", label: "Drafts" },
  { key: "archived", label: "Hidden" },
];

const STATUS_STYLES: Record<ProductStatus, string> = {
  live: "bg-brand-green-100 text-brand-green-700",
  pending_review: "bg-brand-amber-100 text-brand-amber-600",
  rejected: "bg-red-50 text-red-700",
  draft: "bg-cloud-100 text-ink-700",
  archived: "bg-cloud-100 text-ink-500",
};

type Row = {
  _id: string;
  slug: string;
  name: string;
  price: number;
  images: string[];
  status: ProductStatus;
  listingType: string;
  stock: number;
  soldCount: number;
  review?: { rejectionReason?: string };
};

export default async function MyListingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await getSellerContext("/dashboard/artisan/products");
  if (ctx.admin) redirect("/admin/listings");

  if (!ctx.allowed) {
    return (
      <SellerPageShell ctx={ctx}>
        <NotASellerYet status={ctx.user.seller?.status} />
      </SellerPageShell>
    );
  }

  const base = ctx.listingsHref;
  const tabParam = (await searchParams).tab;
  const tab = TABS.find((t) => t.key === tabParam)?.key ?? "all";

  const [docs, countRows, toSend] = await Promise.all([
    Product.find(tab === "all" ? { sellerId: ctx.user._id } : { sellerId: ctx.user._id, status: tab })
      .sort({ updatedAt: -1 })
      .select("slug name price images status listingType stock soldCount review")
      .lean(),
    Product.aggregate<{ _id: ProductStatus; n: number }>([
      { $match: { sellerId: ctx.user._id } },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]),
    // Paid orders this seller still has to send
    Order.countDocuments({
      paymentStatus: "paid",
      shipments: { $elemMatch: { sellerId: ctx.user._id, status: "paid" } },
    }),
  ]);

  const counts: Record<string, number> = Object.fromEntries(countRows.map((r) => [r._id, r.n]));
  counts.all = countRows.reduce((sum, r) => sum + r.n, 0);
  const rows = JSON.parse(JSON.stringify(docs)) as Row[];
  const needsChanges = counts.rejected ?? 0;

  return (
    <SellerPageShell ctx={ctx}>
      <Toaster position="top-center" />

      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">
            {ctx.user.seller?.shopName || "My listings"}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {counts.live ?? 0} live on the marketplace · {counts.pending_review ?? 0} waiting for review
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/sales"
            className="flex h-11 w-fit items-center gap-2 rounded-lg border border-cloud-200 bg-white px-4 text-sm font-semibold text-navy-900 transition-colors hover:bg-cloud-50"
          >
            <Truck className="h-4 w-4" aria-hidden="true" />
            Orders
            {toSend > 0 && (
              <span className="rounded-full bg-brand-amber-500 px-2 py-0.5 text-xs font-extrabold text-navy-900">
                {toSend} to send
              </span>
            )}
          </Link>
          <Link
            href="/dashboard/products/new"
            className="flex h-11 w-fit items-center gap-2 rounded-lg bg-brand-green-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            List something new
          </Link>
        </div>
      </div>

      {needsChanges > 0 && tab !== "rejected" && (
        <Link
          href={`${base}?tab=rejected`}
          className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800 hover:bg-red-100"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {needsChanges} listing{needsChanges === 1 ? " needs" : "s need"} changes before it can go live. See what to fix.
        </Link>
      )}

      <nav aria-label="Filter listings" className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = t.key === tab;
          const n = counts[t.key] ?? 0;
          if (t.key !== "all" && n === 0 && !active) return null;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? base : `${base}?tab=${t.key}`}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ${
                active ? "bg-navy-900 text-white" : "bg-white text-ink-700 ring-1 ring-cloud-200 hover:bg-cloud-100"
              }`}
            >
              {t.label}
              <span className={`text-xs ${active ? "text-white/80" : "text-ink-500"}`}>{n}</span>
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-cloud-200 bg-white px-6 py-16 text-center">
          <Package className="h-10 w-10 text-ink-300" aria-hidden="true" />
          <p className="font-display text-lg font-bold text-navy-900">
            {tab === "all" ? "You haven't listed anything yet" : "Nothing here"}
          </p>
          {tab === "all" && (
            <>
              <p className="max-w-sm text-sm text-ink-500">
                Sell what you make, stock you resell, or a fixed-price service. Buyers pay safely through NaijaCraft.
              </p>
              <Link
                href="/dashboard/products/new"
                className="mt-2 flex h-11 items-center gap-2 rounded-lg bg-brand-green-600 px-5 text-sm font-semibold text-white hover:bg-brand-green-700"
              >
                <PlusCircle className="h-4 w-4" aria-hidden="true" />
                List your first item
              </Link>
            </>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <li key={p._id} className="flex flex-col overflow-hidden rounded-2xl border border-cloud-200 bg-white">
              <div className="relative aspect-[4/3] bg-cloud-100">
                {p.images[0] && (
                  <Image
                    src={p.images[0]}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 100vw"
                    className="object-cover"
                  />
                )}
                <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[p.status]}`}>
                  {STATUS_LABELS[p.status]}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-1 p-4">
                <h2 className="line-clamp-1 font-semibold text-navy-900" title={p.name}>
                  {p.name}
                </h2>
                <p className="font-display text-lg font-bold text-navy-900">{formatNaira(p.price)}</p>
                <p className="text-xs text-ink-500">
                  {LISTING_TYPE_LABELS[p.listingType] ?? p.listingType}
                  {p.listingType !== "service" && ` · ${p.stock} in stock`}
                  {p.soldCount > 0 && ` · ${p.soldCount} sold`}
                </p>
                {p.status === "rejected" && p.review?.rejectionReason && (
                  <p className="mt-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-800">
                    <strong>What to fix:</strong> {p.review.rejectionReason}
                  </p>
                )}
                {p.status === "pending_review" && (
                  <p className="mt-2 text-xs text-ink-500">We&apos;re checking this listing. It goes live once approved.</p>
                )}
              </div>

              <SellerListingActions productId={p._id} slug={p.slug} status={p.status} />
            </li>
          ))}
        </ul>
      )}
    </SellerPageShell>
  );
}
