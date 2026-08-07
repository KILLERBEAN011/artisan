import { MapPin } from "lucide-react";

export function MapPanel() {
  return (
    <div className="sticky top-20 rounded-2xl border border-cloud-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy-900">Map</h3>
        <span className="text-xs text-ink-500">Clustered markers</span>
      </div>

      <div
        role="img"
        aria-label="Map showing clustered artisan locations across Lagos"
        className="flex aspect-[4/5] items-center justify-center rounded-xl bg-cloud-100"
      >
        <MapPin className="h-6 w-6 text-ink-300" />
      </div>

      <div className="mt-4 rounded-xl bg-cloud-50 p-3.5 text-sm">
        <p className="font-semibold text-navy-900">Compare</p>
        <p className="mt-1 text-xs text-ink-500">
          Pin artisans to compare
        </p>
        <p className="mt-2 text-xs font-medium text-ink-700">
          No artisans pinned — tap &lsquo;Pin&rsquo; on a card to add
        </p>
      </div>
    </div>
  );
}
