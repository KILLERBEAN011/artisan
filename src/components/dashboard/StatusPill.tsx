import type { JobStatus } from "@/types/dashboard";

const STATUS_STYLES: Record<JobStatus, string> = {
  scheduled: "bg-navy-100 text-navy-900",
  "in-progress": "bg-brand-amber-100 text-brand-amber-600",
  "awaiting-quote": "bg-cloud-100 text-ink-700",
  "quote-sent": "bg-brand-green-100 text-brand-green-700",
  completed: "bg-brand-green-100 text-brand-green-700",
  "new-request": "bg-brand-amber-100 text-brand-amber-600",
  disputed: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<JobStatus, string> = {
  scheduled: "Scheduled",
  "in-progress": "In progress",
  "awaiting-quote": "Awaiting quote",
  "quote-sent": "Quote sent",
  completed: "Completed",
  "new-request": "New request",
  disputed: "Disputed",
};

export function StatusPill({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
