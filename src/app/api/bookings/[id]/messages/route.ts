import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { Message } from "@/models/Message";
import { auth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
// Imported so Mongoose registers the "User" model for populate() below.
import "@/models/User";
import { sendWhatsAppAlert } from "@/lib/whatsapp";

// Configure Cloudinary (Make sure these exact keys are in your .env.local file)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getBookingIfParticipant(
  bookingId: string,
  userId: string,
  role: string,
) {
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) return null;

  if (role === "customer") {
    return booking.customerId.toString() === userId ? booking : null;
  }

  // Artisan: check the ArtisanProfile they own matches this booking's artisanId.
  const profile = await ArtisanProfile.findOne({ userId }).lean();
  if (!profile) return null;
  return booking.artisanId.toString() === profile._id.toString()
    ? booking
    : null;
}

export async function GET(
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

    await connectToDatabase();

    const { id } = await params;
    const booking = await getBookingIfParticipant(
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
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    await connectToDatabase();

    const { id } = await params;
    const booking = await getBookingIfParticipant(
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

    // 1. Parse the multipart form data instead of JSON
    const formData = await request.formData();
    const text = (formData.get("text") as string) || "";
    const file = formData.get("image") as File | null;

    // A message is valid if it has text OR an image
    if (!text.trim() && !file) {
      return NextResponse.json(
        { error: "Message text or an image is required." },
        { status: 400 },
      );
    }

    let imageUrl = undefined;

    // 2. If a file exists, upload it directly to Cloudinary using a buffer
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      imageUrl = await new Promise<string | undefined>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "naijacraft_chat" }, (error, result) => {
            if (error) reject(error);
            else resolve(result?.secure_url);
          })
          .end(buffer);
      });
    }

    // 3. Save the message to MongoDB, including the new imageUrl
    const message = await Message.create({
      bookingId: id,
      senderId: session.user.id,
      text: text.trim(),
      imageUrl: imageUrl,
    });

    // --- WHATSAPP NOTIFICATION LOGIC ---
    // Count how many messages are in this booking
    const messageCount = await Message.countDocuments({ bookingId: id });

    // If this is the FIRST message, it means a new customer just reached out!
    if (messageCount === 1) {
      // Find the artisan's profile to get their WhatsApp number
      const artisanProfile = await ArtisanProfile.findById(
        booking.artisanId,
      ).lean();

      if (artisanProfile && artisanProfile.whatsappNumber) {
        // Construct the message and the link to the chat
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const alertMsg = `New job request on NaijaCraft! A customer just sent you a message. Log in to reply and quote: ${appUrl}/bookings/${id}`;

        // Fire the WhatsApp alert in the background (Notice we don't use 'await' so we don't slow down the chat UI!)
        sendWhatsAppAlert(artisanProfile.whatsappNumber, alertMsg).catch(
          console.error,
        );
      }
    }
    // -----------------------------------

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
