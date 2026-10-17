"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { AlertTriangle, ArrowLeft, Hammer, Loader2, Package, Wrench } from "lucide-react";
import { PhotoUploader } from "@/components/marketplace/PhotoUploader";
import {
  CONDITION_LABELS,
  NIGERIAN_STATES,
  PRODUCT_CATEGORIES,
  type ListingType,
  type ProductStatus,
} from "@/lib/product-options";

/* ------------------------------------------------------------------ */
/*  Shapes                                                              */
/* ------------------------------------------------------------------ */

/** A product as the edit page passes it in (plain JSON). */
export type EditableProduct = {
  _id: string;
  status: ProductStatus;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  category: string;
  images: string[];
  sellerType: "official" | "seller";
  listingType: ListingType;
  condition: string;
  stock: number;
  leadTimeDays?: number;
  options?: { name: string; values: string[] }[];
  location?: { state?: string; city?: string };
  delivery?: { method: string; fee: number; etaDays?: number; note?: string }[];
  service?: { durationMinutes?: number; includes?: string };
  proofOfPurchase?: string;
  authenticityConfirmed?: boolean;
  review?: { rejectionReason?: string };
};

type DeliveryRow = { on: boolean; fee: string; eta: string; note: string };

type Values = {
  listingType: ListingType;
  official: boolean;
  name: string;
  category: string;
  condition: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  stock: string;
  leadTimeDays: string;
  description: string;
  images: string[];
  sizes: string;
  colours: string;
  state: string;
  city: string;
  selfDelivery: DeliveryRow;
  pickup: DeliveryRow;
  platform: DeliveryRow;
  durationMinutes: string;
  includes: string;
  proofOfPurchase: string[];
  authenticityConfirmed: boolean;
};

const emptyRow = (on = false): DeliveryRow => ({ on, fee: "", eta: "", note: "" });

function toValues(p: EditableProduct | undefined, defaults: { state?: string; city?: string; listingType: ListingType }): Values {
  const opt = (name: string) => p?.options?.find((o) => o.name.toLowerCase() === name)?.values.join(", ") ?? "";
  const row = (method: string): DeliveryRow => {
    const d = p?.delivery?.find((x) => x.method === method);
    return d
      ? { on: true, fee: d.fee ? String(d.fee) : "", eta: d.etaDays ? String(d.etaDays) : "", note: d.note ?? "" }
      : emptyRow(!p && method === "self_delivery");
  };
  const num = (n?: number) => (n === undefined || n === null ? "" : String(n));

  return {
    listingType: p?.listingType ?? defaults.listingType,
    official: p?.sellerType === "official",
    name: p?.name ?? "",
    category: p?.category ?? "Fashion",
    condition: p?.condition ?? "new",
    price: num(p?.price),
    compareAtPrice: num(p?.compareAtPrice),
    costPrice: num(p?.costPrice),
    stock: p ? String(p.stock ?? 1) : "1",
    leadTimeDays: num(p?.leadTimeDays),
    description: p?.description ?? "",
    images: p?.images ?? [],
    sizes: opt("size"),
    colours: opt("colour"),
    state: p?.location?.state || defaults.state || "",
    city: p?.location?.city || defaults.city || "",
    selfDelivery: row("self_delivery"),
    pickup: row("pickup"),
    platform: row("platform"),
    durationMinutes: num(p?.service?.durationMinutes),
    includes: p?.service?.includes ?? "",
    proofOfPurchase: p?.proofOfPurchase ? [p.proofOfPurchase] : [],
    authenticityConfirmed: Boolean(p?.authenticityConfirmed),
  };
}

const cleanNumber = (s: string) => {
  const n = Number(s.replace(/[₦,\s]/g, ""));
  return s.trim() === "" || !Number.isFinite(n) ? undefined : Math.round(n);
};
const splitList = (s: string) =>
  s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 20);

