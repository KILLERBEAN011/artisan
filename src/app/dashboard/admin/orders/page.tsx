"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Truck,
  CheckCircle,
  Loader2,
  Package,
  MapPin,
  Phone,
  ShieldCheck,
  CreditCard,
  X,
  ArrowLeft,
  Banknote,
} from "lucide-react";
import Link from "next/link";

interface OrderItemType {
  name?: string;
  productName?: string;
  quantity: number;
  sellerId?: {
    _id: string;
    name?: string;
    phone?: string;
  };
}

interface OrderType {
  _id: string;
  buyerName?: string;
  buyerPhone?: string;
  deliveryAddress?: string;
  totalAmount?: number;
  orderStatus: string;
  payoutStatus: string;
  items: OrderItemType[];
}

interface BankDetailsType {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

export default function AdminOrdersPage() {
  const { data: session, status } = useSession();

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankDetailsType | null>(
    null,
  );
  const [loadingBankId, setLoadingBankId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        console.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role === "admin") {
        fetchOrders();
      } else {
        setLoading(false);
      }
    }
  }, [status, session, fetchOrders]);

  const handleReleaseEscrow = async (orderId: string) => {
    if (
      !confirm(
        "Are you sure? This will mark the order as delivered and permanently release the escrow funds to the artisan's wallet.",
      )
    )
      return;

    setProcessingId(orderId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          orderStatus: "delivered",
          payoutStatus: "released",
        }),
      });

      if (res.ok) {
        alert("Delivery confirmed! Escrow funds released to the artisan.");
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update order.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while releasing funds.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAsPaid = async (orderId: string) => {
    if (
      !confirm(
        "Have you successfully transferred the funds to the artisan's bank account? This action will clear their available balance to zero.",
      )
    )
      return;

    setProcessingId(`payout-${orderId}`);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          payoutStatus: "paid_out",
        }),
      });

      if (res.ok) {
        alert(
          "Success! The payout has been recorded and the artisan's balance is cleared.",
        );
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update payout status.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while marking as paid.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewBankDetails = async (sellerId: string) => {
    if (!sellerId) return alert("Seller ID is missing.");
    setLoadingBankId(sellerId);
    setSelectedBank(null);

    try {
      const res = await fetch(`/api/admin/artisan-bank?sellerId=${sellerId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedBank(data.bankDetails);
        setIsBankModalOpen(true);
      } else {
        alert("Failed to fetch bank details.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while fetching bank details.");
    } finally {
      setLoadingBankId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    );
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
        <ShieldCheck className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-500 mt-2 max-w-md">
          You do not have permission to view the logistics dashboard. You must
          be logged in as an Admin.
        </p>
        <Link
          href="/"
          className="mt-6 text-brand-green-600 font-medium hover:underline"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 space-y-6 relative">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-brand-green-600 mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Admin Dashboard
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Logistics & Escrow Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Coordinate seller pickups, buyer deliveries, and release funds.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">
            Global Platform Orders
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center p-6 text-center">
            <Truck className="h-12 w-12 text-gray-300 mb-3" />
            <p className="text-base font-medium text-gray-900">No orders yet</p>
            <p className="text-sm text-gray-500 mt-1">
              When buyers checkout, their orders will appear here for logistics
              processing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium">
                    Buyer & Delivery Info
                  </th>
                  <th className="px-6 py-4 font-medium">Order Items</th>
                  <th className="px-6 py-4 font-medium">
                    Seller Pickup Details
                  </th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const isLocked =
                    order.payoutStatus === "held_in_escrow" ||
                    order.orderStatus === "pending" ||
                    order.orderStatus === "dispatched";
                  const isReleased = order.payoutStatus === "released";
                  const isPaidOut = order.payoutStatus === "paid_out";

                  const seller = order.items[0]?.sellerId;

                  return (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">
                          {order.buyerName || "Guest User"}
                        </p>
                        <p className="text-xs text-gray-500 mb-1">
                          {order.buyerPhone}
                        </p>
                        <div className="flex items-start gap-1 text-xs text-gray-600 mt-2">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          <span className="max-w-[200px]">
                            {order.deliveryAddress}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <ul className="space-y-1 mb-2">
                          {order.items.map(
                            (item: OrderItemType, idx: number) => (
                              <li key={idx} className="text-xs">
                                <span className="font-medium text-gray-900">
                                  {item.productName || item.name}
                                </span>
                                <span className="text-gray-500">
                                  {" "}
                                  x {item.quantity}
                                </span>
                              </li>
                            ),
                          )}
                        </ul>
                        <div className="text-xs font-semibold text-brand-green-700 bg-brand-green-50 inline-block px-2 py-1 rounded">
                          Total: ₦{order.totalAmount?.toLocaleString()}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {seller?.name ? (
                          <>
                            <p className="font-medium text-gray-900">
                              {seller.name}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Phone className="h-3 w-3" />
                              <span>{seller.phone || "No phone provided"}</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            Seller details unavailable
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            isLocked
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : isPaidOut
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-brand-green-100 text-brand-green-800 border border-brand-green-200"
                          }`}
                        >
                          {isLocked
                            ? "In Escrow"
                            : isPaidOut
                              ? "Paid Out"
                              : "Released"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right space-y-2">
                        {isLocked ? (
                          <button
                            onClick={() => handleReleaseEscrow(order._id)}
                            disabled={processingId === order._id}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded bg-brand-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-70"
                          >
                            {processingId === order._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5" />
                            )}
                            Confirm Delivery
                          </button>
                        ) : isReleased ? (
                          <button
                            onClick={() => handleMarkAsPaid(order._id)}
                            disabled={processingId === `payout-${order._id}`}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-70"
                          >
                            {processingId === `payout-${order._id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Banknote className="h-3.5 w-3.5" />
                            )}
                            Mark as Paid
                          </button>
                        ) : (
                          <span className="block text-[11px] font-semibold text-purple-600 py-1.5 uppercase tracking-wide bg-purple-50 rounded border border-purple-100 text-center">
                            Funds Settled
                          </span>
                        )}

                        {seller?._id && (
                          <button
                            onClick={() => handleViewBankDetails(seller._id)}
                            disabled={loadingBankId === seller._id}
                            className="w-full inline-flex items-center justify-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-70"
                          >
                            {loadingBankId === seller._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CreditCard className="h-3.5 w-3.5 text-gray-500" />
                            )}
                            View Bank
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bank Details Modal */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setIsBankModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green-100">
                <CreditCard className="h-5 w-5 text-brand-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Artisan Bank Details
              </h2>
            </div>

            {selectedBank ? (
              <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank Name
                  </p>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {selectedBank.bankName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Number
                  </p>
                  <p className="font-semibold text-gray-900 mt-0.5 text-lg tracking-wide">
                    {selectedBank.accountNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Name
                  </p>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {selectedBank.accountName || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-500 text-sm">
                This artisan has not saved their payout bank details yet.
              </div>
            )}

            <button
              onClick={() => setIsBankModalOpen(false)}
              className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
