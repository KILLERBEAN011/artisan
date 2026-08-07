import { Construction } from "lucide-react";

export function ComingSoonPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-cloud-200 bg-white p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-amber-100">
        <Construction className="h-6 w-6 text-brand-amber-600" />
      </div>
      <h2 className="mt-3 font-display text-lg font-bold text-navy-900">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-500">{description}</p>
    </div>
  );
}
