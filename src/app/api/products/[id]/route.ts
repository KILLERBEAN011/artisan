import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import {
  REQUIRE_REVIEW,
  REVIEWED_FIELDS,
  STATUS_LIST,
  UserFacingError,
  attachSellers,
  errorResponse,
  getSessionUser,
  isAdmin,
  pickProductFields,
  removeProduct,
} from "@/lib/products";

type Ctx = { params: Promise<{ id: string }> };

/** Accepts either the Mongo id or the slug ("original-cross-f7fd62"). */
function byIdOrSlug(idOrSlug: string) {
  return mongoose.isValidObjectId(idOrSlug)
    ? { _id: idOrSlug }
    : { slug: idOrSlug };
}

/* ------------------------------------------------------------------ */
/*  GET /api/products/[id]                                              */
/*  Anyone can see a live listing. The owner and admins can also see    */
/*  drafts, pending and rejected ones.                                  */
/* ------------------------------------------------------------------ */

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const product = await Product.findOne(byIdOrSlug(id)).lean();
    if (!product) throw new UserFacingError("Product not found.", 404);

    if (product.status !== "live") {
      const user = await getSessionUser();
      const allowed =
        user &&
        (isAdmin(user) || String(product.sellerId) === String(user._id));
      if (!allowed) throw new UserFacingError("Product not found.", 404);
    }

    const [withSeller] = await attachSellers([product]);

    // A few more live items from the same seller, for "More from this seller"
    const more = await Product.find({
      sellerId: product.sellerId,
      status: "live",
      _id: { $ne: product._id },
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .select(
        "name slug price images category sellerType listingType condition",
      )
      .lean();

    return NextResponse.json({ product: withSeller, moreFromSeller: more });
  } catch (error) {
    return errorResponse(error, "Failed to load the product.");
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/products/[id] — edit a listing                           */
/*                                                                      */
/*  Owner or admin only. Changing the title, photos, description,       */
/*  category or condition of a live item sends it back for review.      */
/*  Price, stock and delivery changes stay live.                        */
/*  Body may include { submit: true } to send a draft for review, or    */
/*  { archive: true } / { unarchive: true }.                            */
/* ------------------------------------------------------------------ */

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id))
      throw new UserFacingError("Product not found.", 404);

    await connectToDatabase();
    const user = await getSessionUser();
    if (!user) throw new UserFacingError("Please log in.", 401);

    const product = await Product.findById(id);
    if (!product) throw new UserFacingError("Product not found.", 404);

    const admin = isAdmin(user);
    const owner = String(product.sellerId) === String(user._id);
    if (!owner && !admin)
      throw new UserFacingError("You can only edit your own listings.", 403);

    const body = (await request.json()) as Record<string, unknown>;
    const fields = pickProductFields(body, admin);

    const reviewedChange = REVIEWED_FIELDS.some((key) => key in fields);
    product.set(fields);

    if (
      admin &&
      typeof body.status === "string" &&
      (STATUS_LIST as readonly string[]).includes(body.status)
    ) {
      product.status = body.status as typeof product.status;
    } else if (body.archive === true) {
      product.status = "archived";
    } else if (body.unarchive === true && product.status === "archived") {
      product.status = admin || !REQUIRE_REVIEW ? "live" : "pending_review";
    } else if (
      body.submit === true &&
      (product.status === "draft" || product.status === "rejected")
    ) {
      product.status = admin || !REQUIRE_REVIEW ? "live" : "pending_review";
    } else if (
      !admin &&
      product.status === "live" &&
      reviewedChange &&
      REQUIRE_REVIEW
    ) {
      product.status = "pending_review";
    }

    if (
      !admin &&
      product.status === "pending_review" &&
      product.listingType === "resale" &&
      !product.authenticityConfirmed
    ) {
      throw new UserFacingError(
        "Confirm the item is genuine before submitting it for review.",
      );
    }

    // A new review clears the old rejection note
    if (product.status === "pending_review") {
      product.set("review.rejectionReason", undefined);
    }

    await product.save();

    return NextResponse.json({
      product,
      message:
        product.status === "pending_review"
          ? "Changes saved. We'll review them before the listing goes live again."
          : "Changes saved.",
    });
  } catch (error) {
    return errorResponse(error, "Failed to update the product.");
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/products/[id]                                           */
/*  Owner or admin. Items that have sold are archived, not deleted.     */
/* ------------------------------------------------------------------ */

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const user = await getSessionUser();
    if (!user) throw new UserFacingError("Please log in.", 401);

    const result = await removeProduct(id, user);
    return NextResponse.json({
      success: true,
      ...result,
      message: result.archived
        ? "This item has past orders, so it was hidden instead of deleted."
        : "Product deleted successfully.",
    });
  } catch (error) {
    return errorResponse(error, "Failed to delete the product.");
  }
}
