import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";

// Import the User model so Mongoose knows how to populate the sellerId
import "@/models/User";

export async function GET() {
  try {
    const session = await auth();

    // 1. Strict Admin Protection
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized access. Admins only." },
        { status: 401 },
      );
    }

    await connectToDatabase();

    // 2. Fetch all orders, newest first, and populate the seller's details
    const orders = await Order.find({})
      .populate({
        path: "items.sellerId",
        select: "name email phone", // Pulls the artisan's contact info for logistics pickup
        model: "User",
      })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Admin Orders Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders for admin dashboard." },
      { status: 500 },
    );
  }
}
export async function PATCH(request: Request) {
  try {
    const session = await auth();

    // 1. Strict Admin Protection
    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized access. Admins only." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { orderId, orderStatus, payoutStatus } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // 2. Find the exact order and update the statuses to release the escrow
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          orderStatus: orderStatus || "delivered",
          payoutStatus: payoutStatus || "released",
        },
      },
      { new: true },
    );

    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Escrow funds released successfully!",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Admin Order Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update order status." },
      { status: 500 },
    );
  }
}
