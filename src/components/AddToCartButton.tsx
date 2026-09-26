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
  };
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      sellerId: product.sellerId,
      quantity: 1, // The context automatically increments if it already exists
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000); // Reset button back to normal after 2 seconds
  };
// h1 
  return (
    <button
      onClick={handleAdd}
      disabled={added}
      className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
        added
          ? "bg-green-100 text-green-800"
          : "bg-brand-green-600 text-white hover:bg-brand-green-700"
      }`}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </>
      )}
    </button>
  );
}
