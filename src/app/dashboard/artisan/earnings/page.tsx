"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Wallet, ShieldCheck, History, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ArtisanEarningsPage() {
  const { status } = useSession();

  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingEscrow, setPendingEscrow] = useState(0);
  const [salesHistory, setSalesHistory] = useState<
    { id: string; productName: string; buyerName: string; amount: number; status: string; date: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // State variables for the bank form
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSavingBank, setIsSavingBank] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [walletRes, bankRes] = await Promise.all([
          fetch("/api/artisans/wallet"),
          fetch("/api/artisans/bank-details"),
        ]);

        if (walletRes.ok) {
          const data = await walletRes.json();
          setAvailableBalance(data.availableBalance || 0);
          setPendingEscrow(data.pendingEscrow || 0);
          setSalesHistory(data.recentSales || []);
        }

        if (bankRes.ok) {
          const bankData = await bankRes.json();
          // Reading from the nested bankDetails object your API returns
          setBankName(bankData.bankDetails?.bankName || "");
          setAccountNumber(bankData.bankDetails?.accountNumber || "");
          setAccountName(bankData.bankDetails?.accountName || "");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  const handleSaveBankDetails = async () => {
    setIsSavingBank(true);
    try {
      const res = await fetch("/api/artisans/bank-details", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName, accountNumber, accountName }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Bank details saved successfully!");
      } else {
        alert(data.error || "Failed to save bank details.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("An error occurred while saving.");
    } finally {
      setIsSavingBank(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
      <Link
        href="/dashboard/artisan"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-brand-green-600 mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Earnings & Wallet</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your sales, escrow funds, and payouts.
        </p>
      </div>

      {/* Automatic Payout Banner */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-blue-900">
              Automatic Payouts Enabled
            </h3>
            <p className="mt-1 text-sm text-blue-700 leading-relaxed max-w-2xl">
              You don&apos;t need to request a withdrawal. Once the buyer confirms
              delivery, the money moves to your <strong>Available Balance</strong>{" "}
              and NaijaCraft transfers it to your saved bank account. Amounts
              shown are after the 5% marketplace commission.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <Wallet className="h-5 w-5" />
            <h2 className="text-sm font-medium">Available Balance</h2>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ₦{availableBalance.toLocaleString()}
          </div>
          <p className="text-sm text-brand-green-600 mt-2 font-medium">
            Ready for withdrawal
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <ShieldCheck className="h-5 w-5" />
            <h2 className="text-sm font-medium">Pending Escrow</h2>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ₦{pendingEscrow.toLocaleString()}
          </div>
          <p className="text-sm text-brand-amber-600 mt-2 font-medium">
            Awaiting delivery dispatch
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Sales History */}
        <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Sales History</h2>
          </div>

          {salesHistory.length === 0 ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center p-6 text-center">
              <History className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-900">No sales yet</p>
              <p className="text-sm text-gray-500 mt-1">
                When buyers purchase your items, they will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 font-medium">Item</th>
                    <th className="px-6 py-3 font-medium">Buyer</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salesHistory.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-gray-50/50 transition-colors border-b border-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {sale.productName}
                      </td>
                      <td className="px-6 py-4">{sale.buyerName}</td>
                      <td className="px-6 py-4">
                        {new Date(sale.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                            sale.status === "held_in_escrow" ||
                            sale.status === "pending" ||
                            sale.status === "dispatched"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-brand-green-100 text-brand-green-800"
                          }`}
                        >
                          {sale.status === "held_in_escrow"
                            ? "In Escrow"
                            : sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ₦{sale.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bank Details Form */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden h-fit">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Payout bank details</h2>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-xs text-gray-500 mb-4">
              This is shared with NaijaCraft admins when they release a
              completed job&apos;s payment to you.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Bank name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Access Bank"
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-green-600 focus:ring-brand-green-600 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Account number
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="0123456789"
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-green-600 focus:ring-brand-green-600 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700">
                Account name
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="John Doe"
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-green-600 focus:ring-brand-green-600 outline-none transition-colors"
              />
            </div>
            <button
              onClick={handleSaveBankDetails}
              disabled={isSavingBank}
              className="mt-2 w-full flex justify-center items-center rounded-lg bg-brand-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-70"
            >
              {isSavingBank ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isSavingBank ? "Saving..." : "Save Bank Details"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
