"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchHeader } from "@/components/search/SearchHeader";
import { FilterSidebar } from "@/components/search/FilterSidebar";
import { ResultsToolbar } from "@/components/search/ResultsToolbar";
import { ArtisanCard } from "@/components/search/ArtisanCard";
import { EmptyState } from "@/components/search/EmptyState";
import { MapPanel } from "@/components/search/MapPanel";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { mapApiArtisanToUi, type ApiArtisan } from "@/lib/mapArtisan";
import { defaultFilters, type Artisan, type SearchFilters } from "@/types/artisan";

function buildQueryString(filters: SearchFilters) {
  const params = new URLSearchParams();

  if (filters.query.trim()) params.set("q", filters.query.trim());
  filters.serviceCategories.forEach((c) => params.append("category", c));
  filters.languages.forEach((l) => params.append("language", l));
  filters.verification.forEach((v) => params.append("verification", v));

  if (filters.sellerType !== "any") params.set("sellerType", filters.sellerType);
  params.set("minPrice", String(filters.minPrice));
  params.set("maxPrice", String(filters.maxPrice));
  if (filters.minRating !== null) params.set("minRating", String(filters.minRating));

  return params.toString();
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    ...defaultFilters,
    query: searchParams.get("q") ?? "",
  }));
  const [results, setResults] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchArtisans() {
      setLoading(true);
      setError(null);

      try {
        const query = buildQueryString(filters);
        const res = await fetch(`/api/artisans?${query}`, { signal: controller.signal });

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data: { artisans: ApiArtisan[] } = await res.json();
        setResults(data.artisans.map(mapApiArtisanToUi));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Failed to fetch artisans:", err);
        setError("Couldn't load artisans. Is your dev server running and MONGODB_URI set?");
      } finally {
        setLoading(false);
      }
    }

    fetchArtisans();

    return () => controller.abort();
  }, [filters]);

  return (
    <>
      <SearchHeader
        query={filters.query}
        onQueryChange={(query) => setFilters((f) => ({ ...f, query }))}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr_300px]">
          <FilterSidebar filters={filters} onChange={setFilters} />

          <div className="flex flex-col gap-4">
            <ResultsToolbar />

            {loading ? (
              <div className="rounded-2xl border border-cloud-200 bg-white p-6 text-sm text-ink-500">
                Loading artisans...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-brand-amber-100 bg-brand-amber-100/40 p-6 text-sm text-ink-700">
                {error}
              </div>
            ) : results.length === 0 ? (
              <EmptyState onReset={() => setFilters(defaultFilters)} />
            ) : (
              results.map((artisan) => <ArtisanCard key={artisan.id} artisan={artisan} />)
            )}

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-ink-500">
                Showing 1-{results.length} of {results.length} artisans
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded-lg border border-cloud-200 px-3 py-1.5 text-sm text-navy-900 transition-colors hover:bg-cloud-50 disabled:opacity-40"
                  disabled
                >
                  Prev
                </button>
                <span className="rounded-lg bg-navy-900 px-3 py-1.5 text-sm font-semibold text-white">
                  1
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-cloud-200 px-3 py-1.5 text-sm text-navy-900 transition-colors hover:bg-cloud-50 disabled:opacity-40"
                  disabled
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <MapPanel />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-ink-500">Loading search...</p>
        </div>
      }
    >
      <SearchPageInner />
    </Suspense>
  );
}
