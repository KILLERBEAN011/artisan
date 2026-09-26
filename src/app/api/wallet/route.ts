import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Order } from "@/models/Order";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json({ error: "Missing seller ID" }, { status: 400 });
    }

    await connectToDatabase();

    // Find all orders that contain an item sold by this seller
    const orders = await Order.find({ "items.sellerId": sellerId }).sort({
      createdAt: -1,
    });

    let availableBalance = 0;
    let pendingEscrow = 0;
    const transactions: any[] = [];

    // Loop through orders and calculate the seller's cut
    orders.forEach((order) => {
      order.items.forEach((item: any) => {
        // Only calculate revenue for items THIS seller actually owns
        if (item.sellerId.toString() === sellerId) {
          const itemTotal = item.price * item.quantity;

          // 1. Calculate the active balances based on Payout Status
          if (order.payoutStatus === "released") {
            availableBalance += itemTotal;
          } else if (order.payoutStatus === "held_in_escrow") {
            pendingEscrow += itemTotal;
          }
          // Note: If payoutStatus is "paid_out", it intentionally bypasses both balances!

          // 2. Determine display status for the transaction history
          let displayStatus = "In Escrow";
          if (order.payoutStatus === "released") displayStatus = "Available";
          if (order.payoutStatus === "paid_out") displayStatus = "Paid Out";

          transactions.push({
            id: `${order._id}-${item._id || item.productId}`,
            productName: item.name,
            amount: itemTotal,
            quantity: item.quantity,
            status: displayStatus,
            date: order.createdAt,
          });
        }
      });
    });

    return NextResponse.json(
      {
        available: availableBalance,
        pending: pendingEscrow,
        transactions,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Wallet Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to load wallet data." },
      { status: 500 },
    );
  }
}
