import type { DashboardJob, DashboardStat } from "@/types/dashboard";

export const customerStats: DashboardStat[] = [
  { label: "Active jobs", value: "3", helpText: "Currently scheduled or in progress" },
  { label: "Wallet balance", value: "NGN 18,450", helpText: "Held in escrow + available" },
  { label: "Total spent", value: "NGN 142,000", helpText: "Across 12 completed jobs" },
];

export const customerJobs: DashboardJob[] = [
  {
    id: "job-101",
    title: "Electrical rewiring — apartment A2",
    counterpartyName: "Chinyere Okeke",
    status: "in-progress",
    dateLabel: "Today, 2:00 PM",
    amountNaira: 18000,
  },
  {
    id: "job-102",
    title: "Plumbing — kitchen sink leak",
    counterpartyName: "Bola Adisa",
    status: "scheduled",
    dateLabel: "Tomorrow, 10:00 AM",
    amountNaira: 8500,
  },
  {
    id: "job-103",
    title: "Painting — bedroom ceiling",
    counterpartyName: "Ifeanyi Umeh",
    status: "awaiting-quote",
    dateLabel: "Requested 2 days ago",
    amountNaira: 0,
  },
];
