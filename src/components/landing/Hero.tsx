"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Lock,
  Star,
  Users,
  ShieldCheck,
  Wrench,
  MapPin,
} from "lucide-react";

export function Hero({ heroImageUrl }: { heroImageUrl?: string }) {
  const router = useRouter();
  const [service, setService] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (service.trim()) params.set("q", service.trim());
    if (location.trim()) params.set("location", location.trim());
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <section className="bg-navy-900">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:py-20">
        {/* Left Column: Copy + Form */}
        <div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
            Trusted local artisans &amp; handymen across Nigeria
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-navy-100 sm:text-lg">
            Find verified professionals for plumbing, electrical, carpentry and
            more. Post a task, receive quotes, and hire with confidence —
            Naira-friendly pricing and secure in-app payments.
          </p>

          {/* New Double Search Bar Form integrated with your Next.js logic */}
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex w-full max-w-3xl flex-col gap-2 sm:flex-row sm:rounded-full sm:bg-white sm:p-2 sm:shadow-lg"
          >
            {/* Service Input */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Wrench className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="What do you need? (e.g. Plumber)"
                className="w-full rounded-full border border-gray-300 bg-white py-3.5 pl-11 pr-4 text-gray-900 focus:border-brand-green-600 focus:outline-none focus:ring-1 focus:ring-brand-green-600 sm:border-transparent sm:focus:border-transparent sm:focus:ring-0"
                required
              />
            </div>

            {/* Divider for Desktop */}
            <div className="hidden w-px bg-gray-200 sm:block"></div>

            {/* Location Input */}
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where? (e.g. Yaba, Lagos)"
                className="w-full rounded-full border border-gray-300 bg-white py-3.5 pl-11 pr-4 text-gray-900 focus:border-brand-green-600 focus:outline-none focus:ring-1 focus:ring-brand-green-600 sm:border-transparent sm:focus:border-transparent sm:focus:ring-0"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="mt-2 w-full rounded-full bg-brand-green-600 px-8 py-3.5 font-bold text-white transition-colors hover:bg-brand-green-700 sm:mt-0 sm:w-auto"
            >
              Search
            </button>
          </form>

          {/* Trust Badges */}
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-navy-100">
            <li className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5 text-brand-green-500" />
              Naira-friendly pricing
            </li>
            <li className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-brand-green-500" />
              Secure payments
            </li>
            <li className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 text-brand-green-500" />
              Customer ratings
            </li>
          </ul>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
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

        {/* Right Column: Side stats card */}
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

          {heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
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
              <p className="text-xs text-ink-500">
                Average time to first reply
              </p>
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
