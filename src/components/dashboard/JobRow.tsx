import Link from "next/link";
import { StatusPill } from "@/components/dashboard/StatusPill";
import type { DashboardJob } from "@/types/dashboard";

type Props = {
  job: DashboardJob;
  counterpartyLabel: string; // e.g. "Artisan" or "Customer"
  primaryAction?: string;
  secondaryAction?: string;
};

function ActionButton({
  label,
  jobId,
  variant,
}: {
  label: string;
  jobId: string;
  variant: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "rounded-lg bg-brand-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-green-700"
      : "rounded-lg border border-cloud-200 px-3 py-1.5 text-xs font-semibold text-navy-900 transition-colors hover:bg-cloud-50";

  // Every action currently leads to the same booking page (status + chat) —
  // there's no separate "quote sending" or "decline" flow built yet, so
  // rather than leave any button dead, all of them point somewhere real.
  return (
    <Link href={`/bookings/${jobId}`} className={className}>
      {label}
    </Link>
  );
}

export function JobRow({ job, counterpartyLabel, primaryAction, secondaryAction }: Props) {
  return (
    <div className="flex flex-col gap-3 border-b border-cloud-200 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold text-navy-900">{job.title}</h4>
          <StatusPill status={job.status} />
        </div>
        <p className="mt-1 text-sm text-ink-500">
          {counterpartyLabel}: {job.counterpartyName} · {job.dateLabel}
        </p>
      </div>

      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
        <p className="font-display text-sm font-bold text-navy-900">
          NGN {job.amountNaira.toLocaleString()}
        </p>
        <div className="flex gap-2">
          {secondaryAction && (
            <ActionButton label={secondaryAction} jobId={job.id} variant="secondary" />
          )}
          {primaryAction && (
            <ActionButton label={primaryAction} jobId={job.id} variant="primary" />
          )}
        </div>
      </div>
    </div>
  );
}
