import Link from "next/link";
import { AlertTriangle, Clock, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { artisanNavItems, customerNavItems } from "@/lib/nav-items";
import type { SellerContext } from "@/lib/seller";

/** Puts the selling pages inside the right dashboard for whoever is logged in. */
export function SellerPageShell({
  ctx,
  activeHref = ctx.listingsHref,
  children,
}: {
  ctx: SellerContext;
  activeHref?: string;
  children: React.ReactNode;
}) {
  const { user, admin } = ctx;

  if (admin) {
    return (
      <div className="min-h-screen bg-cloud-50">
        <header className="border-b border-cloud-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/admin/listings" className="font-display text-lg font-bold text-navy-900">
              NaijaCraft Admin
            </Link>
            <Link href="/admin/listings" className="text-sm font-semibold text-brand-green-600 hover:underline">
              Back to listings
            </Link>
          </div>
        </header>
        <main className="px-4 py-8">{children}</main>
      </div>
    );
  }

  const isArtisan = user.role === "artisan";
  return (
    <DashboardShell
      navItems={isArtisan ? artisanNavItems(activeHref) : customerNavItems(activeHref)}
      userName={user.name || (isArtisan ? "Artisan" : "Seller")}
      userRole={isArtisan ? "Artisan" : "Seller"}
    >
      {children}
    </DashboardShell>
  );
}

/** Shown to someone who isn't approved to sell yet, based on where their application is. */
export function NotASellerYet({ status }: { status?: string }) {
  const box = "mx-auto flex max-w-lg flex-col items-center gap-3 rounded-2xl border border-cloud-200 bg-white p-8 text-center";
  const button =
    "mt-2 flex h-11 items-center rounded-lg bg-brand-green-600 px-5 text-sm font-bold text-white hover:bg-brand-green-700";

  if (status === "pending") {
    return (
      <div className={box}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-amber-100">
          <Clock className="h-6 w-6 text-brand-amber-600" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-bold text-navy-900">We&apos;re reviewing your application</h1>
        <p className="text-sm text-ink-500">We&apos;ll email you as soon as you&apos;re approved. Then you can start listing.</p>
      </div>
    );
  }
  if (status === "rejected" || status === "suspended") {
    return (
      <div className={box}>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-6 w-6 text-red-700" aria-hidden="true" />
        </span>
        <h1 className="font-display text-xl font-bold text-navy-900">
          {status === "rejected" ? "Your application needs changes" : "Your shop is suspended"}
        </h1>
        <Link href="/sell" className={button}>
          See details
        </Link>
      </div>
    );
  }
  return (
    <div className={box}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-100">
        <ShieldCheck className="h-6 w-6 text-brand-green-700" aria-hidden="true" />
      </span>
      <h1 className="font-display text-xl font-bold text-navy-900">Open a shop on NaijaCraft</h1>
      <p className="text-sm text-ink-500">
        Sell what you make, stock you resell, or a fixed-price service. We verify every seller first to keep buyers
        safe.
      </p>
      <Link href="/sell" className={button}>
        Start selling
      </Link>
    </div>
  );
}
