import mongoose, { Schema, Document, model, models } from "mongoose";

/* ------------------------------------------------------------------ */
/*  Allowed values                                                      */
/* ------------------------------------------------------------------ */

export const PRODUCT_CATEGORIES = [
  "Fashion",
  "Home & Furniture",
  "Art & Crafts",
  "Beauty",
  "Gadgets",
  "Services",
  "Food & Agro",
] as const;

// official = NaijaCraft's own stock. seller = any verified marketplace seller.
export const SELLER_TYPES = ["official", "seller"] as const;

// handmade = made by the seller, resale = bought to sell on, service = fixed-price job
export const LISTING_TYPES = ["handmade", "resale", "service"] as const;

export const CONDITIONS = ["new", "used_like_new", "used_good"] as const;

// draft -> pending_review -> live (or rejected). archived = hidden by the seller.
export const PRODUCT_STATUSES = [
  "draft",
  "pending_review",
  "live",
  "rejected",
  "archived",
] as const;

export const DELIVERY_METHODS = [
  "self_delivery",
  "pickup",
  "platform",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type SellerType = (typeof SELLER_TYPES)[number];
export type ListingType = (typeof LISTING_TYPES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface IDeliveryOption {
  method: DeliveryMethod;
  fee: number; // Naira. 0 = free
  etaDays?: number; // rough days to arrive
  states?: string[]; // empty = anywhere this method reaches
  note?: string; // e.g. "Pickup at Bodija"
}

export interface IProductOption {
  name: string; // e.g. "Size", "Colour"
  values: string[]; // e.g. ["S", "M", "L"]
}

export interface IProduct extends Document {
  // --- original fields (unchanged, so existing data still works) ---
  sellerId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number; // Naira, whole number
  category: ProductCategory;
  images: string[];
  inStock: boolean; // kept for old code; now set automatically from `stock`
  createdAt: Date;
  updatedAt: Date;

  // --- who is selling and what kind of listing ---
  sellerType: SellerType;
  listingType: ListingType;
  condition: Condition;

  // --- catalogue ---
  slug: string; // for /marketplace/[slug] pages and WhatsApp previews
  compareAtPrice?: number; // old price, shown crossed out
  costPrice?: number; // what NaijaCraft paid. Official stock only, never sent to the browser
  stock: number;
  options: IProductOption[];
  leadTimeDays?: number; // handmade / made-to-order
  location: { state: string; city?: string };
  delivery: IDeliveryOption[];

  // --- services only ---
  service?: {
    durationMinutes?: number;
    includes?: string;
  };

  // --- trust & moderation ---
  status: ProductStatus;
  proofOfPurchase?: string; // image URL, for branded resale items
  authenticityConfirmed: boolean;
  review?: {
    reviewedBy?: mongoose.Types.ObjectId;
    reviewedAt?: Date;
    rejectionReason?: string;
  };

  // --- stats, updated by order and review code ---
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  isFeatured: boolean;
}

/* ------------------------------------------------------------------ */
/*  Schema                                                              */
/* ------------------------------------------------------------------ */

const DeliveryOptionSchema = new Schema<IDeliveryOption>(
  {
    method: { type: String, enum: DELIVERY_METHODS, required: true },
    fee: { type: Number, min: 0, default: 0 },
    etaDays: { type: Number, min: 0 },
    states: [{ type: String, trim: true }],
    note: { type: String, trim: true, maxlength: 140 },
  },
  { _id: false },
);

const ProductOptionSchema = new Schema<IProductOption>(
  {
    name: { type: String, required: true, trim: true, maxlength: 30 },
    values: [{ type: String, trim: true, maxlength: 30 }],
  },
  { _id: false },
);

const ProductSchema = new Schema<IProduct>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: PRODUCT_CATEGORIES, required: true },
    images: {
      type: [{ type: String, required: true }],
      validate: {
        validator: (v: string[]) =>
          Array.isArray(v) && v.length >= 1 && v.length <= 8,
        message: "Add between 1 and 8 photos.",
      },
    },
    inStock: { type: Boolean, default: true },

    sellerType: {
      type: String,
      enum: SELLER_TYPES,
      default: "seller",
      index: true,
    },
    listingType: { type: String, enum: LISTING_TYPES, default: "resale" },
    condition: { type: String, enum: CONDITIONS, default: "new" },

    slug: { type: String, unique: true, index: true },
    compareAtPrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0, select: false },
    stock: { type: Number, min: 0, default: 1 },
    options: { type: [ProductOptionSchema], default: [] },
    leadTimeDays: { type: Number, min: 0 },
    location: {
      state: { type: String, trim: true, default: "" },
      city: { type: String, trim: true },
    },
    delivery: { type: [DeliveryOptionSchema], default: [] },

    service: {
      durationMinutes: { type: Number, min: 0 },
      includes: { type: String, trim: true, maxlength: 500 },
    },

    status: {
      type: String,
      enum: PRODUCT_STATUSES,
      default: "pending_review",
      index: true,
    },
    proofOfPurchase: { type: String },
    authenticityConfirmed: { type: Boolean, default: false },
    review: {
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
      rejectionReason: { type: String, trim: true },
    },

    ratingAvg: { type: Number, min: 0, max: 5, default: 0 },
    ratingCount: { type: Number, min: 0, default: 0 },
    soldCount: { type: Number, min: 0, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

/* ------------------------------------------------------------------ */
/*  Indexes for the marketplace feed, filters and search               */
/* ------------------------------------------------------------------ */

ProductSchema.index({ status: 1, category: 1, createdAt: -1 });
ProductSchema.index({ status: 1, sellerType: 1, createdAt: -1 });
ProductSchema.index({ status: 1, "location.state": 1 });
ProductSchema.index({ status: 1, price: 1 });
ProductSchema.index({ sellerId: 1, status: 1 });
ProductSchema.index(
  { name: "text", description: "text" },
  { weights: { name: 5, description: 1 } },
);

/* ------------------------------------------------------------------ */
/*  Automatic fields                                                    */
/* ------------------------------------------------------------------ */

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

ProductSchema.pre("validate", async function () {
  // Stable, unique slug: "adire-two-piece-set-3f9a1c"
  if (!this.slug || this.isModified("name")) {
    const suffix = String(this._id).slice(-6);
    this.slug = `${slugify(this.name) || "item"}-${suffix}`;
  }

  // Services are never "out of stock" in the product sense
  if (this.listingType === "service") {
    this.inStock = this.status === "live";
  } else {
    this.inStock = this.stock > 0;
  }

  // Branded resale needs the seller's confirmation before review
  if (
    this.listingType === "resale" &&
    this.status === "pending_review" &&
    !this.authenticityConfirmed
  ) {
    throw new Error(
      "Confirm the item is genuine before submitting it for review.",
    );
  }
});

/* ------------------------------------------------------------------ */
/*  What shoppers are allowed to see                                    */
/* ------------------------------------------------------------------ */

// Use this filter for every public query (marketplace feed, product page, search).
export const PUBLIC_PRODUCT_FILTER = { status: "live" } as const;

export const Product =
  (models.Product as mongoose.Model<IProduct>) ||
  model<IProduct>("Product", ProductSchema);
