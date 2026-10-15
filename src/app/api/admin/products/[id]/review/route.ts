import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import {
  UserFacingError,
  errorResponse,
  getSessionUser,
  isAdmin,
} from "@/lib/products";

type Ctx = { params: Promise<{ id: string }> };

/* ------------------------------------------------------------------ */
/*  POST /api/admin/products/[id]/review                                */
/*  Admins only.                                                        */
/*    { "action": "approve" }                                           */
/*    { "action": "reject", "reason": "Photos are blurry" }             */
/*                                                                      */
/*  To see the queue: GET /api/products?status=pending_review           */
/* ------------------------------------------------------------------ */

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id))
      throw new UserFacingError("Product not found.", 404);

    await connectToDatabase();
    const user = await getSessionUser();
    if (!user) throw new UserFacingError("Please log in.", 401);
    if (!isAdmin(user)) throw new UserFacingError("Admins only.", 403);

    const { action, reason } = (await request.json()) as {
      action?: string;
      reason?: string;
    };
    if (action !== "approve" && action !== "reject") {
      throw new UserFacingError('Action must be "approve" or "reject".');
    }
    if (action === "reject" && !reason?.trim()) {
      throw new UserFacingError(
        "Give the seller a reason so they can fix the listing.",
      );
    }

    const product = await Product.findById(id);
    if (!product) throw new UserFacingError("Product not found.", 404);

    product.status = action === "approve" ? "live" : "rejected";
    product.review = {
      reviewedBy: user._id,
      reviewedAt: new Date(),
      rejectionReason:
        action === "reject" ? reason!.trim().slice(0, 500) : undefined,
    };

    // Skip the authenticity check: the admin has made the call
    await product.save({ validateBeforeSave: false });

    return NextResponse.json({
      product,
      message:
        action === "approve"
          ? "Listing approved and live."
          : "Listing rejected.",
    });
  } catch (error) {
    return errorResponse(error, "Failed to review the product.");
  }
}
