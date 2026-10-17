import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { attachSellers } from "@/lib/products";
import {
  PRODUCT_CATEGORIES,
  Product,
  PUBLIC_PRODUCT_FILTER,
} from "@/models/Product";

/* ------------------------------------------------------------------ */
/*  Shared data for the marketplace pages (server only).                */
/*  Pages read the database directly instead of calling /api/products,  */
/*  so products are in the HTML that Google and WhatsApp see.           */
/* ------------------------------------------------------------------ */

export const CATEGORIES = PRODUCT_CATEGORIES;

export {
  CONDITION_LABELS,
  DELIVERY_LABELS,
  LISTING_TYPE_LABELS,
  NIGERIAN_STATES,
} from "@/lib/product-options";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "top_rated", label: "Top rated" },
  { value: "popular", label: "Most bought" },
] as const;

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  price_asc: { price: 1, createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 },
  top_rated: { ratingAvg: -1, ratingCount: -1 },
  popular: { soldCount: -1, createdAt: -1 },
};

export function formatNaira(amount: number) {
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://naijacraft.com.ng";

/* ------------------------------------------------------------------ */
/*  Types the pages work with (plain objects, safe to pass to client)  */
/* ------------------------------------------------------------------ */

export type MarketplaceProduct = {
  _id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: string;
  images: string[];
  sellerId: string;
  sellerType: "official" | "seller";
  listingType: "handmade" | "resale" | "service";
  condition: string;
  stock: number;
  inStock: boolean;
  options: { name: string; values: string[] }[];
  leadTimeDays?: number;
  location?: { state?: string; city?: string };
  delivery: {
    method: string;
    fee: number;
    etaDays?: number;
    states?: string[];
    note?: string;
  }[];
  service?: { durationMinutes?: number; includes?: string };
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  createdAt: string;
  sellerName: string;
  sellerState: string | null;
  sellerVerified: boolean;
  sellerIsArtisan: boolean;
  sellerShopSlug: string | null;
};

/** Mongo documents contain ObjectIds and Dates; this turns them into plain JSON. */
function toPlain<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/* ------------------------------------------------------------------ */
/*  Reading search params                                               */
/* ------------------------------------------------------------------ */

export type SearchParams = Record<string, string | string[] | undefined>;

export type FeedFilters = {
  q?: string;
  category?: string;
  state?: string;
  sellerType?: string;
  listingType?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  seller?: string;
  sort: string;
  page: number;
};

const first = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export function readFilters(params: SearchParams): FeedFilters {
  const num = (v?: string) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined;
  };
  const sort = first(params.sort);
  return {
    q: first(params.q)?.slice(0, 100),
    category: first(params.category),
    state: first(params.state),
    sellerType: first(params.sellerType),
    listingType: first(params.listingType),
    condition: first(params.condition),
    minPrice: num(first(params.minPrice)),
    maxPrice: num(first(params.maxPrice)),
    seller: first(params.seller),
    sort: sort && SORTS[sort] ? sort : "newest",
    page: num(first(params.page)) ?? 1,
  };
}

/** True when the shopper has searched or filtered (the page then hides the hero). */
export function hasActiveFilters(f: FeedFilters) {
  return Boolean(
    f.q ||
    f.category ||
    f.state ||
    f.sellerType ||
    f.listingType ||
    f.condition ||
    f.minPrice ||
    f.maxPrice ||
    f.seller,
  );
}

/** Builds a /marketplace URL from the current filters plus changes. */
export function marketplaceHref(
  f: Partial<FeedFilters>,
  changes: Partial<Record<keyof FeedFilters, string | number | undefined>> = {},
) {
  const merged = { ...f, ...changes } as Record<string, unknown>;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null || value === "") continue;
    if (key === "page" && Number(value) <= 1) continue;
    if (key === "sort" && value === "newest") continue;
    qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `/marketplace?${s}` : "/marketplace";
}

/* ------------------------------------------------------------------ */
/*  Queries                                                             */
/* ------------------------------------------------------------------ */

export const PAGE_SIZE = 24;

export async function getPublicProducts(f: FeedFilters, limit = PAGE_SIZE) {
  await connectToDatabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { ...PUBLIC_PRODUCT_FILTER };
  if (f.category) filter.category = f.category;
  if (f.state) filter["location.state"] = f.state;
  if (f.sellerType) filter.sellerType = f.sellerType;
  if (f.listingType) filter.listingType = f.listingType;
  if (f.condition) filter.condition = f.condition;
  if (f.seller && mongoose.isValidObjectId(f.seller)) {
    filter.sellerId = new mongoose.Types.ObjectId(f.seller);
  }
  if (f.minPrice || f.maxPrice) {
    filter.price = {};
    if (f.minPrice) filter.price.$gte = f.minPrice;
    if (f.maxPrice) filter.price.$lte = f.maxPrice;
  }
  if (f.q) filter.$text = { $search: f.q };

  const sort =
    f.q && f.sort === "newest"
      ? { score: { $meta: "textScore" } }
      : SORTS[f.sort];
  const projection = f.q ? { score: { $meta: "textScore" } } : undefined;

  const [items, total] = await Promise.all([
    Product.find(filter, projection)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort(sort as any)
      .skip((f.page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const products = toPlain<MarketplaceProduct[]>(await attachSellers(items));
  return { products, total, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getPublicProduct(slugOrId: string) {
  await connectToDatabase();
  const where = mongoose.isValidObjectId(slugOrId)
    ? { _id: slugOrId }
    : { slug: slugOrId };
  const doc = await Product.findOne({
    ...where,
    ...PUBLIC_PRODUCT_FILTER,
  }).lean();
  if (!doc) return null;
  const [withSeller] = await attachSellers([doc]);
  return toPlain<MarketplaceProduct>(withSeller);
}

export async function getMoreFromSeller(
  product: MarketplaceProduct,
  limit = 4,
) {
  await connectToDatabase();
  const items = await Product.find({
    ...PUBLIC_PRODUCT_FILTER,
    sellerId: product.sellerId,
    _id: { $ne: product._id },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return toPlain<MarketplaceProduct[]>(await attachSellers(items));
}
