import type { DashboardJob, DashboardStat } from "@/types/dashboard";

export const artisanStats: DashboardStat[] = [
  { label: "New requests", value: "2", helpText: "Waiting on your quote" },
  { label: "This month's earnings", value: "NGN 96,500", helpText: "6 jobs completed" },
  { label: "Rating", value: "4.6", helpText: "43 reviews" },
];

export const artisanJobs: DashboardJob[] = [
  {
    id: "req-201",
    title: "Electrical rewiring — apartment A2",
    counterpartyName: "Amaka Obi",
    status: "new-request",
    dateLabel: "Requested 1 hour ago",
    amountNaira: 18000,
  },
  {
    id: "req-202",
    title: "AC maintenance — split unit",
    counterpartyName: "David Nwachukwu",
    status: "new-request",
    dateLabel: "Requested 3 hours ago",
    amountNaira: 12000,
  },
  {
    id: "req-203",
    title: "Plumbing — kitchen sink leak",
    counterpartyName: "Bola Adisa",
    status: "quote-sent",
    dateLabel: "Quoted yesterday",
    amountNaira: 8500,
  },
];
