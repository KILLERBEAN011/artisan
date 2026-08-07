import type { Metadata } from "next";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "NaijaCraft — Trusted local artisans & handymen across Nigeria",
  description:
    "Find verified professionals for plumbing, electrical, carpentry and more. Post a task, receive quotes, and hire with confidence — Naira-friendly pricing and secure in-app payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-ink-900 font-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
