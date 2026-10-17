import type { Metadata } from "next";
import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { ProductForm, type EditableProduct } from "@/components/marketplace/ProductForm";
import { SellerPageShell } from "@/components/marketplace/SellerPageShell";
import { getSellerContext } from "@/lib/seller";
import { Product } from "@/models/Product";

export const metadata: Metadata = { title: "Edit listing" };
// Personal to the logged-in seller, so never pre-built
export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getSellerContext(`/dashboard/products/${id}/edit`);
  if (!mongoose.isValidObjectId(id)) notFound();

  const doc = await Product.findById(id).select("+costPrice").lean();
  // Sellers may only open their own listings; admins can open any.
  if (!doc || (!ctx.admin && String(doc.sellerId) !== String(ctx.user._id))) notFound();

  const product = JSON.parse(JSON.stringify(doc)) as EditableProduct;

  return (
    <SellerPageShell ctx={ctx}>
      <ProductForm
        product={product}
        isAdmin={ctx.admin}
        defaultListingType={product.listingType}
        defaultState={ctx.defaultState}
        defaultCity={ctx.defaultCity}
        backHref={ctx.listingsHref}
      />
    </SellerPageShell>
  );
}
