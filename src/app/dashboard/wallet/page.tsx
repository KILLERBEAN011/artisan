"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Wallet, ShieldCheck, Clock, Loader2 } from "lucide-react";

interface Transaction {
  id: string;
  productName: string;
  amount: number;
  quantity: number;
  status: string;
  date: string;
}

interface WalletData {
  available: number;
  pending: number;
  transactions: Transaction[];
}

interface SessionUser {
  id?: string;
  _id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

export default function SellerWalletPage() {
  const { data: session, status } = useSession();
  const user = session?.user as SessionUser;
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      if (!user) {
        setDataLoading(false);
        return;
      }

      try {
        const userId = user._id || user.id;
        const res = await fetch(`/api/wallet?sellerId=${userId}`);

        if (!res.ok) throw new Error("Failed to load wallet");

        const data = await res.json();
        setWallet(data);
      } catch (error) {
        console.error(error);
      } finally {
        setDataLoading(false);
      }
    };

    if (status !== "loading") {
      fetchWallet();
    }
  }, [user, status]);

  if (status === "loading" || dataLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6 my-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Earnings & Wallet</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your sales, escrow funds, and payouts.
        </p>
      </div>

      {/* Automatic Payout Banner */}
      <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-blue-900">
              Automatic Payouts Enabled
            </h3>
            <p className="mt-1 text-sm text-blue-700 leading-relaxed max-w-2xl">
              You don't need to manually request withdrawals. NaijaCraft
              automatically transfers your <strong>Available Balance</strong>{" "}
              directly to your saved bank account immediately after the buyer's
              delivery is confirmed.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-4">
            <Wallet className="h-5 w-5 text-gray-400" />
            <h2 className="text-sm font-medium">Available Balance</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₦{wallet?.available?.toLocaleString() || "0"}
          </p>
          <p className="mt-2 text-xs text-green-600 font-medium">
            Ready for withdrawal
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-gray-500 mb-4">
            <ShieldCheck className="h-5 w-5 text-gray-400" />
            <h2 className="text-sm font-medium">Pending Escrow</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ₦{wallet?.pending?.toLocaleString() || "0"}
          </p>
          <p className="mt-2 text-xs text-yellow-600 font-medium">
            Awaiting delivery dispatch
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Sales History</h3>
        </div>

        {!wallet?.transactions || wallet.transactions.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center">
            <Clock className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-900">No sales yet</p>
            <p className="text-sm text-gray-500 mt-1">
              When buyers purchase your items, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Item</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Qty</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wallet.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {tx.productName}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">{tx.quantity}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₦{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          tx.status === "Available"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
