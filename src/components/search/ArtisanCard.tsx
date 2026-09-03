import Link from "next/link";
import { Star, Zap } from "lucide-react";
import { RequestQuoteButton } from "@/components/search/RequestQuoteButton";
import { Avatar } from "@/components/shared/Avatar";
import type { Artisan } from "@/types/artisan";

export function ArtisanCard({ artisan }: { artisan: Artisan }) {
  return (
    <article className="rounded-2xl border border-cloud-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <Avatar
            src={artisan.avatarUrl}
            alt={`Portrait of ${artisan.name}`}
            size="sm"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-bold text-navy-900">
                {artisan.serviceTitle}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-amber-100 px-2 py-0.5 text-xs font-semibold text-brand-amber-600">
                <Zap className="h-3 w-3" />
                {artisan.responseTime}
              </span>
              {artisan.verified && (
                <span className="rounded-full bg-brand-green-100 px-2 py-0.5 text-xs font-semibold text-brand-green-700">
                  Verified
                </span>
              )}
            </div>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-700">
              {artisan.bio}
            </p>
            <p className="mt-2 text-sm">
              <span className="font-semibold text-navy-900">
                {artisan.name}
              </span>
              <span className="text-ink-500"> · {artisan.title}</span>
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-ink-700">
              <Star className="h-3.5 w-3.5 fill-brand-amber-500 text-brand-amber-500" />
              <span className="font-semibold">{artisan.rating}</span>
              <span className="text-ink-500">
                · {artisan.reviewCount} reviews · {artisan.location}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <div className="text-left sm:text-right">
            <p className="font-display text-lg font-bold text-brand-green-600">
              From NGN {artisan.fromPriceNaira.toLocaleString()}
            </p>
            <p className="text-xs text-ink-500">{artisan.turnaround}</p>
          </div>
          <p className="text-xs text-ink-500">{artisan.availability}</p>

          {/* UPDATED: Conditional Availability Rendering */}
          {artisan.isAvailable ? (
            <RequestQuoteButton
              artisanId={artisan.id}
              serviceTitle={artisan.serviceTitle}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-70 sm:w-auto"
            />
          ) : (
            <button
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-cloud-200 px-4 py-2 text-sm font-semibold text-ink-500 sm:w-auto"
            >
              Currently Unavailable
            </button>
          )}

          <Link
            href={`/artisans/${artisan.id}`}
            className="w-full rounded-lg border border-cloud-200 px-4 py-2 text-center text-sm font-semibold text-navy-900 transition-colors hover:bg-cloud-50 sm:w-auto"
          >
            View Profile
          </Link>
        </div>
      </div>

      {artisan.recentJobs.length > 0 && (
        <div className="mt-4 rounded-xl bg-cloud-50 p-4">
          <p className="mb-2.5 text-sm font-semibold text-navy-900">
            Recent Jobs
          </p>
          <ul className="mb-3 space-y-1 text-sm text-ink-700">
            {artisan.recentJobs.map((job) => (
              <li key={job.id}>
                {job.label} — NGN {job.amountNaira.toLocaleString()} (
                {job.status === "completed" ? "completed" : "in progress"})
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            {artisan.recentJobs.map((job) => (
              <div
                key={job.id}
                role="img"
                aria-label={job.photoAlt}
                className="h-16 w-16 rounded-lg bg-gradient-to-br from-navy-700 to-brand-green-600"
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
