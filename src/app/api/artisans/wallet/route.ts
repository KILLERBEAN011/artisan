import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sellerEarnings } from "@/lib/orders";
import { errorResponse } from "@/lib/products";

const STATUS: Record<string, string> = {
  held: "held_in_escrow",
  released: "released",
  paid_out: "paid out",
  refunded: "refunded",
};

/* GET /api/artisans/wallet — the logged-in artisan's marketplace sales
   (after the NaijaCraft commission). */
export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "artisan") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const e = await sellerEarnings(session.user.id);
    return NextResponse.json({
      pendingEscrow: e.held,
      availableBalance: e.available,
      paidOut: e.paidOut,
      recentSales: e.lines.map((l) => ({
        id: l.id,
        productName: l.productName,
        buyerName: l.buyerName,
        amount: l.amount,
        status: STATUS[l.payoutStatus] ?? l.payoutStatus,
        date: l.date,
      })),
    });
  } catch (error) {
    return errorResponse(error, "Failed to fetch wallet data");
  }
}
