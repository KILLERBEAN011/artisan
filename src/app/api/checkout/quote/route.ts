import { NextResponse } from "next/server";
import { cleanLines, priceCart } from "@/lib/checkout";
import { errorResponse } from "@/lib/products";

/* POST /api/checkout/quote
   { lines: [{ productId, quantity, options }], deliveryChoices: { [sellerId]: method } }
   Returns live prices, stock, delivery options and totals for the cart page.
   Nothing is saved. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { lines?: unknown; deliveryChoices?: Record<string, string> };
    const lines = cleanLines(body.lines);
    const choices = body.deliveryChoices && typeof body.deliveryChoices === "object" ? body.deliveryChoices : {};
    const quote = await priceCart(lines, choices);
    return NextResponse.json(quote, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, "Couldn't load your cart.");
  }
}
