"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

type Props = {
  initialBankName: string;
  initialAccountNumber: string;
  initialAccountName: string;
};

export function BankDetailsForm({
  initialBankName,
  initialAccountNumber,
  initialAccountName,
}: Props) {
  const router = useRouter();
  const [bankName, setBankName] = useState(initialBankName);
  const [accountNumber, setAccountNumber] = useState(initialAccountNumber);
  const [accountName, setAccountName] = useState(initialAccountName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/artisans/bank-details", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankName, accountNumber, accountName }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong saving your bank details.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-navy-900">Bank name</span>
        <input
          type="text"
          required
          placeholder="e.g. GTBank"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-navy-900">Account number</span>
          <input
            type="text"
            required
            inputMode="numeric"
            placeholder="0123456789"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-navy-900">Account name</span>
          <input
            type="text"
            required
            placeholder="As it appears on the account"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-brand-green-700">Saved.</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 flex w-fit items-center gap-1.5 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
      >
        <Save className="h-3.5 w-3.5" />
        {loading ? "Saving..." : "Save Bank Details"}
      </button>
    </form>
  );
}
