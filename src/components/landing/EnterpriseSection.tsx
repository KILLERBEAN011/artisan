import Link from "next/link";

export function EnterpriseSection({ enterpriseImageUrl }: { enterpriseImageUrl?: string }) {
  return (
    <section className="bg-cloud-50">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl">
            Enterprise &amp; volume bookings
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-700 sm:text-base">
            Tailored programs for businesses, property managers and
            facilities teams: bulk scheduling, priority response,
            consolidated invoicing and account management.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/coming-soon?feature=Enterprise+pricing"
              className="rounded-lg bg-brand-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-700"
            >
              Get enterprise pricing
            </Link>
            <Link
              href="/coming-soon?feature=Talk+to+sales"
              className="rounded-lg bg-brand-amber-500 px-5 py-2.5 text-sm font-semibold text-navy-900 transition-colors hover:bg-brand-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber-600"
            >
              Talk to sales
            </Link>
          </div>
        </div>

        {/* Photo placeholder — admin can replace this at /admin/settings */}
        {enterpriseImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URL, not a local asset
          <img
            src={enterpriseImageUrl}
            alt="Facilities professional reviewing a job on a tablet at a commercial site"
            className="aspect-[16/10] w-full rounded-2xl object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label="Facilities professional reviewing a job on a tablet at a commercial site"
            className="flex aspect-[16/10] items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-brand-green-700"
          >
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
              Photo placeholder
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
