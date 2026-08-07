"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";

declare global {
  interface Window {
    PaystackPop?: {
      setup(config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }): { openIframe: () => void };
    };
  }
}

type Props = {
  bookingId: string;
  amountNaira: number;
  customerEmail: string;
};

export function PaymentButton({ bookingId, amountNaira, customerEmail }: Props) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "verifying" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.PaystackPop) {
      // Already loaded from a previous mount — defer so this isn't a
      // synchronous setState call directly inside the effect body.
      Promise.resolve().then(() => setScriptReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setScriptReady(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  function handlePay() {
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) {
      setError("Payments aren't configured yet — missing Paystack public key.");
      return;
    }
    if (!window.PaystackPop) {
      setError("Payment popup isn't ready yet — try again in a second.");
      return;
    }

    setError(null);

    const handler = window.PaystackPop.setup({
      key: publicKey,
      email: customerEmail,
      amount: Math.round(amountNaira * 100), // Paystack expects kobo, not naira
      currency: "NGN",
      // eslint-disable-next-line react-hooks/purity -- runs inside a click handler, not during render
      ref: `naijacraft-${bookingId}-${Date.now()}`,
      onClose: () => {
        // User closed the popup without paying — nothing to do.
      },
      callback: (response) => {
        verifyPayment(response.reference);
      },
    });

    handler.openIframe();
  }

  async function verifyPayment(reference: string) {
    setStatus("verifying");
    setError(null);

    const res = await fetch(`/api/bookings/${bookingId}/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Payment went through, but verification failed. Contact support.");
      setStatus("error");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={handlePay}
        disabled={!scriptReady || status === "verifying"}
        className="flex items-center gap-2 rounded-lg bg-brand-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
      >
        <CreditCard className="h-3.5 w-3.5" />
        {status === "verifying"
          ? "Confirming payment..."
          : `Pay NGN ${amountNaira.toLocaleString()}`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
