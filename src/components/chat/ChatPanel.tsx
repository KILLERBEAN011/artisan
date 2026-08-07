"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type ChatMessage = {
  _id: string;
  text: string;
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

    // Simple polling — good enough for a v1 chat without adding websocket
    // infrastructure. Every 4s is frequent enough to feel responsive without
    // hammering the API.
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
    if (!text) return;

    setSending(true);
    setError(null);

    const res = await fetch(`/api/bookings/${bookingId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    setSending(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to send message.");
      return;
    }

    setDraft("");
    await fetchMessages();
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-2xl border border-cloud-200 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-sm text-ink-500">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-ink-500">
            No messages yet — say hello to get things started.
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = senderId(msg.senderId) === currentUserId;
            return (
              <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    isMe
                      ? "bg-brand-green-600 text-white"
                      : "bg-cloud-100 text-ink-900"
                  }`}
                >
                  {!isMe && (
                    <p className="mb-0.5 text-xs font-semibold text-brand-green-700">
                      {senderName(msg.senderId)}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <p
                    className={`mt-1 text-[10px] ${isMe ? "text-white/70" : "text-ink-500"}`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString("en-NG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-cloud-200 p-3">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-cloud-200 px-3 py-2 text-sm text-ink-900 focus:border-brand-green-500 focus:outline-none focus:ring-2 focus:ring-brand-green-100"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-green-600 text-white transition-colors hover:bg-brand-green-700 disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="px-3 pb-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
