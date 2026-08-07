import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

export async function getSiteSettings() {
  try {
    await connectToDatabase();

    // Upsert so the very first read (or write) creates the singleton document
    // instead of requiring a separate seed step.
    const settings = await SiteSettings.findOneAndUpdate(
      { key: "site-settings" },
      { $setOnInsert: { key: "site-settings" } },
      { returnDocument: "after", upsert: true },
    ).lean();

    return settings;
  } catch (error) {
    // The homepage should still render even if the DB is briefly unreachable —
    // it just falls back to the gradient placeholder for the hero image.
    console.error("getSiteSettings failed, using defaults:", error);
    return { heroImageUrl: "" };
  }
}
