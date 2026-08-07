import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }
    if (session.user.role !== "customer") {
      return NextResponse.json(
        { error: "Only the customer on a booking can pay for it." },
        { status: 403 },
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Payments aren't configured yet. Add PAYSTACK_SECRET_KEY to .env.local." },
        { status: 500 },
      );
    }

    await connectToDatabase();

    const { id } = await params;
    const body = await request.json();
    const reference = typeof body.reference === "string" ? body.reference : "";

    if (!reference) {
      return NextResponse.json({ error: "Missing payment reference." }, { status: 400 });
    }

    const booking = await Booking.findById(id).lean();
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (booking.customerId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have access to this booking." },
        { status: 403 },
      );
    }

    if (booking.escrowFunded) {
      return NextResponse.json({ error: "This booking has already been paid." }, { status: 409 });
    }

    if (booking.status !== "scheduled") {
      return NextResponse.json(
        { error: "This booking isn't ready to be paid yet — the quote must be accepted first." },
        { status: 409 },
      );
    }

    // Ask Paystack directly whether this reference is real and successful.
    // Never trust the client's own claim that a payment succeeded.
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      },
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { error: "Could not reach Paystack to verify this payment." },
        { status: 502 },
      );
    }

    const verifyData = await verifyRes.json();
    const tx = verifyData?.data;

    const expectedKobo = Math.round(booking.amountNaira * 100);

    if (
      !tx ||
      tx.status !== "success" ||
      tx.currency !== "NGN" ||
      Number(tx.amount) !== expectedKobo
    ) {
      return NextResponse.json(
        { error: "Payment verification failed — amount or status didn't match." },
        { status: 400 },
      );
    }

    const updated = await Booking.findByIdAndUpdate(
      id,
      {
        escrowFunded: true,
        paymentReference: reference,
        paidAt: new Date(),
      },
      { returnDocument: "after" },
    ).lean();

    return NextResponse.json({ booking: updated });
  } catch (error) {
    console.error("POST /api/bookings/[id]/verify-payment failed:", error);
    return NextResponse.json(
      { error: "Failed to verify payment. Check server logs." },
      { status: 500 },
    );
  }
}
