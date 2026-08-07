import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { artisanNavItems } from "@/lib/nav-items";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "customer") redirect("/dashboard/customer");

  await connectToDatabase();
  const profile = await ArtisanProfile.findOne({ userId: session.user.id }).lean();
  if (!profile) redirect("/onboarding/artisan");

  return (
    <DashboardShell
      navItems={artisanNavItems("/dashboard/artisan/support")}
      userName={session.user.name ?? "Artisan"}
      userRole={profile.title}
    >
      <h1 className="font-display text-2xl font-bold text-navy-900">Support</h1>
      <div className="mt-5">
        <ComingSoonPanel title="Support is coming soon" description="A dedicated support ticket system for artisans is planned for a future update." />
      </div>
    </DashboardShell>
  );
}
