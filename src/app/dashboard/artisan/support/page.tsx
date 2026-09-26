"use client";

import { MessageCircle, Mail, MessageSquare } from "lucide-react";

export default function SupportPage() {
  const supportEmail = "support@naijacraft.com";
  const whatsappNumber = "2348000000000";

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-2">
      {/* Header */}
      <div className="border-b border-gray-100 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Support & Disputes
        </h1>
        <p className="text-sm text-gray-500 mt-1.5 max-w-2xl">
          Need help with an order, a dispute, or your account? Contact the
          NaijaCraft admin team.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* WhatsApp Support Card */}
        <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-green-100">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/10">
            <MessageCircle className="h-6 w-6 text-[#25D366]" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            WhatsApp Support
          </h2>
          <p className="mb-6 flex-grow text-sm leading-relaxed text-gray-500">
            Chat directly with our admin team on WhatsApp for quick resolutions
            to logistics or order issues.
          </p>
          <a
            href={`https://wa.me/${whatsappNumber}?text=Hi%20NaijaCraft%20Admin,%20I%20need%20help%20with%20my%20account.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1ebd5a] hover:shadow-lg hover:shadow-[#25D366]/20"
          >
            <MessageCircle className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        </div>

        {/* Email Support Card */}
        <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-brand-green-100">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-green-50">
            <Mail className="h-6 w-6 text-brand-green-600" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-900">
            Email Support
          </h2>
          <p className="mb-6 flex-grow text-sm leading-relaxed text-gray-500">
            Send us an email with details about your issue. We typically respond
            within 24 hours.
          </p>
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            <Mail className="h-4 w-4 text-gray-500" />
            {supportEmail}
          </a>
        </div>

        {/* Live Chat Banner */}
        <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row items-center sm:items-start gap-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8 shadow-sm">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-blue-100/50">
            <MessageSquare className="h-7 w-7 text-blue-600" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-semibold text-gray-900">
              Live Chat Platform
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 max-w-2xl">
              Look for the chat bubble at the bottom right corner of your
              screen! You can click it at any time to start a live conversation
              with an available support agent directly on the website.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
