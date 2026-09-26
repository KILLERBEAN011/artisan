import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

interface SessionUser {
  id?: string;
  _id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    // 1. Direct Tracking ID lookup
    if (search) {
      let query: any = {};
      if (mongoose.Types.ObjectId.isValid(search)) {
        query._id = search;
      } else {
        // Match either Paystack reference or partial ObjectId
        query = {
          $or: [{ paystackReference: search }, { buyerEmail: search }],
        };
      }

      const order = await Order.findOne(query).lean();
      if (!order && search.length === 8) {
        // Fallback: search for orders ending with the 8-character snippet
        const allOrders = await Order.find()
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        const found = allOrders.find((o) =>
          o._id.toString().toUpperCase().endsWith(search.toUpperCase()),
        );
        if (found) {
          return NextResponse.json({ order: found }, { status: 200 });
        }
      }

      if (!order) {
        return NextResponse.json(
          { error: "No matching order found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ order }, { status: 200 });
    }

    // 2. Logged-in customer orders list
    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    if (!user) {
      return NextResponse.json({ orders: [] }, { status: 200 });
    }

    const buyerId = user._id || user.id;
    const buyerEmail = user.email;

    const orders = await Order.find({
      $or: [
        ...(buyerId ? [{ buyerId }] : []),
        ...(buyerEmail ? [{ buyerEmail }] : []),
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Fetch Customer Orders Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details." },
      { status: 500 },
    );
  }
}
