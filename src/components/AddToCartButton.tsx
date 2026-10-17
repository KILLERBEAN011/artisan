"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    sellerId: string;
    slug?: string;
  };
  /** Chosen size / colour, e.g. { Size: "M" } */
  options?: Record<string, string>;
  quantity?: number;
  /** e.g. while a size hasn't been chosen yet */
  disabled?: boolean;
  disabledLabel?: string;
}

export default function AddToCartButton({ product, options, quantity = 1, disabled, disabledLabel }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart({ ...product, options, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={added || disabled}
      className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed ${
        added
          ? "bg-green-100 text-green-800"
          : disabled
            ? "bg-cloud-100 text-ink-500"
            : "bg-brand-green-600 text-white hover:bg-brand-green-700"
      }`}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          {disabled && disabledLabel ? disabledLabel : "Add to Cart"}
        </>
      )}
    </button>
  );
}
