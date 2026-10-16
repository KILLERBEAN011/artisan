"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

const TABS = [
  { label: "Completed Bookings", href: "/admin/bookings" },
  { label: "Listings", href: "/admin/listings" },
  { label: "Marketplace Orders", href: "/dashboard/admin/orders" },
  { label: "Site Settings", href: "/admin/settings" },
  { label: "Manage Artisans", href: "/admin/artisans" },
];

export function AdminNav({
  pendingListings = 0,
}: {
  pendingListings?: number;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-4">
      <nav className="flex flex-wrap gap-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const badge =
            tab.href === "/admin/listings" && pendingListings > 0
              ? pendingListings
              : null;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-navy-900 text-white"
                  : "text-ink-700 hover:bg-cloud-50 hover:text-navy-900"
              }`}
            >
              {tab.label}
              {badge !== null && (
                <span
                  className="rounded-full bg-brand-amber-500 px-1.5 py-0.5 text-[11px] font-extrabold leading-none text-navy-900"
                  aria-label={`${badge} waiting for review`}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-1.5 rounded-lg border border-cloud-200 px-3 py-1.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-cloud-50"
      >
        <LogOut className="h-3.5 w-3.5" />
        Log out
      </button>
    </div>
  );
}
