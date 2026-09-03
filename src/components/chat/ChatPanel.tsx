"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, CheckCheck, X } from "lucide-react";

type ChatMessage = {
  _id: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  senderId: { _id: string; name: string } | string;
};

type Props = {
  bookingId: string;
  currentUserId: string;
};

function senderId(sender: ChatMessage["senderId"]) {
  return typeof sender === "string" ? sender : sender._id;
}

function senderName(sender: ChatMessage["senderId"]) {
  return typeof sender === "string" ? "Unknown" : sender.name;
}

export function ChatPanel({ bookingId, currentUserId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    const res = await fetch(`/api/bookings/${bookingId}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      await fetchMessages();
      if (!cancelled) setLoading(false);
    }

    loadInitial();

    const interval = setInterval(fetchMessages, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();

    if (!text && !file) return;

    setSending(true);
    setError(null);

    const formData = new FormData();
    formData.append("text", text);
    if (file) formData.append("image", file);

    const res = await fetch(`/api/bookings/${bookingId}/messages`, {
      method: "POST",
      body: formData,
    });

    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to send message.");
      return;
    }

    setDraft("");
    setFile(null);
    await fetchMessages();
  }

  return (
    // Added 'flex-1' and 'w-full' right here so it stretches to fill the 600px parent!
    <div className="flex h-full w-full flex-1 flex-col bg-white transition-colors dark:bg-[#17264a]">
      <div className="flex-1 space-y-4 overflow-y-auto bg-[#efeae2]/30 p-4 transition-colors sm:p-6 dark:bg-black/10">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-ink-500 shadow-sm transition-colors dark:border dark:border-navy-700 dark:bg-[#101D3F] dark:text-ink-300">
              Loading messages...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="rounded-full bg-white px-4 py-1.5 text-xs font-medium text-ink-500 shadow-sm transition-colors dark:border dark:border-navy-700 dark:bg-[#101D3F] dark:text-ink-300">
              No messages yet — say hello to get things started.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = senderId(msg.senderId) === currentUserId;

            const previousMsg = index > 0 ? messages[index - 1] : null;
            const isConsecutive =
              previousMsg &&
              senderId(previousMsg.senderId) === senderId(msg.senderId);

            return (
              <div
                key={msg._id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`relative max-w-[80%] px-3.5 py-2 text-[15px] shadow-sm transition-colors sm:max-w-[70%] ${
                    isMe
                      ? `bg-brand-green-600 text-white ${isConsecutive ? "rounded-2xl" : "rounded-2xl rounded-br-sm"}`
                      : `border border-cloud-100 bg-white text-navy-900 dark:border-navy-700 dark:bg-[#101D3F] dark:text-white ${isConsecutive ? "rounded-2xl" : "rounded-2xl rounded-bl-sm"}`
                  }`}
                >
                  {!isMe && !isConsecutive && (
                    <p className="mb-0.5 text-xs font-semibold text-brand-green-600 transition-colors dark:text-brand-green-400">
                      {senderName(msg.senderId)}
                    </p>
                  )}

                  {msg.imageUrl && (
                    <div className="mb-2 mt-1 overflow-hidden rounded-xl border border-black/5 dark:border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.imageUrl}
                        alt="Chat attachment"
                        className="max-h-60 w-auto object-cover"
                      />
                    </div>
                  )}

                  {msg.text && (
                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {msg.text}
                    </p>
                  )}

                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] transition-colors ${isMe ? "text-brand-green-100" : "text-ink-400 dark:text-ink-500"}`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString("en-NG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && <CheckCheck className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="bg-cloud-50/50 p-3 transition-colors sm:p-4 dark:border-t dark:border-navy-700 dark:bg-[#17264a]">
        <form
          onSubmit={handleSend}
          className="mx-auto flex w-full max-w-4xl flex-col gap-2"
        >
          {file && (
            <div className="ml-12 flex items-center gap-2 self-start rounded-lg border border-cloud-200 bg-white px-3 py-1.5 text-xs shadow-sm transition-colors dark:border-navy-700 dark:bg-[#101D3F]">
              <span className="max-w-[200px] truncate font-medium text-brand-green-700 transition-colors dark:text-brand-green-400">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-ink-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
                aria-label="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex w-full items-end gap-2">
            <input
              type="file"
              accept="image/*"
              id="photo-upload"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            <button
              type="button"
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                file
                  ? "bg-brand-green-100 text-brand-green-700 dark:bg-brand-green-900/40 dark:text-brand-green-400"
                  : "text-ink-500 hover:bg-cloud-200 hover:text-navy-900 dark:text-ink-400 dark:hover:bg-navy-800 dark:hover:text-white"
              }`}
              onClick={() => document.getElementById("photo-upload")?.click()}
              title="Attach a photo"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                className="w-full rounded-2xl border border-cloud-200 bg-white px-4 py-3 pr-12 text-sm text-ink-900 shadow-sm transition-colors focus:border-brand-green-500 focus:outline-none focus:ring-1 focus:ring-brand-green-500 dark:border-navy-700 dark:bg-[#101D3F] dark:text-white dark:placeholder:text-ink-500"
              />
              <button
                type="submit"
                disabled={sending || (!draft.trim() && !file)}
                className="absolute bottom-1.5 right-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-green-600 text-white transition-colors hover:bg-brand-green-700 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="ml-0.5 h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
        {error && (
          <p className="mt-2 text-center text-xs text-brand-amber-600 dark:text-brand-amber-400">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
