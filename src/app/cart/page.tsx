"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import { AlertTriangle, BadgeCheck, Loader2, Lock, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import MarketplaceHeader from "@/components/marketplace/MarketplaceHeader";
import { useCart } from "@/context/CartContext";
import type { Quote } from "@/lib/checkout";
import { MAX_QTY_PER_ITEM } from "@/lib/marketplace-config";
import { NIGERIAN_STATES, PRODUCT_CATEGORIES } from "@/lib/product-options";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const BUYER_KEY = "naijacraft_buyer";

type Buyer = { name: string; phone: string; address: string; state: string };

export default function CartPage() {
  const { data: session, status: authStatus } = useSession();
  const { cart, updateQuantity, removeFromCart, isLoaded } = useCart();

  const [deliveryChoices, setDeliveryChoices] = useState<Record<string, string>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [buyer, setBuyer] = useState<Buyer>({ name: "", phone: "", address: "", state: "" });
  const [errors, setErrors] = useState<string[]>([]);

  // Remember delivery details on this device, and fill in the name from the account
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(BUYER_KEY) ?? "null") as Buyer | null;
        if (saved) setBuyer(saved);
      } catch {
        /* ignore */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const accountName = session?.user?.name ?? "";
  const buyerName = buyer.name || accountName;

  // Ask the server for live prices, stock and delivery options whenever the cart changes
  const lines = useMemo(
    () => cart.map((i) => ({ productId: i.id, quantity: i.quantity, options: i.options ?? {} })),
    [cart],
  );
  const linesKey = JSON.stringify(lines) + JSON.stringify(deliveryChoices);

  useEffect(() => {
    if (!isLoaded) return;
    if (lines.length === 0) {
      const t = setTimeout(() => setQuote(null), 0);
      return () => clearTimeout(t);
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setQuoting(true);
      try {
        const res = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lines, deliveryChoices }),
          signal: controller.signal,
        });
        if (res.ok) setQuote((await res.json()) as Quote);
      } catch {
        /* aborted or offline: keep the last quote */
      } finally {
        setQuoting(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- linesKey captures lines + choices
  }, [linesKey, isLoaded]);

  const cartByKey = new Map(cart.map((i) => [i.key, i]));
  const blocking = quote?.problems ?? [];

  async function pay() {
    const found: string[] = [];
    if (buyerName.trim().length < 2) found.push("Enter your name.");
    if (buyer.phone.replace(/\D/g, "").length < 10) found.push("Enter your phone number.");
    if (buyer.address.trim().length < 10) found.push("Enter your full delivery address.");
    if (!buyer.state) found.push("Choose your state.");
    if (blocking.length) found.push("Fix the items marked in your cart first.");
    setErrors(found);
    if (found.length) return;

    setPaying(true);
    try {
      localStorage.setItem(BUYER_KEY, JSON.stringify({ ...buyer, name: buyerName }));
    } catch {
      /* ignore */
    }
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, deliveryChoices, buyer: { ...buyer, name: buyerName } }),
      });
      const data = (await res.json().catch(() => ({}))) as { authorizationUrl?: string; error?: string; quote?: Quote };
      if (res.status === 409 && data.quote) {
        setQuote(data.quote);
        toast.error(data.error ?? "Your cart changed. Please check it.");
        setPaying(false);
        return;
      }
      if (!res.ok || !data.authorizationUrl) throw new Error(data.error || "Couldn't start the payment.");
      window.location.href = data.authorizationUrl; // Paystack's secure payment page
    } catch (e) {
      const message = e instanceof Error ? e.message : "Couldn't start the payment.";
      setErrors([message]);
      toast.error(message);
      setPaying(false);
    }
  }

  const field =
    "h-11 w-full rounded-lg border border-cloud-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-green-600 focus:outline-none focus:ring-2 focus:ring-brand-green-100";

  return (
    <div className="min-h-screen bg-cloud-50 font-body text-ink-900">
      <Toaster position="top-center" />
      <MarketplaceHeader categories={PRODUCT_CATEGORIES} />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Your cart</h1>

        {!isLoaded ? (
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-cloud-100" />
        ) : cart.length === 0 ? (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-cloud-200 bg-white px-6 py-16 text-center">
            <ShoppingBag className="h-10 w-10 text-ink-300" aria-hidden="true" />
            <p className="font-display text-lg font-bold">Your cart is empty</p>
            <Link href="/marketplace" className="mt-1 flex h-11 items-center rounded-lg bg-brand-green-600 px-5 text-sm font-bold text-white hover:bg-brand-green-700">
              Browse the marketplace
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
            {/* Items, grouped by seller */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              {blocking.length > 0 && (
                <div role="alert" className="flex flex-col gap-2 rounded-2xl border border-brand-amber-500/40 bg-brand-amber-100/60 p-4">
                  <p className="flex items-center gap-2 font-semibold text-[#7a4a06]">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Some items need your attention
                  </p>
                  <ul className="flex flex-col gap-2 text-sm">
                    {blocking.map((p) => {
                      const item = cartByKey.get(p.key);
                      return (
                        <li key={p.key} className="flex flex-wrap items-center justify-between gap-2">
                          <span>{p.message}</span>
                          {p.fix === "quantity" && p.maxQuantity ? (
                            <button type="button" onClick={() => updateQuantity(p.key, p.maxQuantity!)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-cloud-200">
                              Change to {p.maxQuantity}
                            </button>
                          ) : p.fix === "options" && item?.slug ? (
                            <Link
                              href={`/marketplace/${item.slug}`}
                              onClick={() => removeFromCart(p.key)}
                              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-cloud-200"
                            >
                              Choose on product page
                            </Link>
                          ) : (
                            <button type="button" onClick={() => removeFromCart(p.key)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold ring-1 ring-cloud-200">
                              Remove
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {!quote && quoting && <div className="h-40 animate-pulse rounded-2xl bg-cloud-100" />}

              {quote?.groups.map((g) => (
                <section key={g.sellerId} className="rounded-2xl border border-cloud-200 bg-white">
                  <header className="flex items-center gap-2 border-b border-cloud-200 px-4 py-3">
                    <BadgeCheck className="h-4 w-4 text-brand-green-600" aria-hidden="true" />
                    <h2 className="font-semibold">{g.sellerName}</h2>
                    {g.official && <span className="rounded-md bg-navy-900 px-1.5 py-0.5 text-[10px] font-bold text-white">STORE</span>}
                  </header>

                  <ul className="divide-y divide-cloud-200">
                    {g.items.map((i) => (
                      <li key={i.key} className="flex gap-3 p-4">
                        <Link href={`/marketplace/${i.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cloud-100">
                          {i.image && <Image src={i.image} alt="" fill sizes="80px" className="object-cover" />}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <Link href={`/marketplace/${i.slug}`} className="line-clamp-2 text-sm font-medium hover:text-brand-green-600">
                            {i.name}
                          </Link>
                          {i.options.length > 0 && (
                            <p className="text-xs text-ink-500">{i.options.map((o) => `${o.name}: ${o.value}`).join(" · ")}</p>
                          )}
                          <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center rounded-lg border border-cloud-200">
                              <button
                                type="button"
                                aria-label={`Fewer ${i.name}`}
                                onClick={() => updateQuantity(i.key, i.quantity - 1)}
                                className="flex h-9 w-9 items-center justify-center"
                              >
                                {i.quantity === 1 ? <Trash2 className="h-4 w-4 text-red-700" aria-hidden="true" /> : <Minus className="h-4 w-4" aria-hidden="true" />}
                              </button>
                              <span className="w-7 text-center text-sm font-bold">{i.quantity}</span>
                              <button
                                type="button"
                                aria-label={`More ${i.name}`}
                                disabled={i.quantity >= Math.min(i.stock, MAX_QTY_PER_ITEM)}
                                onClick={() => updateQuantity(i.key, i.quantity + 1)}
                                className="flex h-9 w-9 items-center justify-center disabled:opacity-40"
                              >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                            <span className="font-display font-extrabold">{naira(i.lineTotal)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <fieldset className="border-t border-cloud-200 p-4">
                    <legend className="sr-only">Delivery from {g.sellerName}</legend>
                    <p className="mb-2 text-sm font-semibold">Delivery</p>
                    <div className="flex flex-col gap-2">
                      {g.deliveryOptions.map((d) => {
                        const on = g.delivery.method === d.method;
                        return (
                          <label
                            key={d.method}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 text-sm ${on ? "bg-brand-green-100/50 ring-2 ring-brand-green-600" : "ring-1 ring-cloud-200"}`}
                          >
                            <input
                              type="radio"
                              name={`delivery-${g.sellerId}`}
                              checked={on}
                              onChange={() => setDeliveryChoices((prev) => ({ ...prev, [g.sellerId]: d.method }))}
                              className="mt-0.5 h-4 w-4 accent-brand-green-600"
                            />
                            <span className="flex flex-1 flex-col">
                              <span className="font-medium">{d.label}</span>
                              <span className="text-xs text-ink-500">
                                {[d.etaDays ? `About ${d.etaDays} day${d.etaDays === 1 ? "" : "s"}` : null, d.note].filter(Boolean).join(" · ")}
                              </span>
                            </span>
                            <strong>{d.fee ? naira(d.fee) : "Free"}</strong>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </section>
              ))}
            </div>

            {/* Summary and payment */}
            <aside className="flex flex-col gap-4 rounded-2xl border border-cloud-200 bg-white p-5 lg:sticky lg:top-36">
              <h2 className="font-display text-lg font-bold">Order summary</h2>
              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-700">Items</dt>
                  <dd>{quote ? naira(quote.subtotal) : "…"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-700">Delivery</dt>
                  <dd>{quote ? (quote.deliveryTotal ? naira(quote.deliveryTotal) : "Free") : "…"}</dd>
                </div>
                <div className="flex justify-between border-t border-cloud-200 pt-2 text-base">
                  <dt className="font-bold">Total</dt>
                  <dd className="font-display font-extrabold">{quote ? naira(quote.total) : "…"}</dd>
                </div>
              </dl>

              {authStatus === "unauthenticated" ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-ink-700">Log in so you can track your order and confirm when it arrives.</p>
                  <Link href="/login?callbackUrl=/cart" className="flex h-12 items-center justify-center rounded-xl bg-brand-green-600 font-bold text-white hover:bg-brand-green-700">
                    Log in to check out
                  </Link>
                  <Link href="/signup?callbackUrl=/cart" className="text-center text-sm font-semibold text-brand-green-600 hover:underline">
                    New here? Create an account
                  </Link>
                </div>
              ) : (
                <form
                  className="flex flex-col gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    pay();
                  }}
                >
                  <p className="text-sm font-semibold">Delivery details</p>
                  <label className="sr-only" htmlFor="b-name">Full name</label>
                  <input id="b-name" autoComplete="name" placeholder="Full name" value={buyerName} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} className={field} />
                  <label className="sr-only" htmlFor="b-phone">Phone number</label>
                  <input id="b-phone" type="tel" autoComplete="tel" placeholder="Phone, e.g. 0803 123 4567" value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} className={field} />
                  <label className="sr-only" htmlFor="b-address">Delivery address</label>
                  <textarea
                    id="b-address"
                    autoComplete="street-address"
                    rows={2}
                    placeholder="Street, area, landmark, city"
                    value={buyer.address}
                    onChange={(e) => setBuyer({ ...buyer, address: e.target.value })}
                    className="w-full rounded-lg border border-cloud-200 bg-white p-3 text-sm placeholder:text-ink-300 focus:border-brand-green-600 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
                  />
                  <label className="sr-only" htmlFor="b-state">State</label>
                  <select id="b-state" value={buyer.state} onChange={(e) => setBuyer({ ...buyer, state: e.target.value })} className={field}>
                    <option value="">State</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  {errors.length > 0 && (
                    <ul role="alert" className="list-disc rounded-lg bg-red-50 p-3 pl-7 text-sm text-red-800">
                      {errors.map((e) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="submit"
                    disabled={paying || !quote || quoting || quote.groups.length === 0}
                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-green-600 font-bold text-white transition-colors hover:bg-brand-green-700 disabled:opacity-60"
                  >
                    {paying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
                    {paying ? "Opening Paystack…" : `Pay ${quote ? naira(quote.total) : ""} securely`}
                  </button>
                </form>
              )}

              <div className="flex items-start gap-2.5 rounded-xl bg-brand-green-100 p-3 text-xs leading-relaxed text-ink-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-700" aria-hidden="true" />
                <span>
                  You pay NaijaCraft through Paystack. We hold the money and only pay the seller after you confirm you
                  received your order.
                </span>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
