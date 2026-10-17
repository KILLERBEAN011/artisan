/** One cart line per product + chosen size/colour. Used by the browser cart and the server. */
export function lineKey(productId: string, options?: Record<string, string>) {
  const opts = Object.entries(options ?? {})
    .filter(([, v]) => v)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return opts ? `${productId}|${opts}` : productId;
}
