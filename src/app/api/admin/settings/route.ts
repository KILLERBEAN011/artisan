import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

const ALLOWED_FIELDS = ["heroImageUrl", "enterpriseImageUrl"] as const;

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();

    const update: Record<string, string> = {};
    for (const field of ALLOWED_FIELDS) {
      if (typeof body[field] === "string" && body[field]) {
        update[field] = body[field];
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const updated = await SiteSettings.findOneAndUpdate(
      { key: "site-settings" },
      update,
      { returnDocument: "after", upsert: true },
    ).lean();

    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("PATCH /api/admin/settings failed:", error);
    return NextResponse.json(
      { error: "Failed to update settings. Check server logs." },
      { status: 500 },
    );
  }
}
