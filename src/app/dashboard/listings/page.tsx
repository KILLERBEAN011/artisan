import type { Metadata } from "next";
import MyShopPage from "../artisan/products/page";

// "My Shop" for every seller. Artisans also reach the same page at /dashboard/artisan/products.
export const metadata: Metadata = { title: "My shop" };
export const dynamic = "force-dynamic";

export default MyShopPage;
