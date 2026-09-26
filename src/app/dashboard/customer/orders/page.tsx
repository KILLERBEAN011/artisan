"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Loader2,
  Clock,
  Truck,
  CheckCircle2,
  Search,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface OrderItem {
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  sellerName?: string;
}

interface Order {
  _id: string;
  createdAt: string;
  totalAmount: number;
  orderStatus?: string;
  status?: string;
  payoutStatus: string;
  items: OrderItem[];
}

export default function CustomerOrdersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Search by tracking ID state
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        const res = await fetch("/api/customer/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionStatus === "authenticated") {
      fetchMyOrders();
    } else if (sessionStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [sessionStatus]);

  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().replace("#", "");
    if (!query) return;

    setSearching(true);
    setSearchedOrder(null);

    try {
      const res = await fetch(
        `/api/customer/orders?search=${encodeURIComponent(query)}`,
      );
      const data = await res.json();

      if (res.ok && data.order) {
        setSearchedOrder(data.order);
      } else {
        toast.error(
          data.error || "Order not found. Please verify your tracking ID.",
        );
      }
    } catch {
      toast.error("Failed to look up order.");
    } finally {
      setSearching(false);
    }
  };

  const getStatusBadge = (orderStatus?: string, payoutStatus?: string) => {
    if (orderStatus === "delivered" || payoutStatus === "released") {
      return {
        text: "Delivered",
        color: "bg-green-100 text-green-700 border-green-200",
        icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1" />,
      };
    }
    if (orderStatus === "dispatched") {
      return {
        text: "Dispatched (On the way)",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: <Truck className="h-3.5 w-3.5 mr-1" />,
      };
    }
    return {
      text: "Processing (In Escrow)",
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: <Clock className="h-3.5 w-3.5 mr-1" />,
    };
  };

  const renderOrderCard = (order: Order) => {
    const badge = getStatusBadge(
      order.orderStatus || order.status,
      order.payoutStatus,
    );

    return (
      <div
        key={order._id}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mb-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4 gap-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:flex sm:gap-8">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Placed
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Paid
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                ₦{order.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tracking ID
              </p>
              <p className="text-sm text-brand-green-700 font-mono font-bold mt-0.5">
                #{order._id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge.color}`}
            >
              {badge.icon}
              {badge.text}
            </span>
          </div>
        </div>

        <div className="p-4">
          <ul className="divide-y divide-gray-100">
            {order.items.map((item, idx) => (
              <li
                key={idx}
                className="flex items-center py-3 first:pt-0 last:pb-0"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                  <Package className="h-5 w-5" />
                </div>
                <div className="ml-4 flex flex-1 flex-col justify-center">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-medium text-gray-900">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  if (loading || sessionStatus === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 space-y-6">
      <Toaster position="top-center" reverseOrder={false} />

      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-brand-green-600 mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Track Orders</h1>
        <p className="mt-1 text-sm text-gray-500">
          Search with your Tracking ID or view your previous purchases below.
        </p>
      </div>

      {/* Direct Tracking ID Lookup Input */}
      <form onSubmit={handleSearchOrder} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Paste your Tracking ID (e.g. 66f5a1... or last 8 digits)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-brand-green-600 focus:outline-none focus:ring-1 focus:ring-brand-green-600"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="flex items-center gap-2 rounded-lg bg-brand-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-70"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
        </button>
      </form>

      {/* Searched Order Result */}
      {searchedOrder && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Search Result
          </h2>
          {renderOrderCard(searchedOrder)}
        </div>
      )}

      {/* Orders List */}
      <div className="pt-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Your Recent Orders
        </h2>

        {orders.length === 0 && !searchedOrder ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center px-4">
            <Package className="h-10 w-10 text-gray-400 mb-3" />
            <h3 className="text-base font-medium text-gray-900">
              No account orders found
            </h3>
            <p className="mt-1 text-xs text-gray-500 max-w-sm">
              If you placed an order without logging in, paste your Tracking ID
              above to view live dispatch status.
            </p>
          </div>
        ) : (
          <div>{orders.map((order) => renderOrderCard(order))}</div>
        )}
      </div>
    </div>
  );
}
