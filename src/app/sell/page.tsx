import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Banknote,
  Camera,
  CheckCircle2,
  Clock,
  Hammer,
  Package,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import { auth } from "@/lib/auth";
import { CATEGORIES } from "@/lib/marketplace";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export const metadata: Metadata = {
  title: "Sell on NaijaCraft",
  description:
    "Open a shop on the NaijaCraft Marketplace. Sell what you make, stock you resell, or fixed-price services to buyers across Nigeria.",
};
export const dynamic = "force-dynamic";

type Viewer =
  | { kind: "guest" }
  | { kind: "can_sell"; name: string }
  | { kind: "none" | "pending" | "rejected" | "suspended"; name: string; reason?: string; shopName?: string };

async function getViewer(): Promise<Viewer> {
  const session = await auth();
  if (!session?.user?.id) return { kind: "guest" };
  await connectToDatabase();
  const user = await User.findById(session.user.id)
    .select("name role seller.status seller.rejectionReason seller.shopName")
    .lean<{ name?: string; role?: string; seller?: { status?: string; rejectionReason?: string; shopName?: string } }>();
  const name = user?.name?.split(" ")[0] ?? "there";
  const status = user?.seller?.status ?? "none";
  if (user?.role === "admin" || status === "approved" || (user?.role === "artisan" && status !== "suspended")) {
    return { kind: "can_sell", name };
  }
  if (status === "pending" || status === "rejected" || status === "suspended") {
    return { kind: status, name, reason: user?.seller?.rejectionReason, shopName: user?.seller?.shopName };
  }
  return { kind: "none", name };
}

const STEPS = [
  { icon: BadgeCheck, title: "Apply once", body: "Tell us about your shop, add your ID and the bank account you want to be paid into." },
  { icon: ShieldCheck, title: "We verify you", body: "Our team checks every seller. We email you as soon as you're approved." },
  { icon: Camera, title: "List your items", body: "Add clear photos, a price and delivery options. We check each listing before it goes live." },
  { icon: Banknote, title: "Get paid", body: "Buyers pay through NaijaCraft. Once the buyer confirms delivery, we pay you to your bank." },
];

const WHAT = [
  { icon: Hammer, title: "Things you make", body: "Clothes, adire, shoes, furniture, beadwork, art, food. They get the Handmade badge." },
  { icon: Package, title: "Stock you resell", body: "New or used items you bought to sell on, like gadgets, fashion or home goods." },
  { icon: Wrench, title: "Fixed-price services", body: "A job with a clear price and scope, like AC servicing or a tap repair." },
];

const RULES = [
  "Only sell genuine items. Fakes and replicas get your shop suspended.",
  "Use your own photos that show the real item, including any flaws.",
  "Keep payments on NaijaCraft. Never ask buyers to pay you directly.",
  "Deliver on time and reply to buyers' questions.",
  "No weapons, drugs, alcohol, stolen goods, or anything illegal in Nigeria.",
];

