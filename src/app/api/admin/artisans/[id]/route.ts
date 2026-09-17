import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { auth } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    // Ensure only admins can trigger this route
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const deletedProfile = await ArtisanProfile.findByIdAndDelete(id);

    if (!deletedProfile) {
      return NextResponse.json({ error: "Artisan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete artisan:", error);
    return NextResponse.json(
      { error: "Failed to delete artisan" },
      { status: 500 },
    );
  }
}
