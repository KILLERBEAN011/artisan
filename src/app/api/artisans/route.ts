import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { auth } from "@/lib/auth";
// Imported so Mongoose registers the "User" model — required for
// .populate("userId") below to work, even though we never call User directly.
import "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const params = request.nextUrl.searchParams;

    // Build a Mongo filter object from query params. Every param is optional —
    // an empty search means "return everything".
    const filter: Record<string, unknown> = {};

    const categories = params.getAll("category");
    if (categories.length > 0) {
      filter.categories = { $in: categories };
    }

    const languages = params.getAll("language");
    if (languages.length > 0) {
      filter.languages = { $in: languages };
    }

    const verification = params.getAll("verification");
    if (verification.length > 0) {
      filter.verification = { $all: verification };
    }

    const sellerType = params.get("sellerType");
    if (sellerType && sellerType !== "any") {
      filter.sellerType = sellerType;
    }

    const minPrice = params.get("minPrice");
    const maxPrice = params.get("maxPrice");
    if (minPrice || maxPrice) {
      filter.fromPriceNaira = {};
      if (minPrice)
        (filter.fromPriceNaira as Record<string, number>).$gte =
          Number(minPrice);
      if (maxPrice)
        (filter.fromPriceNaira as Record<string, number>).$lte =
          Number(maxPrice);
    }

    const minRating = params.get("minRating");
    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    // Free-text search — matches the "Search artisans, skills or services"
    // bar and the homepage's "Post Task" form. Simple case-insensitive
    // substring match across the fields a customer would actually type.
    const q = params.get("q");
    if (q && q.trim()) {
      const regex = new RegExp(
        q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      filter.$or = [
        { title: regex },
        { serviceTitle: regex },
        { bio: regex },
        { categories: regex },
      ];
    }

    const artisans = await ArtisanProfile.find(filter)
      .populate("userId", "name")
      .limit(50)
      .lean();

    return NextResponse.json({ artisans });
  } catch (error) {
    console.error("GET /api/artisans failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch artisans. Check server logs." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 },
      );
    }

    if (session.user.role !== "artisan") {
      return NextResponse.json(
        { error: "Only artisan accounts can create an artisan profile." },
        { status: 403 },
      );
    }

    await connectToDatabase();

    // One profile per artisan account — if they already have one, don't let
    // this route create a second.
    const existing = await ArtisanProfile.findOne({ userId: session.user.id });
    if (existing) {
      return NextResponse.json(
        { error: "You already have an artisan profile." },
        { status: 409 },
      );
    }

    const body = await request.json();
    const {
      title,
      serviceTitle,
      bio,
      whatsappNumber, // <-- Extracted from body
      categories,
      subservices,
      languages,
      fromPriceNaira,
      turnaround,
      responseTime,
      availability,
      city,
      state,
      sellerType,
      bankName,
      accountNumber,
      accountName,
      avatarUrl,
      portfolioImages,
    } = body;

    // Added whatsappNumber to the strict backend validation
    if (
      !title ||
      !serviceTitle ||
      !bio ||
      !whatsappNumber ||
      !categories?.length ||
      !fromPriceNaira ||
      !city ||
      !state
    ) {
      return NextResponse.json(
        {
          error:
            "title, serviceTitle, bio, whatsappNumber, categories, fromPriceNaira, city, and state are required.",
        },
        { status: 400 },
      );
    }

    const profile = await ArtisanProfile.create({
      userId: session.user.id,
      whatsappNumber, // <-- Saved to the database
      title,
      serviceTitle,
      bio,
      categories,
      subservices: subservices ?? [],
      languages: languages ?? [],
      fromPriceNaira: Number(fromPriceNaira),
      turnaround: turnaround ?? "",
      responseTime: responseTime ?? "",
      availability: availability ?? "",
      location: {
        city,
        state,
        point: { type: "Point", coordinates: [0, 0] }, // real geocoding comes later
      },
      verification: [],
      sellerType: sellerType === "company" ? "company" : "independent",
      rating: 0,
      reviewCount: 0,
      recentJobs: [],
      bankDetails: {
        bankName: bankName ?? "",
        accountNumber: accountNumber ?? "",
        accountName: accountName ?? "",
      },
      avatarUrl: avatarUrl ?? "",
      portfolioImages: portfolioImages ?? [],
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("POST /api/artisans failed:", error);
    return NextResponse.json(
      { error: "Failed to create artisan profile. Check server logs." },
      { status: 500 },
    );
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "artisan") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();

    if (body.portfolioImages && Array.isArray(body.portfolioImages)) {
      // Enforce the 3-image maximum server-side
      const limitedImages = body.portfolioImages.slice(0, 3);

      const profile = await ArtisanProfile.findOneAndUpdate(
        { userId: session.user.id },
        { portfolioImages: limitedImages },
        { new: true },
      );

      return NextResponse.json({ profile }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/artisans failed:", error);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 },
    );
  }
}