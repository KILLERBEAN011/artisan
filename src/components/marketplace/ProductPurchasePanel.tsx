"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Link2, MessageCircle, Minus, Plus } from "lucide-react";
import AddToCartButton from "@/components/AddToCartButton";
import { useCart } from "@/context/CartContext";
import { lineKey } from "@/lib/cart-key";
import { MAX_QTY_PER_ITEM } from "@/lib/marketplace-config";

type Props = {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    sellerId: string;
    slug?: string;
  };
  /** Sizes / colours the buyer must choose from */
  options?: { name: string; values: string[] }[];
  stock?: number;
  priceLabel: string;
  shareUrl: string;
  soldOut: boolean;
};

export default function ProductPurchasePanel({ product, options = [], stock = 1, priceLabel, shareUrl, soldOut }: Props) {
  const router = useRouter();
  const { cart, addToCart } = useCart();
  const [copied, setCopied] = useState(false);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const choices = options.filter((o) => o.values.length > 0);
  const missing = choices.find((o) => !chosen[o.name]);
  const maxQty = Math.max(1, Math.min(stock, MAX_QTY_PER_ITEM));

  const buyNow = () => {
    if (missing) return;
    // Only add if this exact line isn't already in the cart, so "Buy now" never doubles it
    if (!cart.some((item) => item.key === lineKey(product.id, chosen))) {
      addToCart({ ...product, options: chosen, quantity });
    }
    router.push("/cart");
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${product.name}: ${priceLabel} on NaijaCraft\n${shareUrl}`)}`;

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
    <div className="flex flex-col gap-4">
      {!soldOut &&
        choices.map((opt) => (
          <fieldset key={opt.name}>
            <legend className="mb-2 text-sm font-bold">
              {opt.name}
              {chosen[opt.name] && <span className="font-normal text-ink-500">: {chosen[opt.name]}</span>}
            </legend>
            <div className="flex flex-wrap gap-2">
              {opt.values.map((value) => {
                const on = chosen[opt.name] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setChosen((prev) => ({ ...prev, [opt.name]: value }))}
                    className={`min-h-11 min-w-12 rounded-lg px-3.5 text-sm font-semibold transition-colors ${
                      on ? "bg-navy-900 text-white" : "border border-cloud-200 bg-white text-ink-900 hover:border-ink-300"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}

      {!soldOut && maxQty > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold">Quantity</span>
          <div className="flex items-center rounded-lg border border-cloud-200 bg-white">
            <button
              type="button"
              aria-label="Fewer"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span aria-live="polite" className="w-8 text-center font-bold">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="More"
              disabled={quantity >= maxQty}
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              className="flex h-11 w-11 items-center justify-center disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {soldOut ? (
        <p className="flex h-12 items-center justify-center rounded-xl bg-cloud-100 font-semibold text-ink-500">Sold out</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="[&>button]:h-12 [&>button]:rounded-xl [&>button]:text-base">
            <AddToCartButton
              product={product}
              options={chosen}
              quantity={quantity}
              disabled={Boolean(missing)}
              disabledLabel={missing ? `Choose a ${missing.name.toLowerCase()}` : undefined}
            />
          </div>
          <button
            type="button"
            onClick={buyNow}
            disabled={Boolean(missing)}
            className="h-12 rounded-xl bg-brand-amber-500 text-base font-extrabold text-navy-900 transition-colors hover:bg-brand-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
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
          <MessageCircle className="h-4 w-4 text-brand-green-600" aria-hidden="true" />
          Share on WhatsApp
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="flex h-11 items-center gap-2 rounded-lg border border-cloud-200 bg-white px-4 text-sm font-semibold text-ink-900 transition-colors hover:bg-cloud-100"
        >
          {copied ? <Check className="h-4 w-4 text-brand-green-600" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
