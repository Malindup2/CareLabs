"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGetAuth, clearAuth, getToken } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";

interface PatientProfile {
  id: string;
  userId: string;
  fullName?: string | null;
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [now, setNow] = useState(new Date());
  const token = getToken();

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setLoadingProfile(false);
        return;
      }

      try {
        const profile = await apiGetAuth<PatientProfile>("/patients/me", token);
        setPatient(profile);
      } catch {
        setPatient(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [token]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const stats = useMemo(
    () => ({
      appointments: 0,
      upcoming: 0,
      completed: 0,
      reports: 0,
    }),
    [],
  );

  const displayName = patient?.fullName ? patient.fullName : "Patient";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <div className="col-span-1 xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="text-sm font-semibold text-slate-500">Total Appointments</div>
            <div className="text-4xl font-bold text-slate-900">{stats.appointments}</div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Your appointment activity</div>
          </div>

          <div className="col-span-1 xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="text-sm font-semibold text-slate-500">Upcoming</div>
            <div className="text-4xl font-bold text-slate-900">{stats.upcoming}</div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Appointments scheduled soon</div>
          </div>

          <div className="col-span-1 xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="text-sm font-semibold text-slate-500">Completed</div>
            <div className="text-4xl font-bold text-slate-900">{stats.completed}</div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Past consultations</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Upcoming Appointments</p>
                <p className="text-sm text-slate-500">Review your next scheduled visits.</p>
              </div>
              <Link href="/appointments" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition">
                View all
              </Link>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
              No upcoming appointments yet.
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">AI Symptom Checker</p>
                <p className="text-sm text-slate-500">Quickly assess symptoms and find the right care path.</p>
              </div>
              <Link href="#ai" className="inline-flex items-center gap-2 rounded-full border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition">
                Open checker
              </Link>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">
              No recent checks. Use the chatbot to start your first assessment.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Medical Reports</div>
            <p className="mt-2 text-slate-500">Upload and manage your documents.</p>
            <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-400">No reports uploaded yet.</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Profile quick links</div>
            <div className="mt-4 grid gap-3">
              <Link href="/patient/profile" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition">Edit profile</Link>
              <Link href="/patient/allergies" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition">Manage allergies</Link>
              <Link href="/patient/medical-history" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition">View medical history</Link>
            </div>
          </div>
        </div>
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        cancelLabel="Cancel"
        confirmLabel="Yes, Logout"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          clearAuth();
          router.replace("/login");
        }}
      />
    </div>
  );
}
