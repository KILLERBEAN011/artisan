"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { AlertTriangle, ArrowLeft, FileCheck2, Loader2, Lock, Upload } from "lucide-react";
import { NIGERIAN_STATES, PRODUCT_CATEGORIES } from "@/lib/product-options";
import { NIGERIAN_BANKS, SELLER_ID_TYPE_LABELS, normaliseNigerianPhone } from "@/lib/seller-options";

export type ApplicationDefaults = {
  shopName: string;
  bio: string;
  categories: string[];
  state: string;
  city: string;
  whatsapp: string;
  idType: string;
  idLast4: string;
  hasIdOnFile: boolean;
  bankName: string;
  accountNumber: string;
  accountName: string;
  rejectionReason?: string;
};

const MAX_ID_MB = 8;

export function SellerApplicationForm({ defaults }: { defaults: ApplicationDefaults }) {
  const router = useRouter();
  const banksId = useId();
  const [v, setV] = useState(defaults);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const set = <K extends keyof ApplicationDefaults>(key: K, value: ApplicationDefaults[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));

  const toggleCategory = (c: string) =>
    set("categories", v.categories.includes(c) ? v.categories.filter((x) => x !== c) : [...v.categories, c]);

  function check() {
    const list: string[] = [];
    if (v.shopName.trim().length < 2) list.push("Enter a shop name.");
    if (v.bio.trim().length < 20) list.push("Tell buyers about your shop in at least 20 characters.");
    if (v.categories.length === 0) list.push("Choose at least one thing you sell.");
    if (!v.state) list.push("Choose your state.");
    if (!v.city.trim()) list.push("Enter your city or area.");
    if (!normaliseNigerianPhone(v.whatsapp)) list.push("Enter a Nigerian WhatsApp number, e.g. 0803 123 4567.");
    if (!v.idType) list.push("Choose your ID type.");
    if (!/^[A-Za-z0-9]{4}$/.test(v.idLast4.trim())) list.push("Enter the last 4 characters of your ID number.");
    if (!idFile && !v.hasIdOnFile) list.push("Upload a clear photo of your ID.");
    if (!v.bankName.trim()) list.push("Enter your bank.");
    if (!/^\d{10}$/.test(v.accountNumber.trim())) list.push("Enter your 10-digit account number.");
    if (v.accountName.trim().length < 3) list.push("Enter the name on the bank account.");
    if (!agree) list.push("Agree to the seller rules.");
    return list;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = check();
    setErrors(found);
    if (found.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSending(true);
    const body = new FormData();
    body.set("shopName", v.shopName.trim());
    body.set("bio", v.bio.trim());
    v.categories.forEach((c) => body.append("categories", c));
    body.set("state", v.state);
    body.set("city", v.city.trim());
    body.set("whatsapp", v.whatsapp.trim());
    body.set("idType", v.idType);
    body.set("idLast4", v.idLast4.trim());
    if (idFile) body.set("idDocument", idFile);
    body.set("bankName", v.bankName.trim());
    body.set("accountNumber", v.accountNumber.trim());
    body.set("accountName", v.accountName.trim());
    body.set("agree", String(agree));

    try {
      const res = await fetch("/api/seller/apply", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      router.push("/sell");
      router.refresh();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : "Something went wrong. Please try again."]);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSending(false);
    }
  }

  const field =
    "h-11 w-full rounded-lg border border-cloud-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-green-600 focus:outline-none focus:ring-2 focus:ring-brand-green-100";
  const label = "mb-1.5 block text-sm font-semibold text-navy-900";
  const card = "flex flex-col gap-4 rounded-2xl border border-cloud-200 bg-white p-5 sm:p-6";
  const sectionTitle = "font-display text-lg font-bold text-navy-900";

  return (
    <div>
      <Link href="/sell" className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-green-600">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back
      </Link>
      <h1 className="font-display text-2xl font-bold text-navy-900 sm:text-3xl">Apply to sell</h1>
      <p className="mt-1 text-sm text-ink-500">
        We verify every seller so buyers can trust the marketplace. This takes about 5 minutes.
      </p>

      {defaults.rejectionReason && (
        <div className="mt-4 flex gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            <strong>What to fix:</strong> {defaults.rejectionReason}
          </p>
        </div>
      )}

      {errors.length > 0 && (
        <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">Please fix the following:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 flex flex-col gap-5" noValidate>
        {/* Shop */}
        <section className={card}>
          <h2 className={sectionTitle}>Your shop</h2>
          <div>
            <label htmlFor="sa-shop" className={label}>
              Shop name
            </label>
            <input
              id="sa-shop"
              value={v.shopName}
              onChange={(e) => set("shopName", e.target.value)}
              maxLength={60}
              placeholder="e.g. Tolu's Adire House"
              className={field}
            />
            <p className="mt-1 text-xs text-ink-500">Buyers see this on every listing.</p>
          </div>
          <div>
            <label htmlFor="sa-bio" className={label}>
              About your shop
            </label>
            <textarea
              id="sa-bio"
              rows={3}
              value={v.bio}
              onChange={(e) => set("bio", e.target.value)}
              maxLength={500}
              placeholder="What you sell, how long you've been doing it, and what makes your items good."
              className="w-full rounded-lg border border-cloud-200 bg-white p-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-green-600 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
            />
          </div>
          <fieldset>
            <legend className={label}>What will you sell?</legend>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_CATEGORIES.map((c) => {
                const on = v.categories.includes(c);
                return (
                  <label
                    key={c}
                    className={`flex h-10 cursor-pointer items-center rounded-full px-4 text-sm font-medium transition-colors ${
                      on ? "bg-navy-900 text-white" : "bg-white text-ink-700 ring-1 ring-cloud-200 hover:bg-cloud-50"
                    }`}
                  >
                    <input type="checkbox" checked={on} onChange={() => toggleCategory(c)} className="sr-only" />
                    {c}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>

        {/* Contact and location */}
        <section className={card}>
          <h2 className={sectionTitle}>Where you are</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sa-state" className={label}>
                State
              </label>
              <select id="sa-state" value={v.state} onChange={(e) => set("state", e.target.value)} className={field}>
                <option value="">Choose a state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sa-city" className={label}>
                City or area
              </label>
              <input id="sa-city" value={v.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Bodija, Ibadan" className={field} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="sa-wa" className={label}>
                WhatsApp number
              </label>
              <input
                id="sa-wa"
                type="tel"
                inputMode="tel"
                value={v.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="0803 123 4567"
                className={field}
              />
              <p className="mt-1 text-xs text-ink-500">We use it to tell you about new orders. Buyers don&apos;t see it.</p>
            </div>
          </div>
        </section>

        {/* ID */}
        <section className={card}>
          <div className="flex items-start justify-between gap-3">
            <h2 className={sectionTitle}>Verify your identity</h2>
            <span className="flex items-center gap-1 rounded-full bg-cloud-100 px-2.5 py-1 text-xs font-semibold text-ink-700">
              <Lock className="h-3 w-3" aria-hidden="true" /> Private
            </span>
          </div>
          <p className="-mt-2 text-sm text-ink-500">
            Only our review team can see your ID. We never show it to buyers, and we only keep the last 4 characters
            of your ID number.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sa-idtype" className={label}>
                ID type
              </label>
              <select id="sa-idtype" value={v.idType} onChange={(e) => set("idType", e.target.value)} className={field}>
                <option value="">Choose one</option>
                {Object.entries(SELLER_ID_TYPE_LABELS).map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sa-last4" className={label}>
                Last 4 characters of the ID number
              </label>
              <input
                id="sa-last4"
                value={v.idLast4}
                onChange={(e) => set("idLast4", e.target.value.slice(0, 4))}
                maxLength={4}
                autoComplete="off"
                placeholder="e.g. 4821"
                className={field}
              />
            </div>
          </div>

          <div>
            <span className={label}>Photo of your ID</span>
            <label
              htmlFor="sa-idfile"
              className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-cloud-200 p-4 transition-colors hover:border-brand-green-500 hover:bg-brand-green-100/30"
            >
              {idFile || v.hasIdOnFile ? (
                <FileCheck2 className="h-6 w-6 shrink-0 text-brand-green-600" aria-hidden="true" />
              ) : (
                <Upload className="h-6 w-6 shrink-0 text-ink-500" aria-hidden="true" />
              )}
              <span className="flex flex-col text-sm">
                <span className="font-semibold text-navy-900">
                  {idFile ? idFile.name : v.hasIdOnFile ? "ID photo on file" : "Choose a photo"}
                </span>
                <span className="text-xs text-ink-500">
                  {idFile || v.hasIdOnFile
                    ? "Tap to replace it"
                    : `Clear, all four corners showing. JPG or PNG, up to ${MAX_ID_MB}MB.`}
                </span>
              </span>
            </label>
            <input
              id="sa-idfile"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file && file.size > MAX_ID_MB * 1024 * 1024) {
                  setErrors([`The ID photo must be under ${MAX_ID_MB}MB.`]);
                  return;
                }
                setIdFile(file);
              }}
            />
          </div>
        </section>

        {/* Bank */}
        <section className={card}>
          <h2 className={sectionTitle}>Where we pay you</h2>
          <p className="-mt-2 text-sm text-ink-500">
            Use an account in your own name or your registered business name.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sa-bank" className={label}>
                Bank
              </label>
              <input
                id="sa-bank"
                list={banksId}
                value={v.bankName}
                onChange={(e) => set("bankName", e.target.value)}
                placeholder="e.g. GTBank, Opay"
                className={field}
              />
              <datalist id={banksId}>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="sa-acct" className={label}>
                Account number
              </label>
              <input
                id="sa-acct"
                inputMode="numeric"
                value={v.accountNumber}
                onChange={(e) => set("accountNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10 digits"
                className={field}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="sa-acctname" className={label}>
                Account name
              </label>
              <input id="sa-acctname" value={v.accountName} onChange={(e) => set("accountName", e.target.value)} className={field} />
            </div>
          </div>
        </section>

        {/* Agree and send */}
        <section className={card}>
          <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-900">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-brand-green-600"
            />
            <span>
              I agree to the{" "}
              <Link href="/sell#rules" target="_blank" className="font-semibold text-brand-green-600 hover:underline">
                seller rules
              </Link>
              : I&apos;ll only sell genuine items, describe them honestly, keep payments on NaijaCraft and deliver on
              time. I understand my shop can be suspended if I don&apos;t.
            </span>
          </label>
          <button
            type="submit"
            disabled={sending}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-green-600 font-bold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
          >
            {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {sending ? "Sending…" : defaults.rejectionReason ? "Resend application" : "Send application"}
          </button>
        </section>
      </form>
    </div>
  );
}
