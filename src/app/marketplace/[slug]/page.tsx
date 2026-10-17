import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Clock,
  MapPin,
  ShieldCheck,
  Star,
  Store,
  Truck,
} from "lucide-react";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductGallery from "@/components/marketplace/ProductGallery";
import ProductPurchasePanel from "@/components/marketplace/ProductPurchasePanel";
import {
  CATEGORIES,
  CONDITION_LABELS,
  DELIVERY_LABELS,
  LISTING_TYPE_LABELS,
  SITE_URL,
  formatNaira,
  getMoreFromSeller,
  getPublicProduct,
} from "@/lib/marketplace";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/* Title, description and photo for Google results and WhatsApp/Facebook link previews */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) return { title: "Item not found" };

  const description =
    `${formatNaira(product.price)} · ${product.description}`.slice(0, 160);
  const url = `${SITE_URL}/marketplace/${product.slug}`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/marketplace/${product.slug}` },
    openGraph: {
      title: `${product.name} · ${formatNaira(product.price)}`,
      description,
      url,
      siteName: "NaijaCraft",
      locale: "en_NG",
      type: "website",
      images: product.images
        .slice(0, 1)
        .map((src) => ({ url: src, alt: product.name })),
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} · ${formatNaira(product.price)}`,
      description,
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) notFound();

  const moreFromSeller = await getMoreFromSeller(product);
  const official = product.sellerType === "official";
  const isService = product.listingType === "service";
  const soldOut = !isService && !product.inStock;
  const state = product.location?.state || product.sellerState;
  const shareUrl = `${SITE_URL}/marketplace/${product.slug}`;

  // Structured data so Google can show price and availability in results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    category: product.category,
    offers: {
      "@type": "Offer",
      url: shareUrl,
      priceCurrency: "NGN",
      price: product.price,
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      itemCondition:
        product.condition === "new"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
      seller: { "@type": "Organization", name: product.sellerName },
    },
    ...(product.ratingCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.ratingAvg,
        reviewCount: product.ratingCount,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-cloud-50 font-body text-ink-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <MarketplaceHeader categories={CATEGORIES} category={product.category} />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-sm text-ink-500"
        >
          <Link href="/marketplace" className="hover:text-brand-green-600">
            Marketplace
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/marketplace?category=${encodeURIComponent(product.category)}`}
            className="hover:text-brand-green-600"
          >
            {product.category}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="line-clamp-1 text-ink-700">{product.name}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-2">
          <ProductGallery images={product.images} name={product.name} />

          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {official && (
                <Badge className="bg-navy-900 text-white">
                  NaijaCraft Store
                </Badge>
              )}
              <Badge
                className={
                  product.listingType === "handmade"
                    ? "bg-brand-amber-100 text-[#7a4a06]"
                    : "bg-cloud-100 text-ink-700"
                }
              >
                {LISTING_TYPE_LABELS[product.listingType]}
              </Badge>
              {!isService && (
                <Badge className="bg-brand-green-100 text-brand-green-700">
                  {CONDITION_LABELS[product.condition] ?? "New"}
                </Badge>
              )}
            </div>

            <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-[34px]">
              {product.name}
            </h1>

            {product.ratingCount > 0 && (
              <p className="flex items-center gap-2 text-sm text-ink-700">
                <Star
                  className="h-4 w-4 fill-brand-amber-500 text-brand-amber-500"
                  aria-hidden="true"
                />
                <span>
                  {product.ratingAvg.toFixed(1)} · {product.ratingCount} review
                  {product.ratingCount === 1 ? "" : "s"}
                </span>
              </p>
            )}

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold">
                {formatNaira(product.price)}
              </span>
              {product.compareAtPrice &&
                product.compareAtPrice > product.price && (
                  <s className="text-lg text-ink-500">
                    {formatNaira(product.compareAtPrice)}
                  </s>
                )}
              {!isService && (
                <span
                  className={`text-sm font-semibold ${soldOut ? "text-red-700" : "text-brand-green-700"}`}
                >
                  {soldOut
                    ? "Sold out"
                    : product.stock <= 5
                      ? `Only ${product.stock} left`
                      : "In stock"}
                </span>
              )}
            </div>

            {!isService && product.leadTimeDays ? (
              <p className="flex items-center gap-2 text-sm text-ink-700">
                <Clock className="h-4 w-4" aria-hidden="true" />
                {`Made to order: ready in about ${product.leadTimeDays} day${product.leadTimeDays === 1 ? "" : "s"}`}
              </p>
            ) : null}

            {isService ? (
              <div className="flex flex-col gap-2">
                <Link
                  href={
                    product.sellerIsArtisan
                      ? `/artisans/${product.sellerId}`
                      : `/coming-soon?feature=${encodeURIComponent("Booking this service")}`
                  }
                  className="flex h-12 items-center justify-center rounded-xl bg-navy-900 font-bold text-white hover:bg-navy-800"
                >
                  Book this service
                </Link>
                {product.sellerIsArtisan && (
                  <p className="text-center text-xs text-ink-500">
                    You&apos;ll request a booking on {product.sellerName}&apos;s
                    profile and pay through NaijaCraft once they confirm.
                  </p>
                )}
              </div>
            ) : (
              <ProductPurchasePanel
                product={{
                  id: product._id,
                  name: product.name,
                  price: product.price,
                  image: product.images[0],
                  sellerId: product.sellerId,
                  slug: product.slug,
                }}
                options={product.options}
                stock={product.stock}
                priceLabel={formatNaira(product.price)}
                shareUrl={shareUrl}
                soldOut={soldOut}
              />
            )}

            {/* Service details (services don't ship) */}
            {isService && (
              <div className="flex flex-col gap-3 rounded-card border border-cloud-200 bg-white p-5">
                <h2 className="flex items-center gap-2 text-[15px] font-bold">
                  <MapPin className="h-4 w-4" aria-hidden="true" /> About this
                  service
                </h2>
                <dl className="flex flex-col gap-2 text-sm">
                  {state && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-700">Available in</dt>
                      <dd className="font-semibold">
                        {[product.location?.city, state]
                          .filter(Boolean)
                          .join(", ")}
                      </dd>
                    </div>
                  )}
                  {product.service?.durationMinutes ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-700">Takes about</dt>
                      <dd className="font-semibold">
                        {formatDuration(product.service.durationMinutes)}
                      </dd>
                    </div>
                  ) : null}
                  {product.service?.includes && (
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-ink-700">Included</dt>
                      <dd className="font-semibold">
                        {product.service.includes}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {/* Delivery */}
            {!isService && (
              <div className="flex flex-col gap-3 rounded-card border border-cloud-200 bg-white p-5">
                <h2 className="flex items-center gap-2 text-[15px] font-bold">
                  <Truck className="h-4 w-4" aria-hidden="true" /> Delivery
                </h2>
                {product.delivery.length > 0 ? (
                  <ul className="flex flex-col gap-2 text-sm">
                    {product.delivery.map((d, i) => (
                      <li key={i} className="flex justify-between gap-4">
                        <span className="text-ink-700">
                          {DELIVERY_LABELS[d.method] ?? d.method}
                          {d.etaDays
                            ? `, ${d.etaDays} day${d.etaDays === 1 ? "" : "s"}`
                            : ""}
                          {d.note ? ` · ${d.note}` : ""}
                          {d.states && d.states.length > 0
                            ? ` (${d.states.join(", ")})`
                            : ""}
                        </span>
                        <strong className="shrink-0">
                          {d.fee > 0 ? formatNaira(d.fee) : "Free"}
                        </strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-700">
                    The seller arranges delivery with you after you order
                    {state ? `. Ships from ${state}.` : "."}
                  </p>
                )}
              </div>
            )}

            {/* Payment protection */}
            <div className="flex items-start gap-3 rounded-card bg-brand-green-100 p-5">
              <ShieldCheck
                className="mt-0.5 h-6 w-6 shrink-0 text-brand-green-700"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-1">
                <strong className="text-[15px]">Pay through NaijaCraft</strong>
                <span className="text-sm leading-relaxed text-ink-700">
                  Always pay at checkout here, never by bank transfer to a
                  seller. That way we can help if the item doesn&apos;t arrive
                  or isn&apos;t as described.
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-card border border-cloud-200 bg-white p-6 lg:col-span-2">
            <h2 className="font-display text-xl font-extrabold">
              About this item
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-ink-700">
              {product.description}
            </p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-cloud-200 pt-4 text-sm">
              <Detail term="Category" value={product.category} />
              {!isService && (
                <Detail
                  term="Condition"
                  value={CONDITION_LABELS[product.condition] ?? "New"}
                />
              )}
              <Detail
                term="Type"
                value={LISTING_TYPE_LABELS[product.listingType]}
              />
              {state && (
                <Detail
                  term="Location"
                  value={[product.location?.city, state]
                    .filter(Boolean)
                    .join(", ")}
                />
              )}
            </dl>
          </div>

          <aside className="flex flex-col gap-4 rounded-card border border-cloud-200 bg-white p-6">
            <p className="text-xs font-bold tracking-wider text-ink-500">
              SOLD BY
            </p>
            <div className="flex items-center gap-3">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-extrabold ${
                  official
                    ? "bg-navy-900 text-brand-amber-500"
                    : "bg-brand-green-100 text-brand-green-700"
                }`}
                aria-hidden="true"
              >
                {official ? "NC" : initials(product.sellerName)}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="truncate">{product.sellerName}</span>
                  {product.sellerVerified && (
                    <BadgeCheck
                      className="h-4 w-4 shrink-0 text-brand-green-600"
                      aria-label="Verified"
                    />
                  )}
                </span>
                {state && (
                  <span className="flex items-center gap-1 text-sm text-ink-500">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                    {state}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-ink-700">
              {official
                ? "Stocked and shipped by NaijaCraft."
                : product.sellerVerified
                  ? "This seller's identity has been checked by NaijaCraft."
                  : "Marketplace seller."}
            </p>
            <Link
              href={`/marketplace?seller=${product.sellerId}`}
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-cloud-200 text-sm font-semibold hover:bg-cloud-100"
            >
              <Store className="h-4 w-4" aria-hidden="true" />
              All items from this seller
            </Link>
          </aside>
        </section>

        {moreFromSeller.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-2xl font-extrabold">
              More from {product.sellerName}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {moreFromSeller.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${className}`}>
      {children}
    </span>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-500">{term}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = minutes / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} hr`;
}
