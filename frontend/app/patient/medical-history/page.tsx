"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
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

  if (loading) return <div>Loading...</div>;
  if (!history) return <div className="text-rose-600">No medical history found.</div>;

  const initials = history.profile.fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Medical History</p>
            <h1 className="mt-3 text-3xl font-black text-slate-900 tracking-tight">Your health record overview</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              A patient-centered view of your profile, allergies, and uploaded medical reports.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 px-5 py-4 text-sm font-semibold text-slate-700">
            {history.allergies.length} allergy {history.allergies.length === 1 ? "record" : "records"}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex flex-col items-center text-center gap-5">
            <div className="h-28 w-28 rounded-[2.5rem] bg-slate-200 border border-slate-200 grid place-items-center text-4xl font-black text-slate-500">
              {initials || "P"}
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{history.profile.fullName}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-blue-600 mt-2">Patient</p>
            </div>
            <div className="w-full space-y-4 text-sm text-slate-600">
              <div className="rounded-3xl bg-white border border-slate-200 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Phone</p>
                <p className="font-bold text-slate-900 mt-2">{history.profile.phone || "-"}</p>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Date of Birth</p>
                <p className="font-bold text-slate-900 mt-2">{history.profile.dateOfBirth || "-"}</p>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Gender</p>
                <p className="font-bold text-slate-900 mt-2">{history.profile.gender || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm font-semibold text-slate-900">Allergies</p>
                <p className="text-sm text-slate-500">Your known sensitivities and reactions.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                {history.allergies.length} total
              </span>
            </div>
            {history.allergies.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">No allergies recorded.</div>
            ) : (
              <div className="grid gap-4">
                {history.allergies.map((a) => (
                  <div key={a.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-lg font-bold text-slate-900">{a.allergen}</p>
                        <p className="text-sm text-slate-500 mt-1">{a.reaction || "No reaction details"}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{a.type}</span>
                        <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{a.severity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm font-semibold text-slate-900">Medical Reports</p>
                <p className="text-sm text-slate-500">Uploaded documents associated with your care.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                {history.reports.length} files
              </span>
            </div>
            {history.reports.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">No reports uploaded yet.</div>
            ) : (
              <div className="space-y-4">
                {history.reports.map((r) => (
                  <a
                    key={r.id}
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{r.fileName}</p>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-500 mt-1">{r.type}</p>
                    </div>
                    <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">View</span>
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
