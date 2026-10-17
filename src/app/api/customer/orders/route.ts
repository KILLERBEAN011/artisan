import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { autoConfirmDue } from "@/lib/orders";
import { errorResponse, getSessionUser, UserFacingError } from "@/lib/products";
import { Order } from "@/models/Order";

/* GET /api/customer/orders — the logged-in buyer's own orders.
   (The old public "search by email or reference" lookup is gone: it let anyone
   see a stranger's address and phone number.) */
export async function GET() {
  try {
    await connectToDatabase();
    const user = await getSessionUser();
    const session = await auth();
    if (!user) throw new UserFacingError("Please log in to see your orders.", 401);
    await autoConfirmDue();

    const email = session?.user?.email?.toLowerCase();
    const orders = await Order.find({
      paymentStatus: { $in: ["paid", "amount_mismatch"] },
      $or: [{ buyerId: user._id }, ...(email ? [{ buyerEmail: email, buyerId: { $exists: false } }] : [])],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return NextResponse.json({ orders });
  } catch (error) {
    return errorResponse(error, "Failed to fetch your orders.");
  }
}
