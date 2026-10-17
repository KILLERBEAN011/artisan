// One-time update: converts marketplace orders made before per-seller shipments.
//
// Dry run (shows what would change, writes nothing):
//   node --env-file=.env scripts/migrate-orders.mjs
// Apply:
//   node --env-file=.env scripts/migrate-orders.mjs --apply
//
// Old orders keep their money as it was: no commission is taken from them,
// and the old flat delivery fee stays with NaijaCraft (it did the delivery).

import mongoose from "mongoose";

const APPLY = process.argv.includes("--apply");
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) {
  console.error("No MONGODB_URI or MONGO_URI found. Check your .env file.");
  process.exit(1);
}

const STATUS = { paid: "paid", processing: "paid", dispatched: "dispatched", delivered: "delivered", cancelled: "cancelled" };
const PAYOUT = { held_in_escrow: "held", released: "released", paid_to_seller: "released", paid_out: "paid_out" };

await mongoose.connect(uri);
const orders = mongoose.connection.collection("orders");
const users = mongoose.connection.collection("users");
const products = mongoose.connection.collection("products");

const docs = await orders.find({ schemaVersion: { $ne: 2 } }).toArray();
console.log(`Found ${docs.length} old order(s). ${APPLY ? "APPLYING changes." : "Dry run, nothing will be written."}\n`);

// Leave out empty fields instead of writing nulls
const strip = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const toId = (v) => {
  try {
    return v && mongoose.isValidObjectId(String(v)) ? new mongoose.Types.ObjectId(String(v)) : undefined;
  } catch {
    return undefined;
  }
};

for (const o of docs) {
  // Group the items by seller
  const bySeller = new Map();
  for (const item of o.items ?? []) {
    const key = String(item.sellerId);
    if (!bySeller.has(key)) bySeller.set(key, []);
    bySeller.get(key).push(item);
  }

  let status = STATUS[o.orderStatus] ?? "paid";
  let payout = PAYOUT[o.payoutStatus] ?? "held";
  if (status === "cancelled") payout = "refunded";
  // Under the new rules, delivered means the seller's money is released
  if (status === "delivered" && payout === "held") payout = "released";
  if ((payout === "released" || payout === "paid_out") && status !== "cancelled") status = "delivered";

  const now = new Date();
  const shipments = [];
  for (const [sellerId, items] of bySeller) {
    const seller = await users.findOne({ _id: toId(sellerId) }, { projection: { name: 1, "seller.shopName": 1 } });
    const firstProduct = await products.findOne({ _id: toId(items[0]?.productId) }, { projection: { sellerType: 1 } });
    const official = firstProduct?.sellerType === "official";
    const itemsTotal = items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
    shipments.push(strip({
      _id: new mongoose.Types.ObjectId(),
      sellerId: toId(sellerId),
      sellerName: official ? "NaijaCraft Store" : seller?.seller?.shopName || seller?.name || "Seller",
      official,
      itemsTotal,
      deliveryMethod: "platform",
      deliveryLabel: "NaijaCraft delivery",
      deliveryFee: 0,
      status,
      dispatchedAt: status === "dispatched" || status === "delivered" ? o.updatedAt ?? now : undefined,
      // Give buyers of orders already on their way the normal window from today
      autoConfirmAt: status === "dispatched" ? new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) : undefined,
      deliveredAt: status === "delivered" ? o.updatedAt ?? now : undefined,
      confirmedBy: status === "delivered" ? "admin" : undefined,
      commissionRate: 0,
      commission: 0,
      sellerAmount: official ? 0 : itemsTotal,
      payoutStatus: official ? "internal" : payout,
      releasedAt: payout === "released" || payout === "paid_out" ? o.updatedAt ?? now : undefined,
      paidOutAt: payout === "paid_out" ? o.updatedAt ?? now : undefined,
    }));
  }

  const set = strip({
    schemaVersion: 2,
    buyerId: toId(o.buyerId),
    paymentStatus: "paid",
    paidAt: o.paidAt ?? o.createdAt,
    commissionTotal: 0,
    shipments,
  });

  console.log(`${o._id}  ${o.buyerName}  ₦${o.totalAmount}  ${o.orderStatus}/${o.payoutStatus}`);
  for (const s of shipments) console.log(`   -> ${s.sellerName}: ${s.status}, payout ${s.payoutStatus}, ₦${s.sellerAmount}`);
  if (APPLY) await orders.updateOne({ _id: o._id }, { $set: set });
}

console.log(`\n${docs.length} order(s) ${APPLY ? "updated" : "would be updated"}.`);
await mongoose.disconnect();
