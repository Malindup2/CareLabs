"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Stethoscope, 
  Activity, 
  ArrowRight, 
  ShieldCheck, 
  Search, 
  History,
  TrendingUp,
  Brain,
  Terminal,
  AlertCircle,
  Clock,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { apiPostAuth, getToken } from "@/lib/api";

interface SymptomCheckResponse {
  result: string;
  confidenceScore?: number;
  recommendedSpecialty?: string;
}

export default function AiAssessmentPage() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SymptomCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{ query: string; time: Date }[]>([]);
  const token = getToken();

  const handleAssessment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!symptoms.trim() || !token) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiPostAuth<SymptomCheckResponse>(
        "/ai/symptom-check",
        { symptoms },
        token
      );
      setResult(res);
      setHistory(prev => [{ query: symptoms, time: new Date() }, ...prev.slice(0, 4)]);
    } catch (err: any) {
      setError(err.message || "The clinical diagnostic engine is currently unavailable. Please try again or consult a general practitioner.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/10 to-transparent" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/20">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Next-Gen Clinical AI</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight leading-none">
              Diagnostic <br /> <span className="text-blue-500">Intelligence</span> Center
            </h1>
            <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
              Describe your symptoms in natural language. Our neural engine analyzes thousands of clinical patterns to provide preliminary health guidance and recommend the most suitable specialists.
            </p>
          </div>
          
          <div className="w-full md:w-80 group">
             <div className="relative p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl overflow-hidden">
                <Brain className="w-12 h-12 text-blue-500 mb-6 group-hover:scale-110 transition-transform duration-500" />
                <h3 className="text-lg font-black uppercase tracking-widest">Neural Status</h3>
                <div className="mt-4 space-y-3">
                   <StatusItem label="API Connectivity" active />
                   <StatusItem label="Clinical Database" active />
                   <StatusItem label="Encryption Layer" active />
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Input Section */}
        <div className="xl:col-span-2 space-y-8">
           <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-slate-50 rounded-full -z-0" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Symptom Description</h2>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Detailed Clinical Input</p>
                  </div>
                  <History className="w-5 h-5 text-slate-300" />
                </div>

                <form onSubmit={handleAssessment} className="space-y-6">
                  <div className="relative group">
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      placeholder="Ex: 'I have been experiencing sharp intermittent chest pain for the last 4 hours, accompanied by mild dizziness...'"
                      className="w-full h-48 rounded-[2rem] bg-slate-50 border border-slate-200 p-8 text-lg font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300 resize-none"
                    />
                    <div className="absolute right-6 bottom-6 flex items-center gap-3">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min 10 characters</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                     <div className="flex items-center gap-2 text-emerald-600">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Private & Encrypted</span>
                     </div>
                     <button
                       type="submit"
                       disabled={loading || symptoms.length < 10}
                       className="w-full sm:w-auto px-10 py-5 bg-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-white hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-30 disabled:active:scale-100 flex items-center justify-center gap-3"
                     >
                       {loading ? "Processing Assessment..." : "Begin Neural Analysis"}
                       <ArrowRight className="w-4 h-4" />
                     </button>
                  </div>
                </form>
              </div>
           </div>

           {/* Results Area */}
           {loading && (
             <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 shadow-sm flex flex-col items-center justify-center text-center space-y-8 animate-pulse">
                <div className="relative h-24 w-24">
                   <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
                   <div className="relative h-24 w-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-blue-500">
                      <Terminal className="w-10 h-10" />
                   </div>
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Deconstructing Symptoms</h3>
                   <p className="text-sm font-medium text-slate-400">Mapping descriptors against clinical registry v4.2...</p>
                </div>
             </div>
           )}

           {error && (
             <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 flex items-start gap-6 animate-in slide-in-from-top-4">
                <div className="bg-rose-500 text-white p-3 rounded-2xl shadow-lg shadow-rose-500/20">
                   <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                   <h3 className="text-lg font-black text-rose-900 uppercase tracking-tight">System Fault</h3>
                   <p className="text-rose-700/80 font-medium">{error}</p>
                </div>
             </div>
           )}

           {result && (
             <div className="grid gap-8 animate-in zoom-in-95 duration-500">
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                   </div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-6">Assessment Summary</h2>
                   <div className="prose prose-slate max-w-none">
                      <p className="text-xl font-medium text-slate-700 leading-relaxed italic border-l-4 border-blue-500 pl-8 py-2">
                        "{result.result}"
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Pathology Confidence</h3>
                      <div className="flex flex-col items-center justify-center py-4 space-y-6">
                         <div className="relative h-32 w-32 flex items-center justify-center">
                            <svg className="h-full w-full rotate-[-90deg]">
                               <circle cx="64" cy="64" r="58" className="stroke-slate-100 fill-none" strokeWidth="12" />
                               <circle cx="64" cy="64" r="58" className="stroke-blue-500 fill-none transition-all duration-1000" strokeWidth="12" strokeDasharray="364.4" strokeDashoffset={364.4 - (364.4 * (result.confidenceScore || 70)) / 100} strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-3xl font-black text-slate-900">{result.confidenceScore || 70}%</span>
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">
                            Based on described intensity and duration
                         </p>
                      </div>
                   </div>

                   <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                      <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-6">Recommended Action</h3>
                      <div className="space-y-6 relative z-10">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Target Specialty</p>
                            <div className="flex items-center gap-3">
                               <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400">
                                  <Stethoscope className="w-6 h-6" />
                               </div>
                               <span className="text-2xl font-black">{result.recommendedSpecialty || "General Physician"}</span>
                            </div>
                         </div>
                         <button 
                           onClick={() => router.push(`/appointments`)}
                           className="w-full py-4 bg-blue-600 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-blue-500 transition-all flex items-center justify-center gap-3"
                         >
                           Secure Specialist Slot <ArrowRight className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Sidebar / Info */}
        <div className="space-y-8">
           <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">Analysis Guidelines</h2>
              <div className="space-y-6">
                 <GuidelineItem icon={<TrendingUp className="text-blue-500" />} title="Describe Changes" text="Mention when symptoms started and if they are worsening." />
                 <GuidelineItem icon={<Clock className="text-amber-500" />} title="Duration Matters" text="Specific timeframes help increase neural confidence scores." />
                 <GuidelineItem icon={<Activity className="text-rose-500" />} title="Physical Triggers" text="Note what makes the symptoms better or worse." />
              </div>
           </div>

           <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Recent Sessions</h3>
                <Terminal className="w-4 h-4 text-slate-300" />
              </div>
              <div className="space-y-3">
                 {history.length > 0 ? history.map((h, i) => (
                    <div key={i} className="bg-white border border-slate-200 p-4 rounded-[1.5rem] flex items-center justify-between group cursor-pointer hover:border-blue-200 transition-all">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{h.query}</span>
                          <span className="text-[9px] font-medium text-slate-400">{h.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       </div>
                       <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-500 transition-colors" />
                    </div>
                 )) : (
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 text-center py-6">No session history</p>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function StatusItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <div className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-slate-700"}`} />
    </div>
  );
}

function GuidelineItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 leading-none">{title}</h4>
        <p className="mt-1.5 text-xs text-slate-400 leading-relaxed font-medium">{text}</p>
      </div>
    </div>
  );
}
