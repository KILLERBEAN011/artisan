import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import { SellerApplicationForm, type ApplicationDefaults } from "@/components/marketplace/SellerApplicationForm";
import { CATEGORIES } from "@/lib/marketplace";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionUser } from "@/lib/products";
import { User } from "@/models/User";

export const metadata: Metadata = { title: "Apply to sell" };
export const dynamic = "force-dynamic";

type SellerFields = {
  status?: string;
  shopName?: string;
  bio?: string;
  categories?: string[];
  state?: string;
  city?: string;
  whatsapp?: string;
  idType?: string;
  idLast4?: string;
  idDocumentPublicId?: string;
  rejectionReason?: string;
  payout?: { bankName?: string; accountNumber?: string; accountName?: string };
};

export default async function ApplyToSellPage() {
  await connectToDatabase();
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?callbackUrl=/sell/apply");

  // Artisans and admins can already sell; pending / approved / suspended see their status on /sell
  if (sessionUser.role !== "customer") redirect("/dashboard/products/new");
  const status = sessionUser.seller?.status ?? "none";
  if (status === "approved") redirect("/dashboard/products/new");
  if (status === "pending" || status === "suspended") redirect("/sell");

  const user = await User.findById(sessionUser._id)
    .select("+seller.idDocumentPublicId +seller.payout")
    .lean<{ name?: string; phone?: string; seller?: SellerFields }>();
  const s = user?.seller ?? {};

  const defaults: ApplicationDefaults = {
    shopName: s.shopName ?? "",
    bio: s.bio ?? "",
    categories: s.categories ?? [],
    state: s.state ?? "",
    city: s.city ?? "",
    whatsapp: s.whatsapp ? `0${s.whatsapp.slice(3)}` : (user?.phone ?? ""),
    idType: s.idType ?? "",
    idLast4: s.idLast4 ?? "",
    hasIdOnFile: Boolean(s.idDocumentPublicId),
    bankName: s.payout?.bankName ?? "",
    accountNumber: s.payout?.accountNumber ?? "",
    accountName: s.payout?.accountName ?? user?.name ?? "",
    rejectionReason: status === "rejected" ? s.rejectionReason : undefined,
  };

  return (
    <div className="min-h-screen bg-cloud-50 font-body text-ink-900">
      <MarketplaceHeader categories={CATEGORIES} />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <SellerApplicationForm defaults={defaults} />
      </main>
    </div>
  );
}
