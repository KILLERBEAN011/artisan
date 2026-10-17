import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { ADMIN_EMAIL, emailLayout, sendEmail } from "@/lib/email";
import { formatNaira } from "@/lib/marketplace";
import { AUTO_CONFIRM_DAYS } from "@/lib/marketplace-config";
import { verifyPayment } from "@/lib/paystack";
import { UserFacingError, type SessionUser } from "@/lib/products";
import { sendWhatsAppAlert } from "@/lib/whatsapp";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { Order, type IOrder, type IShipment } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

const DAY = 24 * 60 * 60 * 1000;
const BUYER_FOOTER = "You're getting this because you ordered on the NaijaCraft Marketplace.";
const SELLER_FOOTER = "You're getting this because you sell on the NaijaCraft Marketplace.";

/* ------------------------------------------------------------------ */
/*  Contacts                                                            */
/* ------------------------------------------------------------------ */

type Contact = { email?: string; name?: string; whatsapp?: string };

async function sellerContacts(ids: string[]): Promise<Map<string, Contact>> {
  const users = await User.find({ _id: { $in: ids } })
    .select("name email seller.whatsapp")
    .lean<{ _id: mongoose.Types.ObjectId; name?: string; email?: string; seller?: { whatsapp?: string } }[]>();
  const profiles = await ArtisanProfile.find({ userId: { $in: ids } })
    .select("userId whatsappNumber")
    .lean<{ userId: mongoose.Types.ObjectId; whatsappNumber?: string }[]>();
  const wa = new Map(profiles.map((p) => [String(p.userId), p.whatsappNumber]));
  return new Map(
    users.map((u) => [
      String(u._id),
      { email: u.email, name: u.name, whatsapp: u.seller?.whatsapp || wa.get(String(u._id)) || undefined },
    ]),
  );
}

const firstName = (name?: string) => (name ?? "").split(" ")[0] || "there";
const shortId = (id: unknown) => String(id).slice(-6).toUpperCase();

function itemsLine(order: IOrder, sellerId: string) {
  return order.items
    .filter((i) => String(i.sellerId) === sellerId)
    .map((i) => {
      const opts = i.options?.length ? ` (${i.options.map((o) => o.value).join(", ")})` : "";
      return `${i.quantity} × ${i.name}${opts}`;
    })
    .join(", ");
}

/* ------------------------------------------------------------------ */
/*  Payment confirmation                                                 */
/*  Called from the page Paystack sends the buyer back to AND from the   */
/*  Paystack webhook. Safe to call many times: only the first one acts.  */
/* ------------------------------------------------------------------ */

export type ConfirmResult =
  | { status: "paid"; orderId: string; firstTime: boolean }
  | { status: "unpaid" | "not_found" }
  | { status: "problem"; orderId: string; message: string };

