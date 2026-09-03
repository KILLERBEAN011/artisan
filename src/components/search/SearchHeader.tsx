"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, User, Wrench, MapPin } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  location: string;
  onLocationChange: (value: string) => void;
};

export function SearchHeader({
  query,
  onQueryChange,
  location,
  onLocationChange,
}: Props) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-cloud-200 bg-white transition-colors dark:border-navy-800 dark:bg-[#101D3F]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-sm font-display text-lg font-bold text-navy-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-green-500 dark:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 transition-colors dark:bg-brand-green-600">
            <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          NaijaCraft
        </Link>

        <div className="relative order-3 flex min-w-[320px] flex-1 items-center rounded-lg border border-cloud-200 bg-cloud-50 transition-colors focus-within:border-brand-green-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-green-100 sm:order-2 dark:border-navy-700 dark:bg-[#17264a] dark:focus-within:bg-[#17264a]">
          <label className="relative flex-1">
            <span className="sr-only">Search artisans, skills or services</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500 dark:text-ink-300" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search artisans (e.g., tailor)"
              className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none dark:text-white dark:placeholder:text-ink-400"
            />
          </label>

          <div className="hidden h-5 w-px bg-cloud-300 sm:block dark:bg-navy-700"></div>

          <label className="relative hidden flex-[0.7] sm:block">
            <span className="sr-only">Location</span>
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500 dark:text-ink-300" />
            <input
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Where? (e.g., Ogbomoso)"
              className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none dark:text-white dark:placeholder:text-ink-400"
            />
          </label>
        </div>

        <div className="order-2 ml-auto flex shrink-0 items-center gap-3 sm:order-3 sm:ml-0">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-cloud-200 px-3.5 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-cloud-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-500 dark:border-navy-700 dark:text-white dark:hover:bg-navy-800"
          >
            <Bell className="h-4 w-4" />
            Alerts
          </button>
          {session ? (
            <Link
              href={
                session.user.role === "artisan"
                  ? "/dashboard/artisan"
                  : "/dashboard/customer"
              }
              className="flex items-center gap-2 rounded-lg border border-cloud-200 px-3 py-2 text-left transition-colors hover:bg-cloud-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-500 dark:border-navy-700 dark:hover:bg-navy-800"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-100 text-navy-900 transition-colors dark:bg-navy-800 dark:text-white">
                <User className="h-4 w-4" />
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold leading-tight text-navy-900 dark:text-white">
                  {session.user.name}
                </span>
                <span className="block text-xs capitalize leading-tight text-ink-500 dark:text-ink-400">
                  {session.user.role}
                </span>
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-brand-green-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700"
            >
              Log in
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
