import crypto from "crypto";

/* Server-only Paystack helpers. Uses PAYSTACK_SECRET_KEY (already in your .env). */

const API = "https://api.paystack.co";

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is missing.");
  return key;
}

export type PaystackTransaction = {
  status: string; // "success" | "failed" | "abandoned" | ...
  reference: string;
  amount: number; // kobo
  currency: string;
  channel?: string;
  paid_at?: string;
};

/** Starts a payment. Returns the Paystack page the buyer is sent to. */
export async function initializePayment(input: {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amountNaira * 100),
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url: string; access_code: string; reference: string };
  };
  if (!res.ok || !data.status || !data.data) {
    throw new Error(data.message || "Couldn't start the payment.");
  }
  return data.data;
}

/** Asks Paystack what really happened to a payment. */
export async function verifyPayment(reference: string): Promise<PaystackTransaction | null> {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { status?: boolean; data?: PaystackTransaction };
  if (!res.ok || !data.status || !data.data) return null;
  return data.data;
}

/** True if a webhook really came from Paystack (signed with your secret key). */
export function isValidWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
