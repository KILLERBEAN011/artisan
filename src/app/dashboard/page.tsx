import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardRedirectPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "artisan") {
    redirect("/dashboard/artisan");
  }

  redirect("/dashboard/customer");
}
