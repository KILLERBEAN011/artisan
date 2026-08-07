"use client";

import { defaultFilters, type SearchFilters } from "@/types/artisan";

type Props = {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
};

const SERVICE_CATEGORIES = ["Home Repair", "Tailoring & Fashion", "Graphic & Web Design"];
const SUBSERVICES = ["Logo Design", "Website Landing Page"];
const LANGUAGES = ["English", "Yoruba", "Igbo"];
const VERIFICATIONS = ["ID Verified", "BVN Verified"];

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-cloud-200 py-5 first:pt-0 last:border-b-0">
      <h3 className="mb-3 text-sm font-semibold text-navy-900">{label}</h3>
      {children}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-ink-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-cloud-200 text-brand-green-600 focus:ring-2 focus:ring-brand-green-100"
      />
      {label}
    </label>
  );
}

function Radio({
  label,
  name,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-ink-700">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 border-cloud-200 text-brand-green-600 focus:ring-2 focus:ring-brand-green-100"
      />
      {label}
    </label>
  );
}

export function FilterSidebar({ filters, onChange }: Props) {
  return (
    <aside className="rounded-2xl border border-cloud-200 bg-white p-5">
      <h2 className="mb-1 font-display text-lg font-bold text-navy-900">Filters</h2>

      <FilterGroup label="Service category">
        {SERVICE_CATEGORIES.map((cat) => (
          <Checkbox
            key={cat}
            label={cat}
            checked={filters.serviceCategories.includes(cat)}
            onChange={() =>
              onChange({
                ...filters,
                serviceCategories: toggle(filters.serviceCategories, cat),
              })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Subservices">
        {SUBSERVICES.map((sub) => (
          <Checkbox
            key={sub}
            label={sub}
            checked={filters.subservices.includes(sub)}
            onChange={() =>
              onChange({ ...filters, subservices: toggle(filters.subservices, sub) })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Price range (NGN)">
        <div className="mb-2 flex justify-between text-xs text-ink-500">
          <span>NGN {filters.minPrice.toLocaleString()}</span>
          <span>NGN {filters.maxPrice.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={2500}
          max={150000}
          step={500}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-brand-green-600"
        />
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            value={filters.minPrice}
            onChange={(e) => onChange({ ...filters, minPrice: Number(e.target.value) })}
            className="w-1/2 rounded-lg border border-cloud-200 px-2.5 py-1.5 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
          />
          <input
            type="number"
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
            className="w-1/2 rounded-lg border border-cloud-200 px-2.5 py-1.5 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
          />
        </div>
      </FilterGroup>

      <FilterGroup label="Availability">
        <Radio
          label="Next 24 hours"
          name="availability"
          checked={filters.availability === "24h"}
          onChange={() => onChange({ ...filters, availability: "24h" })}
        />
        <Radio
          label="Next 3 days"
          name="availability"
          checked={filters.availability === "3d"}
          onChange={() => onChange({ ...filters, availability: "3d" })}
        />
        <Radio
          label="Custom date"
          name="availability"
          checked={filters.availability === "custom"}
          onChange={() => onChange({ ...filters, availability: "custom" })}
        />
      </FilterGroup>

      <FilterGroup label="Rating">
        <Radio
          label="4.5 & up"
          name="rating"
          checked={filters.minRating === 4.5}
          onChange={() => onChange({ ...filters, minRating: 4.5 })}
        />
        <Radio
          label="4.0 & up"
          name="rating"
          checked={filters.minRating === 4.0}
          onChange={() => onChange({ ...filters, minRating: 4.0 })}
        />
      </FilterGroup>

      <FilterGroup label="Distance">
        <Checkbox
          label="Use GPS (detect nearby)"
          checked={filters.useGps}
          onChange={() => onChange({ ...filters, useGps: !filters.useGps })}
        />
        <input
          type="text"
          placeholder="City or neighborhood (e.g., Yaba, Lagos)"
          className="mt-2 w-full rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
        />
      </FilterGroup>

      <FilterGroup label="Language">
        {LANGUAGES.map((lang) => (
          <Checkbox
            key={lang}
            label={lang}
            checked={filters.languages.includes(lang)}
            onChange={() => onChange({ ...filters, languages: toggle(filters.languages, lang) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Verification">
        {VERIFICATIONS.map((v) => (
          <Checkbox
            key={v}
            label={v}
            checked={filters.verification.includes(v)}
            onChange={() =>
              onChange({ ...filters, verification: toggle(filters.verification, v) })
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup label="Seller type">
        <Radio
          label="Independent"
          name="sellerType"
          checked={filters.sellerType === "independent"}
          onChange={() => onChange({ ...filters, sellerType: "independent" })}
        />
        <Radio
          label="Company"
          name="sellerType"
          checked={filters.sellerType === "company"}
          onChange={() => onChange({ ...filters, sellerType: "company" })}
        />
      </FilterGroup>

      <div className="mt-2 flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onChange(defaultFilters)}
          className="flex-1 rounded-lg border border-cloud-200 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-cloud-50"
        >
          Reset
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg bg-brand-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700"
        >
          Apply
        </button>
      </div>
    </aside>
  );
}
