"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Link2, MessageCircle } from "lucide-react";
import AddToCartButton from "@/components/AddToCartButton";
import { useCart } from "@/context/CartContext";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    sellerId: string;
  };
  priceLabel: string;
  shareUrl: string;
  soldOut: boolean;
};

export default function ProductPurchasePanel({
  product,
  priceLabel,
  shareUrl,
  soldOut,
}: Props) {
  const router = useRouter();
  const { cart, addToCart } = useCart();
  const [copied, setCopied] = useState(false);

  const buyNow = () => {
    // Only add if it isn't already in the cart, so "Buy now" never doubles the quantity
    if (!cart.some((item) => item.id === product.id)) {
      addToCart({ ...product, quantity: 1 });
    }
    router.push("/cart");
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${product.name}: ${priceLabel} on NaijaCraft\n${shareUrl}`,
  )}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", shareUrl);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {soldOut ? (
        <p className="flex h-12 items-center justify-center rounded-xl bg-cloud-100 font-semibold text-ink-500">
          Sold out
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="[&>button]:h-12 [&>button]:rounded-xl [&>button]:text-base">
            <AddToCartButton product={product} />
          </div>
          <button
            type="button"
            onClick={buyNow}
            className="h-12 rounded-xl bg-brand-amber-500 text-base font-extrabold text-navy-900 transition-colors hover:bg-brand-amber-600"
          >
            Buy now
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 items-center gap-2 rounded-lg border border-cloud-200 bg-white px-4 text-sm font-semibold text-ink-900 transition-colors hover:bg-cloud-100"
        >
          <MessageCircle
            className="h-4 w-4 text-brand-green-600"
            aria-hidden="true"
          />
          Share on WhatsApp
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="flex h-11 items-center gap-2 rounded-lg border border-cloud-200 bg-white px-4 text-sm font-semibold text-ink-900 transition-colors hover:bg-cloud-100"
        >
          {copied ? (
            <Check
              className="h-4 w-4 text-brand-green-600"
              aria-hidden="true"
            />
          ) : (
            <Link2 className="h-4 w-4" aria-hidden="true" />
          )}
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
