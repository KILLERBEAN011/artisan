import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Hammer,
  MessageCircleQuestion,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import FilterPanel from "@/components/marketplace/FilterPanel";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import ProductCard from "@/components/marketplace/ProductCard";
import {
  CATEGORIES,
  getPublicProducts,
  hasActiveFilters,
  marketplaceHref,
  readFilters,
  type SearchParams,
} from "@/lib/marketplace";

// Always show the latest listings
export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const f = readFilters(await searchParams);
  const title = f.q
    ? `"${f.q}" in the Marketplace`
    : f.category
      ? `${f.category} | Marketplace`
      : "Marketplace: handmade goods and trusted sellers";
  return {
    title,
    description:
      "Buy handmade goods, stock from verified sellers and the NaijaCraft Store. Pay safely through NaijaCraft.",
    alternates: { canonical: "/marketplace" },
  };
}

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Protected payments",
    body: "Pay through NaijaCraft, never to a stranger's account.",
  },
  {
    icon: Hammer,
    title: "Verified sellers",
    body: "Sellers are checked before they can list.",
  },
  {
    icon: Truck,
    title: "Delivery shown upfront",
    body: "See delivery options before you order.",
  },
  {
    icon: MessageCircleQuestion,
    title: "We step in",
    body: "Not as described? Open a dispute and we help.",
  },
];

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = readFilters(await searchParams);
  const filtered = hasActiveFilters(filters);
  const showLanding = !filtered && filters.page === 1;

  const [feed, store] = await Promise.all([
    getPublicProducts(filters),
    showLanding
      ? getPublicProducts({ ...filters, sellerType: "official", page: 1 }, 4)
      : null,
  ]);

  const heading = filters.q
    ? `Results for "${filters.q}"`
    : filters.category
      ? filters.category
      : filtered
        ? "Filtered results"
        : "Fresh from sellers";

  return (
    <div className="min-h-screen bg-cloud-50 font-body text-ink-900">
      <MarketplaceHeader
        query={filters.q}
        category={filters.category}
        categories={CATEGORIES}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {showLanding && (
          <>
            {/* Hero */}
            <section className="grid gap-4 lg:grid-cols-3">
              <div className="relative overflow-hidden rounded-[20px] bg-navy-800 p-7 text-white sm:p-10 lg:col-span-2">
                <div
                  aria-hidden="true"
                  className="absolute -right-12 -top-12 h-72 w-72 rounded-full border-[44px] border-brand-green-600 opacity-50"
                />
                <div
                  aria-hidden="true"
                  className="absolute bottom-10 right-24 hidden h-24 w-24 rounded-full bg-brand-amber-500 sm:block"
                />
                <div className="relative flex max-w-xl flex-col gap-4">
                  <span className="self-start rounded-full bg-brand-amber-500 px-3 py-1 text-xs font-bold tracking-wider text-navy-900">
                    MADE &amp; SOLD IN NIGERIA
                  </span>
                  <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-[42px]">
                    Buy from people you can trust.
                  </h1>
                  <p className="text-base leading-relaxed text-navy-100 sm:text-lg">
                    Handmade goods, stock from verified sellers and the
                    NaijaCraft Store, all paid safely through NaijaCraft.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <Link
                      href="/marketplace?sellerType=official"
                      className="flex h-12 items-center rounded-xl bg-brand-amber-500 px-5 font-bold text-navy-900 transition-colors hover:bg-brand-amber-600"
                    >
                      Shop the NaijaCraft Store
                    </Link>
                    <Link
                      href="/coming-soon?feature=Sell+on+NaijaCraft"
                      className="flex h-12 items-center rounded-xl border border-navy-700 px-5 font-semibold text-white transition-colors hover:bg-navy-700"
                    >
                      Start selling
                    </Link>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <Link
                  href="/marketplace?listingType=handmade"
                  className="flex flex-col gap-2 rounded-[20px] bg-brand-amber-100 p-6 transition-shadow hover:shadow-md"
                >
                  <span className="text-xs font-bold tracking-wider text-[#7a4a06]">
                    HANDMADE
                  </span>
                  <span className="font-display text-xl font-extrabold leading-snug">
                    Made by Nigerian artisans, sold by the people who made it
                  </span>
                  <span className="text-sm text-ink-700">
                    Fashion, furniture, leather, beadwork and more.
                  </span>
                </Link>
                <Link
                  href="/marketplace?listingType=service"
                  className="flex flex-col gap-2 rounded-[20px] bg-brand-green-100 p-6 transition-shadow hover:shadow-md"
                >
                  <span className="text-xs font-bold tracking-wider text-brand-green-700">
                    FIXED-PRICE SERVICES
                  </span>
                  <span className="font-display text-xl font-extrabold leading-snug">
                    Book a verified pro like you buy a product
                  </span>
                  <span className="text-sm text-ink-700">
                    Clear price and scope before anyone comes over.
                  </span>
                </Link>
              </div>
            </section>

            {/* Why buy here */}
            <section
              aria-label="Why buy on NaijaCraft"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              {TRUST_POINTS.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-card border border-cloud-200 bg-white p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-green-100">
                    <Icon
                      className="h-[18px] w-[18px] text-brand-green-700"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <strong className="text-[15px]">{title}</strong>
                    <span className="text-[13px] leading-snug text-ink-500">
                      {body}
                    </span>
                  </span>
                </div>
              ))}
            </section>

            {/* NaijaCraft Store row */}
            {store && store.products.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold tracking-wider text-navy-800">
                      <span
                        className="h-2 w-2 rounded-full bg-navy-800"
                        aria-hidden="true"
                      />
                      SOLD &amp; SHIPPED BY NAIJACRAFT
                    </p>
                    <h2 className="font-display text-2xl font-extrabold sm:text-[28px]">
                      From the NaijaCraft Store
                    </h2>
                  </div>
                  <Link
                    href="/marketplace?sellerType=official"
                    className="text-sm font-semibold text-brand-green-600 hover:underline"
                  >
                    See all store items
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {store.products.map((p, i) => (
                    <ProductCard key={p._id} product={p} priority={i < 2} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Main feed with filters */}
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          <aside className="hidden w-64 shrink-0 rounded-card border border-cloud-200 bg-white p-5 lg:sticky lg:top-36 lg:block">
            <h2 className="mb-4 font-display text-base font-bold">Filter</h2>
            <FilterPanel filters={filters} idPrefix="desktop" />
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-extrabold sm:text-[28px]">
                  {heading}
                </h2>
                <p className="text-sm text-ink-500">
                  {feed.total} {feed.total === 1 ? "item" : "items"}
                </p>
              </div>
            </div>

            {/* Filters on phones: a collapsible panel */}
            <details className="rounded-card border border-cloud-200 bg-white lg:hidden">
              <summary className="flex h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Filter and sort
              </summary>
              <div className="border-t border-cloud-200 p-4">
                <FilterPanel filters={filters} idPrefix="mobile" />
              </div>
            </details>

            {feed.products.length === 0 ? (
              <EmptyState filtered={filtered} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {feed.products.map((p, i) => (
                  <ProductCard
                    key={p._id}
                    product={p}
                    priority={!showLanding && i < 4}
                  />
                ))}
              </div>
            )}

            {feed.pages > 1 && (
              <nav
                aria-label="Pages"
                className="flex items-center justify-center gap-3 pt-2"
              >
                {filters.page > 1 ? (
                  <Link
                    href={marketplaceHref(filters, { page: filters.page - 1 })}
                    className="flex h-11 items-center gap-1 rounded-lg border border-cloud-200 bg-white px-4 text-sm font-semibold hover:bg-cloud-100"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />{" "}
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-sm text-ink-500">
                  Page {filters.page} of {feed.pages}
                </span>
                {filters.page < feed.pages && (
                  <Link
                    href={marketplaceHref(filters, { page: filters.page + 1 })}
                    className="flex h-11 items-center gap-1 rounded-lg border border-cloud-200 bg-white px-4 text-sm font-semibold hover:bg-cloud-100"
                  >
                    Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
              </nav>
            )}
          </div>
        </section>

        {/* Sell band */}
        <section className="flex flex-col gap-6 rounded-[20px] bg-brand-green-600 p-7 text-white sm:p-10">
          <div className="flex max-w-2xl flex-col gap-2">
            <h2 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">
              Make it, or source it. Sell it here.
            </h2>
            <p className="text-brand-green-100">
              Artisans, students and resellers can open a shop. Buyers pay
              through NaijaCraft, and you get paid straight to your bank.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-3">
            {[
              ["1. Verify", "Confirm your ID and bank account once."],
              [
                "2. List",
                "Add photos, price and delivery. We check it before it goes live.",
              ],
              [
                "3. Get paid",
                "The buyer confirms delivery and the money lands in your account.",
              ],
            ].map(([title, body]) => (
              <li
                key={title}
                className="flex flex-col gap-1 rounded-card bg-brand-green-700 p-4"
              >
                <strong className="text-sm text-brand-amber-500">
                  {title}
                </strong>
                <span className="text-[15px] leading-snug">{body}</span>
              </li>
            ))}
          </ol>
          <Link
            href="/coming-soon?feature=Sell+on+NaijaCraft"
            className="flex h-12 items-center self-start rounded-xl bg-brand-amber-500 px-6 font-extrabold text-navy-900 transition-colors hover:bg-brand-amber-600"
          >
            Open your shop
          </Link>
        </section>
      </main>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-card border border-dashed border-cloud-200 bg-white p-8 text-center">
      <p className="font-display text-lg font-bold">
        {filtered
          ? "Nothing matches those filters yet"
          : "New listings are on the way"}
      </p>
      <p className="max-w-sm text-sm text-ink-500">
        {filtered
          ? "Try a different search, or clear some filters."
          : "Sellers are setting up their shops. Check back soon, or open your own."}
      </p>
      <Link
        href={
          filtered ? "/marketplace" : "/coming-soon?feature=Sell+on+NaijaCraft"
        }
        className="mt-1 flex h-11 items-center rounded-lg bg-brand-green-600 px-5 text-sm font-bold text-white hover:bg-brand-green-700"
      >
        {filtered ? "Clear filters" : "Start selling"}
      </Link>
    </div>
  );
}
