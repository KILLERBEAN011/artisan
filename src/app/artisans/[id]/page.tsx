import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // Added for product images
import { ArrowLeft, MapPin, ShieldCheck, Star, Zap, Store } from "lucide-react";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { Product, PUBLIC_PRODUCT_FILTER } from "@/models/Product";
import mongoose from "mongoose"; // Added for ID validation
import "@/models/User";
import { RequestQuoteButton } from "@/components/search/RequestQuoteButton";
import { Avatar } from "@/components/shared/Avatar";
import UnlockContactButton from "@/components/UnlockContactButton";
import AddToCartButton from "@/components/AddToCartButton"; // Added for marketplace
import { auth } from "@/lib/auth";


interface StoreProduct {
  _id: string;
  slug: string;
  name: string;
  price: number;
  category: string;
  images: string[];
  sellerId: string;
}

export default async function ArtisanProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  await connectToDatabase();

  let profile;
  let products: StoreProduct[] = [];

  try {
    // Smart Lookup: Find by Profile ID (from search) OR User ID (from marketplace)
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isValidObjectId
      ? { $or: [{ _id: id }, { userId: id }] }
      : { userId: id };

    profile = await ArtisanProfile.findOne(query)
      .populate("userId", "name")
      .lean();

    // If profile exists, fetch any physical products they have listed
    if (profile) {
      const actualUserId = profile.userId._id
        ? profile.userId._id.toString()
        : profile.userId.toString();
      // Only approved, in-stock listings. Drafts and items waiting for review stay private.
      const docs = await Product.find({
        ...PUBLIC_PRODUCT_FILTER,
        sellerId: actualUserId,
        inStock: true,
      })
        .sort({ createdAt: -1 })
        .limit(12)
        .lean();
      products = docs.map((p) => ({
        _id: String(p._id),
        slug: p.slug,
        name: p.name,
        price: p.price,
        category: p.category,
        images: p.images,
        sellerId: String(p.sellerId),
      }));
    }
  } catch (error) {
    console.error("Profile fetch error:", error);
    notFound();
  }

  if (!profile) {
    notFound();
  }

  const user = profile.userId as unknown as { name?: string } | null;
  const name = user?.name ?? "Artisan";
  const isAvailable = profile.isAvailable ?? true;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/search"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green-600 hover:text-brand-green-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Search
      </Link>

      {/* Existing Profile Header */}
      <div className="rounded-2xl border border-cloud-200 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <Avatar
              src={profile.avatarUrl}
              alt={`Portrait of ${name}`}
              size="md"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-bold text-navy-900">
                  {name}
                </h1>
                {profile.verification.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-100 px-2 py-0.5 text-xs font-semibold text-brand-green-700">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-ink-500">{profile.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-ink-700">
                <Star className="h-3.5 w-3.5 fill-brand-amber-500 text-brand-amber-500" />
                <span className="font-semibold">
                  {profile.rating ? profile.rating.toFixed(1) : "New"}
                </span>
                <span className="text-ink-500">
                  · {profile.reviewCount} review
                  {profile.reviewCount === 1 ? "" : "s"}
                </span>
                <span className="flex items-center gap-1 text-ink-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.location.city}, {profile.location.state}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <p className="font-display text-xl font-bold text-brand-green-600">
              From NGN {profile.fromPriceNaira.toLocaleString()}
            </p>

            {isAvailable ? (
              <div className="flex w-full flex-col gap-3">
                <RequestQuoteButton
                  artisanId={profile._id.toString()}
                  serviceTitle={profile.serviceTitle}
                />
                <UnlockContactButton
                  artisanId={profile._id.toString()}
                  artisanName={name}
                  clientEmail={session?.user?.email || ""}
                />
              </div>
            ) : (
              <button
                disabled
                className="cursor-not-allowed rounded-lg bg-cloud-200 px-4 py-2 text-sm font-semibold text-ink-500"
              >
                Currently Unavailable
              </button>
            )}
          </div>
        </div>

        {/* Existing Stats Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-cloud-50 p-3">
            <p className="flex items-center gap-1 text-xs text-ink-500">
              <Zap className="h-3 w-3" />
              Response time
            </p>
            <p className="mt-0.5 text-sm font-semibold text-navy-900">
              {profile.responseTime || "—"}
            </p>
          </div>
          <div className="rounded-xl bg-cloud-50 p-3">
            <p className="text-xs text-ink-500">Turnaround</p>
            <p className="mt-0.5 text-sm font-semibold text-navy-900">
              {profile.turnaround || "—"}
            </p>
          </div>
          <div className="rounded-xl bg-cloud-50 p-3">
            <p className="text-xs text-ink-500">Availability</p>
            <p className="mt-0.5 text-sm font-semibold text-navy-900">
              {profile.availability || "—"}
            </p>
          </div>
          <div className="rounded-xl bg-cloud-50 p-3">
            <p className="text-xs text-ink-500">Seller type</p>
            <p className="mt-0.5 text-sm font-semibold capitalize text-navy-900">
              {profile.sellerType}
            </p>
          </div>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-cloud-200 bg-white p-6">
        <h2 className="font-display text-base font-bold text-navy-900">
          About {name}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          {profile.bio}
        </p>
      </section>

      {/* NEW: Marketplace Storefront Section */}
      {products.length > 0 && (
        <section className="mt-4 rounded-2xl border border-cloud-200 bg-brand-green-50/30 p-6">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-brand-green-600" />
            <h2 className="font-display text-base font-bold text-navy-900">
              Marketplace Storefront
            </h2>
          </div>
          <p className="mt-1 text-sm text-ink-500 mb-5">
            Physical items available for immediate purchase from {name}.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {products.map((product) => (
              <div
                key={product._id}
                className="group flex flex-col overflow-hidden rounded-xl border border-cloud-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <Link
                  href={`/marketplace/${product.slug}`}
                  className="relative block aspect-square w-full bg-cloud-50"
                >
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(min-width: 768px) 240px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-navy-800 backdrop-blur-sm">
                    {product.category}
                  </span>
                </Link>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="line-clamp-1 text-sm font-semibold text-navy-900">
                    <Link
                      href={`/marketplace/${product.slug}`}
                      className="hover:text-brand-green-600"
                    >
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-1 font-bold text-brand-green-600">
                    ₦{product.price.toLocaleString()}
                  </p>
                  <div className="mt-3 mt-auto">
                    <AddToCartButton
                      product={{
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        image: product.images[0],
                        sellerId: product.sellerId,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Existing Skills & Services */}
      <section className="mt-4 rounded-2xl border border-cloud-200 bg-white p-6">
        <h2 className="font-display text-base font-bold text-navy-900">
          Skills &amp; Services
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.categories?.map((cat: string) => (
            <span
              key={cat}
              className="rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-900"
            >
              {cat}
            </span>
          ))}
          {profile.subservices?.map((sub: string) => (
            <span
              key={sub}
              className="rounded-full bg-cloud-100 px-3 py-1 text-xs font-semibold text-ink-700"
            >
              {sub}
            </span>
          ))}
        </div>
      </section>

      {/* Existing Portfolio */}
      {profile.portfolioImages && profile.portfolioImages.length > 0 && (
        <section className="mt-4 rounded-2xl border border-cloud-200 bg-white p-6">
          <h2 className="font-display text-base font-bold text-navy-900">
            Portfolio
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {profile.portfolioImages.map((url: string, i: number) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-xl border border-cloud-100 bg-cloud-50"
              >
                <Image
                  src={url}
                  alt={`${name}'s portfolio image ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
