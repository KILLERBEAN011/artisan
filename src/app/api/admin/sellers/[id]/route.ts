import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { emailLayout, sendEmail } from "@/lib/email";
import { UserFacingError, errorResponse, getSessionUser, isAdmin } from "@/lib/products";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

type Ctx = { params: Promise<{ id: string }> };

/* ------------------------------------------------------------------ */
/*  POST /api/admin/sellers/[id]   Admins only.                         */
/*    { "action": "approve" }                                           */
/*    { "action": "reject",  "reason": "ID photo is blurry" }           */
/*    { "action": "suspend", "reason": "Sold fake items" }   hides their live listings */
/*    { "action": "reinstate" }                                         */
/* ------------------------------------------------------------------ */

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) throw new UserFacingError("Seller not found.", 404);

    await connectToDatabase();
    const admin = await getSessionUser();
    if (!admin) throw new UserFacingError("Please log in.", 401);
    if (!isAdmin(admin)) throw new UserFacingError("Admins only.", 403);

    const { action, reason } = (await request.json()) as { action?: string; reason?: string };
    const note = reason?.trim().slice(0, 500);

    const user = await User.findById(id);
    if (!user || !user.seller || user.seller.status === "none") throw new UserFacingError("Seller not found.", 404);

    const current: string = user.seller.status;
    const allowed: Record<string, string[]> = {
      approve: ["pending", "rejected"],
      reject: ["pending"],
      suspend: ["approved"],
      reinstate: ["suspended"],
    };
    if (!action || !allowed[action]) throw new UserFacingError("Unknown action.");
    if (!allowed[action].includes(current)) {
      throw new UserFacingError(`Can't ${action} a seller who is ${current}.`, 409);
    }
    if ((action === "reject" || action === "suspend") && !note) {
      throw new UserFacingError("Add a reason. The seller will see it.");
    }

    const shop: string = user.seller.shopName || "your shop";
    const first = String(user.name ?? "").split(" ")[0] || "there";
    let hidden = 0;

    user.seller.reviewedAt = new Date();
    user.seller.reviewedBy = admin._id;

    if (action === "approve" || action === "reinstate") {
      user.seller.status = "approved";
      user.seller.rejectionReason = undefined;
    } else if (action === "reject") {
      user.seller.status = "rejected";
      user.seller.rejectionReason = note;
    } else {
      user.seller.status = "suspended";
      user.seller.rejectionReason = note;
      const res = await Product.updateMany({ sellerId: user._id, status: "live" }, { $set: { status: "archived" } });
      hidden = res.modifiedCount;
    }
    await user.save();

    // Let the seller know (failures are logged, never block the action)
    const emails: Record<string, { subject: string; html: string }> = {
      approve: {
        subject: "You're approved to sell on NaijaCraft",
        html: emailLayout({
          heading: `${shop} is approved`,
          paragraphs: [
            `Hi ${first}, good news: you can now list items on the NaijaCraft Marketplace.`,
            "Add clear photos and honest details. We check each listing before it goes live.",
          ],
          button: { label: "List your first item", path: "/dashboard/products/new" },
        }),
      },
      reinstate: {
        subject: "Your NaijaCraft shop is active again",
        html: emailLayout({
          heading: `${shop} is active again`,
          paragraphs: [
            `Hi ${first}, your shop has been reinstated. Your listings are still hidden: open My Shop and choose "Show again" on the ones you want back. We'll check them before they go live.`,
          ],
          button: { label: "Open My Shop", path: "/dashboard/listings" },
        }),
      },
      reject: {
        subject: "Your NaijaCraft seller application needs changes",
        html: emailLayout({
          heading: "A few changes needed",
          paragraphs: [
            `Hi ${first}, thanks for applying to sell on NaijaCraft. We couldn't approve your application yet.`,
            `What to fix: ${note}`,
            "Update your application and send it again. We'll take another look.",
          ],
          button: { label: "Update application", path: "/sell/apply" },
        }),
      },
      suspend: {
        subject: "Your NaijaCraft shop has been suspended",
        html: emailLayout({
          heading: `${shop} is suspended`,
          paragraphs: [
            `Hi ${first}, we've suspended your shop and hidden your listings.`,
            `Reason: ${note}`,
            "If you think this is a mistake, reply to this email.",
          ],
        }),
      },
    };
    if (user.email) await sendEmail({ to: user.email, ...emails[action] });

    const messages: Record<string, string> = {
      approve: "Seller approved. We've emailed them.",
      reinstate: "Seller reinstated. Their listings stay hidden until they show them again.",
      reject: "Application rejected. We've emailed them the reason.",
      suspend: `Seller suspended${hidden ? ` and ${hidden} live listing${hidden === 1 ? "" : "s"} hidden` : ""}.`,
    };
    return NextResponse.json({ message: messages[action] });
  } catch (error) {
    return errorResponse(error, "Failed to update the seller.");
  }
}
