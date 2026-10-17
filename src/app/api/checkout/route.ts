import { NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { cleanLines, priceCart } from "@/lib/checkout";
import { connectToDatabase } from "@/lib/mongodb";
import { initializePayment } from "@/lib/paystack";
import { UserFacingError, errorResponse, getSessionUser } from "@/lib/products";
import { NIGERIAN_STATES } from "@/lib/product-options";
import { normaliseNigerianPhone } from "@/lib/seller-options";
import { auth } from "@/lib/auth";
import { Order } from "@/models/Order";

/** The address the buyer is using right now, so Paystack sends them back to the same site. */
function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0] ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}`;
}

/* ------------------------------------------------------------------ */
/*  POST /api/checkout                                                  */
/*  { lines, deliveryChoices, buyer: { name, phone, address, state } }  */
/*                                                                      */
/*  1. Prices the cart from the database (never from the browser)      */
/*  2. Saves the order as "awaiting payment", split per seller          */
/*  3. Starts a Paystack payment for exactly that amount                */
/*  Returns { authorizationUrl } to send the buyer to Paystack.         */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const user = await getSessionUser();
    const session = await auth();
    const email = session?.user?.email;
    if (!user || !email) throw new UserFacingError("Please log in to check out.", 401);

    const body = (await request.json().catch(() => ({}))) as {
      lines?: unknown;
      deliveryChoices?: Record<string, string>;
      buyer?: { name?: string; phone?: string; address?: string; state?: string };
    };

    // Buyer details
    const name = String(body.buyer?.name ?? "").trim().slice(0, 80);
    const phone = normaliseNigerianPhone(String(body.buyer?.phone ?? ""));
    const address = String(body.buyer?.address ?? "").trim().slice(0, 300);
    const state = String(body.buyer?.state ?? "");
    const problems: string[] = [];
    if (name.length < 2) problems.push("Enter your name.");
    if (!phone) problems.push("Enter a Nigerian phone number, e.g. 0803 123 4567.");
    if (address.length < 10) problems.push("Enter your full delivery address.");
    if (!(NIGERIAN_STATES as readonly string[]).includes(state)) problems.push("Choose your state.");
    if (problems.length) throw new UserFacingError(problems.join(" "));

    // Price everything from the database
    const lines = cleanLines(body.lines);
    if (lines.length === 0) throw new UserFacingError("Your cart is empty.");
    const quote = await priceCart(lines, body.deliveryChoices ?? {});
    if (quote.problems.length) {
      // Something changed (price, stock, availability): show the buyer the updated cart first
      return NextResponse.json({ error: "Your cart changed. Please check it and try again.", quote }, { status: 409 });
    }
    if (quote.groups.length === 0) throw new UserFacingError("Your cart is empty.");
    if (quote.total < 100) throw new UserFacingError("The minimum order is ₦100.");

    const orderId = new mongoose.Types.ObjectId();
    const reference = `NC-${String(orderId).slice(-8).toUpperCase()}-${crypto.randomBytes(3).toString("hex")}`;

    const order = await Order.create({
      _id: orderId,
      buyerId: user._id,
      buyerEmail: email,
      buyerName: name,
      buyerPhone: `+${phone}`,
      deliveryAddress: address,
      deliveryState: state,
      items: quote.groups.flatMap((g) =>
        g.items.map((i) => ({
          productId: i.productId,
          sellerId: g.sellerId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
          slug: i.slug,
          options: i.options,
        })),
      ),
      shipments: quote.groups.map((g) => ({
        sellerId: g.sellerId,
        sellerName: g.sellerName,
        official: g.official,
        itemsTotal: g.itemsTotal,
        deliveryMethod: g.delivery.method,
        deliveryLabel: g.delivery.label,
        deliveryFee: g.deliveryFee,
        deliveryNote: g.delivery.note,
        status: "awaiting_payment",
        commissionRate: g.commissionRate,
        commission: g.commission,
        sellerAmount: g.sellerAmount,
        payoutStatus: "pending",
      })),
      subtotal: quote.subtotal,
      deliveryFee: quote.deliveryTotal,
      totalAmount: quote.total,
      commissionTotal: quote.groups.reduce((s, g) => s + g.commission, 0),
      paystackReference: reference,
      paymentStatus: "pending",
    });

    try {
      const payment = await initializePayment({
        email,
        amountNaira: quote.total,
        reference,
        callbackUrl: `${requestOrigin(request)}/checkout/complete`,
        metadata: { orderId: String(order._id), buyerName: name },
      });
      return NextResponse.json({ authorizationUrl: payment.authorization_url, reference });
    } catch (e) {
      await Order.deleteOne({ _id: order._id, paymentStatus: "pending" });
      console.error("Paystack initialize failed:", e);
      throw new UserFacingError("We couldn't start the payment. Please try again in a moment.", 502);
    }
  } catch (error) {
    return errorResponse(error, "Something went wrong starting checkout.");
  }
}
