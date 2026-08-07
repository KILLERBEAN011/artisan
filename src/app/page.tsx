import { SiteHeader } from "@/components/landing/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import { TrustFeatures } from "@/components/landing/TrustFeatures";
import { BrowseCategories } from "@/components/landing/BrowseCategories";
import { Testimonials } from "@/components/landing/Testimonials";
import { EnterpriseSection } from "@/components/landing/EnterpriseSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { getSiteSettings } from "@/lib/site-settings";

// Without this, Next.js would bake the hero image into a static HTML file at
// build time — meaning an admin uploading a new image later wouldn't show up
// until the next full redeploy. force-dynamic makes this page re-fetch the
// latest settings on every request instead.
export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getSiteSettings();

  return (
    <>
      <SiteHeader />
      <main>
        <Hero heroImageUrl={settings.heroImageUrl} />
        <TrustFeatures />
        <BrowseCategories />
        <Testimonials />
        <EnterpriseSection enterpriseImageUrl={settings.enterpriseImageUrl} />
        <FAQSection />
      </main>
      <SiteFooter />
    </>
  );
}
