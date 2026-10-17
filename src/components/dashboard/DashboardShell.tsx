"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import {
  Banknote,
  Bell,
  Calendar,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  Star,
  Store,
  User,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import type { NavIconKey, NavItem } from "@/types/dashboard";
import Link from "next/link";

const ICONS: Record<NavIconKey, typeof LayoutGrid> = {
  overview: LayoutGrid,
  jobs: Calendar,
  wallet: Wallet,
  reviews: Star,
  settings: User,
  support: LifeBuoy,
  earnings: Banknote,
  verification: ShieldCheck,
  shop: Store,
  orders: Package,
};

type Props = {
  navItems: NavItem[];
  userName: string;
  userRole: string;
  children: React.ReactNode;
};

export function DashboardShell({
  navItems,
  userName,
  userRole,
  children,
}: Props) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cloud-50 dark:bg-[#101D3F]">
      <header className="sticky top-0 z-40 border-b border-cloud-200 bg-white dark:border-navy-800 dark:bg-[#101D3F]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-900 dark:text-white lg:hidden"
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-lg font-bold text-navy-900 dark:text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 dark:bg-brand-green-600">
                <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
              </span>
              NaijaCraft
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-cloud-200 text-navy-900 transition-colors hover:bg-cloud-50 dark:border-navy-700 dark:text-white dark:hover:bg-navy-800"
            >
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-cloud-200 px-3 py-1.5 dark:border-navy-700">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-100 text-navy-900 dark:bg-navy-800 dark:text-white">
                <User className="h-4 w-4" />
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold leading-tight text-navy-900 dark:text-white">
                  {userName}
                </span>
                <span className="block text-xs leading-tight text-ink-500 dark:text-ink-400">
                  {userRole}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-1.5 rounded-lg border border-cloud-200 px-3 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-cloud-50 dark:border-navy-700 dark:text-white dark:hover:bg-navy-800"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="hidden w-56 shrink-0 lg:block">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      item.active
                        ? "bg-navy-900 text-white dark:bg-white dark:text-navy-900"
                        : "text-ink-700 hover:bg-white hover:text-navy-900 dark:text-ink-300 dark:hover:bg-navy-800 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {mobileNavOpen && (
          <nav className="fixed inset-0 z-30 bg-white p-4 pt-20 dark:bg-[#101D3F] lg:hidden">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = ICONS[item.icon];
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                        item.active
                          ? "bg-navy-900 text-white dark:bg-white dark:text-navy-900"
                          : "text-ink-700 hover:bg-cloud-50 dark:text-ink-300 dark:hover:bg-navy-800 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
