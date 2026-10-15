import Link from "next/link";
import {
  NIGERIAN_STATES,
  SORT_OPTIONS,
  type FeedFilters,
} from "@/lib/marketplace";

/**
 * Filters as a plain GET form: works without JavaScript, and every filter
 * combination has its own shareable URL. Rendered twice on the page
 * (phone drawer and desktop sidebar), so ids get a prefix.
 */
export default function FilterPanel({
  filters,
  idPrefix,
}: {
  filters: FeedFilters;
  idPrefix: string;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const field =
    "h-11 w-full rounded-lg border border-cloud-200 bg-white px-3 text-sm text-ink-900 focus:border-brand-green-600 focus:outline-none focus:ring-2 focus:ring-brand-green-100";
  const legend = "mb-2 text-xs font-bold uppercase tracking-wide text-ink-700";

  return (
    <form action="/marketplace" method="get" className="flex flex-col gap-5">
      {filters.q && <input type="hidden" name="q" value={filters.q} />}
      {filters.category && (
        <input type="hidden" name="category" value={filters.category} />
      )}
      {filters.seller && (
        <input type="hidden" name="seller" value={filters.seller} />
      )}

      <div>
        <label htmlFor={id("sort")} className={legend + " block"}>
          Sort by
        </label>
        <select
          id={id("sort")}
          name="sort"
          defaultValue={filters.sort}
          className={field}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className={legend}>Sold by</legend>
        <RadioGroup
          name="sellerType"
          idPrefix={id("seller")}
          value={filters.sellerType}
          options={[
            { value: "", label: "Everyone" },
            { value: "official", label: "NaijaCraft Store" },
            { value: "seller", label: "Marketplace sellers" },
          ]}
        />
      </fieldset>

      <fieldset>
        <legend className={legend}>Type</legend>
        <RadioGroup
          name="listingType"
          idPrefix={id("type")}
          value={filters.listingType}
          options={[
            { value: "", label: "All" },
            { value: "handmade", label: "Handmade" },
            { value: "resale", label: "Shop stock" },
            { value: "service", label: "Services" },
          ]}
        />
      </fieldset>

      <fieldset>
        <legend className={legend}>Condition</legend>
        <RadioGroup
          name="condition"
          idPrefix={id("condition")}
          value={filters.condition}
          options={[
            { value: "", label: "Any" },
            { value: "new", label: "New" },
            { value: "used_like_new", label: "Used, like new" },
            { value: "used_good", label: "Used, good" },
          ]}
        />
      </fieldset>

      <fieldset>
        <legend className={legend}>Price (₦)</legend>
        <div className="flex items-center gap-2">
          <label htmlFor={id("min")} className="sr-only">
            Minimum price
          </label>
          <input
            id={id("min")}
            name="minPrice"
            inputMode="numeric"
            placeholder="Min"
            defaultValue={filters.minPrice}
            className={field}
          />
          <span aria-hidden="true" className="text-ink-500">
            –
          </span>
          <label htmlFor={id("max")} className="sr-only">
            Maximum price
          </label>
          <input
            id={id("max")}
            name="maxPrice"
            inputMode="numeric"
            placeholder="Max"
            defaultValue={filters.maxPrice}
            className={field}
          />
        </div>
      </fieldset>

      <div>
        <label htmlFor={id("state")} className={legend + " block"}>
          Location
        </label>
        <select
          id={id("state")}
          name="state"
          defaultValue={filters.state ?? ""}
          className={field}
        >
          <option value="">Anywhere in Nigeria</option>
          {NIGERIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="submit"
          className="h-11 rounded-lg bg-brand-green-600 text-sm font-bold text-white transition-colors hover:bg-brand-green-700"
        >
          Apply filters
        </button>
        <Link
          href={
            filters.category
              ? `/marketplace?category=${encodeURIComponent(filters.category)}`
              : "/marketplace"
          }
          className="flex h-11 items-center justify-center rounded-lg text-sm font-semibold text-ink-700 hover:bg-cloud-100"
        >
          Clear filters
        </Link>
      </div>
    </form>
  );
}

function RadioGroup({
  name,
  idPrefix,
  value,
  options,
}: {
  name: string;
  idPrefix: string;
  value?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      {options.map((o) => {
        const inputId = `${idPrefix}-${o.value || "all"}`;
        return (
          <label
            key={inputId}
            htmlFor={inputId}
            className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm text-ink-900"
          >
            <input
              id={inputId}
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={(value ?? "") === o.value}
              className="h-4 w-4 accent-brand-green-600"
            />
            {o.label}
          </label>
        );
      })}
    </div>
  );
}
