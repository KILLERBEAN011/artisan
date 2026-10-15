// One-time update for products created before the new Product model.
//
// Dry run (shows what would change, writes nothing):
//   node --env-file=.env scripts/migrate-products.mjs
// Apply the changes:
//   node --env-file=.env scripts/migrate-products.mjs --apply
//
// Needs Node 20.6+ and MONGODB_URI (or MONGO_URI) in your .env.

import mongoose from "mongoose";

const APPLY = process.argv.includes("--apply");
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!uri) {
  console.error("No MONGODB_URI or MONGO_URI found. Check your .env file.");
  process.exit(1);
}

const CATEGORIES = [
  "Fashion",
  "Home & Furniture",
  "Art & Crafts",
  "Beauty",
  "Gadgets",
  "Services",
  "Food & Agro",
];

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

await mongoose.connect(uri);
const products = mongoose.connection.collection("products");

const docs = await products.find({}).toArray();
console.log(
  `Found ${docs.length} product(s). ${APPLY ? "APPLYING changes." : "Dry run, nothing will be written."}\n`,
);

let changed = 0;
const badCategories = [];

for (const doc of docs) {
  const set = {};

  // Products that were already showing stay visible
  if (!doc.status) set.status = "live";
  if (!doc.sellerType) set.sellerType = "seller";
  if (!doc.listingType)
    set.listingType = doc.category === "Services" ? "service" : "resale";
  if (!doc.condition) set.condition = "new";
  if (doc.stock === undefined) set.stock = doc.inStock === false ? 0 : 1;
  if (!doc.location) set.location = { state: "" };
  if (!doc.delivery) set.delivery = [];
  if (!doc.options) set.options = [];
  if (doc.authenticityConfirmed === undefined)
    set.authenticityConfirmed = false;
  if (doc.ratingAvg === undefined) set.ratingAvg = 0;
  if (doc.ratingCount === undefined) set.ratingCount = 0;
  if (doc.soldCount === undefined) set.soldCount = 0;
  if (doc.isFeatured === undefined) set.isFeatured = false;
  if (!doc.slug)
    set.slug = `${slugify(doc.name) || "item"}-${doc._id.toString().slice(-6)}`;

  if (!CATEGORIES.includes(doc.category)) {
    badCategories.push(
      `  ${doc._id}  "${doc.name}"  category: "${doc.category}"`,
    );
  }

  if (Object.keys(set).length === 0) continue;
  changed++;
  console.log(`${doc._id}  "${doc.name}"`);
  console.log(`  -> ${JSON.stringify(set)}`);

  if (APPLY) {
    await products.updateOne({ _id: doc._id }, { $set: set });
  }
}

console.log(
  `\n${changed} product(s) ${APPLY ? "updated" : "would be updated"}.`,
);

if (badCategories.length) {
  console.log(
    `\nThese use a category outside the new list. Fix them in the admin or the database, ` +
      `otherwise saving them will fail validation:\n${badCategories.join("\n")}`,
  );
}

if (APPLY) {
  console.log(
    "\nDone. Restart your dev server (or redeploy) so Mongoose builds the new indexes.",
  );
}

await mongoose.disconnect();
