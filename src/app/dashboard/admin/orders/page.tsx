import { redirect } from "next/navigation";

// Marketplace orders now live in one place: the admin area
export default function OldAdminOrdersPage() {
  redirect("/admin/orders");
}
