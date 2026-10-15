import { Schema, model, models, type InferSchemaType } from "mongoose";

/* ------------------------------------------------------------------ */
/*  Seller shop details                                                 */
/*  Any user (customer, artisan or admin) can apply to sell.            */
/*  Their role does not change; seller.status decides if they can list. */
/* ------------------------------------------------------------------ */

export const SELLER_STATUSES = [
  "none",
  "pending",
  "approved",
  "rejected",
  "suspended",
] as const;
export type SellerStatus = (typeof SELLER_STATUSES)[number];

export const SELLER_ID_TYPES = [
  "nin",
  "bvn",
  "drivers_license",
  "passport",
  "voters_card",
] as const;

const sellerSchema = new Schema(
  {
    status: {
      type: String,
      enum: SELLER_STATUSES,
      default: "none",
      index: true,
    },

    shopName: { type: String, trim: true, maxlength: 60 },
    shopSlug: { type: String, trim: true, lowercase: true }, // /marketplace/shop/[shopSlug]
    bio: { type: String, trim: true, maxlength: 500 },
    logo: { type: String }, // image URL
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    whatsapp: { type: String, trim: true },

    // Identity check. Never store the full NIN/BVN: keep the type, the last 4
    // digits and a photo of the ID that only admins can open.
    idType: { type: String, enum: SELLER_ID_TYPES },
    idLast4: { type: String, maxlength: 4 },
    idDocumentUrl: { type: String, select: false },

    acceptedPolicyAt: { type: Date }, // when they agreed to the seller policy
    appliedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String, trim: true },

    // Leave empty to use the site-wide commission. Set per seller for deals.
    commissionRate: { type: Number, min: 0, max: 100 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    role: {
      type: String,
      enum: ["customer", "artisan", "admin"],
      required: true,
      default: "customer",
    },
    // bcrypt hash, never a plain password
    passwordHash: { type: String, required: true },

    // Email verification
    isVerified: { type: Boolean, default: false },
    verifyToken: { type: String },
    verifyTokenExpiry: { type: Date },
    forgotPasswordToken: { type: String },
    forgotPasswordTokenExpiry: { type: Date },

    // Marketplace shop
    seller: { type: sellerSchema, default: () => ({ status: "none" }) },
  },
  { timestamps: true },
);

// Shop URLs must be unique, but most users have no shop, so only index real ones
userSchema.index(
  { "seller.shopSlug": 1 },
  {
    unique: true,
    partialFilterExpression: { "seller.shopSlug": { $type: "string" } },
  },
);

export type UserDoc = InferSchemaType<typeof userSchema>;

/* ------------------------------------------------------------------ */
/*  Helpers used by the API routes                                     */
/* ------------------------------------------------------------------ */

type UserLike = {
  role?: string | null;
  seller?: { status?: string | null } | null;
};

/**
 * Who can create listings:
 * - admins (that is how NaijaCraft Store items get created)
 * - artisans, who were already vetted when they joined (unless suspended)
 * - any other user whose seller application you approved
 */
export function canSell(user: UserLike | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.seller?.status === "suspended") return false;
  if (user.role === "artisan") return true;
  return user.seller?.status === "approved";
}

export function isAdmin(user: UserLike | null | undefined): boolean {
  return user?.role === "admin";
}

// `models.User` re-uses an already-compiled model if one exists (prevents
// "Cannot overwrite model" errors during Next.js hot reload).
export const User = models.User || model("User", userSchema);
