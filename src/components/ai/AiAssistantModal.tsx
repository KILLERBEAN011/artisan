"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, ArrowRight, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";

interface ExtractedFilters {
  q?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface ArtisanItem {
  _id?: string;
  id?: string;
  name?: string;
  userId?: { name?: string; email?: string };
  sellerType?: string;
  serviceTitle?: string;
  location?: string | { city?: string; state?: string };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content?: string;
  intent?: "search" | "chat";
  artisans?: ArtisanItem[];
  extractedFilters?: ExtractedFilters;
}

export function AiAssistantModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = prompt.trim();
    if (!query || loading) return;

    const userMessageId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", content: query },
    ]);
    setPrompt("");
    setLoading(true);

    try {
      const aiRes = await fetch("/api/ai/find-artisan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });

      if (!aiRes.ok) throw new Error("Failed to process AI request");

      const data = await aiRes.json();
      const intent = data.intent || (data.chatResponse ? "chat" : "search");

      if (intent === "chat") {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            intent: "chat",
            content:
              data.chatResponse ||
              "Here is some information to help you get started on NaijaCraft.",
          },
        ]);
      } else {
        const filters: ExtractedFilters =
          data.searchFilters || data.searchParams || {};
        const queryParams = new URLSearchParams();

        if (filters.q) queryParams.set("q", filters.q);
        if (filters.category) queryParams.append("category", filters.category);
        if (filters.location) queryParams.set("location", filters.location);
        if (filters.minPrice)
          queryParams.set("minPrice", String(filters.minPrice));
        if (filters.maxPrice)
          queryParams.set("maxPrice", String(filters.maxPrice));

        if (!queryParams.toString()) {
          queryParams.set("q", query);
        }

        const dbRes = await fetch(`/api/artisans?${queryParams.toString()}`);
        const dbData = dbRes.ok ? await dbRes.json() : { artisans: [] };

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            intent: "search",
            artisans: dbData.artisans || [],
            extractedFilters: filters,
          },
        ]);
      }
    } catch (err) {
      console.error("AI assistant error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I ran into an issue processing that. You can try searching artisans manually or browse available categories.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="flex h-[540px] w-[350px] flex-col overflow-hidden rounded-2xl border border-cloud-200 bg-white shadow-2xl dark:border-navy-700 dark:bg-[#17264a] sm:w-[420px]">
          <div className="flex items-center justify-between border-b border-cloud-200 bg-brand-green-600 px-4 py-3 text-white dark:border-navy-700">
            <div className="flex items-center gap-2 font-display font-semibold">
              <Sparkles className="h-4 w-4" />
              <span>NaijaCraft Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 transition-colors hover:bg-white/10"
              aria-label="Close assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-cloud-50 p-4 dark:bg-[#101D3F]">
            <div className="rounded-2xl rounded-tl-sm border border-cloud-200/60 bg-white p-3.5 text-sm text-navy-900 shadow-sm dark:border-navy-700/60 dark:bg-[#17264a] dark:text-white">
              <p className="font-medium">Welcome to NaijaCraft! 👋</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-600 dark:text-ink-200">
                I can help you find verified artisans, or guide you step-by-step
                through signing up as a client or artisan.
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-cloud-100 pt-2 dark:border-navy-800">
                <button
                  type="button"
                  onClick={() => setPrompt("How do I register as an artisan?")}
                  className="rounded-full bg-cloud-100 px-2.5 py-1 text-[11px] font-medium text-navy-800 transition hover:bg-cloud-200 dark:bg-navy-800 dark:text-ink-200 dark:hover:bg-navy-700"
                >
                  🛠️ Register as Artisan
                </button>
                <button
                  type="button"
                  onClick={() => setPrompt("How do I sign up as a customer?")}
                  className="rounded-full bg-cloud-100 px-2.5 py-1 text-[11px] font-medium text-navy-800 transition hover:bg-cloud-200 dark:bg-navy-800 dark:text-ink-200 dark:hover:bg-navy-700"
                >
                  👤 Sign up as Customer
                </button>
                <button
                  type="button"
                  onClick={() => setPrompt("I need an electrician in Lagos")}
                  className="rounded-full bg-cloud-100 px-2.5 py-1 text-[11px] font-medium text-navy-800 transition hover:bg-cloud-200 dark:bg-navy-800 dark:text-ink-200 dark:hover:bg-navy-700"
                >
                  ⚡ Find Electrician
                </button>
              </div>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-brand-green-600 px-3.5 py-2.5 text-sm text-white shadow-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="w-full space-y-3">
                    {msg.content && (
                      <div className="rounded-2xl rounded-tl-sm border border-cloud-200/60 bg-white p-3.5 text-sm text-navy-900 shadow-sm dark:border-navy-700/60 dark:bg-[#17264a] dark:text-white">
                        <div className="whitespace-pre-line text-xs leading-relaxed">
                          {msg.content}
                        </div>

                        {(msg.content.toLowerCase().includes("sign up") ||
                          msg.content.toLowerCase().includes("register") ||
                          msg.content.toLowerCase().includes("artisan")) && (
                          <div className="mt-3 flex gap-2 border-t border-cloud-100 pt-2 dark:border-navy-800">
                            <Link
                              href="/signup"
                              className="inline-flex items-center gap-1 rounded-lg bg-brand-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-green-700"
                            >
                              <UserPlus className="h-3 w-3" /> Go to Sign Up
                            </Link>
                            <Link
                              href="/onboarding"
                              className="inline-flex items-center gap-1 rounded-lg border border-cloud-300 px-3 py-1.5 text-xs font-semibold text-navy-900 transition hover:bg-cloud-100 dark:border-navy-600 dark:text-white dark:hover:bg-navy-700"
                            >
                              Artisan Setup
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    {msg.intent === "search" && (
                      <div className="space-y-2">
                        <div className="rounded-2xl rounded-tl-sm border border-cloud-200/60 bg-white p-3 text-xs text-navy-900 shadow-sm dark:border-navy-700/60 dark:bg-[#17264a] dark:text-white">
                          {msg.artisans && msg.artisans.length > 0
                            ? `Found ${msg.artisans.length} matching artisan${
                                msg.artisans.length > 1 ? "s" : ""
                              }:`
                            : "No artisans found matching that exact criteria. Try broadening your keywords or location."}

                          {msg.extractedFilters?.q && (
                            <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400">
                              Filtered by:{" "}
                              <span className="font-semibold text-brand-green-600 dark:text-brand-green-400">
                                &quot;{msg.extractedFilters.q}&quot;
                              </span>
                            </p>
                          )}
                        </div>

                        {msg.artisans?.map((artisan) => (
                          <div
                            key={artisan._id || artisan.id}
                            className="rounded-xl border border-cloud-200 bg-white p-3 shadow-sm dark:border-navy-700 dark:bg-[#17264a]"
                          >
                            <div className="flex items-start justify-between">
                              <h4 className="text-xs font-semibold text-navy-900 dark:text-white">
                                {artisan.userId?.name ||
                                  artisan.name ||
                                  "Artisan"}
                              </h4>
                              {artisan.sellerType && (
                                <span className="rounded bg-brand-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-green-700 dark:bg-brand-green-950 dark:text-brand-green-400">
                                  {artisan.sellerType}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs font-medium text-brand-green-600 dark:text-brand-green-400">
                              {artisan.serviceTitle}
                            </p>
                            <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-300">
                              📍{" "}
                              {typeof artisan.location === "object"
                                ? `${artisan.location.city || "Nigeria"}${
                                    artisan.location.state
                                      ? `, ${artisan.location.state}`
                                      : ""
                                  }`
                                : artisan.location || "Nigeria"}
                            </p>
                            <Link
                              href={`/search/${artisan._id || artisan.id}`}
                              className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-cloud-100 py-1.5 text-xs font-semibold text-navy-900 transition-colors hover:bg-cloud-200 dark:bg-navy-800 dark:text-white dark:hover:bg-navy-700"
                            >
                              View Profile <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex w-fit items-center gap-2 rounded-2xl rounded-tl-sm border border-cloud-200/60 bg-white p-3 text-xs text-ink-500 shadow-sm dark:border-navy-700/60 dark:bg-[#17264a] dark:text-ink-300">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-green-600" />{" "}
                Assistant is thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-cloud-200 bg-white p-3 dark:border-navy-700 dark:bg-[#17264a]"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask how to register, or find an artisan..."
                className="w-full rounded-full border border-cloud-200 bg-cloud-50 py-2 pl-4 pr-11 text-xs text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-1 focus:ring-brand-green-500 dark:border-navy-700 dark:bg-[#101D3F] dark:text-white dark:placeholder:text-ink-400"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="absolute right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-green-600 text-white transition-colors hover:bg-brand-green-700 disabled:opacity-40"
                aria-label="Send message"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green-600 text-white shadow-xl transition-transform hover:scale-105 hover:bg-brand-green-700 focus:outline-none focus:ring-4 focus:ring-brand-green-300"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