export default async function SellPage() {
  const viewer = await getViewer();

  return (
    <div className="min-h-screen bg-cloud-50 font-body text-ink-900">
      <MarketplaceHeader categories={CATEGORIES} />

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Hero + next step */}
        <section className="grid gap-6 lg:grid-cols-5">
          <div className="relative overflow-hidden rounded-[20px] bg-navy-800 p-7 text-white sm:p-10 lg:col-span-3">
            <div aria-hidden="true" className="absolute -right-14 -top-14 h-64 w-64 rounded-full border-[40px] border-brand-green-600 opacity-50" />
            <div className="relative flex max-w-xl flex-col gap-4">
              <span className="self-start rounded-full bg-brand-amber-500 px-3 py-1 text-xs font-bold tracking-wider text-navy-900">
                SELL ON NAIJACRAFT
              </span>
              <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-[40px]">
                Make it, or source it. Sell it here.
              </h1>
              <p className="text-base leading-relaxed text-navy-100 sm:text-lg">
                Artisans, students and small businesses sell to buyers across Nigeria. Buyers pay through
                NaijaCraft, so they trust your shop from day one.
              </p>
            </div>
          </div>

          <NextStep viewer={viewer} />
        </section>

        {/* How it works */}
        <section className="flex flex-col gap-5">
          <h2 className="font-display text-2xl font-extrabold">How it works</h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="flex flex-col gap-2 rounded-card border border-cloud-200 bg-white p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green-100">
                  <Icon className="h-5 w-5 text-brand-green-700" aria-hidden="true" />
                </span>
                <strong className="text-[15px]">
                  {i + 1}. {title}
                </strong>
                <span className="text-sm leading-relaxed text-ink-700">{body}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* What you can sell */}
        <section className="flex flex-col gap-5">
          <h2 className="font-display text-2xl font-extrabold">What you can sell</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {WHAT.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex flex-col gap-2 rounded-card border border-cloud-200 bg-white p-5">
                <Icon className="h-6 w-6 text-brand-amber-600" aria-hidden="true" />
                <strong className="text-[15px]">{title}</strong>
                <span className="text-sm leading-relaxed text-ink-700">{body}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Rules */}
        <section id="rules" className="grid scroll-mt-40 gap-6 rounded-[20px] border border-cloud-200 bg-white p-6 sm:p-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="font-display text-2xl font-extrabold">Seller rules</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">
              These keep the marketplace safe for buyers, which brings more buyers to your shop. Breaking them can
              get listings removed or a shop suspended.
            </p>
          </div>
          <ul className="flex flex-col gap-3 lg:col-span-3">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-2.5 text-sm leading-relaxed">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-600" aria-hidden="true" />
                {rule}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function NextStep({ viewer }: { viewer: Viewer }) {
  const card = "flex flex-col justify-center gap-4 rounded-[20px] border border-cloud-200 bg-white p-7 lg:col-span-2";
  const primary =
    "flex h-12 items-center justify-center rounded-xl bg-brand-green-600 px-5 font-bold text-white transition-colors hover:bg-brand-green-700";
  const secondary =
    "flex h-12 items-center justify-center rounded-xl border border-cloud-200 px-5 font-semibold text-navy-900 transition-colors hover:bg-cloud-50";

  switch (viewer.kind) {
    case "guest":
      return (
        <div className={card}>
          <h2 className="font-display text-xl font-bold">Ready to start?</h2>
          <p className="text-sm text-ink-700">
            Use your NaijaCraft account to apply. New here? It takes a minute to create one.
          </p>
          <Link href="/signup?callbackUrl=/sell/apply" className={primary}>
            Create an account
          </Link>
          <Link href="/login?callbackUrl=/sell/apply" className={secondary}>
            I already have an account
          </Link>
        </div>
      );
    case "can_sell":
      return (
        <div className={card}>
          <h2 className="font-display text-xl font-bold">You can sell, {viewer.name}</h2>
          <p className="text-sm text-ink-700">Your account is set up to list on the marketplace.</p>
          <Link href="/dashboard/products/new" className={primary}>
            List something
          </Link>
          <Link href="/dashboard/listings" className={secondary}>
            My shop
          </Link>
          <Link href="/dashboard/sales" className="text-center text-sm font-semibold text-brand-green-600 hover:underline">
            Orders to send
          </Link>
        </div>
      );
    case "pending":
      return (
        <div className={card}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-amber-100">
            <Clock className="h-5 w-5 text-brand-amber-600" aria-hidden="true" />
          </span>
          <h2 className="font-display text-xl font-bold">We&apos;re reviewing your application</h2>
          <p className="text-sm text-ink-700">
            Thanks, {viewer.name}. We&apos;re checking {viewer.shopName ? <strong>{viewer.shopName}</strong> : "your shop"}{" "}
            and will email you when it&apos;s done. You can start listing as soon as you&apos;re approved.
          </p>
          <Link href="/marketplace" className={secondary}>
            Browse the marketplace
          </Link>
        </div>
      );
    case "rejected":
      return (
        <div className={card}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-700" aria-hidden="true" />
          </span>
          <h2 className="font-display text-xl font-bold">Your application needs changes</h2>
          {viewer.reason && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
              <strong>What to fix:</strong> {viewer.reason}
            </p>
          )}
          <Link href="/sell/apply" className={primary}>
            Update and resend
          </Link>
        </div>
      );
    case "suspended":
      return (
        <div className={card}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50">
            <Ban className="h-5 w-5 text-red-700" aria-hidden="true" />
          </span>
          <h2 className="font-display text-xl font-bold">Your shop is suspended</h2>
          {viewer.reason && <p className="text-sm text-ink-700">Reason: {viewer.reason}</p>}
          <p className="text-sm text-ink-700">If you think this is a mistake, contact support.</p>
          <Link href="/dashboard/customer/support" className={secondary}>
            Contact support
          </Link>
        </div>
      );
    default:
      return (
        <div className={card}>
          <h2 className="font-display text-xl font-bold">Open your shop, {viewer.name}</h2>
          <p className="text-sm text-ink-700">
            The application takes about 5 minutes. Have your ID and bank details ready.
          </p>
          <Link href="/sell/apply" className={primary}>
            Start your application
          </Link>
        </div>
      );
  }
}
