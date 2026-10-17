import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { autoConfirmDue } from "@/lib/orders";
import { errorResponse, getSessionUser, isAdmin, UserFacingError } from "@/lib/products";
import { Order } from "@/models/Order";

/* GET /api/orders — admins only: every paid order, newest first. */
export async function GET() {
  try {
    await connectToDatabase();
    const user = await getSessionUser();
    if (!user || !isAdmin(user)) throw new UserFacingError("Admins only.", 403);
    await autoConfirmDue();
    const orders = await Order.find({ paymentStatus: { $ne: "pending" } }).sort({ createdAt: -1 }).limit(500).lean();
    return NextResponse.json({ orders });
  } catch (error) {
    return errorResponse(error, "Failed to fetch orders.");
  }
}

/* The old browser-priced checkout and the open status update were unsafe and are retired.
   Checkout: POST /api/checkout. Order updates: POST /api/orders/[id]/shipments/[shipmentId]. */
const gone = () =>
  NextResponse.json(
    { error: "This endpoint has been replaced. Please refresh the page and try again." },
    { status: 410 },
  );
export const POST = gone;
export const PATCH = gone;
