"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { errorMessage } from "@/lib/format";
import { colors, radius, shadow } from "@/lib/theme";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";

interface Msg {
  id: string;
  role: "user" | "assistant";
  text: string;
  isError?: boolean;
}

let counter = 0;
const makeId = () => `w-${Date.now()}-${counter++}`;

const WELCOME: Msg = {
  id: "welcome",
  role: "assistant",
  text: "Hi, I'm the Aggre8 Assistant. I can explain how things work and tell you what needs attention in your workspace.",
};

const QUICK_PROMPTS = ["What should I do next?", "How do I connect a data source?", "Why did a file fail?"];

export function AssistantWidget() {
  const { user } = useAuth();
  const narrow = useMediaQuery("(max-width: 600px)");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const userId = user?.id;

  useEffect(() => {
    setMessages([WELCOME]);
    setOpen(false);
  }, [userId]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending, open]);

  if (!user) return null;

  async function send(text: string) {
    const question = text.trim();
    if (!question || sending) return;

    const history = messages
      .filter((m) => m.id !== "welcome" && !m.isError)
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.text }));

    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { id: makeId(), role: "user", text: question }]);

    try {
      const result = await api.assistantChat(question, history);
      setMessages((prev) => [...prev, { id: makeId(), role: "assistant", text: result.answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: makeId(), role: "assistant", text: errorMessage(err), isError: true }]);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Aggre8 Assistant"
          style={{
            position: "fixed",
            zIndex: 45,
            right: narrow ? 8 : 24,
            left: narrow ? 8 : undefined,
            bottom: 92,
            width: narrow ? undefined : 380,
            height: "min(560px, calc(100vh - 120px))",
            display: "flex",
            flexDirection: "column",
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.lg,
            boxShadow: shadow.overlay,
            overflow: "hidden",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              color: "#ffffff",
              background: colors.sidebar,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Aggre8 Assistant</div>
              <div style={{ fontSize: 12, color: colors.sidebarText }}>Help and workspace status</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              style={{ display: "flex", background: "none", border: "none", color: "#ffffff", cursor: "pointer" }}
            >
              <Icon name="close" />
            </button>
          </header>

          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "grid", alignContent: "start", gap: 12 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "88%",
                    padding: "10px 14px",
                    fontSize: 14,
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                    color: m.role === "user" ? "#ffffff" : m.isError ? colors.danger : colors.text,
                    background: m.role === "user" ? colors.primary : m.isError ? colors.dangerSoft : colors.neutralSoft,
                    borderRadius: radius.lg,
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {messages.length === 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => send(prompt)}
                    style={{
                      padding: "6px 12px",
                      fontSize: 13,
                      color: colors.primary,
                      background: colors.primarySoft,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 999,
                      cursor: "pointer",
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {sending && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: colors.textMuted }}>
                <Spinner size={14} /> Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div style={{ display: "flex", gap: 8, padding: 12, borderTop: `1px solid ${colors.border}` }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask for help…"
              aria-label="Message the assistant"
              style={{
                flex: 1,
                height: 40,
                padding: "0 12px",
                fontSize: 14,
                color: colors.text,
                border: `1px solid ${colors.borderStrong}`,
                borderRadius: radius.md,
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={sending || !input.trim()}
              aria-label="Send"
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                background: colors.primary,
                border: "none",
                borderRadius: radius.md,
                cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                opacity: sending || !input.trim() ? 0.6 : 1,
              }}
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        data-tour="assistant-button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        style={{
          position: "fixed",
          zIndex: 45,
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          background: colors.primary,
          border: "none",
          borderRadius: "50%",
          boxShadow: shadow.overlay,
          cursor: "pointer",
        }}
      >
        <Icon name={open ? "close" : "chat"} size={24} />
      </button>
    </>
  );
}