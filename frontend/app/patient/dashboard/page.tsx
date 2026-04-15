"use client";

import React, { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Clock,
  CheckCircle2,
  CalendarDays,
  FileText,
  User,
  ShieldAlert,
  ArrowRight,
  Stethoscope,
  TrendingUp,
  Plus,
} from "lucide-react";
import { apiGetAuth, clearAuth, getToken } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";

interface PatientProfile {
  id: string;
  userId: string;
  fullName?: string | null;
}

interface Appointment {
  id: string;
  patientId: string;
  status: string;
  appointmentTime: string;
  type: string;
  doctorFullName?: string;
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const token = getToken();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        router.replace("/login");
        return;
      }

      setLoading(true);
      try {
        const profile = await apiGetAuth<PatientProfile>("/patients/me", token);
        setPatient(profile);

        const appts = await apiGetAuth<Appointment[]>(`/appointments/patient/${profile.userId}`, token);
        setAppointments(appts);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [token, router]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const upcoming = appointments.filter((a) => ["PENDING", "CONFIRMED", "ACCEPTED"].includes(a.status)).length;
    const completed = appointments.filter((a) => a.status === "COMPLETED").length;
    return { total, upcoming, completed };
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    return appointments
      .filter((a) => ["PENDING", "CONFIRMED", "ACCEPTED"].includes(a.status))
      .sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime())
      .slice(0, 3);
  }, [appointments]);

  const displayName = patient?.fullName || "Patient";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard
          title="Total Visits"
          value={String(stats.total)}
          subtitle="Care History"
          icon={<Activity className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          title="Upcoming"
          value={String(stats.upcoming)}
          subtitle="Scheduled"
          icon={<Clock className="w-5 h-5 text-indigo-500" />}
        />
        <StatCard
          title="Completed"
          value={String(stats.completed)}
          subtitle="Past Care"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          title="Clinical Reports"
          value="View"
          subtitle="Uploaded Evidence"
          icon={<FileText className="w-5 h-5 text-amber-500" />}
          onClick={() => router.push("/patient/reports")}
        />
        <StatCard
          title="Profile Health"
          value="100%"
          subtitle="Digital Identity"
          icon={<User className="w-5 h-5 text-fuchsia-500" />}
          onClick={() => router.push("/patient/profile")}
        />
        <StatCard
          title="Allergies"
          value="Alerts"
          subtitle="Safety Check"
          icon={<ShieldAlert className="w-5 h-5 text-rose-500" />}
          onClick={() => router.push("/patient/allergies")}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Upcoming Appointments Section */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Care Pipeline</h2>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Upcoming Clinical Sessions</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/doctors"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Book New
              </Link>
              <Link
                href="/appointments"
                className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all active:scale-95"
              >
                View Full Schedule
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="group/item border border-slate-200 bg-slate-50/50 rounded-3xl p-5 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm group-hover/item:scale-110 transition-transform">
                        <CalendarDays className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-none">
                          {new Date(appt.appointmentTime).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                          {new Date(appt.appointmentTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" • "}
                          {appt.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">Dr. {appt.doctorFullName || "Consultant"}</p>
                      <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                        {appt.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No Upcoming Sessions</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / AI Checker */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Health Intelligence</h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">AI-Powered Care Path</p>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] relative group/ai overflow-hidden">
              <div className="relative z-10">
                <Stethoscope className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="text-lg font-black text-slate-900 leading-tight">Symptom Checker</h3>
                <p className="mt-2 text-xs font-medium text-slate-600 leading-relaxed">
                  Quickly assess your symptoms using our advanced clinical AI to find the right specialist.
                </p>
                <Link
                  href="#ai"
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
                >
                  Start Assessment <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-400/20 rotate-12" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Link
                href="/patient/profile"
                className="flex items-center justify-between p-4 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group/link"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 group-hover/link:text-blue-500 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-700">Digital Identity</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover/link:text-blue-500 group-hover/link:translate-x-1 transition-all" />
              </Link>
              <Link
                href="/patient/medical-history"
                className="flex items-center justify-between p-4 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group/link"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 group-hover/link:text-emerald-500 transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-700">Health Ledger</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover/link:text-emerald-500 group-hover/link:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group aspect-square flex flex-col justify-between items-center text-center ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />

      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full gap-2">
        <div className="p-3 shadow-sm bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-white group-hover:scale-110 transition-all duration-300 mb-1">
          {icon}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight leading-none">{value}</p>
        </div>

        {subtitle && (
          <p className="mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

