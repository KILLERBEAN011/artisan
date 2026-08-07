"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

const TABS = [
  { label: "Completed Bookings", href: "/admin/bookings" },
  { label: "Site Settings", href: "/admin/settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-4">
      <nav className="flex gap-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-navy-900 text-white"
                  : "text-ink-700 hover:bg-cloud-50 hover:text-navy-900"
              }`}
            >
              {tab.label}
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
