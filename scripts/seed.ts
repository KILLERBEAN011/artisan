/**
 * Seeds the database with the same 3 artisans used in the frontend mock data,
 * so you can test /api/artisans against real MongoDB data instead of the
 * hardcoded array in src/data/mock-artisans.ts.
 *
 * Run with:  npx tsx scripts/seed.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import mongoose from "mongoose";
import { User } from "../src/models/User";
import { ArtisanProfile } from "../src/models/ArtisanProfile";

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI. Add it to .env.local first.");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Clear existing seed data so this script is safe to re-run.
  await ArtisanProfile.deleteMany({});
  await User.deleteMany({ email: { $regex: /@naijacraft-seed\.test$/ } });

  const seedArtisans = [
    {
      name: "Tunde Adebayo",
      title: "Tailor & Pattern Maker",
      serviceTitle: "Custom Bridal Gowns & Tailoring",
      bio: "I create bespoke bridal gowns and tailored outfits with hand-finished seams. Work samples include six bridal commissions and multiple alteration jobs across Lagos.",
      categories: ["Tailoring & Fashion"],
      subservices: [],
      languages: ["English", "Yoruba"],
      fromPriceNaira: 7500,
      turnaround: "Avg. 3–5 days",
      responseTime: "Response: 2 hrs",
      availability: "Online · responds quickly",
      location: { city: "Yaba", state: "Lagos", point: { type: "Point", coordinates: [3.3792, 6.5244] } },
      verification: ["ID Verified"],
      sellerType: "independent",
      rating: 4.8,
      reviewCount: 124,
      recentJobs: [
        { label: "Bridal gown for Ifeoma", amountNaira: 95000, status: "completed" },
        { label: "Alteration package for Uche", amountNaira: 5000, status: "completed" },
        { label: "Custom suit for Bayo", amountNaira: 42000, status: "in-progress" },
      ],
    },
    {
      name: "Adaora Nnaji",
      title: "UI/UX & Brand Designer",
      serviceTitle: "Brand Identity & Landing Pages",
      bio: "I craft brand identity and conversion-focused landing pages for startups across Nigeria. Specialise in Figma prototypes and responsive handoffs.",
      categories: ["Graphic & Web Design"],
      subservices: ["Logo Design", "Website Landing Page"],
      languages: ["English"],
      fromPriceNaira: 25000,
      turnaround: "Avg. 5–7 days",
      responseTime: "Response: 6 hrs",
      availability: "Available tomorrow",
      location: { city: "Surulere", state: "Lagos", point: { type: "Point", coordinates: [3.3515, 6.4924] } },
      verification: [],
      sellerType: "independent",
      rating: 4.7,
      reviewCount: 68,
      recentJobs: [],
    },
    {
      name: "Chinyere Okeke",
      title: "Certified Electrician",
      serviceTitle: "Electrical Repairs & Installations",
      bio: "Licensed electrician specialising in home rewiring, switchboard upgrades and quick-response emergency repairs across Ikeja and environs.",
      categories: ["Home Repair"],
      subservices: [],
      languages: ["English", "Igbo"],
      fromPriceNaira: 5500,
      turnaround: "Avg. 1–2 days",
      responseTime: "Response: 30 mins",
      availability: "Usually replies within an hour",
      location: { city: "Ikeja", state: "Lagos", point: { type: "Point", coordinates: [3.3515, 6.6018] } },
      verification: ["ID Verified", "BVN Verified"],
      sellerType: "independent",
      rating: 4.6,
      reviewCount: 43,
      recentJobs: [],
    },
  ];

  for (const artisan of seedArtisans) {
    const email = `${artisan.name.toLowerCase().replace(/\s+/g, ".")}@naijacraft-seed.test`;

    const user = await User.create({
      name: artisan.name,
      email,
      role: "artisan",
      passwordHash: "seed-data-not-a-real-password",
    });

    await ArtisanProfile.create({
      userId: user._id,
      title: artisan.title,
      serviceTitle: artisan.serviceTitle,
      bio: artisan.bio,
      categories: artisan.categories,
      subservices: artisan.subservices,
      languages: artisan.languages,
      fromPriceNaira: artisan.fromPriceNaira,
      turnaround: artisan.turnaround,
      responseTime: artisan.responseTime,
      availability: artisan.availability,
      location: artisan.location,
      verification: artisan.verification,
      sellerType: artisan.sellerType,
      rating: artisan.rating,
      reviewCount: artisan.reviewCount,
      recentJobs: artisan.recentJobs,
    });

    console.log(`Seeded artisan: ${artisan.name}`);
  }

  console.log("Done seeding.");
  await mongoose.disconnect();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
