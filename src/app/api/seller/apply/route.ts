import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { UserFacingError, errorResponse, getSessionUser } from "@/lib/products";
import { NIGERIAN_STATES, PRODUCT_CATEGORIES } from "@/lib/product-options";
import { normaliseNigerianPhone } from "@/lib/seller-options";
import { uploadPrivateDocument } from "@/lib/private-upload";
import { SELLER_ID_TYPES, User } from "@/models/User";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/* ------------------------------------------------------------------ */
/*  POST /api/seller/apply  (multipart form)                            */
/*  Anyone logged in, except artisans and admins who can already sell.  */
/*  Saves the application as "pending" for an admin to review.          */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const sessionUser = await getSessionUser();
    if (!sessionUser) throw new UserFacingError("Please log in to apply.", 401);
    if (sessionUser.role === "admin" || sessionUser.role === "artisan") {
      throw new UserFacingError("Your account can already list items.", 400);
    }

    const user = await User.findById(sessionUser._id).select("+seller.idDocumentPublicId +seller.idDocumentFormat");
    if (!user) throw new UserFacingError("Account not found.", 404);

    const status: string = user.seller?.status ?? "none";
    if (status === "pending") throw new UserFacingError("Your application is already waiting for review.", 409);
    if (status === "approved") throw new UserFacingError("You're already approved to sell.", 409);
    if (status === "suspended") {
      throw new UserFacingError("Your shop is suspended. Contact support to talk about it.", 403);
    }

    const form = await request.formData();
    const str = (key: string, max = 200) => String(form.get(key) ?? "").trim().slice(0, max);

    const shopName = str("shopName", 60);
    const bio = str("bio", 500);
    const state = str("state", 40);
    const city = str("city", 60);
    const whatsapp = normaliseNigerianPhone(str("whatsapp", 20));
    const idType = str("idType", 30);
    const idLast4 = str("idLast4", 4).toUpperCase();
    const bankName = str("bankName", 60);
    const accountNumber = str("accountNumber", 10);
    const accountName = str("accountName", 80);
    const categories = form
      .getAll("categories")
      .map(String)
      .filter((c) => (PRODUCT_CATEGORIES as readonly string[]).includes(c));
    const agreed = form.get("agree") === "true";
    const idFile = form.get("idDocument");

    // Validate everything first, so the seller sees every problem at once
    const problems: string[] = [];
    if (shopName.length < 2) problems.push("Enter a shop name.");
    if (bio.length < 20) problems.push("Tell buyers about your shop in at least 20 characters.");
    if (categories.length === 0) problems.push("Choose at least one thing you sell.");
    if (!(NIGERIAN_STATES as readonly string[]).includes(state)) problems.push("Choose your state.");
    if (!city) problems.push("Enter your city or area.");
    if (!whatsapp) problems.push("Enter a Nigerian WhatsApp number, e.g. 0803 123 4567.");
    if (!(SELLER_ID_TYPES as readonly string[]).includes(idType)) problems.push("Choose your ID type.");
    if (!/^[A-Z0-9]{4}$/.test(idLast4)) problems.push("Enter the last 4 characters of your ID number.");
    const hasNewId = idFile instanceof File && idFile.size > 0;
    if (!hasNewId && !user.seller?.idDocumentPublicId) problems.push("Upload a clear photo of your ID.");
    if (!bankName) problems.push("Enter your bank.");
    if (!/^\d{10}$/.test(accountNumber)) problems.push("Enter your 10-digit account number.");
    if (accountName.length < 3) problems.push("Enter the name on the bank account.");
    if (!agreed) problems.push("Agree to the seller rules.");
    if (problems.length) throw new UserFacingError(problems.join(" "), 400);

    // A unique shop address: /marketplace?seller=… today, /shop/<slug> later
    const base = slugify(shopName) || "shop";
    let shopSlug = user.seller?.shopSlug || base;
    if (!user.seller?.shopSlug || user.seller.shopName !== shopName) {
      shopSlug = base;
      for (let n = 2; await User.exists({ "seller.shopSlug": shopSlug, _id: { $ne: user._id } }); n++) {
        shopSlug = `${base}-${n}`;
      }
    }

    let idDocumentPublicId = user.seller?.idDocumentPublicId as string | undefined;
    let idDocumentFormat = user.seller?.idDocumentFormat as string | undefined;
    if (hasNewId) {
      try {
        const uploaded = await uploadPrivateDocument(idFile as File, "naijacraft_seller_ids");
        idDocumentPublicId = uploaded.publicId;
        idDocumentFormat = uploaded.format;
      } catch (e) {
        throw new UserFacingError(e instanceof Error ? e.message : "Couldn't upload your ID photo.", 400);
      }
    }

    user.set("seller", {
      ...(user.seller?.toObject?.() ?? {}),
      status: "pending",
      shopName,
      shopSlug,
      bio,
      categories,
      state,
      city,
      whatsapp,
      idType,
      idLast4,
      idDocumentPublicId,
      idDocumentFormat,
      payout: { bankName, accountNumber, accountName },
      acceptedPolicyAt: new Date(),
      appliedAt: new Date(),
      reviewedAt: undefined,
      reviewedBy: undefined,
      rejectionReason: undefined,
    });
    if (!user.phone) user.phone = `+${whatsapp}`;
    await user.save();

    return NextResponse.json({ message: "Application sent. We'll review it and email you." }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Something went wrong sending your application.");
  }
}