export async function confirmPayment(reference: string): Promise<ConfirmResult> {
  await connectToDatabase();
  const order = await Order.findOne({ paystackReference: reference });
  if (!order) return { status: "not_found" };
  if (order.paymentStatus === "paid") return { status: "paid", orderId: String(order._id), firstTime: false };
  if (order.paymentStatus === "amount_mismatch") {
    return { status: "problem", orderId: String(order._id), message: "We're checking this payment." };
  }

  const tx = await verifyPayment(reference);
  if (!tx || tx.status !== "success") {
    if (tx?.status === "failed") await Order.updateOne({ _id: order._id, paymentStatus: "pending" }, { paymentStatus: "failed" });
    return { status: "unpaid" };
  }

  // The amount Paystack actually collected must match the price we calculated
  if (tx.currency !== "NGN" || tx.amount !== Math.round(order.totalAmount * 100)) {
    await Order.updateOne(
      { _id: order._id, paymentStatus: "pending" },
      { paymentStatus: "amount_mismatch", adminNote: `Paystack collected ${tx.currency} ${tx.amount / 100}, expected NGN ${order.totalAmount}.` },
    );
    if (ADMIN_EMAIL) {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Payment amount mismatch on order ${shortId(order._id)}`,
        html: emailLayout({
          heading: "Payment amount doesn't match",
          paragraphs: [
            `Reference ${reference}: Paystack collected ${tx.currency} ${tx.amount / 100}, but the order total is ${formatNaira(order.totalAmount)}.`,
            "The order has NOT been confirmed. Check it in Paystack and refund if needed.",
          ],
          button: { label: "Open orders", path: "/admin/orders?tab=attention" },
          footer: "Admin alert.",
        }),
      });
    }
    return { status: "problem", orderId: String(order._id), message: "We couldn't match this payment. Our team will contact you." };
  }

  // Mark paid exactly once, even if the webhook and the return page arrive together
  const now = new Date();
  const shipments = order.shipments.map((s) => ({
    ...s.toObject(),
    status: "paid",
    payoutStatus: s.official ? "internal" : "held",
  }));
  const res = await Order.updateOne(
    { _id: order._id, paymentStatus: "pending" },
    {
      $set: {
        paymentStatus: "paid",
        paidAt: tx.paid_at ? new Date(tx.paid_at) : now,
        paymentChannel: tx.channel,
        shipments,
      },
    },
  );
  if (res.modifiedCount === 0) return { status: "paid", orderId: String(order._id), firstTime: false };

  // Take the items out of stock
  let stockIssue = false;
  for (const item of order.items) {
    const ok = await Product.updateOne(
      { _id: item.productId, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity, soldCount: item.quantity } },
    );
    if (ok.modifiedCount === 0) {
      stockIssue = true; // someone else bought the last ones while this buyer was paying
      await Product.updateOne({ _id: item.productId }, { $set: { stock: 0 }, $inc: { soldCount: item.quantity } });
    }
  }
  await Product.updateMany(
    { _id: { $in: order.items.map((i) => i.productId) }, stock: { $lte: 0 }, listingType: { $ne: "service" } },
    { $set: { inStock: false } },
  );
  if (stockIssue) await Order.updateOne({ _id: order._id }, { stockIssue: true });

  await notifyOrderPaid(order, stockIssue);
  return { status: "paid", orderId: String(order._id), firstTime: true };
}

async function notifyOrderPaid(order: IOrder, stockIssue: boolean) {
  const sellerIds = order.shipments.map((s) => String(s.sellerId));
  const contacts = await sellerContacts(sellerIds);

  await sendEmail({
    to: order.buyerEmail,
    subject: `Order ${shortId(order._id)} confirmed`,
    html: emailLayout({
      heading: "Thanks, your order is confirmed",
      paragraphs: [
        `Hi ${firstName(order.buyerName)}, we've received your payment of ${formatNaira(order.totalAmount)}.`,
        `Your money is held by NaijaCraft. Each seller is only paid after you confirm you received your items (or ${AUTO_CONFIRM_DAYS} days after they're sent, if you don't report a problem).`,
        `Delivering to: ${order.deliveryAddress}`,
      ],
      button: { label: "Track your order", path: "/dashboard/customer/orders" },
      footer: BUYER_FOOTER,
    }),
  });

  for (const s of order.shipments) {
    const c = contacts.get(String(s.sellerId));
    const what = itemsLine(order, String(s.sellerId));
    if (s.official) {
      if (ADMIN_EMAIL) {
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `NaijaCraft Store order ${shortId(order._id)}`,
          html: emailLayout({
            heading: "New NaijaCraft Store order",
            paragraphs: [`${what} for ${order.buyerName}, ${order.deliveryAddress}.`, `Delivery: ${s.deliveryLabel}.`],
            button: { label: "Open orders", path: "/admin/orders" },
            footer: "Admin alert.",
          }),
        });
      }
      continue;
    }
    if (c?.email) {
      await sendEmail({
        to: c.email,
        subject: `New order: ${what}`,
        html: emailLayout({
          heading: "You have a new order",
          paragraphs: [
            `Hi ${firstName(c.name)}, ${order.buyerName} bought ${what}.`,
            `Delivery: ${s.deliveryLabel}${s.deliveryFee ? ` (${formatNaira(s.deliveryFee)})` : ""}.`,
            `You'll receive ${formatNaira(s.sellerAmount)} after the buyer confirms delivery (${Math.round(s.commissionRate * 100)}% NaijaCraft commission taken off the item price).`,
            "Send the order, then press \"Mark as sent\" so the buyer can follow it.",
          ],
          button: { label: "See the order", path: "/dashboard/sales" },
          footer: SELLER_FOOTER,
        }),
      });
    }
    if (c?.whatsapp) {
      await sendWhatsAppAlert(
        c.whatsapp,
        `NaijaCraft: new order! ${order.buyerName} bought ${what}. Open your Orders page to see the delivery address and mark it as sent.`,
      );
    }
  }

  if (stockIssue && ADMIN_EMAIL) {
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Stock problem on order ${shortId(order._id)}`,
      html: emailLayout({
        heading: "An item sold out during payment",
        paragraphs: ["Another buyer took the last one. Check with the seller, and refund that item if they can't supply it."],
        button: { label: "Open orders", path: "/admin/orders?tab=attention" },
        footer: "Admin alert.",
      }),
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Automatic confirmation                                               */
/*  If the buyer says nothing within AUTO_CONFIRM_DAYS of "sent", the    */
/*  shipment counts as delivered and the seller's money is released.     */
/*  Runs whenever an order page loads (at most once a minute), and from  */
/*  /api/cron/auto-confirm if you set up a scheduled job.                */
/* ------------------------------------------------------------------ */

let lastAutoConfirm = 0;

export async function autoConfirmDue(force = false) {
  if (!force && Date.now() - lastAutoConfirm < 60_000) return 0;
  lastAutoConfirm = Date.now();
  await connectToDatabase();
  const now = new Date();
  const due = { "s.status": "dispatched", "s.autoConfirmAt": { $lte: now } };

  const released = await Order.updateMany(
    { shipments: { $elemMatch: { status: "dispatched", autoConfirmAt: { $lte: now }, payoutStatus: "held" } } },
    {
      $set: {
        "shipments.$[s].status": "delivered",
        "shipments.$[s].deliveredAt": now,
        "shipments.$[s].confirmedBy": "auto",
        "shipments.$[s].payoutStatus": "released",
        "shipments.$[s].releasedAt": now,
      },
    },
    { arrayFilters: [{ ...due, "s.payoutStatus": "held" }] },
  );
  const internal = await Order.updateMany(
    { shipments: { $elemMatch: { status: "dispatched", autoConfirmAt: { $lte: now }, payoutStatus: { $ne: "held" } } } },
    {
      $set: {
        "shipments.$[s].status": "delivered",
        "shipments.$[s].deliveredAt": now,
        "shipments.$[s].confirmedBy": "auto",
      },
    },
    { arrayFilters: [{ ...due, "s.payoutStatus": { $ne: "held" } }] },
  );
  return released.modifiedCount + internal.modifiedCount;
}

/* ------------------------------------------------------------------ */
/*  Shipment actions                                                     */
/* ------------------------------------------------------------------ */

export const SHIPMENT_ACTIONS = [
  "dispatch", // seller (or admin): "I've sent it"
  "confirm", // buyer (or admin): "I received it"
  "dispute", // buyer: "There's a problem"
  "resolve_release", // admin: dispute settled in the seller's favour
  "refund", // admin: cancel and refund the buyer (do the refund in Paystack)
  "mark_paid_out", // admin: "I've transferred the money to the seller"
] as const;
export type ShipmentAction = (typeof SHIPMENT_ACTIONS)[number];

export async function performShipmentAction(input: {
  orderId: string;
  shipmentId: string;
  action: ShipmentAction;
  actor: SessionUser;
  note?: string;
}) {
  const { orderId, shipmentId, action, actor } = input;
  const note = input.note?.trim().slice(0, 1000) || undefined;
  if (!mongoose.isValidObjectId(orderId) || !mongoose.isValidObjectId(shipmentId)) {
    throw new UserFacingError("Order not found.", 404);
  }

  await connectToDatabase();
  const order = await Order.findById(orderId);
  const shipment = order?.shipments.id(shipmentId) as (IShipment & mongoose.Types.Subdocument) | null | undefined;
  if (!order || !shipment) throw new UserFacingError("Order not found.", 404);
  if (order.paymentStatus !== "paid") throw new UserFacingError("This order hasn't been paid.", 409);

  const isAdmin = actor.role === "admin";
  const isBuyer = order.buyerId ? String(order.buyerId) === String(actor._id) : false;
  const isSeller = String(shipment.sellerId) === String(actor._id);
  const now = new Date();
  const from = shipment.status;

  const deny = () => {
    throw new UserFacingError("You can't do that on this order.", 403);
  };
  const need = (...states: string[]) => {
    if (!states.includes(from)) {
      throw new UserFacingError(`This part of the order is "${from.replace("_", " ")}", so that isn't possible now.`, 409);
    }
  };

  switch (action) {
    case "dispatch":
      if (!isSeller && !isAdmin) deny();
      need("paid");
      shipment.status = "dispatched";
      shipment.dispatchedAt = now;
      shipment.dispatchNote = note;
      shipment.autoConfirmAt = new Date(now.getTime() + AUTO_CONFIRM_DAYS * DAY);
      break;

    case "confirm":
      if (!isBuyer && !isAdmin) deny();
      need("paid", "dispatched");
      markDelivered(shipment, isBuyer ? "buyer" : "admin", now);
      break;

    case "dispute":
      if (!isBuyer) deny();
      need("paid", "dispatched");
      if (!note || note.length < 10) throw new UserFacingError("Tell us what went wrong (at least 10 characters).");
      shipment.status = "disputed";
      shipment.autoConfirmAt = undefined;
      shipment.dispute = { reason: note, openedAt: now };
      break;

    case "resolve_release":
      if (!isAdmin) deny();
      need("disputed");
      markDelivered(shipment, "admin", now);
      shipment.dispute = { ...(shipment.dispute ?? {}), resolvedAt: now, resolution: "released", note };
      break;

    case "refund":
      if (!isAdmin) deny();
      need("paid", "dispatched", "disputed");
      if (!note) throw new UserFacingError("Add a reason for the refund.");
      shipment.status = "cancelled";
      shipment.payoutStatus = shipment.official ? "internal" : "refunded";
      shipment.cancelReason = note;
      if (shipment.dispute?.openedAt) {
        shipment.dispute = { ...shipment.dispute, resolvedAt: now, resolution: "refunded", note };
      }
      // Put the items back in stock
      for (const item of order.items.filter((i) => String(i.sellerId) === String(shipment.sellerId))) {
        await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity, soldCount: -item.quantity } });
        await Product.updateOne({ _id: item.productId, stock: { $gt: 0 } }, { $set: { inStock: true } });
      }
      break;

    case "mark_paid_out":
      if (!isAdmin) deny();
      if (shipment.payoutStatus !== "released") {
        throw new UserFacingError("Only delivered orders that are ready to pay out can be marked as paid.", 409);
      }
      shipment.payoutStatus = "paid_out";
      shipment.paidOutAt = now;
      shipment.payoutNote = note;
      break;

    default:
      throw new UserFacingError("Unknown action.");
  }

  await order.save();
  await notifyShipmentChange(order, shipment, action, note);
  return order;
}

