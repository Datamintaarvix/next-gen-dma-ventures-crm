"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Sparkles,
  X,
  Send,
  Trash2,
  AlertCircle,
  RotateCcw,
  Bot,
  User,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  isError?: boolean;
}

const QUICK_PROMPTS = [
  "What modules are in the CRM?",
  "How does Lead to Follow-up synchronization work?",
  "What courses and categories does the academy offer?",
  "How are admissions and installments handled?",
];

export function CrmAssistantWidget() {
  const { user, staff } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [configNotice, setConfigNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isLoading]);

  // Don't render for unauthenticated visitors
  if (!user) return null;

  const staffName = staff?.fullName || "Team Member";
  const staffRole = staff?.role || "Staff";

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `usr-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputMessage("");
    setIsLoading(true);
    setConfigNotice(null);

    try {
      // Map history for the backend
      const historyPayload = messages.slice(-10).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.isConfigError) {
          setConfigNotice(data.error);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "model",
            text: data.error || "Unable to reach the Gemini service. Please try again.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isError: true,
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "model",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "model",
          text: "A connection error occurred while contacting the assistant. Please check your network and retry.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setConfigNotice(null);
  };

  const handleRetryLast = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.text);
    }
  };

  return (
    <>
      {/* 1. Floating Launcher Button (Always visible when chat is closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2.5 px-4 py-3 bg-[#11232B] hover:bg-[#078783] text-white rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 border border-[#078783]/40"
          aria-label="Open AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#4DD0E1] group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>
          <span className="text-xs font-semibold tracking-wide pr-1">CRM Assistant</span>
        </button>
      )}

      {/* 2. Floating Chatbot Window */}
      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col bg-white border border-[#E2ECEB] shadow-2xl rounded-2xl overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
            isExpanded
              ? "bottom-3 right-3 sm:bottom-5 sm:right-5 w-[96vw] sm:w-[620px] h-[90vh] max-h-[820px]"
              : "bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-[#11232B] text-white flex items-center justify-between border-b border-[#1E3A45]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#078783] flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4 text-[#E6F5F4]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight text-white">CRM Data Assistant</h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#078783]/50 text-emerald-200 border border-[#078783]">
                    Gemini AI
                  </span>
                </div>
                <p className="text-[10px] text-[#A2B8BF] truncate max-w-[200px]">
                  Logged in as {staffName} ({staffRole})
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1 text-[#A2B8BF]">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? "Collapse view" : "Expand view"}
                className="hidden sm:block p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close assistant"
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Configuration Alert Banner (if key missing) */}
          {configNotice && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-[11px]">Configuration Required</p>
                <p className="text-[11px] leading-relaxed text-amber-800">{configNotice}</p>
              </div>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAFCFB]">
            {/* Initial Welcome & Capabilities Notice */}
            <div className="p-3.5 bg-[#F3F8F7] rounded-xl border border-[#E2ECEB] space-y-2">
              <div className="flex items-center gap-2 text-[#078783] text-xs font-bold">
                <Bot className="w-4 h-4" />
                <span>Welcome, {staffName}!</span>
              </div>
              <p className="text-xs text-[#3E555C] leading-relaxed">
                I am your NEXT GEN DMA VENTURES CRM Assistant. You can ask me questions about CRM
                features, operational workflows, or academic course categories.
              </p>
              <div className="pt-1.5 border-t border-[#E2ECEB]/70 flex items-center gap-1.5 text-[11px] text-[#5A7178]">
                <Info className="w-3.5 h-3.5 text-[#078783] shrink-0" />
                <span>Connected to live CRM data. Responses respect your role-based permissions.</span>
              </div>
            </div>

            {/* Quick Prompt Suggestions (When conversation has no messages) */}
            {messages.length === 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold text-[#8A9EA5] uppercase tracking-wider px-1">
                  Suggested Questions
                </p>
                <div className="flex flex-col gap-1.5">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left px-3 py-2 bg-white hover:bg-[#F3F8F7] hover:border-[#078783]/40 border border-[#E2ECEB] rounded-lg text-xs text-[#11232B] font-medium transition-colors shadow-2xs"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Flow */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "model" && (
                  <div className="w-7 h-7 rounded-lg bg-[#E6F5F4] text-[#078783] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-2xs ${
                    msg.role === "user"
                      ? "bg-[#078783] text-white rounded-tr-none font-normal"
                      : msg.isError
                      ? "bg-red-50 text-red-800 border border-red-200 rounded-tl-none"
                      : "bg-white text-[#11232B] border border-[#E2ECEB] rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`mt-1 text-[9px] flex items-center justify-end ${
                      msg.role === "user" ? "text-emerald-100" : "text-[#8A9EA5]"
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-[#11232B] text-white flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold shadow-2xs">
                    {staffName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
            ))}

            {/* Loading / Typing Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#5A7178] pl-1">
                <div className="w-7 h-7 rounded-lg bg-[#E6F5F4] text-[#078783] flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="bg-white border border-[#E2ECEB] rounded-xl px-3 py-2 flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 bg-[#078783] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-[#078783] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-[#078783] rounded-full animate-bounce" />
                  <span className="text-[11px] text-[#5A7178] pl-1 font-medium">Gemini is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-3 border-t border-[#E2ECEB] bg-white space-y-2">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask about CRM features or procedures..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 bg-[#F8FBFA] border border-[#E2ECEB] rounded-xl text-xs text-[#11232B] placeholder-[#8A9EA5] focus:outline-none focus:ring-1 focus:ring-[#078783] focus:bg-white resize-none max-h-24 min-h-[38px]"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="w-9 h-9 rounded-xl bg-[#078783] hover:bg-[#066F6C] disabled:bg-[#D5E2E1] disabled:text-[#8A9EA5] text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#8A9EA5] px-1">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>Google Gemini AI</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
