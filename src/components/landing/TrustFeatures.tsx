import { MessageSquareText, ShieldCheck, UserCheck } from "lucide-react";
import { trustFeatures } from "@/lib/landing-content";

const icons = [UserCheck, ShieldCheck, MessageSquareText];

export function TrustFeatures() {
  return (
    <section className="border-b border-cloud-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {trustFeatures.map((feature, i) => {
            const Icon = icons[i];
            return (
              <div key={feature.title} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green-100">
                  <Icon className="h-5 w-5 text-brand-green-600" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-navy-900">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