function markDelivered(s: IShipment, by: "buyer" | "admin" | "auto", now: Date) {
  s.status = "delivered";
  s.deliveredAt = now;
  s.confirmedBy = by;
  s.autoConfirmAt = undefined;
  if (s.payoutStatus === "held") {
    s.payoutStatus = "released";
    s.releasedAt = now;
  }
}

async function notifyShipmentChange(order: IOrder, s: IShipment, action: ShipmentAction, note?: string) {
  const contacts = await sellerContacts([String(s.sellerId)]);
  const seller = contacts.get(String(s.sellerId));
  const what = itemsLine(order, String(s.sellerId));
  const id = shortId(order._id);

  const toBuyer = (subject: string, heading: string, paragraphs: string[]) =>
    sendEmail({
      to: order.buyerEmail,
      subject,
      html: emailLayout({ heading, paragraphs, button: { label: "View your order", path: "/dashboard/customer/orders" }, footer: BUYER_FOOTER }),
    });
  const toSeller = (subject: string, heading: string, paragraphs: string[]) =>
    !s.official && seller?.email
      ? sendEmail({
          to: seller.email,
          subject,
          html: emailLayout({ heading, paragraphs, button: { label: "Open your orders", path: "/dashboard/sales" }, footer: SELLER_FOOTER }),
        })
      : Promise.resolve();
  const toAdmin = (subject: string, paragraphs: string[]) =>
    ADMIN_EMAIL
      ? sendEmail({
          to: ADMIN_EMAIL,
          subject,
          html: emailLayout({ heading: subject, paragraphs, button: { label: "Open orders", path: "/admin/orders?tab=attention" }, footer: "Admin alert." }),
        })
      : Promise.resolve();

  switch (action) {
    case "dispatch":
      await toBuyer(`Order ${id} is on its way`, "Your order is on its way", [
        `${s.sellerName} has sent ${what}.`,
        ...(note ? [`Note from the seller: ${note}`] : []),
        `When it arrives, press "I received it". If there's a problem, report it within ${AUTO_CONFIRM_DAYS} days, otherwise the order counts as delivered.`,
      ]);
      break;
    case "confirm":
    case "resolve_release":
      await toSeller(`Delivered: ${what}`, "Order delivered", [
        `${order.buyerName}'s order (${what}) is complete.`,
        `${formatNaira(s.sellerAmount)} is now ready to pay out to your bank account.`,
      ]);
      break;
    case "dispute":
      await toSeller(`Problem reported on order ${id}`, "A buyer reported a problem", [
        `${order.buyerName} reported a problem with ${what}: "${note}"`,
        "Payment is on hold while our team looks into it. We'll contact you.",
      ]);
      await toAdmin(`Dispute on order ${id}`, [`${order.buyerName} vs ${s.sellerName}: "${note}"`, `Items: ${what}`]);
      break;
    case "refund":
      await toBuyer(`Refund for order ${id}`, "We're refunding you", [
        `${what} from ${s.sellerName} has been cancelled. Reason: ${note}`,
        "Your refund is on its way to your original payment method. It can take a few working days to show.",
      ]);
      await toSeller(`Order ${id} cancelled`, "Order cancelled", [`${what} for ${order.buyerName} was cancelled and refunded. Reason: ${note}`]);
      break;
    case "mark_paid_out":
      await toSeller(`${formatNaira(s.sellerAmount)} sent to your bank`, "You've been paid", [
        `We've transferred ${formatNaira(s.sellerAmount)} for ${what}.`,
        ...(note ? [`Transfer reference: ${note}`] : []),
      ]);
      break;
  }
}

