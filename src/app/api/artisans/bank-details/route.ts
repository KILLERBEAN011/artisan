import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "artisan") {
      return NextResponse.json({ error: "You must be logged in as an artisan." }, { status: 401 });
    }

    await connectToDatabase();

    const profile = await ArtisanProfile.findOne({ userId: session.user.id })
      .select("bankDetails")
      .lean();

    if (!profile) {
      return NextResponse.json({ error: "No artisan profile found." }, { status: 404 });
    }

    return NextResponse.json({ bankDetails: profile.bankDetails ?? {} });
  } catch (error) {
    console.error("GET /api/artisans/bank-details failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank details. Check server logs." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "artisan") {
      return NextResponse.json({ error: "You must be logged in as an artisan." }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const bankName = typeof body.bankName === "string" ? body.bankName.trim() : "";
    const accountNumber = typeof body.accountNumber === "string" ? body.accountNumber.trim() : "";
    const accountName = typeof body.accountName === "string" ? body.accountName.trim() : "";

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: "Bank name, account number, and account name are all required." },
        { status: 400 },
      );
    }

    const updated = await ArtisanProfile.findOneAndUpdate(
      { userId: session.user.id },
      { bankDetails: { bankName, accountNumber, accountName } },
      { returnDocument: "after" },
    ).select("bankDetails");

    if (!updated) {
      return NextResponse.json({ error: "No artisan profile found." }, { status: 404 });
    }

    return NextResponse.json({ bankDetails: updated.bankDetails });
  } catch (error) {
    console.error("PATCH /api/artisans/bank-details failed:", error);
    return NextResponse.json(
      { error: "Failed to update bank details. Check server logs." },
      { status: 500 },
    );
  }
}
