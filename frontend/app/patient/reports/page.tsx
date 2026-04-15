"use client";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
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
      toast.success("Report uploaded");
      fileInputRef.current.value = "";
      setSelectedFileName("");
      fetchReports();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Delete this report?")) return;
    try {
      await apiDeleteAuth(`/patients/reports/${id}`, token);
      toast.success("Report deleted");
      fetchReports();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Medical Reports</p>
            <h1 className="mt-3 text-3xl font-black text-slate-900 tracking-tight">Your medical record library</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Upload, review and manage your lab reports, prescriptions, and radiology documents.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4 text-sm font-semibold text-slate-700">
            {reports.length} report{reports.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Upload new report</p>
          <form onSubmit={handleUpload} className="mt-6 space-y-6">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Report File</label>
              <label className="group block cursor-pointer rounded-[2rem] border-2 border-dashed border-slate-300 bg-white px-5 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-500/10 text-blue-600 grid place-items-center text-2xl">
                  📎
                </div>
                <p className="text-sm font-semibold text-slate-900">Click to select a file</p>
                <p className="mt-2 text-xs text-slate-500">PDF, JPG, PNG up to 10MB</p>
                {selectedFileName && (
                  <p className="mt-3 text-xs font-semibold text-slate-700">Selected: {selectedFileName}</p>
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
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ReportType)}
                className="w-full rounded-[2rem] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-900"
                required
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Report"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm text-slate-500">Loading...</div>
          ) : reports.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm text-slate-500">No reports found. Upload a report to keep your health record complete.</div>
          ) : (
            <div className="space-y-4">
              {reports.map((r) => (
                <div key={r.id} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xl font-bold text-slate-900 hover:text-blue-600 transition"
                      >
                        {r.fileName}
                      </a>
                      <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-500">{r.type}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="rounded-2xl bg-rose-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-rose-700 hover:bg-rose-200 transition"
                      >
                        Delete
                      </button>
                      <span className="rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                        View
                      </span>
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
