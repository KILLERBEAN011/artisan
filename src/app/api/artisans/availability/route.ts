import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { auth } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "artisan") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isAvailable } = await request.json();
    if (typeof isAvailable !== "boolean") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await connectToDatabase();

    // Update the artisan's profile
    await ArtisanProfile.findOneAndUpdate(
      { userId: session.user.id },
      { isAvailable },
    );

    return NextResponse.json({ success: true, isAvailable });
  } catch (error) {
    console.error("PATCH /api/artisan/availability error:", error);
    return NextResponse.json(
      { error: "Failed to update availability" },
      { status: 500 },
    );
  }
}
