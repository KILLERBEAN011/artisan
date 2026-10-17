/* ------------------------------------------------------------------ */
/*  Product choices and labels.                                         */
/*  No database code here, so both server code and browser forms can   */
/*  import it. models/Product.ts and lib/marketplace.ts re-export these. */
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

// draft -> pending_review -> live (or rejected). archived = hidden.
export const PRODUCT_STATUSES = ["draft", "pending_review", "live", "rejected", "archived"] as const;

export const DELIVERY_METHODS = ["self_delivery", "pickup", "platform"] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type SellerType = (typeof SELLER_TYPES)[number];
export type ListingType = (typeof LISTING_TYPES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  used_like_new: "Used, like new",
  used_good: "Used, good",
};

export const LISTING_TYPE_LABELS: Record<string, string> = {
  handmade: "Handmade",
  resale: "Resale",
  service: "Service",
};

export const DELIVERY_LABELS: Record<string, string> = {
  self_delivery: "Seller delivers",
  pickup: "Pickup",
  platform: "NaijaCraft delivery",
};

export const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Draft",
  pending_review: "Waiting for review",
  live: "Live",
  rejected: "Needs changes",
  archived: "Hidden",
};

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
] as const;
