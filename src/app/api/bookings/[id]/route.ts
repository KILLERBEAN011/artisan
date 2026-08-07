import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { auth } from "@/lib/auth";
import "@/models/User";

async function loadBookingWithAccess(id: string, userId: string, role: string) {
  const booking = await Booking.findById(id)
    .populate("customerId", "name")
    .populate({
      path: "artisanId",
      select: "serviceTitle userId",
      populate: { path: "userId", select: "name" },
    })
    .lean();

  if (!booking) return { booking: null, viewerRole: null as null };

  const customer = booking.customerId as unknown as { _id: { toString(): string } };
  const artisanProfile = booking.artisanId as unknown as { _id: { toString(): string } };

  const isCustomer = role === "customer" && customer._id.toString() === userId;

  let isArtisan = false;
  if (role === "artisan") {
    const myProfile = await ArtisanProfile.findOne({ userId }).select("_id").lean();
    isArtisan = !!myProfile && myProfile._id.toString() === artisanProfile._id.toString();
  }

  if (!isCustomer && !isArtisan) {
    return { booking: null, viewerRole: null as null };
  }

  return { booking, viewerRole: (isCustomer ? "customer" : "artisan") as "customer" | "artisan" };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const { booking, viewerRole } = await loadBookingWithAccess(
      id,
      session.user.id,
      session.user.role,
    );

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found, or you don't have access to it." },
        { status: 404 },
      );
    }

    return NextResponse.json({ booking, viewerRole });
  } catch (error) {
    console.error("GET /api/bookings/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking. Check server logs." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Admin-only action — admins aren't a participant on the booking, so this
    // is handled before the customer/artisan access check below.
    if (action === "release-funds") {
      if (session.user.role !== "admin") {
        return NextResponse.json(
          { error: "Only an admin can release funds." },
          { status: 403 },
        );
      }

      const booking = await Booking.findById(id);
      if (!booking) {
        return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      }
      if (booking.status !== "completed") {
        return NextResponse.json(
          { error: "This job hasn't been marked complete yet." },
          { status: 409 },
        );
      }
      if (!booking.escrowFunded) {
        return NextResponse.json(
          { error: "This booking was never paid for." },
          { status: 409 },
        );
      }
      if (booking.payoutStatus === "released") {
        return NextResponse.json(
          { error: "Funds have already been released for this booking." },
          { status: 409 },
        );
      }

      booking.payoutStatus = "released";
      booking.payoutReleasedAt = new Date();
      await booking.save();

      return NextResponse.json({ booking });
    }

    const { booking, viewerRole } = await loadBookingWithAccess(
      id,
      session.user.id,
      session.user.role,
    );

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found, or you don't have access to it." },
        { status: 404 },
      );
    }

    if (action === "send-quote") {
      if (viewerRole !== "artisan") {
        return NextResponse.json(
          { error: "Only the artisan on this booking can send a quote." },
          { status: 403 },
        );
      }
      if (booking.status !== "awaiting-quote") {
        return NextResponse.json(
          { error: "A quote has already been sent for this booking." },
          { status: 409 },
        );
      }

      const amountNaira = Number(body.amountNaira);
      if (!amountNaira || amountNaira <= 0) {
        return NextResponse.json(
          { error: "A valid quote amount is required." },
          { status: 400 },
        );
      }

      const updated = await Booking.findByIdAndUpdate(
        id,
        { amountNaira, status: "quote-sent" },
        { returnDocument: "after" },
      ).lean();

      return NextResponse.json({ booking: updated });
    }

    if (action === "accept-quote") {
      if (viewerRole !== "customer") {
        return NextResponse.json(
          { error: "Only the customer on this booking can accept a quote." },
          { status: 403 },
        );
      }
      if (booking.status !== "quote-sent") {
        return NextResponse.json(
          { error: "There's no pending quote to accept on this booking." },
          { status: 409 },
        );
      }

      const updated = await Booking.findByIdAndUpdate(
        id,
        { status: "scheduled" },
        { returnDocument: "after" },
      ).lean();

      return NextResponse.json({ booking: updated });
    }

    if (action === "mark-complete") {
      if (viewerRole !== "customer") {
        return NextResponse.json(
          { error: "Only the customer on this booking can mark it complete." },
          { status: 403 },
        );
      }
      if (booking.status !== "scheduled") {
        return NextResponse.json(
          { error: "This job isn't in a state that can be marked complete." },
          { status: 409 },
        );
      }
      if (!booking.escrowFunded) {
        return NextResponse.json(
          { error: "Pay for this job before marking it complete." },
          { status: 409 },
        );
      }

      const updated = await Booking.findByIdAndUpdate(
        id,
        { status: "completed" },
        { returnDocument: "after" },
      ).lean();

      return NextResponse.json({ booking: updated });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/bookings/[id] failed:", error);
    return NextResponse.json(
      { error: "Failed to update booking. Check server logs." },
      { status: 500 },
    );
  }
}
