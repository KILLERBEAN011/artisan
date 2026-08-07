import Link from "next/link";
import { Construction } from "lucide-react";

export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>;
}) {
  const { feature } = await searchParams;
  const label = feature ?? "This feature";

  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud-50 px-4">
      <div className="max-w-sm rounded-2xl border border-cloud-200 bg-white p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-amber-100">
          <Construction className="h-6 w-6 text-brand-amber-600" />
        </div>
        <h1 className="mt-3 font-display text-lg font-bold text-navy-900">
          {label} isn&rsquo;t built yet
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">
          We&rsquo;re still working on this part of NaijaCraft — check back soon.
        </p>
        <Link
          href="/search"
          className="mt-5 inline-block rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700"
        >
          Back to Search
        </Link>
      </div>
    </main>
  );
}
