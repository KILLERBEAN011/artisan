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
import { AiAssistantModal } from "@/components/ai/AiAssistantModal";

export const metadata: Metadata = {
  title: {
    template: "%s | NaijaCraft",
    default: "NaijaCraft | Trusted Local Artisans in Nigeria",
  },
  description:
    "Find verified professionals for plumbing, electrical, carpentry and more. Hire with confidence using Naira-friendly pricing and secure in-app payments.",
  keywords: [
    "artisans in Nigeria",
    "hire a plumber Lagos",
    "handyman Nigeria",
    "NaijaCraft",
  ],
  openGraph: {
    title: "NaijaCraft | Trusted Local Artisans in Nigeria",
    description:
      "Find verified professionals for plumbing, electrical, and carpentry.",
    url: "https://naijacraft.com.ng",
    siteName: "NaijaCraft",
    locale: "en_NG",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="bg-cloud-50 text-ink-900 dark:bg-[#101D3F] dark:text-white">
        <AuthProvider>{children}</AuthProvider>
        <AiAssistantModal />
      </body>
    </html>
  );
}
