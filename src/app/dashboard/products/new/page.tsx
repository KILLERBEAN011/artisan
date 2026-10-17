import type { Metadata } from "next";
import { ProductForm } from "@/components/marketplace/ProductForm";
import { NotASellerYet, SellerPageShell } from "@/components/marketplace/SellerPageShell";
import { getSellerContext } from "@/lib/seller";

export const metadata: Metadata = { title: "List something for sale" };
// Personal to the logged-in seller, so never pre-built
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const ctx = await getSellerContext("/dashboard/products/new");

  return (
    <SellerPageShell ctx={ctx}>
      {ctx.allowed ? (
        <ProductForm
          isAdmin={ctx.admin}
          defaultListingType={ctx.user.role === "artisan" ? "handmade" : "resale"}
          defaultState={ctx.defaultState}
          defaultCity={ctx.defaultCity}
          backHref={ctx.listingsHref}
        />
      ) : (
        <NotASellerYet status={ctx.user.seller?.status} />
      )}
    </SellerPageShell>
  );
}
