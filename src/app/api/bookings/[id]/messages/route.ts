import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { Message } from "@/models/Message";
import { auth } from "@/lib/auth";
// Imported so Mongoose registers the "User" model for populate() below.
import "@/models/User";

async function getBookingIfParticipant(bookingId: string, userId: string, role: string) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) return null;

  if (role === "customer") {
    return booking.customerId.toString() === userId ? booking : null;
  }

  // Artisan: check the ArtisanProfile they own matches this booking's artisanId.
  const profile = await ArtisanProfile.findOne({ userId }).lean();
  if (!profile) return null;
  return booking.artisanId.toString() === profile._id.toString() ? booking : null;
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
    const booking = await getBookingIfParticipant(id, session.user.id, session.user.role);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found, or you don't have access to it." },
        { status: 404 },
      );
    }

    const messages = await Message.find({ bookingId: id })
      .populate("senderId", "name")
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/bookings/[id]/messages failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages. Check server logs." },
      { status: 500 },
    );
  }
}

export async function POST(
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
    const booking = await getBookingIfParticipant(id, session.user.id, session.user.role);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found, or you don't have access to it." },
        { status: 404 },
      );
    }

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json({ error: "Message text is required." }, { status: 400 });
    }

    const message = await Message.create({
      bookingId: id,
      senderId: session.user.id,
      text,
    });

    const populated = await message.populate("senderId", "name");

    return NextResponse.json({ message: populated }, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookings/[id]/messages failed:", error);
    return NextResponse.json(
      { error: "Failed to send message. Check server logs." },
      { status: 500 },
    );
  }
}
