import { Schema, model, models, type InferSchemaType } from "mongoose";

const recentJobSchema = new Schema(
  {
    label: { type: String, required: true },
    amountNaira: { type: Number, required: true },
    status: { type: String, enum: ["completed", "in-progress"], required: true },
    photoUrl: { type: String },
  },
  { _id: false },
);

const artisanProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    title: { type: String, required: true }, // e.g. "Certified Electrician"
    serviceTitle: { type: String, required: true }, // e.g. "Electrical Repairs & Installations"
    bio: { type: String, required: true },

    categories: { type: [String], default: [], index: true },
    subservices: { type: [String], default: [] },
    languages: { type: [String], default: [] },

    fromPriceNaira: { type: Number, required: true },
    turnaround: { type: String }, // e.g. "Avg. 1-2 days"
    responseTime: { type: String }, // e.g. "Response: 30 mins"
    availability: { type: String }, // display text, e.g. "Usually replies within an hour"

    location: {
      city: { type: String, required: true },
      state: { type: String, required: true },
      point: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
      },
    },

    verification: { type: [String], default: [] }, // e.g. ["ID Verified", "BVN Verified"]
    sellerType: { type: String, enum: ["independent", "company"], default: "independent" },

    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    recentJobs: { type: [recentJobSchema], default: [] },

    // Cloudinary URL — empty string means "no photo yet", falls back to
    // the gradient placeholder used throughout the UI.
    avatarUrl: { type: String, default: "" },

    // Optional — set at onboarding or added later via account settings.
    // Used by the admin to know where to send a manual payout.
    bankDetails: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      accountName: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

artisanProfileSchema.index({ "location.point": "2dsphere" });

export type ArtisanProfileDoc = InferSchemaType<typeof artisanProfileSchema>;

export const ArtisanProfile =
  models.ArtisanProfile || model("ArtisanProfile", artisanProfileSchema);
