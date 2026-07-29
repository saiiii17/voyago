"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ChatWindow({ code, destination }: { code: string; destination: string }) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: `/api/trips/${code}/chat` }),
  });
  const [input, setInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="flex h-[65vh] flex-col overflow-hidden rounded-2xl border border-stone-200/70 bg-white/90 shadow-[0_1px_2px_rgba(30,25,15,0.04),0_8px_24px_-12px_rgba(30,25,15,0.08)]">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="text-3xl">🗺️</span>
            <p className="max-w-xs text-sm text-stone-400">
              Ask anything about {destination} — things to do, rough prices, safety tips, itinerary ideas.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-brand-600 text-white"
                  : "rounded-bl-md bg-stone-100 text-stone-800"
              }`}
            >
              {m.parts.map((part, i) =>
                part.type === "text" ? <span key={i} className="whitespace-pre-wrap">{part.text}</span> : null
              )}
            </div>
          </div>
        ))}
        {status === "submitted" && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-stone-100 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:0.2s]" />
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-stone-100 bg-stone-50/60 p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about ${destination}…`}
          disabled={status !== "ready"}
          className="bg-white"
        />
        <Button type="submit" disabled={status !== "ready" || !input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