/** What the API receives. Keys are the API's field names. */
function toBody(v: Values, isAdmin: boolean) {
  const service = v.listingType === "service";
  const body: Record<string, unknown> = {
    listingType: v.listingType,
    name: v.name.trim(),
    category: v.category,
    description: v.description.trim(),
    price: cleanNumber(v.price),
    compareAtPrice: cleanNumber(v.compareAtPrice) ?? null,
    images: v.images,
    location: { state: v.state, city: v.city.trim() || undefined },
    condition: service || v.listingType === "handmade" ? "new" : v.condition,
    stock: service ? 1 : (cleanNumber(v.stock) ?? 0),
    leadTimeDays: v.listingType === "handmade" ? (cleanNumber(v.leadTimeDays) ?? null) : null,
    options: service
      ? []
      : [
          { name: "Size", values: splitList(v.sizes) },
          { name: "Colour", values: splitList(v.colours) },
        ].filter((o) => o.values.length > 0),
    delivery: service
      ? []
      : (
          [
            ["self_delivery", v.selfDelivery],
            ["pickup", v.pickup],
            ["platform", v.platform],
          ] as const
        )
          .filter(([, r]) => r.on)
          .map(([method, r]) => ({
            method,
            fee: method === "pickup" ? 0 : (cleanNumber(r.fee) ?? 0),
            etaDays: method === "pickup" ? undefined : cleanNumber(r.eta),
            note: r.note.trim() || undefined,
          })),
    service: service
      ? { durationMinutes: cleanNumber(v.durationMinutes), includes: v.includes.trim() || undefined }
      : undefined,
    proofOfPurchase: v.listingType === "resale" ? (v.proofOfPurchase[0] ?? "") : "",
    authenticityConfirmed: v.listingType === "resale" ? v.authenticityConfirmed : false,
  };
  if (isAdmin) {
    body.sellerType = v.official ? "official" : "seller";
    body.costPrice = cleanNumber(v.costPrice) ?? null;
  }
  return body;
}

