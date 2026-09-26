"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { artisanNavItems } from "@/lib/nav-items";
import {
  Loader2,
  PlusCircle,
  Pencil,
  Trash2,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  images: string[];
}

export default function ArtisanProductsPage() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any;
  const userId = user?.id || user?._id;

  const fetchProducts = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/products?sellerId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || data || []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProducts();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchProducts]);

  const handleDelete = async (productId: string) => {
    // 1. Replace the native confirm with a custom toast confirmation
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-gray-900">
            Are you sure you want to delete this item? Buyers will no longer see
            it.
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="rounded px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setProcessingId(`delete-${productId}`);

                try {
                  const res = await fetch(`/api/products?id=${productId}`, {
                    method: "DELETE",
                  });

                  if (res.ok) {
                    setProducts((prev) =>
                      prev.filter((p) => p._id !== productId),
                    );
                    // 2. Replace the native alert with a success toast
                    toast.success("Product deleted successfully!");
                  } else {
                    toast.error("Failed to delete product. Please try again.");
                  }
                } catch (error) {
                  console.error(error);
                  toast.error("An error occurred while deleting.");
                } finally {
                  setProcessingId(null);
                }
              }}
              className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Yes, delete
            </button>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: "top-center",
      },
    );
  };

  if (loading || status === "loading") {
    return (
      <DashboardShell
        navItems={artisanNavItems("/dashboard/artisan/products")}
        userName="Loading..."
        userRole="Artisan"
      >
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      navItems={artisanNavItems("/dashboard/artisan/products")}
      userName={user?.name || "Artisan"}
      userRole="Artisan"
    >
      {/* 3. Add the Toaster component so the popups actually render */}
      <Toaster position="top-center" reverseOrder={false} />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your marketplace listings, update details, or remove items.
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 rounded-lg bg-brand-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 w-fit"
        >
          <PlusCircle className="h-4 w-4" />
          List New Item
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
          <Package className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">
            No products listed
          </h3>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mb-6">
            You haven&apos;t added any items to the marketplace yet. Start
            selling by creating your first listing!
          </p>
          <Link
            href="/dashboard/products/new"
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <PlusCircle className="h-4 w-4" />
            List your first item
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product._id}
              className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all"
            >
              <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <ImageIcon className="h-10 w-10 opacity-50" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-semibold text-gray-800 shadow-sm uppercase tracking-wide">
                    {product.category}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3
                  className="font-semibold text-gray-900 line-clamp-1"
                  title={product.name}
                >
                  {product.name}
                </h3>
                <p className="mt-1 text-lg font-bold text-brand-green-600">
                  ₦{product.price?.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100 bg-gray-50/50">
                <button
                  disabled
                  className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors opacity-60 cursor-not-allowed"
                  title="Edit functionality coming soon"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product._id)}
                  disabled={processingId === `delete-${product._id}`}
                  className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                >
                  {processingId === `delete-${product._id}` ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
