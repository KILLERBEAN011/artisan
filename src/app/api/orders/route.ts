import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";

interface SessionUser {
  id?: string;
  _id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

// GET: Fetch all orders for the Admin Dashboard
export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all orders, newest first
    const orders = await Order.find().sort({ createdAt: -1 });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders." },
      { status: 500 },
    );
  }
}

// POST: Create a new order after Paystack checkout
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      reference,
      buyerName,
      buyerEmail,
      buyerPhone,
      deliveryAddress,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      buyerId: clientBuyerId,
    } = body;

    if (
      !reference ||
      !buyerEmail ||
      !buyerPhone ||
      !deliveryAddress ||
      !items?.length
    ) {
      return NextResponse.json(
        { error: "Missing required order information." },
        { status: 400 },
      );
    }

    // 1. Verify payment with Paystack
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // 2. Resolve buyer ID from active session or request payload
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    const buyerId = user?._id || user?.id || clientBuyerId || null;

    // 3. Save order to MongoDB with buyerId attached
    const newOrder = await Order.create({
      buyerId,
      buyerEmail,
      buyerName,
      buyerPhone,
      deliveryAddress,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      paystackReference: reference,
      orderStatus: "paid",
      payoutStatus: "held_in_escrow",
    });

    return NextResponse.json(
      { success: true, orderId: newOrder._id },
      { status: 201 },
    );
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// PATCH: Update order status
export async function PATCH(request: Request) {
  try {
    const { orderId, newStatus, payoutStatus } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    await connectToDatabase();

    // Dynamically build the update object based on what the frontend sends
    const updateData: any = {};
    if (newStatus) updateData.orderStatus = newStatus;
    if (payoutStatus) updateData.payoutStatus = payoutStatus;

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updateData, {
      new: true,
    });

    return NextResponse.json(
      { success: true, order: updatedOrder },
      { status: 200 },
    );
  } catch (error) {
    console.error("Update Order Error:", error);
    return NextResponse.json(
      { error: "Failed to update order status." },
      { status: 500 },
    );
  }
}
