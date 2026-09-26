"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Menu, X, Wrench, ShoppingBag } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import Link from "next/link";
import { useRouter } from "next/navigation";
import KiwiLoader from "@/components/shared/KiwiLoader";
import MarketplaceLoader from "@/components/shared/MarketplaceLoader";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Browse artisans", href: "#categories" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Pricing", href: "#pricing" },
  { label: "Help", href: "#faq" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMarketplaceLoading, setIsMarketplaceLoading] = useState(false);

  const { data: session, status } = useSession();
  const router = useRouter();

  const dashboardHref =
    session?.user.role === "artisan"
      ? "/dashboard/artisan"
      : "/dashboard/customer";

  const handleFindProClick = () => {
    setIsSearching(true);
    setTimeout(() => {
      router.push("/search");
      setTimeout(() => setIsSearching(false), 500);
    }, 800);
  };

  const handleMarketplaceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMarketplaceLoading(true);
    setOpen(false); // Close mobile menu if open

    setTimeout(() => {
      router.push("/marketplace");
      setTimeout(() => setIsMarketplaceLoading(false), 500);
    }, 800);
  };

  return (
    <>
      {isSearching && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/80 backdrop-blur-sm">
          <KiwiLoader />
        </div>
      )}

      {isMarketplaceLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-900/80 backdrop-blur-sm">
          <MarketplaceLoader />
        </div>
      )}

      <header className="sticky top-0 z-40 bg-navy-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-sm font-display text-lg font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-amber-500"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green-600">
              <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
            </span>
            NaijaCraft
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) =>
              link.label === "Marketplace" ? (
                <button
                  key={link.href}
                  onClick={handleMarketplaceClick}
                  className="text-sm font-medium text-navy-100 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-amber-500"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-navy-100 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-amber-500"
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/cart"
              className="flex items-center gap-2 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber-500"
            >
              <ShoppingBag className="h-4 w-4" />
              Cart
            </Link>

            {status === "authenticated" ? (
              <>
                <Link
                  href={dashboardHref}
                  className="rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber-500"
                >
                  My Dashboard
                </Link>

                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1.5 rounded-lg border border-navy-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber-500"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg border border-navy-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber-500"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber-500"
                >
                  Sign up
                </Link>
              </>
            )}

            <button
              onClick={handleFindProClick}
              className="hidden rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber-500 md:inline-block"
            >
              Find a Pro
            </button>
            <Link
              href="/search"
              className="hidden rounded-lg bg-brand-amber-500 px-4 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-brand-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:inline-block"
            >
              Get a quote
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber-500 sm:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div
            id="mobile-menu"
            className="border-t border-navy-800 bg-navy-900 px-4 pb-6 pt-2 sm:hidden"
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) =>
                link.label === "Marketplace" ? (
                  <button
                    key={link.href}
                    onClick={handleMarketplaceClick}
                    className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy-100 hover:bg-navy-800 hover:text-white"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-100 hover:bg-navy-800 hover:text-white"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/search"
                className="rounded-lg bg-brand-amber-500 px-4 py-2.5 text-center text-sm font-semibold text-navy-900"
              >
                Get a quote
              </Link>

              <button
                onClick={() => {
                  setOpen(false);
                  handleFindProClick();
                }}
                className="rounded-lg bg-brand-green-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Find a Pro
              </button>

              <Link
                href="/cart"
                className="flex items-center justify-center gap-2 rounded-lg border border-navy-700 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-navy-800"
              >
                <ShoppingBag className="h-4 w-4" />
                Cart
              </Link>

              {status === "authenticated" ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="rounded-lg border border-navy-700 px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    My Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-navy-700 px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg border border-navy-700 px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg border border-navy-700 px-4 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
