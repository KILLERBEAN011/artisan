# NaijaCraft — Landing Page

Built with Next.js 16 (App Router), TypeScript, and Tailwind CSS v4, matching the NaijaCraft prototype design.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## What's here

- `src/app/layout.tsx` — root layout, fonts, metadata
- `src/app/globals.css` — brand design tokens (colors, fonts) as Tailwind v4 `@theme`
- `src/components/landing/` — one component per section (Header, Hero, TrustFeatures, BrowseCategories, Testimonials, EnterpriseSection, FAQSection, Footer)
- `src/lib/landing-content.ts` — copy/content data, kept separate from markup so it's easy to edit without touching JSX

## Notes / decisions made without a mobile design

- Built mobile-first and responsive throughout (hamburger menu under `sm`, stacked hero, 1-col cards) — no mobile mockups existed yet, so this reflects standard responsive best practice rather than a specific design.
- Two photo slots (hero "Artisans at work" card, Enterprise section) are placeholder gradients — swap in real photography via the `<img>`/`next/image` where marked "Photo placeholder".
- Fonts use the system font stack (no Google Fonts fetch) so the build never depends on network access. If you want a custom typeface, swap the `--font-display` / `--font-body` values in `globals.css` — `next/font/google` works fine once you have normal internet access.
- Footer merges the two slightly different footer variants seen in the prototype screens (Company/Support/Legal + a "Stay updated" newsletter column) into one consistent version.

## Next steps

Search results page, customer dashboard, artisan dashboard, and booking flow are designed but not yet built — say the word and we'll keep going through them in the same design system.
