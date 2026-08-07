import { SearchX } from "lucide-react";

export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-brand-amber-100 bg-brand-amber-100/40 p-6">
      <div className="flex items-start gap-3">
        <SearchX className="mt-0.5 h-5 w-5 shrink-0 text-brand-amber-600" />
        <div className="flex-1">
          <h3 className="font-display text-base font-bold text-navy-900">
            No results found for your exact filters
          </h3>
          <p className="mt-1 text-sm text-ink-700">
            Try broadening your search: remove some filters, increase price range, or
            request a custom quote from artisans who match loosely.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700"
            >
              Request Custom Quote
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-cloud-200 bg-white px-4 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-cloud-50"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
