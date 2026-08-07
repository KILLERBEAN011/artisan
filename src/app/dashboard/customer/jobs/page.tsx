import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCustomerDashboardData } from "@/lib/dashboard-data";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { JobRow } from "@/components/dashboard/JobRow";
import { customerNavItems } from "@/lib/nav-items";

export default async function CustomerJobsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "artisan") redirect("/dashboard/artisan");

  const { jobs } = await getCustomerDashboardData(session.user.id);

  return (
    <DashboardShell
      navItems={customerNavItems("/dashboard/customer/jobs")}
      userName={session.user.name ?? "Customer"}
      userRole="Customer"
    >
      <h1 className="font-display text-2xl font-bold text-navy-900">My Jobs</h1>
      <p className="mt-1 text-sm text-ink-500">Every job you&rsquo;ve booked, all-time.</p>

      <section className="mt-5 rounded-2xl border border-cloud-200 bg-white p-5">
        {jobs.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-500">
            You haven&rsquo;t booked any jobs yet.
          </p>
        ) : (
          jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              counterpartyLabel="Artisan"
              primaryAction={job.status === "awaiting-quote" ? "View quotes" : "View details"}
              secondaryAction="Message"
            />
          ))
        )}
      </section>
    </DashboardShell>
  );
}
