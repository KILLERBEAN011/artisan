import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import AddToCartButton from "@/components/AddToCartButton";
import {
  CONDITION_LABELS,
  formatNaira,
  type MarketplaceProduct,
} from "@/lib/marketplace";

/** The one badge that tells a shopper the most about this listing. */
function primaryBadge(p: MarketplaceProduct) {
  if (p.sellerType === "official") {
    return { label: "NaijaCraft Store", className: "bg-navy-900 text-white" };
  }
  if (p.listingType === "service") {
    return {
      label: "Service",
      className: "bg-brand-green-100 text-brand-green-700",
    };
  }
  if (p.listingType === "handmade") {
    return {
      label: "Handmade",
      className: "bg-brand-amber-100 text-[#7a4a06]",
    };
  }
  if (p.condition && p.condition !== "new") {
    return {
      label: CONDITION_LABELS[p.condition] ?? "Used",
      className: "bg-white text-ink-900 ring-1 ring-cloud-200",
    };
  }
  return null;
}

export default function ProductCard({
  product,
  priority = false,
}: {
  product: MarketplaceProduct;
  /** Set on the first few cards so the top of the page loads fastest. */
  priority?: boolean;
}) {
  const href = `/marketplace/${product.slug}`;
  const badge = primaryBadge(product);
  const state = product.location?.state || product.sellerState;
  const soldOut = product.listingType !== "service" && !product.inStock;

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-cloud-200 bg-white transition-shadow hover:shadow-md">
      <Link
        href={href}
        className="relative block aspect-square bg-cloud-100"
        tabIndex={-1}
        aria-hidden="true"
      >
        {product.images[0] && (
          <Image
            src={product.images[0]}
            alt=""
            fill
            sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 30vw, 48vw"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
        {badge && (
          <span
            className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[11px] font-bold ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-ink-900/80 py-1.5 text-center text-xs font-semibold text-white">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-ink-900">
          <Link href={href} className="hover:text-brand-green-600">
            {product.name}
          </Link>
        </h3>

        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-display text-lg font-extrabold text-ink-900">
            {formatNaira(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <s className="text-xs text-ink-500">
              {formatNaira(product.compareAtPrice)}
            </s>
          )}
        </p>

        <p className="flex items-center gap-1 text-xs text-ink-700">
          {product.sellerVerified && (
            <BadgeCheck
              className="h-3.5 w-3.5 shrink-0 text-brand-green-600"
              aria-label="Verified seller"
            />
          )}
          <span className="line-clamp-1">{product.sellerName}</span>
        </p>

        {state && (
          <p className="flex items-center gap-1 text-xs text-ink-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {state}
          </p>
        )}

        <div className="mt-auto pt-2">
          {product.listingType === "service" ? (
            <Link
              href={href}
              className="flex w-full items-center justify-center rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
            >
              View service
            </Link>
          ) : soldOut ? (
            <span className="flex w-full items-center justify-center rounded-lg bg-cloud-100 py-2.5 text-sm font-semibold text-ink-500">
              Sold out
            </span>
          ) : product.options?.some((o) => o.values.length > 0) ? (
            // Sizes / colours must be chosen on the product page
            <Link
              href={href}
              className="flex w-full items-center justify-center rounded-lg border border-brand-green-600 py-2.5 text-sm font-semibold text-brand-green-700 transition-colors hover:bg-brand-green-100"
            >
              Choose options
            </Link>
          ) : (
            <AddToCartButton
              product={{
                id: product._id,
                name: product.name,
                price: product.price,
                image: product.images[0],
                sellerId: product.sellerId,
                slug: product.slug,
              }}
            />
          )}
        </div>
      </div>
    </article>
  );
}
