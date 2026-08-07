import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { auth } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "artisan") {
      return NextResponse.json({ error: "You must be logged in as an artisan." }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl : "";

    if (!avatarUrl) {
      return NextResponse.json({ error: "Missing image URL." }, { status: 400 });
    }

    const updated = await ArtisanProfile.findOneAndUpdate(
      { userId: session.user.id },
      { avatarUrl },
      { returnDocument: "after" },
    ).select("avatarUrl");

    if (!updated) {
      return NextResponse.json({ error: "No artisan profile found." }, { status: 404 });
    }

    return NextResponse.json({ avatarUrl: updated.avatarUrl });
  } catch (error) {
    console.error("PATCH /api/artisans/avatar failed:", error);
    return NextResponse.json(
      { error: "Failed to update profile photo. Check server logs." },
      { status: 500 },
    );
  }
}
