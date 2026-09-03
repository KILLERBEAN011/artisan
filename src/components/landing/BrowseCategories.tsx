import { Droplets, Zap, Hammer, PaintRoller, Fan, Wrench } from "lucide-react";
import { categories } from "@/lib/landing-content";
import Link from "next/link";

const icons = [Droplets, Zap, Hammer, PaintRoller, Fan, Wrench];

export function BrowseCategories() {
  return (
    <section
      id="categories"
      className="bg-cloud-50 transition-colors dark:bg-[#101D3F]"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-extrabold text-navy-900 transition-colors dark:text-white sm:text-3xl">
            Browse categories
          </h2>
          <p className="text-sm text-ink-500 transition-colors dark:text-ink-300">
            Find the right pros for specific tasks
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, i) => {
            const Icon = icons[i];
            return (
              <div
                key={category.title}
                className="flex flex-col rounded-2xl border border-cloud-200 bg-white p-5 transition-all hover:shadow-md dark:border-navy-700 dark:bg-[#17264a]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900/5 dark:bg-white/10">
                  <Icon className="h-5 w-5 text-navy-800 dark:text-white" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold text-navy-900 dark:text-white">
                  {category.title}
                </h3>
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
                  {category.description}
                </p>
                <Link
                  href={category.href}
                  className="mt-4 inline-flex w-fit items-center rounded-lg bg-brand-green-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green-700"
                >
                  Browse {category.title}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
