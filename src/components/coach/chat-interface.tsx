"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { COACH_SUGGESTIONS } from "@/lib/coach";
import { cn, initials } from "@/lib/utils";

interface Msg { id: string; role: "user" | "assistant"; content: string }

export function ChatInterface({
  initialMessages,
  initialConversationId,
  userName,
  live,
}: {
  initialMessages: Msg[];
  initialConversationId?: string;
  userName: string;
  live: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    setInput("");
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantMsg: Msg = { id: crypto.randomUUID(), role: "assistant", content: "" };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    setStreaming(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
      });
      const convId = res.headers.get("X-Conversation-Id");
      if (convId) setConversationId(convId);
      if (!res.body) throw new Error("no body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => m.map((msg) => (msg.id === assistantMsg.id ? { ...msg, content: acc } : msg)));
      }
    } catch {
      setMessages((m) => m.map((msg) => (msg.id === assistantMsg.id ? { ...msg, content: "Sorry, something went wrong. Please try again." } : msg)));
    } finally {
      setStreaming(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col lg:h-[calc(100dvh-8rem)]">
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto pb-4">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gradient shadow-glow">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Hey {userName.split(" ")[0]} 👋</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              I&apos;m Aura, your AI coach. Ask me about your progress, nutrition, training, or motivation.
            </p>
            {!live && (
              <Badge variant="secondary" className="mt-3">Offline mode · add ANTHROPIC_API_KEY for full AI</Badge>
            )}
            <div className="mt-7 grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {COACH_SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-xl border p-3 text-left text-sm transition-all hover:border-primary/40 hover:bg-accent/50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <Bubble key={m.id} msg={m} userName={userName} streaming={streaming} />)
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border/50 pt-3">
        <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask your coach anything…"
            className="min-h-[44px] max-h-32 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            rows={1}
          />
          <Button size="icon" variant="gradient" disabled={!input.trim() || streaming} onClick={() => send(input)}>
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Aura can make mistakes. Not medical advice.
        </p>
      </div>
    </div>
  );
}

function Bubble({ msg, userName, streaming }: { msg: Msg; userName: string; streaming: boolean }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold", isUser ? "bg-secondary" : "bg-brand-gradient text-white")}>
        {isUser ? initials(userName) : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn(
        "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
        isUser ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-card border"
      )}>
        {msg.content || (streaming && <span className="inline-flex gap-1"><Dot /><Dot delay={0.2} /><Dot delay={0.4} /></span>)}
      </div>
    </motion.div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <motion.span
      className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground"
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1, repeat: Infinity, delay }}
    />
  );
}
