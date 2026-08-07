import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { customerNavItems } from "@/lib/nav-items";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "artisan") redirect("/dashboard/artisan");

  return (
    <DashboardShell
      navItems={customerNavItems("/dashboard/customer/wallet")}
      userName={session.user.name ?? "Customer"}
      userRole="Customer"
    >
      <h1 className="font-display text-2xl font-bold text-navy-900">Wallet</h1>
      <div className="mt-5">
        <ComingSoonPanel title="Wallet is coming soon" description="Wallet top-ups and escrow balance tracking will live here once payment integration is built." />
      </div>
    </DashboardShell>
  );
}
