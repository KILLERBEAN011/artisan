import Link from "next/link";
import { Banknote, ExternalLink, IdCard, MapPin, MessageCircle } from "lucide-react";
import { connectToDatabase } from "@/lib/mongodb";
import { SELLER_ID_TYPE_LABELS } from "@/lib/seller-options";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { SellerReviewActions } from "@/components/admin/SellerReviewActions";

// Access is limited to admins by src/app/admin/layout.tsx
export const dynamic = "force-dynamic";

const TABS = [
  { status: "pending", label: "Pending" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
  { status: "suspended", label: "Suspended" },
] as const;
type Status = (typeof TABS)[number]["status"];

type SellerRow = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  seller: {
    status: Status;
    shopName?: string;
    bio?: string;
    categories?: string[];
    state?: string;
    city?: string;
    whatsapp?: string;
    idType?: string;
    idLast4?: string;
    hasId: boolean;
    payout?: { bankName?: string; accountNumber?: string; accountName?: string };
    appliedAt?: string;
    reviewedAt?: string;
    rejectionReason?: string;
  };
  liveListings: number;
};

export default async function AdminSellersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const requested = (await searchParams).status;
  const status: Status = TABS.some((t) => t.status === requested) ? (requested as Status) : "pending";

  await connectToDatabase();

  const [docs, countRows] = await Promise.all([
    User.find({ "seller.status": status })
      .select("+seller.payout +seller.idDocumentPublicId")
      .sort(status === "pending" ? { "seller.appliedAt": 1 } : { "seller.reviewedAt": -1 })
      .limit(100)
      .lean(),
    User.aggregate<{ _id: string; n: number }>([
      { $match: { "seller.status": { $in: TABS.map((t) => t.status) } } },
      { $group: { _id: "$seller.status", n: { $sum: 1 } } },
    ]),
  ]);

  const ids = docs.map((d) => d._id);
  const liveCounts = await Product.aggregate<{ _id: unknown; n: number }>([
    { $match: { sellerId: { $in: ids }, status: "live" } },
    { $group: { _id: "$sellerId", n: { $sum: 1 } } },
  ]);
  const liveBySeller = new Map(liveCounts.map((r) => [String(r._id), r.n]));
  const counts = Object.fromEntries(countRows.map((r) => [r._id, r.n])) as Record<string, number>;

  // Only pass what the page shows (never password hashes or tokens)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: SellerRow[] = docs.map((d: any) => ({
    _id: String(d._id),
    name: d.name ?? "",
    email: d.email ?? "",
    createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : "",
    seller: {
      status: d.seller.status,
      shopName: d.seller.shopName,
      bio: d.seller.bio,
      categories: d.seller.categories,
      state: d.seller.state,
      city: d.seller.city,
      whatsapp: d.seller.whatsapp,
      idType: d.seller.idType,
      idLast4: d.seller.idLast4,
      hasId: Boolean(d.seller.idDocumentPublicId),
      payout: d.seller.payout,
      appliedAt: d.seller.appliedAt ? new Date(d.seller.appliedAt).toISOString() : undefined,
      reviewedAt: d.seller.reviewedAt ? new Date(d.seller.reviewedAt).toISOString() : undefined,
      rejectionReason: d.seller.rejectionReason,
    },
    liveListings: liveBySeller.get(String(d._id)) ?? 0,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-navy-900">Sellers</h1>
      <p className="mt-1 text-sm text-ink-500">
        People who applied to sell. Check the ID photo matches the name, the bank account name matches too, and the
        shop sounds genuine. Artisans can already sell and don&apos;t appear here.
      </p>

      <nav aria-label="Seller status" className="mt-5 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const active = tab.status === status;
          const n = counts[tab.status] ?? 0;
          return (
            <Link
              key={tab.status}
              href={`/admin/sellers?status=${tab.status}`}
              aria-current={active ? "page" : undefined}
              className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
                active ? "bg-navy-900 text-white" : "bg-white text-ink-700 ring-1 ring-cloud-200 hover:bg-cloud-100"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-white/20"
                    : tab.status === "pending" && n > 0
                      ? "bg-brand-amber-100 text-brand-amber-600"
                      : "bg-cloud-100"
                }`}
              >
                {n}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-cloud-200 bg-white p-6 text-center text-sm text-ink-500">
            {status === "pending" ? "No applications waiting. You're all caught up." : "No sellers here."}
          </p>
        ) : (
          rows.map((row) => <SellerCard key={row._id} row={row} />)
        )}
      </div>
    </main>
  );
}

function SellerCard({ row }: { row: SellerRow }) {
  const s = row.seller;
  const date = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";
  const bankMatches =
    s.payout?.accountName &&
    row.name
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .some((w) => s.payout!.accountName!.toLowerCase().includes(w));

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-cloud-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-navy-900">{s.shopName || "Unnamed shop"}</h2>
          <p className="text-sm text-ink-500">
            {row.name} · {row.email}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            Applied {date(s.appliedAt)} · Account since {date(row.createdAt)}
            {s.reviewedAt && ` · Reviewed ${date(s.reviewedAt)}`}
          </p>
        </div>
        {s.status === "approved" && (
          <Link
            href={`/marketplace?seller=${row._id}`}
            target="_blank"
            className="flex items-center gap-1 text-sm font-semibold text-brand-green-600 hover:underline"
          >
            {row.liveListings} live listing{row.liveListings === 1 ? "" : "s"}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>

      {s.bio && <p className="text-sm leading-relaxed text-ink-700">{s.bio}</p>}

      {s.categories && s.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {s.categories.map((c) => (
            <span key={c} className="rounded-full bg-cloud-100 px-2.5 py-0.5 text-xs font-semibold text-ink-700">
              {c}
            </span>
          ))}
        </div>
      )}

      <dl className="grid gap-3 rounded-xl bg-cloud-50 p-3 text-sm sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
          <div>
            <dt className="sr-only">Location</dt>
            <dd>{[s.city, s.state].filter(Boolean).join(", ") || "—"}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
          <div>
            <dt className="sr-only">WhatsApp</dt>
            <dd>
              {s.whatsapp ? (
                <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-green-600 hover:underline">
                  +{s.whatsapp}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <IdCard className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
          <div>
            <dt className="sr-only">ID</dt>
            <dd>
              {SELLER_ID_TYPE_LABELS[s.idType ?? ""] ?? "—"} ending <strong>{s.idLast4 ?? "—"}</strong>
              {s.hasId && (
                <>
                  {" · "}
                  <a
                    href={`/api/admin/sellers/${row._id}/id-document`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-green-600 hover:underline"
                  >
                    View ID photo
                  </a>
                </>
              )}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
          <div>
            <dt className="sr-only">Bank</dt>
            <dd>
              {s.payout?.bankName ?? "—"} · {s.payout?.accountNumber ?? "—"}
              <br />
              <span className={bankMatches ? "text-ink-700" : "font-semibold text-brand-amber-600"}>
                {s.payout?.accountName ?? "—"}
                {s.payout?.accountName && !bankMatches && " (doesn't match the account holder's name: check)"}
              </span>
            </dd>
          </div>
        </div>
      </dl>

      {(s.status === "rejected" || s.status === "suspended") && s.rejectionReason && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <span className="font-semibold">{s.status === "rejected" ? "Rejected" : "Suspended"}:</span> {s.rejectionReason}
        </p>
      )}

      <div className="flex justify-end border-t border-cloud-200 pt-3">
        <SellerReviewActions sellerId={row._id} status={s.status} />
      </div>
    </article>
  );
}
