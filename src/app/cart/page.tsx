"use client";

import { useCart } from "@/context/CartContext";
import {
  Trash2,
  ShoppingBag,
  Info,
  CheckCircle2,
  Package,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";

interface SessionUser {
  id?: string;
  _id?: string;
  name?: string | null;
  email?: string | null;
  role?: string;
}

export default function CartPage() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const { cart, removeFromCart, clearCart, cartTotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // Delivery & Buyer Info
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
  });

  const deliveryFee = 1000;
  const finalTotal = cartTotal > 0 ? cartTotal + deliveryFee : 0;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.phone || !form.address) {
      toast.error("Please complete all delivery information fields.");
      return;
    }

    setLoading(true);

    try {
      // @ts-expect-error - Paystack lacks official types
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const paystack = new PaystackPop();

      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email: form.email,
        amount: finalTotal * 100, // Kobo
        currency: "NGN",
        onSuccess: async (transaction: { reference: string }) => {
          try {
            const currentBuyerId = user?._id || user?.id || null;

            const res = await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                reference: transaction.reference,
                buyerId: currentBuyerId,
                buyerName: form.name,
                buyerEmail: form.email,
                buyerPhone: form.phone,
                deliveryAddress: form.address,
                items: cart.map((item) => ({
                  productId: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  sellerId: item.sellerId,
                })),
                subtotal: cartTotal,
                deliveryFee,
                totalAmount: finalTotal,
              }),
            });

            const data = await res.json();

            if (res.ok && data.orderId) {
              clearCart();
              setPlacedOrderId(data.orderId);
              toast.success("Payment verified! Order placed in escrow.");
            } else {
              toast.error(
                data.error ||
                  "Order creation failed after payment. Contact support.",
              );
            }
          } catch {
            toast.error(
              "Error recording your order. Please contact support with ref: " +
                transaction.reference,
            );
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => {
          setLoading(false);
        },
      });
    } catch {
      toast.error("Error initializing checkout. Please try again.");
      setLoading(false);
    }
  };

  if (placedOrderId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Toaster position="top-center" reverseOrder={false} />
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-brand-green-600 mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment Successful!
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Your funds are held securely in escrow until delivery is completed
            and verified.
          </p>

          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
              Your Order Tracking ID
            </p>
            <p className="mt-1 font-mono text-base font-bold text-gray-900">
              #{placedOrderId.slice(-8).toUpperCase()}
            </p>
            <p className="mt-1 text-[11px] text-gray-400 font-mono select-all">
              Full ID: {placedOrderId}
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/customer/orders"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700"
            >
              <Package className="h-4 w-4" />
              Track Order Status
            </Link>
            <Link
              href="/marketplace"
              className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Marketplace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
        <ShoppingBag className="mb-4 h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
        <Link
          href="/marketplace"
          className="mt-4 font-semibold text-brand-green-600 hover:underline"
        >
          Browse Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <Toaster position="top-center" reverseOrder={false} />

      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        Checkout & Escrow Payment
      </h1>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Cart Items */}
        <div className="space-y-4 md:col-span-2">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                <p className="mt-1 font-medium text-gray-900">
                  ₦{item.price.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="rounded-full p-2 text-red-500 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Delivery Details & Checkout */}
        <form
          onSubmit={handleCheckout}
          className="h-fit rounded-lg border border-gray-200 bg-gray-50 p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Delivery Details
          </h2>

          <div className="space-y-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Full Name
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-green-500 focus:outline-none focus:ring-1 focus:ring-brand-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Email Address
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-green-500 focus:outline-none focus:ring-1 focus:ring-brand-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Phone Number (For Delivery Rider)
              </label>
              <input
                required
                type="tel"
                placeholder="08012345678"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-green-500 focus:outline-none focus:ring-1 focus:ring-brand-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Delivery Address
              </label>
              <textarea
                required
                rows={2}
                placeholder="Street address, hostel, room number, city..."
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-brand-green-500 focus:outline-none focus:ring-1 focus:ring-brand-green-500"
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-gray-200 pt-4 text-sm text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-medium text-gray-900">
                ₦{cartTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Base Delivery Fee</span>
              <span className="font-medium text-gray-900">
                ₦{deliveryFee.toLocaleString()}
              </span>
            </div>

            <div className="flex items-start gap-1.5 rounded-md bg-amber-50 p-2 text-[11px] text-amber-800 border border-amber-200">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>
                Base fee is ₦1,000. Delivery riders may request a surcharge upon
                dispatch if the drop-off location is outside standard radius.
              </span>
            </div>

            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
              <span>Total to Pay</span>
              <span>₦{finalTotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
          >
            {loading
              ? "Processing..."
              : `Pay ₦${finalTotal.toLocaleString()} via Paystack`}
          </button>
        </form>
      </div>
    </div>
  );
}
