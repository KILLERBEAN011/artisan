import { Wrench } from "lucide-react";
import Link from "next/link";

const columns = [
  {
    title: "Company",
    links: ["About Us", "Careers", "Blog", "Press"],
  },
  {
    title: "Support",
    links: ["Help Center", "Contact", "Safety", "Trust & Safety"],
  },
  {
    title: "Legal",
    links: ["Terms", "Privacy"],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-navy-900">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,0.8fr)_1fr]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-lg font-bold text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green-600">
                <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
              </span>
              NaijaCraft
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-navy-100">
              Connecting Nigerians with trusted local artisans for home,
              office and business needs. Secure, simple and Naira-friendly.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-lg border border-navy-700 px-3.5 py-2 text-xs font-medium text-navy-100">
                App Store
              </span>
              <span className="rounded-lg border border-navy-700 px-3.5 py-2 text-xs font-medium text-navy-100">
                Google Play
              </span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-white">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-navy-100 transition-colors hover:text-white"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-sm font-semibold text-white">
              Stay updated
            </h3>
            <form className="mt-4 flex gap-2">
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Email address"
                className="w-full min-w-0 rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-sm text-white placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-brand-green-500"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-brand-green-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-amber-500"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 border-t border-navy-800 pt-6 text-xs text-navy-300">
          © {new Date().getFullYear()} NaijaCraft. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
