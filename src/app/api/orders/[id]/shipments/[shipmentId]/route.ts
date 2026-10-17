import { NextResponse } from "next/server";
import { performShipmentAction, SHIPMENT_ACTIONS, type ShipmentAction } from "@/lib/orders";
import { UserFacingError, errorResponse, getSessionUser } from "@/lib/products";

type Ctx = { params: Promise<{ id: string; shipmentId: string }> };

const MESSAGES: Record<ShipmentAction, string> = {
  dispatch: "Marked as sent. We've told the buyer.",
  confirm: "Thanks! We've told the seller and released their payment.",
  dispute: "Problem reported. Payment is on hold and our team will contact you.",
  resolve_release: "Dispute closed and the seller's payment released.",
  refund: "Cancelled. Now refund the buyer in your Paystack dashboard.",
  mark_paid_out: "Marked as paid out. We've emailed the seller.",
};

/* POST /api/orders/[id]/shipments/[shipmentId]
   { action: "dispatch" | "confirm" | "dispute" | "resolve_release" | "refund" | "mark_paid_out", note? }
   Who can do what is checked in lib/orders.ts (seller, buyer or admin). */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id, shipmentId } = await params;
    const actor = await getSessionUser();
    if (!actor) throw new UserFacingError("Please log in.", 401);

    const { action, note } = (await request.json().catch(() => ({}))) as { action?: string; note?: string };
    if (!action || !(SHIPMENT_ACTIONS as readonly string[]).includes(action)) {
      throw new UserFacingError("Unknown action.");
    }

    await performShipmentAction({ orderId: id, shipmentId, action: action as ShipmentAction, actor, note });
    return NextResponse.json({ message: MESSAGES[action as ShipmentAction] });
  } catch (error) {
    return errorResponse(error, "Couldn't update the order.");
  }
}
