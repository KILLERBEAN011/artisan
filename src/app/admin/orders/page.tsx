"use client";

import { useEffect, useState } from "react";
import {
  Package,
  MapPin,
  Phone,
  Mail,
  Loader2,
  CheckCircle,
  Banknote,
} from "lucide-react";

interface OrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderData {
  _id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number;
  orderStatus: string;
  payoutStatus: string;
  paystackReference: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleDispatch = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          newStatus: "dispatched",
          payoutStatus: "released",
        }),
      });

      if (res.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  orderStatus: "dispatched",
                  payoutStatus: "released",
                }
              : order,
          ),
        );
      } else {
        alert("Failed to update delivery status.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAsPaid = async (orderId: string) => {
    setUpdatingId(`payout-${orderId}`);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, payoutStatus: "paid_out" }),
      });

      if (res.ok) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === orderId
              ? { ...order, payoutStatus: "paid_out" }
              : order,
          ),
        );
      } else {
        alert("Failed to update payout status.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred.");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`API returned ${res.status}: ${text}`);
        }
        const data = await res.json();
        setOrders(data.orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-green-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="mb-8 border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Order & Payout Management
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Confirm deliveries and finalize artisan bank transfers.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-20 text-center">
          <Package className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <div
              key={order._id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-5 py-4">
                <div className="flex gap-2">
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 tracking-wider uppercase border border-blue-100">
                    {order.orderStatus}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase border ${
                      order.payoutStatus === "paid_out"
                        ? "bg-purple-50 text-purple-700 border-purple-100"
                        : order.payoutStatus === "released"
                          ? "bg-green-50 text-green-700 border-green-100"
                          : "bg-yellow-50 text-yellow-700 border-yellow-100"
                    }`}
                  >
                    {order.payoutStatus.replace(/_/g, " ")}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Card Body */}
              <div className="flex-1 px-5 py-4">
                <div className="mb-4 space-y-1">
                  <div className="font-semibold text-gray-900 text-sm">
                    {order.buyerName}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />{" "}
                    {order.buyerPhone}
                  </div>
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                    <p>{order.deliveryAddress}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <ul className="space-y-2 text-sm">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span className="text-gray-700">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium text-gray-900">
                          ₦{item.price.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-100 bg-gray-50/30 px-5 py-4 space-y-3">
                <div className="flex items-center justify-between font-bold text-gray-900">
                  <span>Total Escrow</span>
                  <span>₦{order.totalAmount.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Delivery Button */}
                  <button
                    onClick={() => handleDispatch(order._id)}
                    disabled={
                      updatingId === order._id ||
                      order.orderStatus === "dispatched"
                    }
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      order.orderStatus === "dispatched"
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {order.orderStatus === "dispatched"
                      ? "Delivered"
                      : "Confirm Delivery"}
                  </button>

                  {/* Financial Button */}
                  <button
                    onClick={() => handleMarkAsPaid(order._id)}
                    disabled={
                      updatingId === `payout-${order._id}` ||
                      order.payoutStatus !== "released"
                    }
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                      order.payoutStatus === "paid_out"
                        ? "border-purple-200 bg-purple-50 text-purple-700"
                        : order.payoutStatus === "released"
                          ? "border-brand-green-600 bg-brand-green-600 text-white hover:bg-brand-green-700"
                          : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Banknote className="h-3.5 w-3.5" />
                    {order.payoutStatus === "paid_out"
                      ? "Paid Out"
                      : "Mark as Paid"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
