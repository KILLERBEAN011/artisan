"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wrench, X } from "lucide-react";
import { ImageUpload } from "@/components/shared/ImageUpload";

const CATEGORIES = [
  "Home Repair",
  "Tailoring & Fashion",
  "Graphic & Web Design",
];
const LANGUAGES = ["English", "Yoruba", "Igbo"];

function toggle(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export default function ArtisanOnboardingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [bio, setBio] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [fromPriceNaira, setFromPriceNaira] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Lagos");
  const [sellerType, setSellerType] = useState<"independent" | "company">(
    "independent",
  );
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // NEW: State for the portfolio gallery
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper to remove an image from the portfolio array
  const handleRemovePortfolioImage = (indexToRemove: number) => {
    setPortfolioImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (categories.length === 0) {
      setError("Pick at least one service category.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/artisans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        serviceTitle,
        bio,
        whatsappNumber,
        categories,
        languages,
        fromPriceNaira: Number(fromPriceNaira),
        city,
        state,
        sellerType,
        bankName,
        accountNumber,
        accountName,
        avatarUrl,
        portfolioImages, // <-- Included in payload
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong creating your profile.");
      return;
    }

    router.push("/dashboard/artisan");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-cloud-200 bg-white p-6">
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 font-display text-lg font-bold text-navy-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
            <Wrench className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          NaijaCraft
        </Link>

        <h1 className="font-display text-xl font-bold text-navy-900">
          Set up your artisan profile
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          This is what customers will see when they search for you.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Profile Photo */}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900">
              Profile photo (optional)
            </span>
            <ImageUpload
              onUploaded={setAvatarUrl}
              shape="circle"
              label={avatarUrl ? "Change photo" : "Upload photo"}
            />
          </div>

          {/* NEW: Portfolio Gallery Upload */}
          <div className="flex flex-col gap-1.5 rounded-xl border border-cloud-200 p-4">
            <span className="text-sm font-medium text-navy-900">
              Portfolio photos (optional)
            </span>
            <p className="-mt-1 mb-2 text-xs text-ink-500">
              Showcase up to 6 photos of your past work to build trust.
            </p>
            <div className="flex flex-wrap items-start gap-3">
              {portfolioImages.map((url, i) => (
                <div
                  key={i}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-cloud-200 bg-cloud-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Portfolio ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePortfolioImage(i)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-sm transition-colors hover:bg-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {portfolioImages.length < 6 && (
                <div className="h-20 w-20 shrink-0">
                  <ImageUpload
                    onUploaded={(url) =>
                      setPortfolioImages((prev) => [...prev, url])
                    }
                    shape="square"
                    label="Add work"
                  />
                </div>
              )}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900">
              Your title
            </span>
            <input
              type="text"
              required
              placeholder="e.g. Certified Electrician"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900">
              Service headline
            </span>
            <input
              type="text"
              required
              placeholder="e.g. Electrical Repairs & Installations"
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900">Bio</span>
            <textarea
              required
              rows={3}
              placeholder="Tell customers what you do and what makes you reliable."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900">
              WhatsApp Number
            </span>
            <p className="-mt-1 text-xs text-ink-500">
              We will send you instant alerts here when you get a new job
              request. Include your country code (e.g., 2348012345678).
            </p>
            <input
              type="text"
              required
              placeholder="2348012345678"
              value={whatsappNumber}
              onChange={(e) =>
                setWhatsappNumber(e.target.value.replace(/\D/g, ""))
              }
              className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
            />
          </label>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium text-navy-900">
              Service categories
            </legend>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 text-sm text-ink-700"
                >
                  <input
                    type="checkbox"
                    checked={categories.includes(cat)}
                    onChange={() => setCategories(toggle(categories, cat))}
                  />
                  {cat}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium text-navy-900">
              Languages
            </legend>
            <div className="flex flex-wrap gap-3">
              {LANGUAGES.map((lang) => (
                <label
                  key={lang}
                  className="flex items-center gap-2 text-sm text-ink-700"
                >
                  <input
                    type="checkbox"
                    checked={languages.includes(lang)}
                    onChange={() => setLanguages(toggle(languages, lang))}
                  />
                  {lang}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-navy-900">
              Starting price (NGN)
            </span>
            <input
              type="number"
              required
              min={0}
              placeholder="e.g. 5000"
              value={fromPriceNaira}
              onChange={(e) => setFromPriceNaira(e.target.value)}
              className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-navy-900">City</span>
              <input
                type="text"
                required
                placeholder="e.g. Ikeja"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-navy-900">State</span>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
              />
            </label>
          </div>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-sm font-medium text-navy-900">
              Seller type
            </legend>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="radio"
                  name="sellerType"
                  checked={sellerType === "independent"}
                  onChange={() => setSellerType("independent")}
                />
                Independent
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="radio"
                  name="sellerType"
                  checked={sellerType === "company"}
                  onChange={() => setSellerType("company")}
                />
                Company
              </label>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3 rounded-lg border border-cloud-200 p-3">
            <legend className="px-1 text-sm font-medium text-navy-900">
              Bank details (optional)
            </legend>
            <p className="-mt-1 text-xs text-ink-500">
              For payouts once a job is completed. You can skip this and add it
              later in your dashboard.
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-navy-900">
                Bank name
              </span>
              <input
                type="text"
                placeholder="e.g. GTBank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900">
                  Account number
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0123456789"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-navy-900">
                  Account name
                </span>
                <input
                  type="text"
                  placeholder="As it appears on the account"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
                />
              </label>
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-brand-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
          >
            {loading ? "Creating profile..." : "Create my profile"}
          </button>
        </form>
      </div>
    </main>
  );
}
