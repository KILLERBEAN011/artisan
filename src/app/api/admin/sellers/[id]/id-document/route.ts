import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { privateDocumentLink } from "@/lib/private-upload";
import { errorResponse, getSessionUser, isAdmin } from "@/lib/products";
import { User } from "@/models/User";

type Ctx = { params: Promise<{ id: string }> };

/* GET /api/admin/sellers/[id]/id-document
   Admins only. Sends the admin to a signed link to the seller's ID photo
   that stops working after 5 minutes. */
export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const admin = await getSessionUser();
    if (!admin || !isAdmin(admin)) {
      return NextResponse.json({ error: "Admins only." }, { status: 403 });
    }
    if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const user = await User.findById(id)
      .select("+seller.idDocumentPublicId +seller.idDocumentFormat")
      .lean<{ seller?: { idDocumentPublicId?: string; idDocumentFormat?: string } }>();
    const publicId = user?.seller?.idDocumentPublicId;
    if (!publicId) return NextResponse.json({ error: "No ID uploaded." }, { status: 404 });

    const link = privateDocumentLink(publicId, user.seller?.idDocumentFormat || "jpg");
    return NextResponse.redirect(link, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, "Couldn't open the ID photo.");
  }
}
