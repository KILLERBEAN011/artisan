import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { attachSellers } from "@/lib/products";
import { lineKey } from "@/lib/cart-key";
import { COMMISSION_RATE, MAX_QTY_PER_ITEM } from "@/lib/marketplace-config";

export { lineKey };
import { DELIVERY_LABELS } from "@/lib/product-options";
import { Product, PUBLIC_PRODUCT_FILTER } from "@/models/Product";
import { User } from "@/models/User";

/* ------------------------------------------------------------------ */
/*  Pricing a cart. Server only.                                        */
/*  Everything that costs money comes from the database here: prices,  */
/*  stock, delivery fees, commission. Nothing is trusted from the       */
/*  browser except which product, how many, which size/colour and which */
/*  delivery option the buyer picked.                                   */
/* ------------------------------------------------------------------ */

export type CartLine = {
  productId: string;
  quantity: number;
  options?: Record<string, string>;
};

export type DeliveryOption = {
  method: string;
  label: string;
  fee: number;
  etaDays?: number;
  note?: string;
};

export type QuoteItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
  options: { name: string; value: string }[];
  lineTotal: number;
};

export type QuoteGroup = {
  sellerId: string;
  sellerName: string;
  official: boolean;
  items: QuoteItem[];
  deliveryOptions: DeliveryOption[];
  delivery: DeliveryOption;
  itemsTotal: number;
  deliveryFee: number;
  commissionRate: number;
  commission: number;
  sellerAmount: number;
};

export type QuoteProblem = { key: string; productId: string; message: string; fix?: "remove" | "quantity" | "options"; maxQuantity?: number };

export type Quote = {
  groups: QuoteGroup[];
  problems: QuoteProblem[];
  subtotal: number;
  deliveryTotal: number;
  total: number;
};

/** Cleans what the browser sent: valid ids, whole quantities, merged duplicates. */
export function cleanLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const merged = new Map<string, CartLine>();
  for (const r of raw.slice(0, 50)) {
    const line = r as Partial<CartLine>;
    const productId = String(line?.productId ?? "");
    if (!mongoose.isValidObjectId(productId)) continue;
    const quantity = Math.floor(Number(line?.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) continue;
    const options: Record<string, string> = {};
    if (line?.options && typeof line.options === "object") {
      for (const [k, v] of Object.entries(line.options)) {
        if (typeof v === "string" && v.trim()) options[String(k).slice(0, 30)] = v.trim().slice(0, 30);
      }
    }
    const key = lineKey(productId, options);
    const prev = merged.get(key);
    merged.set(key, { productId, options, quantity: (prev?.quantity ?? 0) + quantity });
  }
  return [...merged.values()];
}

type ProductDoc = {
  _id: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  sellerType?: string;
  listingType?: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  stock: number;
  options?: { name: string; values: string[] }[];
  delivery?: { method: string; fee: number; etaDays?: number; note?: string }[];
  sellerName?: string;
};

/** Delivery choices for one seller: only methods every item in the group offers. */
function deliveryOptionsFor(products: ProductDoc[]): DeliveryOption[] {
  const byMethod = new Map<string, { count: number; fee: number; etaDays?: number; note?: string }>();
  for (const p of products) {
    for (const d of p.delivery ?? []) {
      const prev = byMethod.get(d.method);
      byMethod.set(d.method, {
        count: (prev?.count ?? 0) + 1,
        // One delivery per seller: charge the highest fee among the items
        fee: Math.max(prev?.fee ?? 0, d.method === "pickup" ? 0 : Math.max(0, Math.round(d.fee || 0))),
        etaDays: Math.max(prev?.etaDays ?? 0, d.etaDays ?? 0) || undefined,
        note: prev?.note ?? d.note,
      });
    }
  }
  const common = [...byMethod.entries()]
    .filter(([, v]) => v.count === products.length)
    .map(([method, v]) => ({ method, label: DELIVERY_LABELS[method] ?? method, fee: v.fee, etaDays: v.etaDays, note: v.note }))
    .sort((a, b) => a.fee - b.fee);

  return common.length
    ? common
    : [{ method: "arranged", label: "Seller contacts you to arrange delivery", fee: 0 }];
}

/**
 * Prices a cart from the database.
 * deliveryChoices: { [sellerId]: method } — anything not offered falls back to the cheapest option.
 */
