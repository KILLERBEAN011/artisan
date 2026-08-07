"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Lock, Star, Users, ShieldCheck } from "lucide-react";

export function Hero({ heroImageUrl }: { heroImageUrl?: string }) {
  const router = useRouter();
  const [service, setService] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (service.trim()) params.set("q", service.trim());
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <section className="bg-navy-900">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:py-20">
        {/* Copy + form */}
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            Trusted local artisans &amp; handymen across Nigeria
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-navy-100 sm:text-lg">
            Find verified professionals for plumbing, electrical, carpentry
            and more. Post a task, receive quotes, and hire with confidence —
            Naira-friendly pricing and secure in-app payments.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 rounded-2xl bg-white p-4 shadow-xl shadow-navy-950/20 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="sr-only" htmlFor="hero-service">
                Service
              </label>
              <input
                id="hero-service"
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="Service (e.g., Plumbing)"
                className="rounded-lg border border-cloud-200 bg-cloud-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green-100"
              />
              <label className="sr-only" htmlFor="hero-location">
                Location
              </label>
              <input
                id="hero-location"
                type="text"
                placeholder="Location (Lagos, Abuja…)"
                className="rounded-lg border border-cloud-200 bg-cloud-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green-100"
              />
              <label className="sr-only" htmlFor="hero-date">
                Preferred date
              </label>
              <input
                id="hero-date"
                type="text"
                placeholder="Preferred date"
                className="rounded-lg border border-cloud-200 bg-cloud-50 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green-100"
              />
            </div>
            <button
              type="submit"
              className="mt-3 w-full rounded-lg bg-brand-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-700 sm:w-auto sm:px-8"
            >
              Post Task
            </button>

            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-ink-700">
              <li className="flex items-center gap-1.5">
                <Banknote className="h-3.5 w-3.5 text-brand-green-600" />
                Naira-friendly pricing
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-brand-green-600" />
                Secure payments
              </li>
              <li className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-brand-green-600" />
                Customer ratings
              </li>
            </ul>
          </form>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl bg-navy-800/60 p-4">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-brand-amber-500" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Screened artisans
                </p>
                <p className="text-xs text-navy-100">
                  Background checks &amp; skill verification
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-navy-800/60 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-amber-500" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Insurance &amp; guarantees
                </p>
                <p className="text-xs text-navy-100">
                  Job protection up to ₦50,000
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Side stats card */}
        <div className="rounded-2xl bg-white p-5 shadow-xl shadow-navy-950/20 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-navy-900">
                Artisans at work
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Skilled professionals from trusted local communities
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-brand-amber-100 px-2.5 py-1 text-xs font-semibold text-brand-amber-600">
              Top-rated
            </span>
          </div>

          {/* Photo placeholder — admin can replace this at /admin/settings */}
          {heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external Cloudinary URL, not a local asset
            <img
              src={heroImageUrl}
              alt="Artisans collaborating on a home repair job"
              className="mt-4 aspect-[4/3] w-full rounded-xl object-cover"
            />
          ) : (
            <div
              role="img"
              aria-label="Artisans collaborating on a home repair job"
              className="mt-4 flex aspect-[4/3] items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 via-navy-700 to-brand-green-700"
            >
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
                Photo placeholder
              </span>
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-cloud-50 p-3.5">
              <p className="text-xs font-medium text-ink-500">
                Typical response
              </p>
              <p className="mt-1 font-display text-xl font-bold text-brand-green-600">
                ~30 mins
              </p>
              <p className="text-xs text-ink-500">Average time to first reply</p>
            </div>
            <div className="rounded-xl bg-cloud-50 p-3.5">
              <p className="text-xs font-medium text-ink-500">
                Typical job cost
              </p>
              <p className="mt-1 font-display text-xl font-bold text-navy-900">
                ₦3,500
              </p>
              <p className="text-xs text-ink-500">Small repairs from</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
