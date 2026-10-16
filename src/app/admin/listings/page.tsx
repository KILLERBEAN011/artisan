import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  ExternalLink,
  FileCheck2,
  ShieldAlert,
} from "lucide-react";
import { connectToDatabase } from "@/lib/mongodb";
import { attachSellers } from "@/lib/products";
import { Product } from "@/models/Product";
import {
  CONDITION_LABELS,
  LISTING_TYPE_LABELS,
  formatNaira,
} from "@/lib/marketplace";
import { ListingReviewActions } from "@/components/admin/ListingReviewActions";

// Access is already limited to admins by src/app/admin/layout.tsx
export const dynamic = "force-dynamic";

const TABS = [
  { status: "pending_review", label: "Pending" },
  { status: "live", label: "Live" },
  { status: "rejected", label: "Rejected" },
  { status: "archived", label: "Hidden" },
] as const;

type Status = (typeof TABS)[number]["status"];

type Listing = {
  _id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  sellerType: string;
  listingType: string;
  condition: string;
  stock: number;
  isFeatured: boolean;
  proofOfPurchase?: string;
  authenticityConfirmed: boolean;
  location?: { state?: string; city?: string };
  review?: { reviewedAt?: string; rejectionReason?: string };
  createdAt: string;
  updatedAt: string;
  sellerName: string;
  sellerVerified: boolean;
};

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const requested = (await searchParams).status;
  const status: Status = TABS.some((t) => t.status === requested)
    ? (requested as Status)
    : "pending_review";

  await connectToDatabase();

  const [docs, countRows] = await Promise.all([
    Product.find({ status })
      // Oldest first in the queue, so nobody waits too long; newest first elsewhere
      .sort(status === "pending_review" ? { updatedAt: 1 } : { updatedAt: -1 })
      .limit(100)
      .lean(),
    Product.aggregate<{ _id: string; n: number }>([
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]),
  ]);

  const counts = Object.fromEntries(
    countRows.map((r) => [r._id, r.n]),
  ) as Record<string, number>;
  const listings = JSON.parse(
    JSON.stringify(await attachSellers(docs)),
  ) as Listing[];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-navy-900">
        Marketplace Listings
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Check each new listing before shoppers see it. Look for clear photos, an
        honest description, a fair price and, for branded items, proof that
        it&rsquo;s genuine.
      </p>

      <nav aria-label="Listing status" className="mt-5 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = tab.status === status;
          const n = counts[tab.status] ?? 0;
          return (
            <Link
              key={tab.status}
              href={`/admin/listings?status=${tab.status}`}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
                active
                  ? "bg-navy-900 text-white"
                  : "bg-white text-ink-700 ring-1 ring-cloud-200 hover:bg-cloud-100"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-white/20"
                    : tab.status === "pending_review" && n > 0
                      ? "bg-brand-amber-100 text-brand-amber-600"
                      : "bg-cloud-100"
                }`}
              >
                {n}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 space-y-3">
        {listings.length === 0 ? (
          <p className="rounded-2xl border border-cloud-200 bg-white p-6 text-center text-sm text-ink-500">
            {status === "pending_review"
              ? "Nothing waiting for review. You're all caught up."
              : "No listings here."}
          </p>
        ) : (
          listings.map((item) => (
            <ListingCard key={item._id} item={item} status={status} />
          ))
        )}
      </div>
    </main>
  );
}

function ListingCard({ item, status }: { item: Listing; status: Status }) {
  const isResale = item.listingType === "resale";
  const place = [item.location?.city, item.location?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-cloud-200 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Photos */}
        <div className="grid shrink-0 grid-cols-4 gap-2 sm:w-56 sm:grid-cols-2">
          {item.images.slice(0, 4).map((src, i) => (
            <a
              key={src + i}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open photo ${i + 1} full size`}
              className="relative aspect-square overflow-hidden rounded-lg bg-cloud-100 ring-1 ring-cloud-200"
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
              />
            </a>
          ))}
          {item.images.length > 4 && (
            <p className="col-span-full text-xs text-ink-500">
              +{item.images.length - 4} more photos
            </p>
          )}
        </div>

        {/* Details */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="font-semibold text-navy-900">{item.name}</h2>
            <p className="font-display text-lg font-bold text-navy-900">
              {formatNaira(item.price)}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            {item.sellerType === "official" && (
              <span className="rounded-full bg-navy-900 px-2 py-0.5 text-white">
                NaijaCraft Store
              </span>
            )}
            <span className="rounded-full bg-cloud-100 px-2 py-0.5 text-ink-700">
              {item.category}
            </span>
            <span className="rounded-full bg-cloud-100 px-2 py-0.5 text-ink-700">
              {LISTING_TYPE_LABELS[item.listingType] ?? item.listingType}
            </span>
            {item.listingType !== "service" && (
              <span className="rounded-full bg-cloud-100 px-2 py-0.5 text-ink-700">
                {CONDITION_LABELS[item.condition] ?? item.condition} ·{" "}
                {item.stock} in stock
              </span>
            )}
            {item.isFeatured && (
              <span className="rounded-full bg-brand-amber-100 px-2 py-0.5 text-brand-amber-600">
                Featured
              </span>
            )}
          </div>

          <p className="flex items-center gap-1 text-sm text-ink-500">
            Seller:{" "}
            <span className="font-medium text-ink-700">{item.sellerName}</span>
            {item.sellerVerified && (
              <BadgeCheck
                className="h-4 w-4 text-brand-green-600"
                aria-label="Verified"
              />
            )}
            {place && <span>· {place}</span>}
          </p>
          <p className="text-xs text-ink-500">
            {status === "pending_review" ? "Submitted" : "Updated"}{" "}
            {new Date(item.updatedAt).toLocaleString("en-NG", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>

          <details className="mt-1 text-sm text-ink-700">
            <summary className="cursor-pointer font-medium text-navy-900">
              Description
            </summary>
            <p className="mt-1 whitespace-pre-line">{item.description}</p>
          </details>
        </div>
      </div>

      {/* Authenticity: only matters for resale */}
      {isResale && (
        <div className="flex items-start gap-2 rounded-xl bg-cloud-50 p-3 text-sm">
          {item.proofOfPurchase ? (
            <>
              <FileCheck2
                className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-600"
                aria-hidden="true"
              />
              <p className="text-ink-700">
                Proof of purchase uploaded.{" "}
                <a
                  href={item.proofOfPurchase}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand-green-600 hover:underline"
                >
                  View it
                </a>
                {item.authenticityConfirmed
                  ? " · Seller confirmed it's genuine."
                  : ""}
              </p>
            </>
          ) : (
            <>
              <ShieldAlert
                className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber-600"
                aria-hidden="true"
              />
              <p className="text-brand-amber-600">
                No proof of purchase.{" "}
                {item.authenticityConfirmed
                  ? "The seller confirmed it's genuine. "
                  : ""}
                For branded items (Nike, Apple, Samsung…) ask for a receipt
                before approving.
              </p>
            </>
          )}
        </div>
      )}

      {status === "rejected" && item.review?.rejectionReason && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <span className="font-semibold">Rejected:</span>{" "}
          {item.review.rejectionReason}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cloud-200 pt-3">
        {status === "live" ? (
          <Link
            href={`/marketplace/${item.slug}`}
            target="_blank"
            className="flex items-center gap-1 text-sm font-semibold text-brand-green-600 hover:underline"
          >
            View on marketplace{" "}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <span />
        )}
        <ListingReviewActions
          productId={item._id}
          status={status}
          isFeatured={item.isFeatured}
        />
      </div>
    </article>
  );
}