export async function priceCart(lines: CartLine[], deliveryChoices: Record<string, string> = {}): Promise<Quote> {
  await connectToDatabase();
  const problems: QuoteProblem[] = [];

  const ids = [...new Set(lines.map((l) => l.productId))];
  const docs = await Product.find({ _id: { $in: ids }, ...PUBLIC_PRODUCT_FILTER })
    .select("sellerId sellerType listingType name slug price images stock options delivery")
    .lean<ProductDoc[]>();
  const withSellers = (await attachSellers(docs)) as ProductDoc[];
  const byId = new Map(withSellers.map((p) => [String(p._id), p]));

  // Per-seller commission overrides (seller.commissionRate is a percentage, e.g. 5)
  const sellerIds = [...new Set(withSellers.map((p) => String(p.sellerId)))];
  const overrides = await User.find({ _id: { $in: sellerIds }, "seller.commissionRate": { $ne: null } })
    .select("seller.commissionRate")
    .lean<{ _id: mongoose.Types.ObjectId; seller?: { commissionRate?: number } }[]>();
  const rateBySeller = new Map(
    overrides
      .filter((u) => typeof u.seller?.commissionRate === "number")
      .map((u) => [String(u._id), (u.seller!.commissionRate as number) / 100]),
  );

  const groups = new Map<string, { products: ProductDoc[]; items: QuoteItem[]; official: boolean; sellerName: string }>();

  for (const line of lines) {
    const key = lineKey(line.productId, line.options);
    const p = byId.get(line.productId);
    if (!p) {
      problems.push({ key, productId: line.productId, message: "This item is no longer available.", fix: "remove" });
      continue;
    }
    if (p.listingType === "service") {
      problems.push({ key, productId: line.productId, message: `"${p.name}" is a service. Book it from its page instead.`, fix: "remove" });
      continue;
    }
    if (!p.stock || p.stock < 1) {
      problems.push({ key, productId: line.productId, message: `"${p.name}" is sold out.`, fix: "remove" });
      continue;
    }

    // Sizes / colours must be real choices on this product
    const chosen: { name: string; value: string }[] = [];
    let optionProblem = false;
    for (const opt of p.options ?? []) {
      if (!opt.values?.length) continue;
      const value = line.options?.[opt.name];
      if (!value || !opt.values.includes(value)) {
        problems.push({ key, productId: line.productId, message: `Choose a ${opt.name.toLowerCase()} for "${p.name}".`, fix: "options" });
        optionProblem = true;
        break;
      }
      chosen.push({ name: opt.name, value });
    }
    if (optionProblem) continue;

    let quantity = Math.min(line.quantity, MAX_QTY_PER_ITEM);
    if (quantity > p.stock) {
      problems.push({
        key,
        productId: line.productId,
        message: `Only ${p.stock} of "${p.name}" left.`,
        fix: "quantity",
        maxQuantity: p.stock,
      });
      quantity = p.stock;
    }

    const sellerId = String(p.sellerId);
    const group = groups.get(sellerId) ?? {
      products: [],
      items: [],
      official: p.sellerType === "official",
      sellerName: p.sellerName ?? "Seller",
    };
    group.products.push(p);
    group.items.push({
      key,
      productId: String(p._id),
      slug: p.slug,
      name: p.name,
      image: p.images?.[0] ?? "",
      price: p.price,
      quantity,
      stock: p.stock,
      options: chosen,
      lineTotal: p.price * quantity,
    });
    groups.set(sellerId, group);
  }

  const out: QuoteGroup[] = [...groups.entries()].map(([sellerId, g]) => {
    const deliveryOptions = deliveryOptionsFor(g.products);
    const delivery = deliveryOptions.find((d) => d.method === deliveryChoices[sellerId]) ?? deliveryOptions[0];
    const itemsTotal = g.items.reduce((sum, i) => sum + i.lineTotal, 0);
    const commissionRate = g.official ? 0 : (rateBySeller.get(sellerId) ?? COMMISSION_RATE);
    const commission = Math.round(itemsTotal * commissionRate);
    return {
      sellerId,
      sellerName: g.official ? "NaijaCraft Store" : g.sellerName,
      official: g.official,
      items: g.items,
      deliveryOptions,
      delivery,
      itemsTotal,
      deliveryFee: delivery.fee,
      commissionRate,
      commission,
      // The seller delivers, so the delivery fee goes to them. NaijaCraft Store keeps everything.
      sellerAmount: g.official ? 0 : itemsTotal - commission + delivery.fee,
    };
  });

  const subtotal = out.reduce((s, g) => s + g.itemsTotal, 0);
  const deliveryTotal = out.reduce((s, g) => s + g.deliveryFee, 0);
  return { groups: out, problems, subtotal, deliveryTotal, total: subtotal + deliveryTotal };
}
