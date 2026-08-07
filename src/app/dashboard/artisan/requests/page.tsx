import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getArtisanDashboardData } from "@/lib/dashboard-data";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { JobRow } from "@/components/dashboard/JobRow";
import { artisanNavItems } from "@/lib/nav-items";

export default async function ArtisanRequestsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "customer") redirect("/dashboard/customer");

  const data = await getArtisanDashboardData(session.user.id);
  if (!data) redirect("/onboarding/artisan");

  const { jobs, profile } = data;

  return (
    <DashboardShell
      navItems={artisanNavItems("/dashboard/artisan/requests")}
      userName={session.user.name ?? "Artisan"}
      userRole={profile.title}
    >
      <h1 className="font-display text-2xl font-bold text-navy-900">Job Requests</h1>
      <p className="mt-1 text-sm text-ink-500">Every request you&rsquo;ve received, all-time.</p>

      <section className="mt-5 rounded-2xl border border-cloud-200 bg-white p-5">
        {jobs.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-500">
            No job requests yet — once a customer requests a quote from your profile,
            it&rsquo;ll show up here.
          </p>
        ) : (
          jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              counterpartyLabel="Customer"
              primaryAction={job.status === "new-request" ? "Send Quote" : "View details"}
              secondaryAction="Message"
            />
          ))
        )}
      </section>
    </DashboardShell>
  );
}
