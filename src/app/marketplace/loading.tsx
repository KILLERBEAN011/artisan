/* Shown instantly while the marketplace loads */
export default function MarketplaceLoading() {
  return (
    <div
      className="min-h-screen bg-cloud-50"
      aria-busy="true"
      aria-label="Loading the marketplace"
    >
      <div className="h-[124px] bg-navy-900" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-cloud-200" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-card border border-cloud-200 bg-white"
            >
              <div className="aspect-square animate-pulse bg-cloud-100" />
              <div className="flex flex-col gap-2 p-3">
                <div className="h-4 w-4/5 animate-pulse rounded bg-cloud-200" />
                <div className="h-5 w-1/3 animate-pulse rounded bg-cloud-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-cloud-100" />
                <div className="mt-2 h-10 animate-pulse rounded-lg bg-cloud-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
