/**
 * Only allow redirects to pages on this site ("/sell/apply"), never to another
 * website ("https://evil.com" or "//evil.com"), so links can't be abused for phishing.
 */
export function safeRedirect(target: string | null | undefined, fallback = "/dashboard") {
  if (!target) return fallback;
  if (!target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return fallback;
  return target;
}

/** Reads ?callbackUrl= from the current address (browser only). */
export function callbackFromLocation(fallback = "/dashboard") {
  if (typeof window === "undefined") return fallback;
  return safeRedirect(new URLSearchParams(window.location.search).get("callbackUrl"), fallback);
}