/** Problems that stop a listing being submitted (drafts can be saved with gaps). */
function problems(v: Values, forSubmit: boolean) {
  const list: string[] = [];
  if (v.name.trim().length < 3) list.push("Give your listing a title.");
  const price = cleanNumber(v.price);
  if (!price || price <= 0) list.push("Enter a price.");
  if (v.images.length === 0) list.push("Add at least one photo.");
  if (!forSubmit) return list;
  if (v.description.trim().length < 20) list.push("Write a description of at least 20 characters.");
  if (!v.state) list.push("Choose the state you sell from.");
  if (v.listingType !== "service" && !v.selfDelivery.on && !v.pickup.on && !v.platform.on) {
    list.push("Choose at least one way buyers can get the item.");
  }
  if (v.listingType === "resale" && !v.authenticityConfirmed) {
    list.push("Confirm the item is genuine and yours to sell.");
  }
  return list;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

type Props = {
  product?: EditableProduct;
  isAdmin: boolean;
  defaultListingType: ListingType;
  defaultState?: string;
  defaultCity?: string;
  /** Where to go after saving, and where the back link points. */
  backHref: string;
};

const LISTING_TYPES_UI: { id: ListingType; title: string; body: string; icon: typeof Hammer }[] = [
  { id: "handmade", title: "Something I made", body: "Clothes, furniture, crafts, food. Gets the Handmade badge.", icon: Hammer },
  { id: "resale", title: "Something I resell", body: "New or used stock you bought to sell on.", icon: Package },
  { id: "service", title: "A fixed-price service", body: "A job with a set price and a clear scope.", icon: Wrench },
];

export function ProductForm({ product, isAdmin, defaultListingType, defaultState, defaultCity, backHref }: Props) {
  const router = useRouter();
  const editing = Boolean(product);
  const initial = useMemo(
    () => toValues(product, { state: defaultState, city: defaultCity, listingType: defaultListingType }),
    [product, defaultState, defaultCity, defaultListingType],
  );
  const [v, setV] = useState<Values>(initial);
  const [saving, setSaving] = useState<"draft" | "submit" | "save" | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setV((prev) => ({ ...prev, [key]: value }));
  const setRow = (key: "selfDelivery" | "pickup" | "platform", patch: Partial<DeliveryRow>) =>
    setV((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const service = v.listingType === "service";
  const status = product?.status;
  const canSubmitForReview = !editing || status === "draft" || status === "rejected";

  async function save(action: "draft" | "submit" | "save") {
    const forSubmit = action === "submit" || (action === "save" && status !== "draft");
    const found = problems(v, forSubmit);
    setErrors(found);
    if (found.length) {
      toast.error(found[0]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(action);
    try {
      const body = toBody(v, isAdmin);
      let res: Response;

      if (editing && product) {
        // Send only what changed, so editing a price doesn't send a live item back for review
        const before = toBody(initial, isAdmin);
        const changed: Record<string, unknown> = {};
        for (const key of Object.keys(body)) {
          if (JSON.stringify(body[key]) !== JSON.stringify(before[key])) changed[key] = body[key];
        }
        if (action === "submit") changed.submit = true;
        if (Object.keys(changed).length === 0) {
          toast("No changes to save.");
          setSaving(null);
          return;
        }
        res = await fetch(`/api/products/${product._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(changed),
        });
      } else {
        res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, submit: action === "submit" }),
        });
      }

      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");

      toast.success(data.message || "Saved.");
      router.push(backHref);
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setErrors([message]);
      toast.error(message);
      setSaving(null);
    }
  }

  const field =
    "h-11 w-full rounded-lg border border-cloud-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-green-600 focus:outline-none focus:ring-2 focus:ring-brand-green-100";
  const labelCls = "mb-1.5 block text-sm font-semibold text-navy-900";
  const card = "rounded-2xl border border-cloud-200 bg-white p-5 sm:p-6";
  const busy = saving !== null;

  return (
    <div className="mx-auto max-w-3xl">
      <Toaster position="top-center" />

      <Link href={backHref} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-green-600">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy-900">{editing ? "Edit listing" : "List something for sale"}</h1>
      <p className="mt-1 text-sm text-ink-500">
        {isAdmin
          ? "Admin listings go live straight away."
          : "Our team checks every listing before it goes live. Clear photos and honest details get approved fastest."}
      </p>

      {status === "rejected" && product?.review?.rejectionReason && (
        <div className="mt-4 flex gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            <strong>What to fix:</strong> {product.review.rejectionReason}
          </p>
        </div>
      )}

      {errors.length > 0 && (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <form
        className="mt-5 flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          save(editing ? "save" : "submit");
        }}
      >
        {/* 1. What kind of listing */}
        <fieldset className={card}>
          <legend className="sr-only">What are you listing?</legend>
          <p className="mb-3 text-sm font-semibold text-navy-900">What are you listing?</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {LISTING_TYPES_UI.map(({ id, title, body, icon: Icon }) => {
              const on = v.listingType === id;
              return (
                <label
                  key={id}
                  className={`flex cursor-pointer flex-col gap-1.5 rounded-xl p-4 transition-colors ${
                    on ? "bg-brand-green-100/60 ring-2 ring-brand-green-600" : "ring-1 ring-cloud-200 hover:bg-cloud-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="listingType"
                    value={id}
                    checked={on}
                    onChange={() => {
                      set("listingType", id);
                      if (id === "service") set("category", "Services");
                    }}
                    className="sr-only"
                  />
                  <Icon className={`h-5 w-5 ${on ? "text-brand-green-700" : "text-ink-500"}`} aria-hidden="true" />
                  <span className="text-sm font-bold text-navy-900">{title}</span>
                  <span className="text-xs leading-snug text-ink-500">{body}</span>
                </label>
              );
            })}
          </div>
          {isAdmin && (
            <label className="mt-4 flex items-center gap-2.5 text-sm text-ink-900">
              <input
                type="checkbox"
                checked={v.official}
                onChange={(e) => set("official", e.target.checked)}
                className="h-4 w-4 accent-brand-green-600"
              />
              Sold and shipped by <strong>NaijaCraft Store</strong> (your own stock)
            </label>
          )}
        </fieldset>

        {/* 2. Photos */}
        <div className={card}>
          <PhotoUploader
            label="Photos"
            hint={
              service
                ? "Show examples of your finished work. The first photo is the cover."
                : "At least 3 clear photos on a plain background: front, back and any details or flaws. The first photo is the cover."
            }
            photos={v.images}
            onChange={(images) => set("images", images)}
          />
        </div>

        {/* 3. Details */}
        <div className={`${card} grid gap-4 sm:grid-cols-2`}>
          <div className="sm:col-span-2">
            <label htmlFor="pf-name" className={labelCls}>
              Title
            </label>
            <input
              id="pf-name"
              value={v.name}
              onChange={(e) => set("name", e.target.value)}
              maxLength={120}
              placeholder={service ? "e.g. AC servicing, 1 unit" : "e.g. Handwoven aso-oke cap, wine"}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="pf-category" className={labelCls}>
              Category
            </label>
            <select id="pf-category" value={v.category} onChange={(e) => set("category", e.target.value)} className={field}>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {v.listingType === "resale" && (
            <div>
              <label htmlFor="pf-condition" className={labelCls}>
                Condition
              </label>
              <select id="pf-condition" value={v.condition} onChange={(e) => set("condition", e.target.value)} className={field}>
                {Object.entries(CONDITION_LABELS).map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </div>
          )}

          {v.listingType === "handmade" && (
            <div>
              <label htmlFor="pf-lead" className={labelCls}>
                Ready in (days) <span className="font-normal text-ink-500">optional</span>
              </label>
              <input
                id="pf-lead"
                inputMode="numeric"
                value={v.leadTimeDays}
                onChange={(e) => set("leadTimeDays", e.target.value)}
                placeholder="Leave empty if it's ready now"
                className={field}
              />
            </div>
          )}

          <div>
            <label htmlFor="pf-price" className={labelCls}>
              Price (₦)
            </label>
            <input
              id="pf-price"
              inputMode="numeric"
              value={v.price}
              onChange={(e) => set("price", e.target.value)}
              placeholder="e.g. 15000"
              className={field}
            />
          </div>

          <div>
            <label htmlFor="pf-compare" className={labelCls}>
              Old price (₦) <span className="font-normal text-ink-500">optional, shown crossed out</span>
            </label>
            <input
              id="pf-compare"
              inputMode="numeric"
              value={v.compareAtPrice}
              onChange={(e) => set("compareAtPrice", e.target.value)}
              className={field}
            />
          </div>

          {!service && (
            <div>
              <label htmlFor="pf-stock" className={labelCls}>
                How many do you have?
              </label>
              <input
                id="pf-stock"
                inputMode="numeric"
                value={v.stock}
                onChange={(e) => set("stock", e.target.value)}
                className={field}
              />
            </div>
          )}

          {isAdmin && v.official && (
            <div>
              <label htmlFor="pf-cost" className={labelCls}>
                What you paid (₦) <span className="font-normal text-ink-500">private</span>
              </label>
              <input
                id="pf-cost"
                inputMode="numeric"
                value={v.costPrice}
                onChange={(e) => set("costPrice", e.target.value)}
                className={field}
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label htmlFor="pf-description" className={labelCls}>
              Description
            </label>
            <textarea
              id="pf-description"
              rows={5}
              value={v.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={4000}
              placeholder={
                service
                  ? "What's included, what the customer needs to provide, and how long it takes."
                  : "Size or measurements, material, condition, and anything a buyer should know."
              }
              className="w-full rounded-lg border border-cloud-200 bg-white p-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-green-600 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
            />
          </div>

          {!service && (
            <>
              <div>
                <label htmlFor="pf-sizes" className={labelCls}>
                  Sizes <span className="font-normal text-ink-500">optional</span>
                </label>
                <input
                  id="pf-sizes"
                  value={v.sizes}
                  onChange={(e) => set("sizes", e.target.value)}
                  placeholder="e.g. S, M, L, XL"
                  className={field}
                />
              </div>
              <div>
                <label htmlFor="pf-colours" className={labelCls}>
                  Colours <span className="font-normal text-ink-500">optional</span>
                </label>
                <input
                  id="pf-colours"
                  value={v.colours}
                  onChange={(e) => set("colours", e.target.value)}
                  placeholder="e.g. Indigo, Wine"
                  className={field}
                />
              </div>
            </>
          )}

          {service && (
            <>
              <div>
                <label htmlFor="pf-duration" className={labelCls}>
                  How long it takes (minutes)
                </label>
                <input
                  id="pf-duration"
                  inputMode="numeric"
                  value={v.durationMinutes}
                  onChange={(e) => set("durationMinutes", e.target.value)}
                  placeholder="e.g. 60"
                  className={field}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="pf-includes" className={labelCls}>
                  What&apos;s included
                </label>
                <input
                  id="pf-includes"
                  value={v.includes}
                  onChange={(e) => set("includes", e.target.value)}
                  maxLength={500}
                  placeholder="e.g. Clean filters and coils, gas check, test run"
                  className={field}
                />
              </div>
            </>
          )}
        </div>

        {/* 4. Location and delivery */}
        <div className={`${card} flex flex-col gap-4`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-state" className={labelCls}>
                {service ? "State you work in" : "State you sell from"}
              </label>
              <select id="pf-state" value={v.state} onChange={(e) => set("state", e.target.value)} className={field}>
                <option value="">Choose a state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pf-city" className={labelCls}>
                City or area <span className="font-normal text-ink-500">optional</span>
              </label>
              <input id="pf-city" value={v.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Bodija" className={field} />
            </div>
          </div>

          {!service && (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-sm font-semibold text-navy-900">How can buyers get it?</legend>

              <DeliveryOption
                label="I deliver it"
                row={v.selfDelivery}
                onChange={(p) => setRow("selfDelivery", p)}
                showFee
                feeHint="Your delivery fee"
                notePlaceholder="e.g. Ibadan only"
              />
              <DeliveryOption
                label="Buyer picks it up"
                row={v.pickup}
                onChange={(p) => setRow("pickup", p)}
                notePlaceholder="Pickup area, e.g. UI second gate"
              />
              <DeliveryOption
                label="Courier / waybill to other states"
                row={v.platform}
                onChange={(p) => setRow("platform", p)}
                showFee
                feeHint="Courier fee"
                notePlaceholder="e.g. GIG, waybill from Ibadan park"
              />
            </fieldset>
          )}
        </div>

        {/* 5. Authenticity, resale only */}
        {v.listingType === "resale" && (
          <div className={`${card} flex flex-col gap-4`}>
            <PhotoUploader
              label="Proof of purchase (for branded items)"
              hint="A receipt, invoice or order screenshot for brands like Nike, Apple or Samsung. Only our review team sees it."
              photos={v.proofOfPurchase}
              onChange={(p) => set("proofOfPurchase", p)}
              max={1}
            />
            <label className="flex items-start gap-2.5 rounded-xl bg-brand-amber-100/60 p-4 text-sm text-ink-900">
              <input
                type="checkbox"
                checked={v.authenticityConfirmed}
                onChange={(e) => set("authenticityConfirmed", e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-green-600"
              />
              <span>
                I confirm this item is genuine and I have the right to sell it. Fake or replica goods are removed and
                the shop suspended.
              </span>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-3 border-t border-cloud-200 bg-cloud-50/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-white sm:px-5">
          {!isAdmin && (!editing || status === "draft") && (
            <button
              type="button"
              disabled={busy}
              onClick={() => save(editing ? "save" : "draft")}
              className="flex h-12 items-center gap-2 rounded-xl border border-cloud-200 bg-white px-5 text-sm font-semibold text-navy-900 hover:bg-cloud-50 disabled:opacity-60"
            >
              {(saving === "draft" || (saving === "save" && status === "draft")) && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Save draft
            </button>
          )}

          {editing && !canSubmitForReview && (
            <button
              type="button"
              disabled={busy}
              onClick={() => save("save")}
              className="flex h-12 items-center gap-2 rounded-xl bg-brand-green-600 px-6 text-sm font-bold text-white hover:bg-brand-green-700 disabled:opacity-60"
            >
              {saving === "save" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Save changes
            </button>
          )}

          {canSubmitForReview && (
            <button
              type="button"
              disabled={busy}
              onClick={() => save("submit")}
              className="flex h-12 items-center gap-2 rounded-xl bg-brand-green-600 px-6 text-sm font-bold text-white hover:bg-brand-green-700 disabled:opacity-60"
            >
              {saving === "submit" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isAdmin ? "Publish" : status === "rejected" ? "Resubmit for review" : "Submit for review"}
            </button>
          )}
        </div>

        {editing && status === "live" && !isAdmin && (
          <p className="-mt-2 text-center text-xs text-ink-500">
            Price, stock and delivery changes go live straight away. New photos, title or description are checked again
            first.
          </p>
        )}
      </form>
    </div>
  );
}

function DeliveryOption({
  label,
  row,
  onChange,
  showFee,
  feeHint,
  notePlaceholder,
}: {
  label: string;
  row: DeliveryRow;
  onChange: (patch: Partial<DeliveryRow>) => void;
  showFee?: boolean;
  feeHint?: string;
  notePlaceholder: string;
}) {
  const small =
    "h-10 w-full rounded-lg border border-cloud-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-green-600 focus:outline-none";
  return (
    <div className={`rounded-xl p-3 ${row.on ? "bg-cloud-50 ring-1 ring-cloud-200" : ""}`}>
      <label className="flex items-center gap-2.5 text-sm font-medium text-ink-900">
        <input
          type="checkbox"
          checked={row.on}
          onChange={(e) => onChange({ on: e.target.checked })}
          className="h-4 w-4 accent-brand-green-600"
        />
        {label}
      </label>
      {row.on && (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {showFee && (
            <>
              <input
                aria-label={`${label}: fee in Naira`}
                inputMode="numeric"
                value={row.fee}
                onChange={(e) => onChange({ fee: e.target.value })}
                placeholder={`${feeHint} (₦), 0 = free`}
                className={small}
              />
              <input
                aria-label={`${label}: days to arrive`}
                inputMode="numeric"
                value={row.eta}
                onChange={(e) => onChange({ eta: e.target.value })}
                placeholder="Days to arrive"
                className={small}
              />
            </>
          )}
          <input
            aria-label={`${label}: note`}
            value={row.note}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder={notePlaceholder}
            className={`${small} ${showFee ? "" : "sm:col-span-3"}`}
          />
        </div>
      )}
    </div>
  );
}