/* ------------------------------------------------------------------ */
/*  Payout details for admins                                            */
/* ------------------------------------------------------------------ */

export type BankDetails = { bankName?: string; accountNumber?: string; accountName?: string };

export async function bankDetailsFor(sellerIds: string[]): Promise<Map<string, BankDetails>> {
  await connectToDatabase();
  const [users, profiles] = await Promise.all([
    User.find({ _id: { $in: sellerIds } })
      .select("+seller.payout")
      .lean<{ _id: mongoose.Types.ObjectId; seller?: { payout?: BankDetails } }[]>(),
    ArtisanProfile.find({ userId: { $in: sellerIds } })
      .select("userId bankDetails")
      .lean<{ userId: mongoose.Types.ObjectId; bankDetails?: BankDetails }[]>(),
  ]);
  const map = new Map<string, BankDetails>();
  for (const p of profiles) if (p.bankDetails?.accountNumber) map.set(String(p.userId), p.bankDetails);
  for (const u of users) if (u.seller?.payout?.accountNumber) map.set(String(u._id), u.seller.payout);
  return map;
}

/** Plain JSON for passing orders to pages. */
export function toPlain<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/* ------------------------------------------------------------------ */
/*  Seller earnings (wallet pages)                                       */
/* ------------------------------------------------------------------ */

