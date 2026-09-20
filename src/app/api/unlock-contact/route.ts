import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Unlock } from "@/models/Unlock";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const { reference, artisanId, clientEmail } = await request.json();

    if (!reference || !artisanId || !clientEmail) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 },
      );
    }

    // 1. Verify the transaction directly with Paystack's servers
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json(
        { error: "Payment verification failed." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // 2. Fetch the artisan's contact information
    // 2. Fetch the artisan's contact information
    const artisanProfile = await ArtisanProfile.findById(artisanId);

    if (!artisanProfile) {
      return NextResponse.json(
        { error: "Artisan profile not found." },
        { status: 404 },
      );
    }

    const artisanUser = await User.findById(artisanProfile.userId);

    if (!artisanUser) {
      return NextResponse.json(
        { error: "Artisan user account not found." },
        { status: 404 },
      );
    }

    // Prioritize the dedicated WhatsApp number, fallback to the base user phone
    const phoneNumber = artisanProfile?.whatsappNumber || artisanUser.phone;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "This artisan has no contact number on file." },
        { status: 400 },
      );
    }

    // 3. Record the successful payment in your database
    try {
      await Unlock.create({
        clientEmail,
        artisanId,
        paystackReference: reference,
        amountPaid: paystackData.data.amount / 100, // Convert from Kobo to Naira
      });
    } catch (error) {
      // Cast to access the MongoDB error code safely without using 'any'
      const mongoError = error as { code?: number };

      // Ignore duplicate key errors if the user double-clicked the button
      if (mongoError.code !== 11000) {
        throw error;
      }
    }

    // 4. Send the SMS alert via Termii
    // const formattedPhone = phoneNumber.startsWith("0")
    //   ? `234${phoneNumber.slice(1)}`
    //   : phoneNumber;

    // if (process.env.TERMII_API_KEY) {
    //   const termiiPayload = {
    //     to: formattedPhone,
    //     from: process.env.TERMII_SENDER_ID || "N-Alert", // Must be approved by Termii
    //     sms: `Hi ${artisanUser.name.split(" ")[0]}, a client (${clientEmail}) just paid to unlock your contact on NaijaCraft! Check your WhatsApp for their message.`,
    //     type: "plain",
    //     channel: "generic",
    //     api_key: process.env.TERMII_API_KEY,
    //   };

    //   // Fire and forget (do not await) so the frontend unlocks instantly without waiting for the SMS network
    //   fetch("https://v4.api.termii.com/api/sms/send", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(termiiPayload),
    //   }).catch((smsErr) => console.error("Termii SMS Error:", smsErr));
    // }

    // 5. Return the number to the frontend so it can render the WhatsApp link
    return NextResponse.json({ phoneNumber }, { status: 200 });
  } catch (error) {
    console.error("Unlock Contact API Error:", error);
    return NextResponse.json(
      { error: "Something went wrong while processing the request." },
      { status: 500 },
    );
  }
}
