/* Seller sign-up choices. No database code, so the browser form can use it. */

export const SELLER_ID_TYPE_LABELS: Record<string, string> = {
  nin: "NIN slip or card",
  voters_card: "Voter's card",
  drivers_license: "Driver's licence",
  passport: "International passport",
  bvn: "BVN printout",
};

export const SELLER_STATUS_LABELS: Record<string, string> = {
  none: "Not applied",
  pending: "Waiting for review",
  approved: "Approved",
  rejected: "Needs changes",
  suspended: "Suspended",
};

/** Suggestions only: sellers can type any bank. */
export const NIGERIAN_BANKS = [
  "Access Bank", "Carbon", "Ecobank", "FairMoney", "Fidelity Bank", "First Bank", "FCMB",
  "GTBank", "Jaiz Bank", "Keystone Bank", "Kuda", "Moniepoint", "Opay", "PalmPay",
  "Polaris Bank", "Providus Bank", "Stanbic IBTC", "Sterling Bank", "UBA", "Union Bank",
  "Unity Bank", "VFD Microfinance Bank", "Wema Bank", "Zenith Bank",
];

/** Turns 0803…, +234803…, 234803… into 234803… Returns null if it isn't a Nigerian mobile number. */
export function normaliseNigerianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let local: string | null = null;
  if (digits.length === 11 && digits.startsWith("0")) local = digits.slice(1);
  else if (digits.length === 13 && digits.startsWith("234")) local = digits.slice(3);
  else if (digits.length === 10 && /^[789]/.test(digits)) local = digits;
  return local && /^[789][01]\d{8}$/.test(local) ? `234${local}` : null;
}
