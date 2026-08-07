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
      navItems={artisanNavItems("/dashboard/artisan/verification")}
      userName={session.user.name ?? "Artisan"}
      userRole={profile.title}
    >
      <h1 className="font-display text-2xl font-bold text-navy-900">Verification</h1>
      <div className="mt-5">
        <ComingSoonPanel title="Verification is coming soon" description="ID and BVN verification uploads will be handled here in a future update." />
      </div>
    </DashboardShell>
  );
}
