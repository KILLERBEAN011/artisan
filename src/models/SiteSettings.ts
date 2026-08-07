import { Schema, model, models } from "mongoose";

const siteSettingsSchema = new Schema(
  {
    // Fixed key so there's always exactly one settings document.
    key: { type: String, default: "site-settings", unique: true },
    heroImageUrl: { type: String, default: "" },
    enterpriseImageUrl: { type: String, default: "" },
  },
  { timestamps: true },
);

export const SiteSettings = models.SiteSettings || model("SiteSettings", siteSettingsSchema);
