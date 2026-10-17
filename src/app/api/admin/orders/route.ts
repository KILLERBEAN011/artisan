import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { autoConfirmDue } from "@/lib/orders";
import { errorResponse, getSessionUser, isAdmin, UserFacingError } from "@/lib/products";
import { Order } from "@/models/Order";

/* GET /api/admin/orders — admins only. */
export async function GET() {
  try {
    await connectToDatabase();
    const user = await getSessionUser();
    if (!user || !isAdmin(user)) throw new UserFacingError("Admins only.", 403);
    await autoConfirmDue();
    const orders = await Order.find({ paymentStatus: { $ne: "pending" } }).sort({ createdAt: -1 }).limit(500).lean();
    return NextResponse.json(orders);
  } catch (error) {
    return errorResponse(error, "Failed to fetch orders for admin dashboard.");
  }
}

/* Replaced by per-seller actions: POST /api/orders/[id]/shipments/[shipmentId] */
export function PATCH() {
  return NextResponse.json(
    { error: "This endpoint has been replaced. Please refresh the page and try again." },
    { status: 410 },
  );
}
