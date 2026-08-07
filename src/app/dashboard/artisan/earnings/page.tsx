import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ArtisanProfile } from "@/models/ArtisanProfile";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BankDetailsForm } from "@/components/artisan/BankDetailsForm";
import { ProfilePhotoForm } from "@/components/artisan/ProfilePhotoForm";
import { artisanNavItems } from "@/lib/nav-items";

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "customer") redirect("/dashboard/customer");

  await connectToDatabase();
  const profile = await ArtisanProfile.findOne({ userId: session.user.id }).lean();
  if (!profile) redirect("/onboarding/artisan");

  const bankDetails = profile.bankDetails ?? { bankName: "", accountNumber: "", accountName: "" };

  return (
    <DashboardShell
      navItems={artisanNavItems("/dashboard/artisan/earnings")}
      userName={session.user.name ?? "Artisan"}
      userRole={profile.title}
    >
      <h1 className="font-display text-2xl font-bold text-navy-900">Earnings</h1>
      <p className="mt-1 text-sm text-ink-500">
        Detailed payout history isn&rsquo;t built yet — for now, here&rsquo;s where you add or
        update the bank account your payouts get sent to.
      </p>

      <section className="mt-5 rounded-2xl border border-cloud-200 bg-white p-5">
        <h2 className="font-display text-base font-bold text-navy-900">Profile photo</h2>
        <p className="mt-1 text-sm text-ink-500">
          Shown on your public profile and in search results.
        </p>
        <div className="mt-4">
          <ProfilePhotoForm currentAvatarUrl={profile.avatarUrl ?? ""} />
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-cloud-200 bg-white p-5">
        <h2 className="font-display text-base font-bold text-navy-900">Payout bank details</h2>
        <p className="mt-1 text-sm text-ink-500">
          This is shared with NaijaCraft admins when they release a completed job&rsquo;s payment
          to you.
        </p>
        <div className="mt-4">
          <BankDetailsForm
            initialBankName={bankDetails.bankName ?? ""}
            initialAccountNumber={bankDetails.accountNumber ?? ""}
            initialAccountName={bankDetails.accountName ?? ""}
          />
        </div>
      </section>
    </DashboardShell>
  );
}
