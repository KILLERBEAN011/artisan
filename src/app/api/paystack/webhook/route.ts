import { NextResponse } from "next/server";
import { confirmPayment } from "@/lib/orders";
import { isValidWebhookSignature } from "@/lib/paystack";

/* POST /api/paystack/webhook
   Paystack calls this after every payment, even if the buyer closed their
   browser before coming back to the site. Set this URL in your Paystack
   dashboard: Settings → API Keys & Webhooks → Webhook URL
   https://naijacraft.com.ng/api/paystack/webhook */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!isValidWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
    const reference = event.data?.reference;
    // Only marketplace references start with NC-; booking payments are handled elsewhere
    if (event.event === "charge.success" && reference?.startsWith("NC-")) {
      await confirmPayment(reference);
    }
  } catch (error) {
    console.error("Paystack webhook error:", error);
    // Paystack retries on non-200 responses; returning 500 lets it try again later
    return NextResponse.json({ received: false }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
