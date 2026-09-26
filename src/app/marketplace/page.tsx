"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Package, ShoppingBag, Loader2, Store } from "lucide-react";
import AddToCartButton from "@/components/AddToCartButton";
import { useCart } from "@/context/CartContext";

interface ProductData {
  _id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  sellerId: string;
  sellerName?: string;
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const { cart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (res.ok) setProducts(data.products);
      } catch (error) {
        console.error("Error fetching products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-brand-green-600 mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">
            NaijaCraft Marketplace
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Support students and local artisans.
          </p>
        </div>

        {/* Buttons Container */}
        <div className="flex items-center gap-3">
          {/* Track Orders Button */}
          <Link
            href="/dashboard/customer/orders"
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Package className="h-4 w-4 text-gray-500" />
            <span className="hidden sm:inline">Track Orders</span>
          </Link>

          {/* Floating Cart Indicator */}
          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-200"
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="hidden sm:inline">Cart</span>
            {cart.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-green-600 text-[10px] font-bold text-white shadow-sm">
                {cart.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
          <p className="text-gray-500">No products have been listed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {products.map((product) => (
            <div
              key={product._id.toString()}
              className="group relative flex flex-col overflow-hidden rounded-md border border-gray-100 bg-white p-2 transition-shadow hover:shadow-md"
            >
              {/* Category Badge overlaying the image */}
              <span className="absolute left-2 top-2 z-10 rounded bg-brand-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-amber-800 shadow-sm">
                {product.category}
              </span>

              {/* Image Container: Using object-contain and white background for uniformity */}
              <div className="relative aspect-square w-full bg-white p-2">
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Tight Product Details */}
              <div className="mt-2 flex flex-1 flex-col">
                <h3 className="line-clamp-2 text-xs font-medium text-gray-800 transition-colors hover:text-brand-green-600">
                  {product.name}
                </h3>

                <div className="mt-1 text-sm font-bold text-gray-900">
                  ₦{product.price.toLocaleString()}
                </div>

                <Link
                  href={`/artisans/${product.sellerId}`}
                  className="mt-1 flex w-fit items-center gap-1 text-[11px] text-gray-500 hover:text-brand-green-600 hover:underline"
                >
                  <Store className="h-3 w-3 flex-shrink-0" />
                  <span className="line-clamp-1">
                    {product.sellerName || "NaijaCraft Artisan"}
                  </span>
                </Link>

                {/* Compact Add to Cart Wrapper */}
                <div className="mt-3 mt-auto w-full">
                  <AddToCartButton
                    product={{
                      id: product._id.toString(),
                      name: product.name,
                      price: product.price,
                      image: product.images[0],
                      sellerId: product.sellerId.toString(),
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
