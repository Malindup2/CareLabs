"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import PatientSidebar from "@/components/PatientSidebar";
import FloatingChatbot from "@/components/FloatingChatbot";
import { apiGetAuth, clearAuth, getToken } from "@/lib/api";
import NotificationBell from "@/components/NotificationBell";

const routeTitles: Record<string, string> = {
  "/patient/dashboard": "Dashboard",
  "/patient/appointments": "Appointments",
  "/patient/profile": "Profile",
  "/patient/medical-history": "Medical History",
  "/patient/allergies": "Allergies",
  "/patient/reports": "Reports",
  "/patient/ai-assessment": "Health Intelligence Center",
};

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [now, setNow] = useState(new Date());
  const [patientName, setPatientName] = useState<string | null>(null);
  const token = getToken();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;
      try {
        const profile = await apiGetAuth<{ fullName?: string | null }>("/patients/me", token);
        setPatientName(profile.fullName || "Patient");
      } catch {
        setPatientName("Patient");
      }
    };
    loadProfile();
  }, [token]);

  const pageTitle = useMemo(() => routeTitles[pathname] ?? "Patient Portal", [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <PatientSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{pageTitle}</h1>
            <p className="text-xs font-semibold text-blue-700">
              {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} • {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col items-start sm:items-end gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Welcome back</p>
              <p className="text-sm font-bold text-slate-900">{patientName || "Patient"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">PT</div>
            <NotificationBell />
            <button
              type="button"
              onClick={() => { clearAuth(); window.location.href = "/login"; }}
              className="rounded-2xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto px-6 py-6 md:px-8 md:py-8">{children}</main>
      </div>
      <FloatingChatbot />
    </div>
  );
}
