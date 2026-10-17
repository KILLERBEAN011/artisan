"use client";

import Link from "next/link";
import { Package, Search, ShoppingBag, Wrench } from "lucide-react";
import { useCart } from "@/context/CartContext";

type Props = {
  query?: string;
  category?: string;
  categories: readonly string[];
};

export default function MarketplaceHeader({
  query,
  category,
  categories,
}: Props) {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-30 bg-navy-900 text-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="NaijaCraft home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green-600">
            <Wrench className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg font-extrabold">
              NaijaCraft
            </span>
            <span className="text-[11px] font-semibold tracking-[0.12em] text-brand-amber-500">
              MARKETPLACE
            </span>
          </span>
        </Link>

        {/* Search: a plain GET form, so it works even before JavaScript loads */}
        <form
          action="/marketplace"
          method="get"
          role="search"
          className="order-last flex w-full min-w-0 overflow-hidden rounded-xl bg-white md:order-none md:flex-1"
        >
          {category && <input type="hidden" name="category" value={category} />}
          <label htmlFor="marketplace-search" className="sr-only">
            Search the marketplace
          </label>
          <input
            id="marketplace-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search adire, sandals, furniture, sellers…"
            className="h-11 min-w-0 flex-1 px-4 text-[15px] text-ink-900 placeholder:text-ink-500 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex w-12 items-center justify-center bg-brand-amber-500 text-navy-900 transition-colors hover:bg-brand-amber-600"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>

        <nav aria-label="Shopping" className="ml-auto flex items-center gap-2">
          <Link
            href="/dashboard/customer/orders"
            className="flex h-11 items-center gap-2 rounded-lg px-3 text-sm text-navy-100 transition-colors hover:bg-navy-800 hover:text-white"
          >
            <Package className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Orders</span>
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            className="flex h-11 items-center gap-2 rounded-lg bg-brand-green-600 px-4 text-sm font-semibold transition-colors hover:bg-brand-green-700"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="rounded-full bg-brand-amber-500 px-2 py-0.5 text-xs font-extrabold text-navy-900">
                {itemCount}
              </span>
            )}
          </Link>
          <Link
            href="/sell"
            className="hidden h-11 items-center rounded-lg bg-brand-amber-500 px-4 text-sm font-bold text-navy-900 transition-colors hover:bg-brand-amber-600 lg:flex"
          >
            Sell on NaijaCraft
          </Link>
        </nav>
      </div>

      <nav aria-label="Categories" className="border-t border-navy-800">
        <ul className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8 [scrollbar-width:none]">
          <li>
            <CategoryChip
              href={
                query
                  ? `/marketplace?q=${encodeURIComponent(query)}`
                  : "/marketplace"
              }
              active={!category}
            >
              All
            </CategoryChip>
          </li>
          {categories.map((c) => {
            const qs = new URLSearchParams({ category: c });
            if (query) qs.set("q", query);
            return (
              <li key={c}>
                <CategoryChip
                  href={`/marketplace?${qs}`}
                  active={category === c}
                >
                  {c}
                </CategoryChip>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

function CategoryChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-9 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm transition-colors ${
        active
          ? "bg-brand-amber-500 font-bold text-navy-900"
          : "bg-navy-800 text-navy-100 hover:bg-navy-700 hover:text-white"
      }`}
    >
      {children}
    </Link>
  );
}
