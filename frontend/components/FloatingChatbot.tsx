"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  X, 
  User, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Activity,
  Stethoscope,
  Terminal,
  ChevronDown
} from "lucide-react";
import { apiPostAuth, getToken } from "@/lib/api";

interface SymptomCheckResponse {
  recommendedSpecialty?: string;
  result?: string;
  confidenceScore?: number;
}

interface Message {
  sender: "user" | "bot";
  text: string;
  specialty?: string;
  confidence?: number;
}

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const token = getToken();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || !token) return;
    
    const userMsg = input.trim();
    setMessages((msgs) => [...msgs, { sender: "user", text: userMsg }]);
    setLoading(true);
    setInput("");

    try {
      const res = await apiPostAuth<SymptomCheckResponse>(
        "/ai/symptom-check",
        { symptoms: userMsg },
        token
      );
      
      setMessages((msgs) => [
        ...msgs,
        { 
          sender: "bot", 
          text: res.result || "Assessment complete.",
          specialty: res.recommendedSpecialty,
          confidence: res.confidenceScore
        },
      ]);
    } catch (err: any) {
      setMessages((msgs) => [
        ...msgs, 
        { 
          sender: "bot", 
          text: err.message || "I apologize, but my diagnostic engine is temporarily unavailable. Access the Health Intelligence center on your dashboard for prioritized care." 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] font-[family-name:var(--font-geist-sans)]">
      {/* Toggle Button */}
      <button
        className={`group relative h-16 w-16 overflow-hidden rounded-[1.5rem] bg-slate-900 border border-slate-800 shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 flex items-center justify-center ${
          open ? "rotate-90 opacity-0 scale-50 pointer-events-none" : "opacity-100 scale-100"
        }`}
        onClick={() => setOpen(true)}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Bot className="h-8 w-8 text-blue-500 group-hover:text-blue-400 transition-colors" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-pulse" />
      </button>

      {/* Chat Window */}
      <div
        className={`absolute bottom-0 right-0 w-[400px] max-w-[90vw] origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          open 
            ? "translate-y-0 scale-100 opacity-100 pointer-events-auto" 
            : "translate-y-10 scale-90 opacity-0 pointer-events-none"
        }`}
      >
        <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl flex flex-col h-[600px] max-h-[80vh] relative">
          
          {/* Header */}
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-xl bg-blue-500 animate-ping opacity-20" />
                <div className="relative h-10 w-10 rounded-xl bg-blue-600 border border-blue-400 flex items-center justify-center text-white shadow-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Clinical Intelligence</h3>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Neural Care Engine Active</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all active:scale-90"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/30"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4">
                <div className="h-16 w-16 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300">
                  <Activity className="h-8 w-8" />
                </div>
                {!token ? (
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-red-500">Authentication Required</p>
                    <p className="text-sm font-medium text-slate-600">
                      Please sign in to access Clinical Intelligence diagnostics.
                    </p>
                    <a href="/login" className="inline-block px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-colors">
                      Go to Login
                    </a>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Diagnostic Portal</p>
                      <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
                        Welcome. Describe your symptoms in natural language for a preliminary clinical assessment and specialist recommendation.
                      </p>
                    </div>
                    <div className="pt-4 grid grid-cols-2 gap-2 w-full">
                      <QuickSuggestion icon={<Stethoscope className="w-3 h-3"/>} text="Abdominal Pain" onClick={() => setInput("I've been having sharp pains in my upper abdomen for 2 days.")}/>
                      <QuickSuggestion icon={<Activity className="w-3 h-3"/>} text="Constant Headache" onClick={() => setInput("I have a persistent headache and sensitivity to light.")}/>
                    </div>
                  </>
                )}
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start animate-in fade-in slide-in-from-left-2 duration-300"}`}>
                  <div className="flex items-center gap-2 mb-1.5 px-1">
                    {msg.sender === "bot" ? (
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> CareLabs Intelligence
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Identity Protocol</span>
                    )}
                  </div>
                  <div 
                    className={`max-w-[85%] px-5 py-4 text-sm shadow-sm ${
                      msg.sender === "user" 
                        ? "bg-blue-600 text-white rounded-[1.5rem] rounded-tr-none font-medium" 
                        : "bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] rounded-tl-none leading-relaxed font-medium"
                    }`}
                  >
                    {msg.text}
                    {msg.specialty && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                         <div className="flex items-center gap-.5 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Path Selection:</span>
                            <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                               <Stethoscope className="w-3.5 h-3.5" /> {msg.specialty}
                            </span>
                         </div>
                         {msg.confidence && (
                            <div className="flex items-center gap-3">
                               <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-blue-500 rounded-full" style={{ width: `${msg.confidence}%` }} />
                               </div>
                               <span className="text-[9px] font-black text-blue-600 shrink-0">{msg.confidence}% Confidence</span>
                            </div>
                         )}
                         <button className="w-full mt-2 py-3 bg-slate-900 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                            Secure Referral <ArrowRight className="w-3 h-3" />
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex items-center gap-2 p-2 px-4 rounded-full bg-slate-100 border border-slate-200 w-fit animate-pulse">
                <Terminal className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Processing Neural Signals...</span>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="relative group/form"
            >
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 pr-14 text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                placeholder="Ex. 'Steady fatigue and joint pain'..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg active:scale-90 disabled:opacity-50 disabled:active:scale-100 transition-all hover:bg-blue-600"
                disabled={loading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-3 text-[9px] font-medium text-slate-400 text-center uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck className="h-3 w-3" /> Secure End-to-End Clinical Encryption
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

function QuickSuggestion({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group/sugg text-left"
    >
      <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/sugg:text-blue-600 group-hover/sugg:bg-white transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-600">{text}</span>
    </button>
  );
}
