"use client";

import { Bell, Search, Star } from "lucide-react";

export function ResultsToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-cloud-200 bg-white p-4">
      <label className="relative min-w-[220px] flex-1">
        <span className="sr-only">Refine search</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <input
          type="text"
          placeholder="Refine search (e.g., 'bridal tailor, WordPress dev')"
          className="w-full rounded-lg border border-cloud-200 bg-cloud-50 py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green-100"
        />
      </label>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink-500">Sort:</span>
        <select className="rounded-lg border border-cloud-200 bg-white px-3 py-2 text-sm font-medium text-navy-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100">
          <option>Relevance</option>
          <option>Highest rated</option>
          <option>Price: low to high</option>
          <option>Fastest response</option>
        </select>
      </div>

      <button
        type="button"
        className="flex items-center gap-1.5 rounded-lg bg-brand-green-100 px-3.5 py-2 text-sm font-semibold text-brand-green-700 transition-colors hover:bg-brand-green-100/70"
      >
        <Bell className="h-4 w-4" />
        Saved Search
      </button>
      <button
        type="button"
        className="flex items-center gap-1.5 rounded-lg border border-cloud-200 px-3.5 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-cloud-50"
      >
        <Star className="h-4 w-4" />
        Save alert
      </button>
    </div>
  );
}
