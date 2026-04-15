"use client";

import React, { useState } from "react";
import { apiPostAuth, getToken } from "@/lib/api";

interface SymptomCheckResponse {
  result: string;
  confidenceScore?: number;
  recommendedSpecialty?: string;
}

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const token = getToken();

  const sendMessage = async () => {
    if (!input.trim() || !token) return;
    setMessages((msgs) => [...msgs, { sender: "user", text: input }]);
    setLoading(true);
    try {
      const res = await apiPostAuth<SymptomCheckResponse>(
        "/ai/symptom-check",
        { symptoms: input },
        token
      );
      setMessages((msgs) => [
        ...msgs,
        { sender: "bot", text: res.result + (res.recommendedSpecialty ? `\nRecommended: ${res.recommendedSpecialty}` : "") },
      ]);
    } catch (err: any) {
      setMessages((msgs) => [...msgs, { sender: "bot", text: err.message || "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  return (
    <>
      <button
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-3xl hover:bg-blue-700"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI Symptom Checker"
      >
        💬
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-xl shadow-2xl flex flex-col border border-slate-200">
          <div className="p-4 border-b font-bold text-blue-700">AI Symptom Checker</div>
          <div className="flex-1 p-4 overflow-y-auto max-h-80 space-y-2">
            {messages.length === 0 && <div className="text-slate-400">Ask about your symptoms...</div>}
            {messages.map((msg, i) => (
              <div key={i} className={msg.sender === "user" ? "text-right" : "text-left"}>
                <span className={msg.sender === "user" ? "bg-blue-100 text-blue-900" : "bg-slate-100 text-slate-800"} style={{ borderRadius: 12, padding: 8, display: "inline-block", marginBottom: 4 }}>
                  {msg.text}
                </span>
              </div>
            ))}
            {loading && <div className="text-slate-400">Thinking...</div>}
          </div>
          <form
            className="flex border-t"
            onSubmit={e => { e.preventDefault(); sendMessage(); }}
          >
            <input
              className="flex-1 px-3 py-2 rounded-bl-xl outline-none"
              placeholder="Describe your symptoms..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-br-xl font-bold disabled:opacity-50"
              disabled={loading || !input.trim()}
            >Send</button>
          </form>
        </div>
      )}
    </>
  );
}
