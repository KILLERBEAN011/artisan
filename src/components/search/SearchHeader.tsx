"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, User, Wrench } from "lucide-react";
import Link from "next/link";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function SearchHeader({ query, onQueryChange }: Props) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-cloud-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-sm font-display text-lg font-bold text-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-green-500"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
            <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          NaijaCraft
        </Link>

        <label className="relative order-3 min-w-[240px] flex-1 sm:order-2">
          <span className="sr-only">Search artisans, skills or services</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search artisans, skills or services (e.g., 'tailor, plumber, UI designer')"
            className="w-full rounded-lg border border-cloud-200 bg-cloud-50 py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green-100"
          />
        </label>

        <div className="order-2 ml-auto flex shrink-0 items-center gap-3 sm:order-3 sm:ml-0">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-cloud-200 px-3.5 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-cloud-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-500"
          >
            <Bell className="h-4 w-4" />
            Alerts
          </button>
          {session ? (
            <Link
              href={session.user.role === "artisan" ? "/dashboard/artisan" : "/dashboard/customer"}
              className="flex items-center gap-2 rounded-lg border border-cloud-200 px-3 py-2 text-left transition-colors hover:bg-cloud-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-500"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-100 text-navy-900">
                <User className="h-4 w-4" />
              </span>
              <span className="hidden sm:block">
                <span className="block text-sm font-semibold leading-tight text-navy-900">
                  {session.user.name}
                </span>
                <span className="block text-xs capitalize leading-tight text-ink-500">
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
        </div>
      </div>
    </header>
  );
}
