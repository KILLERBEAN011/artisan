import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { auth } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { rating, review } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "A valid rating between 1 and 5 is required." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 },
      );
    }

    if (booking.customerId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    if (booking.status !== "completed") {
      return NextResponse.json(
        { error: "You can only review completed jobs." },
        { status: 400 },
      );
    }

    if (booking.rating) {
      return NextResponse.json(
        { error: "You have already reviewed this booking." },
        { status: 400 },
      );
    }

    // Save review data to the booking
    booking.rating = rating;
    booking.review = review ?? "";
    booking.reviewedAt = new Date();
    await booking.save();

    // Recalculate the artisan's average rating and review count
    const artisanProfile = await ArtisanProfile.findById(booking.artisanId);
    if (artisanProfile) {
      const allCompletedBookings = await Booking.find({
        artisanId: booking.artisanId,
        rating: { $exists: true, $ne: null },
      });

      const totalReviews = allCompletedBookings.length;
      const sumRatings = allCompletedBookings.reduce(
        (acc, curr) => acc + (curr.rating || 0),
        0,
      );
      const newAverage = totalReviews > 0 ? sumRatings / totalReviews : 0;

      artisanProfile.rating = newAverage;
      artisanProfile.reviewCount = totalReviews;
      await artisanProfile.save();
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("POST /api/bookings/[id]/review failed:", error);
    return NextResponse.json(
      { error: "Failed to submit review. Check server logs." },
      { status: 500 },
    );
  }
}
