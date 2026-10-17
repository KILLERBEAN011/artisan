import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { User, canSell, isAdmin } from "@/models/User";
import {
  CONDITIONS,
  DELIVERY_METHODS,
  LISTING_TYPES,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  Product,
  SELLER_TYPES,
} from "@/models/Product";

/* ------------------------------------------------------------------ */
/*  Who is calling                                                      */
/* ------------------------------------------------------------------ */

export type SessionUser = {
  _id: mongoose.Types.ObjectId;
  name: string;
  role: "customer" | "artisan" | "admin";
  seller?: {
    status?: string;
    shopName?: string;
    state?: string;
    city?: string;
  };
};

/**
 * Reads the logged-in user from the NextAuth session, then loads them from the
 * database so seller approval is always current (never trusted from the browser).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !mongoose.isValidObjectId(id)) return null;
  const user = await User.findById(id)
    .select("name role seller")
    .lean<SessionUser>();
  return user ?? null;
}

export { canSell, isAdmin };

/* ------------------------------------------------------------------ */
/*  Errors                                                              */
/* ------------------------------------------------------------------ */

export class UserFacingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(error: unknown, fallback: string) {
  if (error instanceof UserFacingError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((e) => e.message);
    return NextResponse.json({ error: messages.join(" ") }, { status: 400 });
  }
  if (error instanceof mongoose.Error.CastError) {
    return NextResponse.json(
      { error: `Invalid value for ${error.path}.` },
      { status: 400 },
    );
  }
  console.error(fallback, error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

/* ------------------------------------------------------------------ */
/*  Cleaning what the browser sends                                     */
/* ------------------------------------------------------------------ */

const oneOf = <T extends readonly string[]>(
  list: T,
  value: unknown,
  field: string,
) => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !list.includes(value)) {
    throw new UserFacingError(`${field} must be one of: ${list.join(", ")}.`);
  }
  return value as T[number];
};

const money = (value: unknown, field: string) => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(String(value).replace(/[₦,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0)
    throw new UserFacingError(`${field} must be a positive amount.`);
  return Math.round(n);
};

const wholeNumber = (value: unknown, field: string) => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0)
    throw new UserFacingError(`${field} must be a whole number.`);
  return n;
};

/** Optional numbers: null or "" means "clear this field", undefined means "leave it alone". */
const optional = <T>(value: unknown, parse: (v: unknown) => T) =>
  value === null || value === "" ? null : parse(value);

const text = (value: unknown, max: number) =>
  value === undefined ? undefined : String(value).trim().slice(0, max);

const stringList = (value: unknown, max: number, itemMax = 500) =>
  value === undefined
    ? undefined
    : (Array.isArray(value) ? value : [value])
        .map((v) => String(v).trim().slice(0, itemMax))
        .filter(Boolean)
        .slice(0, max);

/**
 * Builds the product fields from a request body.
 * Only fields a seller is allowed to set are kept. `sellerId`, `status`,
 * ratings and sales counts are always ignored here.
 * Admin-only fields (sellerType, costPrice, isFeatured) are kept only for admins.
 */
