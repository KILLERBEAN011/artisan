import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Message } from "@/models/Message"; // <-- 1. Import the Message model
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    await connectToDatabase();

    const params = request.nextUrl.searchParams;
    const artisanId = params.get("artisanId");

    // Customers only ever see their own bookings. If an artisanId filter is
    // passed, it's applied on top of that — never as a substitute for it.
    const filter: Record<string, unknown> = { customerId: session.user.id };
    if (artisanId) filter.artisanId = artisanId;

    const bookings = await Booking.find(filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("GET /api/bookings failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings. Check server logs." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    if (session.user.role !== "customer") {
      return NextResponse.json(
        { error: "Only customer accounts can request a booking." },
        { status: 403 },
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const { artisanId, title, initialMessage } = body; // <-- 2. Extract initialMessage

    // Enforce that the user typed something in the modal
    if (!artisanId || !title || !initialMessage) {
      return NextResponse.json(
        { error: "artisanId, title, and initialMessage are required." },
        { status: 400 },
      );
    }

    // customerId comes from the verified session, never from the request body —
    // otherwise anyone could create bookings pretending to be someone else.
    const booking = await Booking.create({
      customerId: session.user.id,
      artisanId,
      title,
      status: "awaiting-quote",
    });

    // 3. Immediately save the customer's message to the new booking
    await Message.create({
      bookingId: booking._id,
      senderId: session.user.id,
      text: initialMessage,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookings failed:", error);
    return NextResponse.json(
      { error: "Failed to create booking. Check server logs." },
      { status: 500 },
    );
  }
}
