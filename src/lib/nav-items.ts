import type { NavItem } from "@/types/dashboard";

export function customerNavItems(activeHref: string): NavItem[] {
  const items: Omit<NavItem, "active">[] = [
    { label: "Overview", icon: "overview", href: "/dashboard/customer" },
    { label: "My Jobs", icon: "jobs", href: "/dashboard/customer/jobs" },
    { label: "My Orders", icon: "orders", href: "/dashboard/customer/orders" },
    { label: "My Shop", icon: "shop", href: "/dashboard/listings" },
    { label: "Wallet", icon: "wallet", href: "/dashboard/customer/wallet" },
    { label: "Reviews", icon: "reviews", href: "/dashboard/customer/reviews" },
    {
      label: "Account Settings",
      icon: "settings",
      href: "/dashboard/customer/settings",
    },
    {
      label: "Support & Disputes",
      icon: "support",
      href: "/dashboard/customer/support",
    },
  ];
  return items.map((item) => ({ ...item, active: item.href === activeHref }));
}

export function artisanNavItems(activeHref: string): NavItem[] {
  const items: Omit<NavItem, "active">[] = [
    { label: "Dashboard Home", icon: "overview", href: "/dashboard/artisan" },
    {
      label: "Job Requests",
      icon: "jobs",
      href: "/dashboard/artisan/requests",
    },
    {
      label: "Earnings",
      icon: "earnings",
      href: "/dashboard/artisan/earnings",
    },
    {
      label: "My Products",
      icon: "shop",
      href: "/dashboard/artisan/products",
    },
    {
      label: "Shop Orders",
      icon: "orders",
      href: "/dashboard/sales",
    },
    { label: "Reviews", icon: "reviews", href: "/dashboard/artisan/reviews" },
    {
      label: "Verification",
      icon: "verification",
      href: "/dashboard/artisan/verification",
    },
    { label: "Support", icon: "support", href: "/dashboard/artisan/support" },
  ];
  return items.map((item) => ({ ...item, active: item.href === activeHref }));
}