export type EarningsLine = {
  id: string;
  orderId: string;
  productName: string;
  quantity: number;
  buyerName: string;
  amount: number; // what the seller gets: items - commission + delivery
  commission: number;
  payoutStatus: string;
  status: string;
  date: string;
};

export async function sellerEarnings(sellerId: string) {
  await connectToDatabase();
  await autoConfirmDue();
  const sid = new mongoose.Types.ObjectId(sellerId);
  const orders = await Order.find({ "shipments.sellerId": sid, paymentStatus: "paid" })
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  let held = 0;
  let available = 0;
  let paidOut = 0;
  const lines: EarningsLine[] = [];

  for (const o of orders) {
    for (const s of o.shipments) {
      if (String(s.sellerId) !== sellerId || s.official) continue;
      if (s.payoutStatus === "held") held += s.sellerAmount;
      if (s.payoutStatus === "released") available += s.sellerAmount;
      if (s.payoutStatus === "paid_out") paidOut += s.sellerAmount;
      const items = o.items.filter((i) => String(i.sellerId) === sellerId);
      lines.push({
        id: String(s._id),
        orderId: String(o._id),
        productName: items.map((i) => i.name).join(", ") || "Marketplace order",
        quantity: items.reduce((n, i) => n + i.quantity, 0),
        buyerName: o.buyerName,
        amount: s.sellerAmount,
        commission: s.commission,
        payoutStatus: s.payoutStatus,
        status: s.status,
        date: new Date(o.createdAt).toISOString(),
      });
    }
  }
  return { held, available, paidOut, lines };
}
