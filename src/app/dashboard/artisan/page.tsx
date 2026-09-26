import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getArtisanDashboardData } from "@/lib/dashboard-data";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { JobRow } from "@/components/dashboard/JobRow";
import { artisanNavItems } from "@/lib/nav-items";
import { AvailabilityToggle } from "@/components/dashboard/AvailabilityToggle";
import { PortfolioEditor } from "@/components/dashboard/PortfolioEditor";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default async function ArtisanDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "customer") {
    redirect("/dashboard/customer");
  }

  const data = await getArtisanDashboardData(session.user.id);

  if (!data) {
    redirect("/onboarding/artisan");
  }

  const { jobs: artisanJobs, stats: artisanStats, profile } = data;

  return (
    <DashboardShell
      navItems={artisanNavItems("/dashboard/artisan")}
      userName={session.user.name ?? "Artisan"}
      userRole={profile.title}
    >
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            You have {artisanStats[0].value} new request
            {artisanStats[0].value === "1" ? "" : "s"} waiting on a quote.
          </p>
        </div>

        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 w-fit"
        >
          <PlusCircle className="h-4 w-4" />
          List New Item
        </Link>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {artisanStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-cloud-200 bg-white p-5">
        <h2 className="font-display text-base font-bold text-navy-900">
          Portfolio Images
        </h2>
        <p className="mt-1 text-sm text-ink-700">
          Upload up to 3 images of your past work to show on your public
          profile.
        </p>
        <PortfolioEditor initialImages={profile.portfolioImages ?? []} />
      </section>

      <section className="mt-6 rounded-2xl border border-cloud-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-navy-900">
            New requests
          </h2>
          <Link
            href="/dashboard/artisan/requests"
            className="text-sm font-semibold text-brand-green-600 hover:text-brand-green-700"
          >
            View all
          </Link>
        </div>
        <div className="mt-2">
          {artisanJobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-500">
              No job requests yet — once a customer requests a quote from your
              profile, it&rsquo;ll show up here.
            </p>
          ) : (
            artisanJobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                counterpartyLabel="Customer"
                primaryAction={
                  job.status === "new-request" ? "Send Quote" : "View details"
                }
                secondaryAction="Message"
              />
            ))
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-cloud-200 bg-white p-5">
        <h2 className="font-display text-base font-bold text-navy-900">
          Availability
        </h2>
        <p className="mt-1 text-sm text-ink-700">
          Toggle your status so customers know when you can take new jobs.
        </p>
        <AvailabilityToggle initialStatus={profile.isAvailable ?? true} />
      </section>
    </DashboardShell>
  );
}
