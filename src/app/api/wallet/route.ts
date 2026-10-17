import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { sellerEarnings } from "@/lib/orders";
import { errorResponse, getSessionUser, isAdmin, UserFacingError } from "@/lib/products";

const LABEL: Record<string, string> = {
  held: "In Escrow",
  released: "Available",
  paid_out: "Paid Out",
  refunded: "Refunded",
};

/* GET /api/wallet — the logged-in seller's marketplace earnings.
   Admins may pass ?sellerId= to look at a seller. Everyone else only sees their own. */
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const user = await getSessionUser();
    if (!user) throw new UserFacingError("Please log in.", 401);

    const requested = new URL(request.url).searchParams.get("sellerId");
    const sellerId =
      isAdmin(user) && requested && mongoose.isValidObjectId(requested) ? requested : String(user._id);

    const e = await sellerEarnings(sellerId);
    return NextResponse.json({
      available: e.available,
      pending: e.held,
      paidOut: e.paidOut,
      transactions: e.lines.map((l) => ({
        id: l.id,
        productName: l.productName,
        amount: l.amount,
        quantity: l.quantity,
        status: LABEL[l.payoutStatus] ?? l.payoutStatus,
        date: l.date,
      })),
    });
  } catch (error) {
    return errorResponse(error, "Failed to load wallet data.");
  }
}
