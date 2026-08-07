import { getSiteSettings } from "@/lib/site-settings";
import { SiteImageForm } from "@/components/admin/SiteImageForm";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-navy-900">Site Settings</h1>
      <p className="mt-1 text-sm text-ink-500">
        Controls shown site-wide — not tied to any individual user.
      </p>

      <section className="mt-5 rounded-2xl border border-cloud-200 bg-white p-5">
        <h2 className="font-display text-base font-bold text-navy-900">Homepage hero image</h2>
        <p className="mt-1 text-sm text-ink-500">
          The main image at the top of the homepage.
        </p>
        <div className="mt-4">
          <SiteImageForm field="heroImageUrl" currentUrl={settings.heroImageUrl ?? ""} />
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-cloud-200 bg-white p-5">
        <h2 className="font-display text-base font-bold text-navy-900">
          Enterprise section image
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Shown next to the &ldquo;Enterprise &amp; volume bookings&rdquo; section further down
          the homepage.
        </p>
        <div className="mt-4">
          <SiteImageForm
            field="enterpriseImageUrl"
            currentUrl={settings.enterpriseImageUrl ?? ""}
          />
        </div>
      </section>
    </main>
  );
}
