import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { canSell, getSessionUser, isAdmin, type SessionUser } from "@/lib/products";
import { NIGERIAN_STATES } from "@/lib/product-options";
import { ArtisanProfile } from "@/models/ArtisanProfile";

/** Turns "Oyo State" / "Abuja" into the names the forms use ("Oyo", "FCT"). */
function normaliseState(raw?: string | null) {
  if (!raw) return undefined;
  const cleaned = raw.replace(/\s+state$/i, "").trim().toLowerCase();
  if (cleaned === "abuja" || cleaned === "fct abuja") return "FCT";
  return NIGERIAN_STATES.find((s) => s.toLowerCase() === cleaned);
}

export type SellerContext = {
  user: SessionUser;
  admin: boolean;
  allowed: boolean;
  defaultState?: string;
  defaultCity?: string;
  /** Where "My listings" lives for this person. */
  listingsHref: string;
};

/** Loads the logged-in seller for the selling pages. Sends logged-out visitors to /login. */
export async function getSellerContext(returnTo: string): Promise<SellerContext> {
  await connectToDatabase();
  const user = await getSessionUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);

  const admin = isAdmin(user);
  let defaultState = normaliseState(user.seller?.state);
  let defaultCity = user.seller?.city;

  if (user.role === "artisan" && (!defaultState || !defaultCity)) {
    const profile = await ArtisanProfile.findOne({ userId: user._id })
      .select("location.state location.city")
      .lean<{ location?: { state?: string; city?: string } }>();
    defaultState ??= normaliseState(profile?.location?.state);
    defaultCity ??= profile?.location?.city;
  }

  return {
    user,
    admin,
    allowed: canSell(user),
    defaultState,
    defaultCity,
    listingsHref: admin
      ? "/admin/listings?status=live"
      : user.role === "artisan"
        ? "/dashboard/artisan/products"
        : "/dashboard/listings",
  };
}
