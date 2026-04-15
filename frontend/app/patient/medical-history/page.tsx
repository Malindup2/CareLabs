"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { 
  ShieldAlert, 
  FileText, 
  User, 
  Phone, 
  Calendar, 
  Activity, 
  TrendingUp, 
  Dna,
  ArrowRight,
  Stethoscope,
  Clock,
  ExternalLink
} from "lucide-react";
import { apiGetAuth, getToken } from "@/lib/api";

type Gender = "MALE" | "FEMALE" | "OTHER";
type AllergyType = "MEDICINE" | "FOOD" | "ENVIRONMENTAL";
type AllergySeverity = "MILD" | "MODERATE" | "SEVERE";
type ReportType = "LAB" | "XRAY" | "PRESCRIPTION" | "OTHER";

interface PatientProfile {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  addressLine1: string;
  city: string;
  district: string;
}
interface Allergy {
  id: string;
  allergen: string;
  type: AllergyType;
  severity: AllergySeverity;
  reaction: string;
}
interface Report {
  id: string;
  fileName: string;
  fileUrl: string;
  type: ReportType;
}
interface MedicalHistory {
  profile: PatientProfile;
  allergies: Allergy[];
  reports: Report[];
}

export default function MedicalHistoryPage() {
  const [history, setHistory] = useState<MedicalHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  const fetchHistory = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiGetAuth<MedicalHistory>("/patients/medical-history", token);
      setHistory(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load medical history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line
  }, []);

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );

  if (!history) return (
    <div className="p-8 rounded-[2.5rem] bg-rose-50 border border-rose-100 text-rose-700">
      <p className="font-black uppercase tracking-widest text-xs">Registry Error</p>
      <p className="mt-2 font-bold">No unified health record could be retrieved.</p>
    </div>
  );

  const initials = history.profile.fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-blue-500 transition-colors">Unified Health Record</p>
            <h1 className="mt-3 text-4xl font-black text-slate-900 tracking-tight">Clinical Care Ledger</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 leading-relaxed">
              A comprehensive synchronized view of your clinical profile, verified sensitivities, and uploaded diagnostic evidence.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 px-6 py-4 flex items-center gap-3 shadow-xl">
            <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white">
              {history.allergies.length} Flagged Sensitivities
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center group">
            <div className="h-32 w-32 rounded-[3.5rem] bg-slate-50 border-4 border-white shadow-xl grid place-items-center text-4xl font-black text-slate-900 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
              {initials || "P"}
            </div>
            <div className="mt-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{history.profile.fullName}</h2>
              <div className="mt-4 flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600">
                <Dna className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Active Patient Profile</span>
              </div>
            </div>
            <div className="w-full mt-10 space-y-3">
              <QuickInfoCard icon={<Phone className="w-4 h-4" />} label="Identity Line" value={history.profile.phone} />
              <QuickInfoCard icon={<Calendar className="w-4 h-4" />} label="Birth Protocol" value={history.profile.dateOfBirth} />
              <QuickInfoCard icon={<User className="w-4 h-4" />} label="Gender Index" value={history.profile.gender} />
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-blue-600 text-white relative overflow-hidden group">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:bg-white/30 transition-colors" />
             <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 relative z-10">Care Analysis</p>
             <h3 className="mt-4 text-xl font-black tracking-tight relative z-10 leading-tight">Your medical history is vital for accurate diagnosis.</h3>
             <p className="mt-4 text-xs font-medium text-blue-100/80 relative z-10 leading-relaxed">Regularly update your reports and sensitivities to ensure the highest safety during clinical sessions.</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform shadow-sm">
                    <ShieldAlert className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Sensitivities</h2>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Verified Clinical Alerts</p>
                 </div>
              </div>
              <span className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {history.allergies.length} Records
              </span>
            </div>
            
            {history.allergies.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 flex flex-col items-center justify-center text-center">
                 <ShieldAlert className="w-12 h-12 text-slate-200 mb-4" />
                 <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No Historical Sensitivities Registered</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {history.allergies.map((a) => (
                  <div key={a.id} className="group/item relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/50 p-6 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-4">
                         <div className="mt-1 h-2 w-2 rounded-full bg-rose-500 group-hover/item:animate-ping" />
                         <div>
                            <p className="text-lg font-black text-slate-900 tracking-tight leading-none">{a.allergen}</p>
                            <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed italic">"{a.reaction || "No reaction protocol specified"}"</p>
                         </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600">{a.type}</span>
                        <span className={`rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${
                          a.severity === 'SEVERE' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200' : 'bg-white border-slate-200 text-slate-600'
                        }`}>{a.severity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                    <FileText className="w-6 h-6" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Diagnostic Evidence</h2>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Clinical Artifact Repository</p>
                 </div>
              </div>
              <span className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {history.reports.length} Files
              </span>
            </div>

            {history.reports.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50 flex flex-col items-center justify-center text-center">
                 <FileText className="w-12 h-12 text-slate-200 mb-4" />
                 <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No Diagnostic Artifacts Uploaded</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {history.reports.map((r) => (
                  <a
                    key={r.id}
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/report flex items-center justify-between gap-6 rounded-3xl border border-slate-200 bg-slate-50/50 p-6 hover:bg-white hover:border-blue-500 hover:shadow-xl hover:shadow-blue-200 transition-all duration-300"
                  >
                    <div className="flex items-center gap-5">
                       <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/report:text-blue-500 transition-colors shadow-sm">
                          <FileText className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-base font-black text-slate-900 tracking-tight leading-none group-hover/report:text-blue-600 transition-colors">{r.fileName}</p>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">{r.type}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 opacity-0 group-hover/report:opacity-100 transition-all font-black uppercase text-[10px] tracking-widest">
                       Access Evidence <ExternalLink className="w-4 h-4" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickInfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100 group/card border-transparent hover:bg-white hover:border-slate-200 hover:shadow-md transition-all">
      <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/card:text-blue-600 shadow-sm transition-colors">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-sm font-black text-slate-900 mt-0.5">{value || "UNSPECIFIED"}</p>
      </div>
    </div>
  );
}

