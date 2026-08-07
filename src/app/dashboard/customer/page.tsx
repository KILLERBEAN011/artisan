import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCustomerDashboardData } from "@/lib/dashboard-data";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { JobRow } from "@/components/dashboard/JobRow";
import { customerNavItems } from "@/lib/nav-items";
import Link from "next/link";

export default async function CustomerDashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // An artisan account has no business seeing the customer dashboard.
  if (session.user.role === "artisan") {
    redirect("/dashboard/artisan");
  }

  const { jobs: customerJobs, stats: customerStats } = await getCustomerDashboardData(
    session.user.id,
  );

  return (
    <DashboardShell
      navItems={customerNavItems("/dashboard/customer")}
      userName={session.user.name ?? "Customer"}
      userRole="Customer"
    >
      <h1 className="font-display text-2xl font-bold text-navy-900">Overview</h1>
      <p className="mt-1 text-sm text-ink-500">
        Here&rsquo;s what&rsquo;s happening across your jobs.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {customerStats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-cloud-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-navy-900">
            Upcoming &amp; active jobs
          </h2>
          <Link
            href="/dashboard/customer/jobs"
            className="text-sm font-semibold text-brand-green-600 hover:text-brand-green-700"
          >
            View all
          </Link>
        </div>
        <div className="mt-2">
          {customerJobs.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-500">
              No jobs yet — head to{" "}
              <Link href="/search" className="font-semibold text-brand-green-600 hover:text-brand-green-700">
                Search
              </Link>{" "}
              to request a quote from an artisan.
            </p>
          ) : (
            customerJobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                counterpartyLabel="Artisan"
                primaryAction={job.status === "awaiting-quote" ? "View quotes" : "View details"}
                secondaryAction="Message"
              />
            ))
          )}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-cloud-200 bg-white p-5">
        <h2 className="font-display text-base font-bold text-navy-900">Support &amp; disputes</h2>
        <p className="mt-1 text-sm text-ink-700">
          Need help with a job? Our support team responds within 24 hours.
        </p>
        <button
          type="button"
          className="mt-3 rounded-lg border border-cloud-200 px-4 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-cloud-50"
        >
          Contact Support
        </button>
      </section>
    </DashboardShell>
  );
}
