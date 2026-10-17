import { NextResponse } from "next/server";
import { autoConfirmDue } from "@/lib/orders";

/* GET /api/cron/auto-confirm
   Optional: a scheduled job can call this once an hour with the header
   "Authorization: Bearer <CRON_SECRET>". Without it, orders are still
   auto-confirmed whenever someone opens an orders page. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const confirmed = await autoConfirmDue(true);
  return NextResponse.json({ confirmed });
}
