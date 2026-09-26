import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admins only." },
        { status: 401 },
      );
    }

    const sellerId = request.nextUrl.searchParams.get("sellerId");

    if (!sellerId) {
      return NextResponse.json(
        { error: "Seller ID is required." },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const profile = await ArtisanProfile.findOne({ userId: sellerId })
      .select("bankDetails")
      .lean();

    if (!profile || !profile.bankDetails) {
      return NextResponse.json({ bankDetails: null });
    }

    return NextResponse.json({ bankDetails: profile.bankDetails });
  } catch (error) {
    console.error("Admin Fetch Bank Details Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artisan bank details." },
      { status: 500 },
    );
  }
}
