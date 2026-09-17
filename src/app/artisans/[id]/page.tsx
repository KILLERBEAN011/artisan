import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, ShieldCheck, Star, Zap } from "lucide-react";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import "@/models/User";
import { RequestQuoteButton } from "@/components/search/RequestQuoteButton";
import { Avatar } from "@/components/shared/Avatar";

export default async function ArtisanProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectToDatabase();

  let profile;
  try {
    profile = await ArtisanProfile.findById(id)
      .populate("userId", "name")
      .lean();
  } catch {
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
              <RequestQuoteButton
                artisanId={id}
                serviceTitle={profile.serviceTitle}
              />
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

      <section className="mt-4 rounded-2xl border border-cloud-200 bg-white p-6">
        <h2 className="font-display text-base font-bold text-navy-900">
          Skills &amp; Services
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.categories.map((cat: string) => (
            <span
              key={cat}
              className="rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-900"
            >
              {cat}
            </span>
          ))}
          {profile.subservices.map((sub: string) => (
            <span
              key={sub}
              className="rounded-full bg-cloud-100 px-3 py-1 text-xs font-semibold text-ink-700"
            >
              {sub}
            </span>
          ))}
        </div>
        {profile.languages.length > 0 && (
          <p className="mt-3 text-sm text-ink-500">
            Speaks: {profile.languages.join(", ")}
          </p>
        )}
      </section>

      {profile.portfolioImages && profile.portfolioImages.length > 0 && (
        <section className="mt-4 rounded-2xl border border-cloud-200 bg-white p-6">
          <h2 className="font-display text-base font-bold text-navy-900">
            Portfolio
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {profile.portfolioImages.map((url: string, i: number) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-xl border border-cloud-100 bg-cloud-50"
              >
                <img
                  src={url}
                  alt={`${name}'s portfolio image ${i + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {profile.recentJobs.length > 0 && (
        <section className="mt-4 rounded-2xl border border-cloud-200 bg-white p-6">
          <h2 className="font-display text-base font-bold text-navy-900">
            Recent Jobs
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {profile.recentJobs.map((job: { label: string }, i: number) => (
              <div key={i}>
                <div
                  role="img"
                  aria-label={job.label}
                  className="aspect-square rounded-xl bg-gradient-to-br from-navy-700 to-brand-green-600"
                />
                <p className="mt-1.5 text-xs text-ink-500">{job.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-cloud-200 bg-white p-6">
        <h2 className="font-display text-base font-bold text-navy-900">
          Reviews
        </h2>
        {profile.reviewCount > 0 ? (
          <div className="mt-2 flex items-center gap-2">
            <Star className="h-4 w-4 fill-brand-amber-500 text-brand-amber-500" />
            <span className="font-display text-lg font-bold text-navy-900">
              {profile.rating.toFixed(1)}
            </span>
            <span className="text-sm text-ink-500">
              from {profile.reviewCount} review
              {profile.reviewCount === 1 ? "" : "s"}
            </span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-ink-500">
            No reviews yet — {name} hasn&rsquo;t completed a job through
            NaijaCraft.
          </p>
        )}
        <p className="mt-2 text-xs text-ink-500">
          Detailed written reviews aren&rsquo;t built yet — this section shows
          the aggregate rating only for now.
        </p>
      </section>
    </main>
  );
}
