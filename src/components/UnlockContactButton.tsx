"use client";

import { useState } from "react";
import { Lock, Unlock as UnlockIcon, MessageCircle } from "lucide-react";

interface UnlockButtonProps {
  artisanId: string;
  artisanName: string;
  clientEmail: string;
}

export default function UnlockContactButton({
  artisanId,
  artisanName,
  clientEmail,
}: UnlockButtonProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // You can change this amount to whatever you like
  const amount = 500; // ₦500

  const handlePayment = async () => {
    if (!clientEmail) {
      alert("Please log in to unlock contacts.");
      return;
    }

    // Dynamically import Paystack ONLY on the client side when clicked
    // @ts-expect-error - Paystack lacks official TypeScript definitions
    const PaystackPop = (await import("@paystack/inline-js")).default;

    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: clientEmail,
      amount: amount * 100, // Paystack charges in Kobo
      currency: "NGN",
      onSuccess: async (transaction: { reference: string }) => {
        setLoading(true);
        try {
          const res = await fetch("/api/unlock-contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reference: transaction.reference,
              artisanId,
              clientEmail,
            }),
          });

          const data = await res.json();

          if (res.ok) {
            setIsUnlocked(true);
            setPhoneNumber(data.phoneNumber);
          } else {
            alert(data.error || "Payment verification failed.");
          }
        } catch (error) {
          alert("Network error. Please contact support if you were debited.");
        } finally {
          setLoading(false);
        }
      },
      onCancel: () => {
        console.log("Payment canceled");
      },
    });
  };

  if (isUnlocked && phoneNumber) {
    const whatsappUrl = `https://wa.me/234${phoneNumber.startsWith("0") ? phoneNumber.slice(1) : phoneNumber}?text=Hello%20${artisanName},%20I%20found%20your%20profile%20on%20NaijaCraft.`;

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
          <span className="font-mono text-lg font-bold text-green-800">
            {phoneNumber}
          </span>
          <UnlockIcon className="h-5 w-5 text-green-600" />
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
        >
          <MessageCircle className="h-4 w-4" />
          Message on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 blur-sm">
        <span className="font-mono text-lg font-bold text-gray-500">
          0803 *** ****
        </span>
        <Lock className="h-5 w-5 text-gray-400" />
      </div>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
      >
        <Lock className="h-4 w-4" />
        {loading ? "Verifying..." : `Unlock Contact (₦${amount})`}
      </button>
    </div>
  );
}
