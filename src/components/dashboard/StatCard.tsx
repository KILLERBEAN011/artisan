import type { DashboardStat } from "@/types/dashboard";

export function StatCard({ stat }: { stat: DashboardStat }) {
  return (
    <div className="rounded-xl border border-cloud-200 bg-white p-4">
      <p className="text-xs font-medium text-ink-500">{stat.label}</p>
      <p className="mt-1 font-display text-xl font-bold text-navy-900">{stat.value}</p>
      {stat.helpText && <p className="mt-0.5 text-xs text-ink-500">{stat.helpText}</p>}
    </div>
  );
}