export function pickProductFields(
  body: Record<string, unknown>,
  admin: boolean,
) {
  const fields: Record<string, unknown> = {
    name: text(body.name, 120),
    description: text(body.description, 4000),
    price: money(body.price, "Price"),
    compareAtPrice: optional(body.compareAtPrice, (v) => money(v, "Old price")),
    category: oneOf(PRODUCT_CATEGORIES, body.category, "Category"),
    images: stringList(body.images, 8),
    listingType: oneOf(LISTING_TYPES, body.listingType, "Listing type"),
    condition: oneOf(CONDITIONS, body.condition, "Condition"),
    stock: wholeNumber(body.stock, "Stock"),
    leadTimeDays: optional(body.leadTimeDays, (v) =>
      wholeNumber(v, "Lead time"),
    ),
    proofOfPurchase: text(body.proofOfPurchase, 500),
    authenticityConfirmed:
      body.authenticityConfirmed === undefined
        ? undefined
        : Boolean(body.authenticityConfirmed),
  };

  if (body.location !== undefined) {
    const loc = (body.location ?? {}) as Record<string, unknown>;
    fields.location = {
      state: text(loc.state, 40) ?? "",
      city: text(loc.city, 60),
    };
  }

  if (body.options !== undefined) {
    const list = Array.isArray(body.options) ? body.options : [];
    fields.options = list.slice(0, 3).map((o: Record<string, unknown>) => ({
      name: text(o?.name, 30) ?? "",
      values: stringList(o?.values, 20, 30) ?? [],
    }));
  }

  if (body.delivery !== undefined) {
    const list = Array.isArray(body.delivery) ? body.delivery : [];
    fields.delivery = list.slice(0, 5).map((d: Record<string, unknown>) => ({
      method: oneOf(DELIVERY_METHODS, d?.method, "Delivery method"),
      fee: money(d?.fee, "Delivery fee") ?? 0,
      etaDays: wholeNumber(d?.etaDays, "Delivery days"),
      states: stringList(d?.states, 37, 40) ?? [],
      note: text(d?.note, 140),
    }));
  }

  if (body.service !== undefined) {
    const s = (body.service ?? {}) as Record<string, unknown>;
    fields.service = {
      durationMinutes: wholeNumber(s.durationMinutes, "Duration"),
      includes: text(s.includes, 500),
    };
  }

  if (admin) {
    fields.sellerType = oneOf(SELLER_TYPES, body.sellerType, "Seller type");
    fields.costPrice = optional(body.costPrice, (v) => money(v, "Cost price"));
    if (body.isFeatured !== undefined)
      fields.isFeatured = Boolean(body.isFeatured);
  }

  // Drop anything not sent, so PATCH only changes what was asked
  for (const key of Object.keys(fields)) {
    if (fields[key] === undefined) delete fields[key];
  }
  return fields;
}

export const STATUS_LIST = PRODUCT_STATUSES;

/** Changing these on a live listing sends it back for review. */
export const REVIEWED_FIELDS = [
  "name",
  "description",
  "images",
  "category",
  "listingType",
  "condition",
  "proofOfPurchase",
] as const;

/** Set MARKETPLACE_REQUIRE_REVIEW=false in .env to let new listings go live immediately. */
export const REQUIRE_REVIEW =
  process.env.MARKETPLACE_REQUIRE_REVIEW !== "false";

/* ------------------------------------------------------------------ */
/*  Seller names for product cards                                      */
/* ------------------------------------------------------------------ */

type ProductLike = { sellerId: unknown; sellerType?: string };

export async function attachSellers<T extends ProductLike>(products: T[]) {
  const ids = [...new Set(products.map((p) => String(p.sellerId)))].filter(
    (id) => mongoose.isValidObjectId(id),
  );
  const sellers = await User.find({ _id: { $in: ids } })
    .select(
      "name role seller.shopName seller.shopSlug seller.state seller.status",
    )
    .lean<
      {
        _id: mongoose.Types.ObjectId;
        name?: string;
        role?: string;
        seller?: {
          shopName?: string;
          shopSlug?: string;
          state?: string;
          status?: string;
        };
      }[]
    >();
  const byId = new Map(sellers.map((s) => [String(s._id), s]));

  return products.map((p) => {
    const s = byId.get(String(p.sellerId));
    const official = p.sellerType === "official";
    return {
      ...p,
      sellerName: official
        ? "NaijaCraft Store"
        : s?.seller?.shopName || s?.name || "NaijaCraft Seller",
      sellerShopSlug: official ? null : (s?.seller?.shopSlug ?? null),
      sellerState: s?.seller?.state ?? null,
      sellerVerified:
        official || s?.seller?.status === "approved" || s?.role === "artisan",
      // Lets service pages send buyers to the artisan's booking profile
      sellerIsArtisan: !official && s?.role === "artisan",
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Shared delete logic (used by both product routes)                   */
/* ------------------------------------------------------------------ */

export async function removeProduct(productId: string, user: SessionUser) {
  if (!mongoose.isValidObjectId(productId))
    throw new UserFacingError("Product not found.", 404);

  const product = await Product.findById(productId);
  if (!product) throw new UserFacingError("Product not found.", 404);

  const owner = String(product.sellerId) === String(user._id);
  if (!owner && !isAdmin(user))
    throw new UserFacingError("You can only remove your own listings.", 403);

  // Keep the record if it has ever sold, so order history still makes sense
  if (product.soldCount > 0) {
    product.status = "archived";
    await product.save({ validateBeforeSave: false });
    return { archived: true };
  }

  await product.deleteOne();
  return { deleted: true };
}
