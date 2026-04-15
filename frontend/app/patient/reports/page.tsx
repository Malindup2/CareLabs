"use client";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  CloudUpload,
  FileText,
  Trash2,
  Eye,
  Activity,
  Search,
  RefreshCw,
  X,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
  FilePlus,
  ArrowUpCircle
} from "lucide-react";
import {
  apiGetAuth,
  apiPostAuthFormData,
  apiDeleteAuth,
  getToken,
} from "@/lib/api";

type ReportType = "LAB" | "XRAY" | "PRESCRIPTION" | "OTHER";

interface Report {
  id: string;
  fileName: string;
  fileUrl: string;
  type: ReportType;
}

const REPORT_TYPES: ReportType[] = ["LAB", "XRAY", "PRESCRIPTION", "OTHER"];

export default function MedicalReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState<ReportType>("LAB");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = getToken();

  const fetchReports = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiGetAuth<Report[]>("/patients/reports", token);
      setReports(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !fileInputRef.current?.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    const selectedFile = fileInputRef.current.files[0];
    formData.append("file", selectedFile);
    formData.append("type", type);
    try {
      await apiPostAuthFormData<Report>("/patients/reports", formData, token);
      toast.success("Diagnostic artifact registered");
      fileInputRef.current.value = "";
      setSelectedFileName("");
      fetchReports();
    } catch (err: any) {
      toast.error(err.message || "Registry synchronization failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Delete this diagnostic artifact?")) return;
    try {
      await apiDeleteAuth(`/patients/reports/${id}`, token);
      toast.success("Artifact revoked");
      fetchReports();
    } catch (err: any) {
      toast.error(err.message || "Revocation failed");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-blue-500 transition-colors">Diagnostic Evidence Library</p>
            <h1 className="mt-3 text-4xl font-black text-slate-900 tracking-tight">Clinical Artifact Repository</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 leading-relaxed">
              Securely store and manage your high-fidelity medical records, including laboratory diagnostics, radiology imaging, and pharmaceutical protocols.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-900 border border-slate-800 px-6 py-4 flex items-center gap-3 shadow-xl">
             <FilePlus className="w-5 h-5 text-blue-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-white">
                {reports.length} Registered Documents
             </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm group">
            <div className="flex items-center gap-3 mb-8">
               <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                  <CloudUpload className="w-6 h-6" />
               </div>
               <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Evidence Ingest</h2>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">Initialize Registry Upload</p>
               </div>
            </div>
            
            <form onSubmit={handleUpload} className="space-y-8">
              <div className="space-y-4">
                <label className="group block cursor-pointer rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center transition-all hover:bg-white hover:border-blue-500 hover:shadow-xl hover:shadow-blue-200/50">
                  <div className="mx-auto mb-6 h-16 w-16 rounded-[2rem] bg-white border border-slate-100 text-slate-400 group-hover:text-blue-600 shadow-sm grid place-items-center transition-colors">
                     <FilePlus className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-black text-slate-900 tracking-tight">Select Diagnostic Artifact</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">PDF, JPG, PNG (Max 10MB)</p>
                  {selectedFileName && (
                    <div className="mt-6 flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                       <ShieldCheck className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-full">{selectedFileName}</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name || "")}
                    className="hidden"
                    required
                  />
                </label>
              </div>

              <div className="space-y-2 px-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block">Classification Category</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ReportType)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none"
                  required
                >
                  {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-[2rem] bg-slate-900 px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Synchronizing...
                  </>
                ) : (
                  <>
                    Commence Registry Upload <ArrowUpCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {loading ? (
             <div className="flex h-64 items-center justify-center rounded-[2.5rem] border border-slate-200 bg-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
             </div>
          ) : reports.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center opacity-50 bg-white border border-slate-200 rounded-[2.5rem]">
               <LayoutDashboard className="w-16 h-16 text-slate-200 mb-6" />
               <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 tracking-[0.3em]">No Diagnostic Artifacts Found</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {reports.map((r) => (
                <div key={r.id} className="group/item relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/item:text-blue-500 transition-colors shadow-sm">
                          <FileText className="w-8 h-8" />
                       </div>
                       <div>
                          <p className="text-xl font-black text-slate-900 tracking-tight leading-none group-hover/item:text-blue-600 transition-colors">{r.fileName}</p>
                          <div className="mt-3 flex items-center gap-3">
                             <span className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">{r.type}</span>
                             <span className="h-1 w-1 rounded-full bg-slate-300" />
                             <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">ID: {r.id.slice(0, 8).toUpperCase()}</span>
                          </div>
                       </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-3">
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-12 px-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-50 hover:border-blue-300 transition-all active:scale-95 shadow-sm"
                      >
                         <Eye className="w-4 h-4" /> View
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

