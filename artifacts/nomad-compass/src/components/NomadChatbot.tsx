import { useState, useRef, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type LocationComparison, customFetch } from "@workspace/api-client-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  comparisons: LocationComparison[];
  annualIncomeUSD: number;
  employerCountry: string;
  employerCity: string;
  homeCityCOL: number | null;
}

const SUGGESTIONS = [
  "Which city gives me the most disposable income?",
  "Compare Tbilisi vs Lisbon for a $80k income",
  "Where is easiest to move to quickly?",
  "Which cities have digital nomad visas?",
  "What are the trade-offs between SE Asia and Europe?",
];

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.slice(2);
      return (
        <div key={i} className="flex gap-1.5 mt-1">
          <span className="text-primary/70 mt-0.5 flex-shrink-0">•</span>
          <span>{renderInline(content)}</span>
        </div>
      );
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-semibold mt-2">{line.slice(2, -2)}</p>;
    }
    if (line === "") {
      return <div key={i} className="h-1.5" />;
    }
    return <p key={i} className={i > 0 ? "mt-1" : ""}>{renderInline(line)}</p>;
  });
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function NomadChatbot({ comparisons, annualIncomeUSD, employerCountry, employerCity, homeCityCOL }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: msg };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      const context = {
        annualIncomeUSD,
        employerCountry,
        employerCity,
        homeCityCOL,
        comparisons: comparisons.map((c) => ({
          city: c.city,
          country: c.country,
          emoji: c.emoji,
          overallScore: c.overallScore,
          effectiveTaxRate: c.effectiveTaxRate,
          monthlyNetIncomeUSD: c.monthlyNetIncomeUSD,
          monthlyCostOfLivingUSD: c.monthlyCostOfLivingUSD,
          monthlyDisposableIncomeUSD: c.monthlyDisposableIncomeUSD,
          hasDigitalNomadVisa: c.visaInfo.hasDigitalNomadVisa,
          setupDifficultyLabel: c.relocationInfo?.setupDifficultyLabel ?? "Moderate",
          touristVisaDays: c.relocationInfo?.touristVisaDays ?? 90,
          pros: c.pros,
          cons: c.cons,
        })),
      };

      const data = await customFetch<{ reply: string }>("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          history: messages,
          context,
        }),
      });

      setMessages([...newHistory, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setMessages(newHistory);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const showSuggestions = messages.length === 0 && !loading;

  return (
    <>
      {/* Floating toggle button */}
      <AnimatePresence mode="wait">
        {!open && (
          <motion.button
            key="chat-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors group"
            aria-label="Open AI Assistant"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-9 right-0 bg-popover text-popover-foreground text-xs px-2 py-1 rounded-md shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border">
              Ask AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl shadow-2xl border bg-background overflow-hidden"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b bg-muted/30 shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight">Nomad Compass AI</p>
                <p className="text-xs text-muted-foreground leading-tight">
                  Ask about {comparisons.length} cities in your results
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 rounded-full shrink-0"
                onClick={() => setOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {showSuggestions && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-3 py-2 text-sm leading-relaxed">
                      Hi! I have your full comparison data — {comparisons.length} cities, all their taxes, costs, visa info, and relocation details. What would you like to know?
                    </div>
                  </div>
                  <div className="pl-8 flex flex-col gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-left text-xs px-3 py-1.5 rounded-full border border-dashed hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors text-muted-foreground"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {msg.role === "user"
                      ? <User className="w-3.5 h-3.5" />
                      : <Bot className="w-3.5 h-3.5 text-primary" />
                    }
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted/60 rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "assistant"
                      ? renderMarkdown(msg.content)
                      : msg.content
                    }
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted/60 rounded-2xl rounded-tl-sm px-3 py-2">
                    <TypingDots />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-center text-xs text-destructive px-4">{error}</p>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t px-3 py-3 shrink-0 bg-background">
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about any city or comparison…"
                  className="resize-none text-sm min-h-[40px] max-h-[100px] flex-1 rounded-xl"
                  rows={1}
                />
                <Button
                  size="icon"
                  className="rounded-xl h-10 w-10 shrink-0"
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-1.5 text-center">
                Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
