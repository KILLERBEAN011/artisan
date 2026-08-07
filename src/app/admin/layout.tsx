import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-cloud-50">
      <header className="border-b border-cloud-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <Link href="/admin/bookings" className="font-display text-lg font-bold text-navy-900">
              NaijaCraft Admin
            </Link>
            <p className="text-xs text-ink-500">Logged in as {session.user.name}</p>
          </div>
          <AdminNav />
        </div>
      </header>
      {children}
    </div>
  );
}
