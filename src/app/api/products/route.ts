import { NextResponse } from "next/server";
import type { SortOrder } from "mongoose";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import {
  Product,
  PUBLIC_PRODUCT_FILTER,
  type ProductStatus,
} from "@/models/Product";
import {
  REQUIRE_REVIEW,
  STATUS_LIST,
  UserFacingError,
  attachSellers,
  canSell,
  errorResponse,
  getSessionUser,
  isAdmin,
  pickProductFields,
  removeProduct,
} from "@/lib/products";

const SORTS: Record<string, Record<string, SortOrder>> = {
  newest: { createdAt: -1 },
  price_asc: { price: 1, createdAt: -1 },
  price_desc: { price: -1, createdAt: -1 },
  top_rated: { ratingAvg: -1, ratingCount: -1 },
  popular: { soldCount: -1, createdAt: -1 },
};

/* ------------------------------------------------------------------ */
/*  GET /api/products                                                   */
/*                                                                      */
/*  Public marketplace feed. Only live listings.                        */
/*    ?q=adire            text search                                   */
/*    ?category=Fashion   ?state=Oyo   ?sellerType=official             */
/*    ?listingType=handmade   ?condition=new                            */
/*    ?minPrice=1000&maxPrice=50000                                     */
/*    ?sellerId=...       one seller's live items                       */
/*    ?featured=1         featured items only                           */
/*    ?sort=newest|price_asc|price_desc|top_rated|popular               */
/*    ?page=1&limit=24                                                  */
/*                                                                      */
/*  ?mine=1               the logged-in seller's own items, any status  */
/*  ?status=pending_review  (admins only) any status, e.g. review queue */
/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    const mine = params.get("mine") === "1";
    const statusParam = params.get("status");

    if (mine || statusParam) {
      const user = await getSessionUser();
      if (!user) throw new UserFacingError("Please log in.", 401);

      if (mine) {
        filter.sellerId = user._id;
        if (
          statusParam &&
          (STATUS_LIST as readonly string[]).includes(statusParam)
        ) {
          filter.status = statusParam;
        }
      } else {
        if (!isAdmin(user)) throw new UserFacingError("Admins only.", 403);
        if (statusParam !== "all") {
          if (!(STATUS_LIST as readonly string[]).includes(statusParam!)) {
            throw new UserFacingError("Unknown status.");
          }
          filter.status = statusParam;
        }
      }
    } else {
      Object.assign(filter, PUBLIC_PRODUCT_FILTER);
    }

    const sellerId = params.get("sellerId");
    if (sellerId && !mine) {
      if (!mongoose.isValidObjectId(sellerId))
        throw new UserFacingError("Unknown seller.");
      filter.sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    for (const key of [
      "category",
      "sellerType",
      "listingType",
      "condition",
    ] as const) {
      const value = params.get(key);
      if (value) filter[key] = value;
    }

    const state = params.get("state");
    if (state) filter["location.state"] = state;

    if (params.get("featured") === "1") filter.isFeatured = true;

    const minPrice = Number(params.get("minPrice"));
    const maxPrice = Number(params.get("maxPrice"));
    if (minPrice > 0 || maxPrice > 0) {
      filter.price = {};
      if (minPrice > 0) filter.price.$gte = minPrice;
      if (maxPrice > 0) filter.price.$lte = maxPrice;
    }

    const q = params.get("q")?.trim();
    if (q) filter.$text = { $search: q.slice(0, 100) };

    const sort =
      SORTS[params.get("sort") ?? ""] ?? (q ? undefined : SORTS.newest);
    const limit = Math.min(Math.max(Number(params.get("limit")) || 24, 1), 48);
    const page = Math.max(Number(params.get("page")) || 1, 1);

    let query = Product.find(
      filter,
      q ? { score: { $meta: "textScore" } } : undefined,
    );
    query = sort
      ? query.sort(sort)
      : query.sort({ score: { $meta: "textScore" } });

    const [items, total] = await Promise.all([
      query
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const products = await attachSellers(items);

    return NextResponse.json({
      products,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(
      error,
      "Failed to fetch products from the marketplace.",
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/products — create a listing                               */
/*                                                                      */
/*  The seller is always the logged-in user. `sellerId` in the body is  */
/*  ignored. Send { submit: true } to send it for review straight away; */
/*  otherwise it is saved as a draft.                                   */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const user = await getSessionUser();
    if (!user)
      throw new UserFacingError("Please log in to list a product.", 401);
    if (!canSell(user)) {
      throw new UserFacingError(
        "Your seller account needs to be approved before you can list.",
        403,
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const admin = isAdmin(user);
    const fields = pickProductFields(body, admin);

    if (!fields.name || fields.price === undefined || !fields.category) {
      throw new UserFacingError("Name, price and category are required.");
    }
    if (!Array.isArray(fields.images) || fields.images.length === 0) {
      throw new UserFacingError("Add at least one photo.");
    }
    if (!fields.description) fields.description = String(fields.name);

    // Sensible defaults for older forms that don't send the new fields
    fields.listingType ??=
      fields.category === "Services"
        ? "service"
        : user.role === "artisan"
          ? "handmade"
          : "resale";
    fields.location ??= {
      state: user.seller?.state ?? "",
      city: user.seller?.city,
    };
    if (!admin) fields.sellerType = "seller";

    // Status: admins publish directly; sellers draft or submit for review.
    // Old forms don't send `submit`, so treat a missing value as "submit".
    const submit = body.submit === undefined ? true : Boolean(body.submit);
    let status: ProductStatus;
    if (admin) {
      status =
        typeof body.status === "string" &&
        (STATUS_LIST as readonly string[]).includes(body.status)
          ? (body.status as ProductStatus)
          : "live";
    } else if (!submit) {
      status = "draft";
    } else {
      status = REQUIRE_REVIEW ? "pending_review" : "live";
    }

    if (
      status !== "draft" &&
      fields.listingType === "resale" &&
      !fields.authenticityConfirmed &&
      !admin
    ) {
      throw new UserFacingError(
        "Confirm the item is genuine before submitting it for review.",
      );
    }

    const product = await Product.create({
      ...fields,
      sellerId: user._id,
      status,
    });

    return NextResponse.json(
      {
        product,
        message:
          status === "pending_review"
            ? "Submitted. We'll review your listing before it goes live."
            : status === "draft"
              ? "Saved as a draft."
              : "Your listing is live.",
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(
      error,
      "Something went wrong while creating the product.",
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE /api/products?id=...                                         */
/*  Kept so older screens still work. New code should call              */
/*  DELETE /api/products/[id].                                          */
/* ------------------------------------------------------------------ */

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) throw new UserFacingError("Product ID is required.");

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
