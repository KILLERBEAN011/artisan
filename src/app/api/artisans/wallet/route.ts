import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";

interface OrderItem {
  name?: string;
  productName?: string;
  sellerId: { toString: () => string } | string;
  price: number;
  quantity: number;
}

interface OrderDoc {
  _id: { toString: () => string } | string;
  buyerName: string;
  createdAt: string | Date;
  orderStatus: string;
  payoutStatus?: string;
  items: OrderItem[];
}

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "artisan") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const artisanId = session.user.id;

    // Fetch orders and sort by newest first
    const orders = await Order.find({ "items.sellerId": artisanId }).sort({
      createdAt: -1,
    });

    let pendingEscrow = 0;
    let availableBalance = 0;

    // Array to hold the history records
    const recentSales: Record<string, unknown>[] = [];


    orders.forEach((order: OrderDoc) => {
      order.items.forEach((item: OrderItem) => {
        if (item.sellerId.toString() === artisanId) {
          const itemTotal = item.price * item.quantity;

          // 1. Calculate Balances
          if (
            order.payoutStatus === "held_in_escrow" ||
            order.orderStatus === "pending" ||
            order.orderStatus === "dispatched"
          ) {
            pendingEscrow += itemTotal;
          } else if (
            order.payoutStatus === "released" ||
            order.orderStatus === "delivered" ||
            order.orderStatus === "completed"
          ) {
            availableBalance += itemTotal;
          }

          // 2. Build Sales History Record
          recentSales.push({
            // Creating a unique ID for the list key
            id: `${order._id.toString()}-${Math.random().toString(36).substr(2, 9)}`,
            // Fallback to "Product" if you didn't save the item name during checkout
            productName: item.name || item.productName || "Marketplace Item",
            buyerName: order.buyerName || "Guest User",
            amount: itemTotal,
            status: order.payoutStatus || order.orderStatus,
            date: order.createdAt,
          });
        }
      });
    });

    return NextResponse.json({
      pendingEscrow,
      availableBalance,
      recentSales, // <-- Returning the new array!
    });
  } catch (error) {
    console.error("Wallet Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet data" },
      { status: 500 },
    );
  }
}
