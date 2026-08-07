"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, UserRound } from "lucide-react";
import { testimonials } from "@/lib/landing-content";

const PAGE_SIZE = 3;

export function Testimonials() {
  const [start, setStart] = useState(0);
  const pageCount = Math.ceil(testimonials.length / PAGE_SIZE);
  const page = Math.floor(start / PAGE_SIZE);
  const visible = testimonials.slice(start, start + PAGE_SIZE);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl">
              What customers say
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Real feedback from verified customers
            </p>
          </div>
          {pageCount > 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setStart((s) => (s - PAGE_SIZE + testimonials.length) % testimonials.length)
                }
                disabled={page === 0}
                aria-label="Previous testimonials"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cloud-200 text-ink-700 transition-colors hover:bg-cloud-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setStart((s) => (s + PAGE_SIZE) % testimonials.length)}
                disabled={page >= pageCount - 1}
                aria-label="Next testimonials"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cloud-200 text-ink-700 transition-colors hover:bg-cloud-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {visible.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl bg-cloud-50 p-5"
            >
              <figcaption className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900/10">
                  <UserRound className="h-4.5 w-4.5 text-navy-800" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-ink-500">{t.location}</p>
                </div>
              </figcaption>
              <blockquote className="mt-3 text-sm leading-relaxed text-ink-700">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-3 flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-brand-amber-500 text-brand-amber-500"
                  />
                ))}
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
