import { Resend } from "resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://naijacraft.com.ng";

let client: Resend | null = null;

/** Where admin alerts go (disputes, payment problems). Set ADMIN_EMAIL in .env. */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

/**
 * Sends an email through Resend. Never throws: a failed email is logged so it
 * can't break the action that triggered it (approving a seller, etc.).
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`Email not sent (RESEND_API_KEY missing): "${subject}" to ${to}`);
    return;
  }
  try {
    client ??= new Resend(process.env.RESEND_API_KEY);
    await client.emails.send({ from: "NaijaCraft <support@naijacraft.com.ng>", to, subject, html });
  } catch (error) {
    console.error(`Email failed: "${subject}" to ${to}`, error);
  }
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A simple branded email: heading, paragraphs and an optional button. */
export function emailLayout({
  heading,
  paragraphs,
  button,
  footer = "You're getting this because you applied to sell on NaijaCraft.",
}: {
  heading: string;
  paragraphs: string[];
  button?: { label: string; path: string };
  footer?: string;
}) {
  const body = paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.6;color:#3c455a">${escape(p)}</p>`).join("");
  const cta = button
    ? `<a href="${APP_URL}${button.path}" style="display:inline-block;margin-top:8px;padding:12px 22px;background:#1a7a46;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">${escape(button.label)}</a>`
    : "";
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#10192e">
<p style="margin:0 0 20px;font-weight:800;font-size:18px;color:#101d3f">NaijaCraft</p>
<h2 style="margin:0 0 16px;font-size:20px">${escape(heading)}</h2>${body}${cta}
<p style="margin-top:28px;font-size:12px;color:#64708a">${escape(footer)}</p></div>`;
}
