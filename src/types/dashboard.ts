export type JobStatus =
  | "scheduled"
  | "in-progress"
  | "awaiting-quote"
  | "quote-sent"
  | "completed"
  | "new-request"
  | "disputed";

export type DashboardJob = {
  id: string;
  title: string;
  counterpartyName: string; // the artisan (customer view) or customer (artisan view)
  status: JobStatus;
  dateLabel: string;
  amountNaira: number;
};

export type NavIconKey =
  | "overview"
  | "jobs"
  | "wallet"
  | "reviews"
  | "settings"
  | "support"
  | "earnings"
  | "verification"
  | "shop"
  | "orders";

export type NavItem = {
  label: string;
  icon: NavIconKey;
  href: string;
  active?: boolean;
};

export type DashboardStat = {
  label: string;
  value: string;
  helpText?: string;
};
