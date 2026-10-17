/* Marketplace money rules. Safe to import anywhere (no database code). */

/**
 * NaijaCraft's commission on item prices (not delivery).
 * MARKETPLACE_COMMISSION_RATE accepts "5%", "5" or "0.05" (all mean 5%).
 */
export const COMMISSION_RATE = (() => {
  const raw = (process.env.MARKETPLACE_COMMISSION_RATE ?? "").trim();
  if (!raw) return 0.05;
  let n = Number(raw.replace("%", "").trim());
  if (raw.includes("%") || n >= 1) n = n / 100;
  return Number.isFinite(n) && n >= 0 && n < 1 ? n : 0.05;
})();

/** Days after "sent" before an order counts as delivered if the buyer says nothing. */
export const AUTO_CONFIRM_DAYS = (() => {
  const n = Number(process.env.MARKETPLACE_AUTO_CONFIRM_DAYS ?? 3);
  return Number.isFinite(n) && n > 0 ? n : 3;
})();

/** Most of one item a buyer can put in one order. */
export const MAX_QTY_PER_ITEM = 20;

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  paid: "Paid, preparing",
  dispatched: "On its way",
  delivered: "Delivered",
  disputed: "Problem reported",
  cancelled: "Cancelled",
};

export const PAYOUT_STATUS_LABELS: Record<string, string> = {
  pending: "Not paid yet",
  held: "Held until delivery",
  released: "Ready to pay out",
  paid_out: "Paid to seller",
  refunded: "Refunded to buyer",
  internal: "NaijaCraft Store",
};

export const DISPUTE_REASONS = [
  "I haven't received it",
  "It's not as described",
  "It arrived damaged",
  "Wrong item or size",
  "Something else",
];
