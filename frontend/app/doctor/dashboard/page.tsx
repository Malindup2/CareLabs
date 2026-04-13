"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  User,
  FileCheck,
  CalendarDays,
  Stethoscope,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Activity,
  Video,
} from "lucide-react";
import {
  apiDeleteAuth,
  apiGetAuth,
  apiPostAuth,
  apiPostAuthFormData,
  apiPutAuth,
  clearAuth,
  getRole,
  getToken,
} from "@/lib/api";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
type DocumentType = "LICENSE" | "CERTIFICATE";
type AppointmentStatus = "PENDING" | "CONFIRMED" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
type AppointmentType = "IN_CLINIC" | "TELEMEDICINE";

interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string | null;
  specialty: string | null;
  bio: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  qualification: string | null;
  verificationStatus: VerificationStatus;
  active: boolean;
  averageRating?: number;
  totalReviews?: number;
}

interface DoctorDocument {
  id: string;
  doctorId: string;
  documentUrl: string;
  type: DocumentType;
  status: VerificationStatus;
}

interface Availability {
  id?: string;
  doctorId?: string;
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  startTime: string;
  endTime: string;
  slotDuration: number;
}

interface DoctorLeave {
  id?: string;
  doctorId?: string;
  leaveDate: string;
  reason: string;
}

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentTime: string;
  durationMinutes: number;
  status: AppointmentStatus;
  type: AppointmentType;
  reason: string;
  consultationFee: number;
}

interface ConsultationNote {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  chiefComplaint: string;
  clinicalNotes: string;
  diagnosis: string;
}

interface PrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
}

interface Prescription {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  validUntil: string;
  notes: string;
  items: PrescriptionItem[];
}

const dayOptions: Availability["dayOfWeek"][] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const statusOptions: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ACCEPTED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
];

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "profile" | "verification" | "schedule" | "appointments" | "earnings">("overview");
  const [now, setNow] = useState(new Date());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [documents, setDocuments] = useState<DoctorDocument[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    specialty: "",
    bio: "",
    experienceYears: "",
    consultationFee: "",
    qualification: "",
  });

  const [docType, setDocType] = useState<DocumentType>("LICENSE");
  const [docFile, setDocFile] = useState<File | null>(null);

  const [availabilityForm, setAvailabilityForm] = useState<Availability>({
    dayOfWeek: "MONDAY",
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30,
  });

  const [leaveForm, setLeaveForm] = useState<DoctorLeave>({
    leaveDate: "",
    reason: "",
  });

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
  const [statusToSet, setStatusToSet] = useState<AppointmentStatus>("CONFIRMED");
  const [meetingLink, setMeetingLink] = useState<string>("");

  const [consultationNote, setConsultationNote] = useState({
    chiefComplaint: "",
    clinicalNotes: "",
    diagnosis: "",
  });

  const [prescription, setPrescription] = useState({
    validUntil: "",
    notes: "",
    medicineName: "",
    dosage: "",
    frequency: "",
    duration: "",
    route: "ORAL",
  });

  const appointmentStats = useMemo(() => {
    const total = appointments.length;
    const upcoming = appointments.filter((a) => ["PENDING", "CONFIRMED", "ACCEPTED"].includes(a.status)).length;
    const completed = appointments.filter((a) => a.status === "COMPLETED").length;
    const cancelled = appointments.filter((a) => ["CANCELLED", "REJECTED", "NO_SHOW"].includes(a.status)).length;
    return { total, upcoming, completed, cancelled };
  }, [appointments]);

  const completedAppointments = useMemo(() => appointments.filter((a) => a.status === "COMPLETED"), [appointments]);

  const earnings = useMemo(() => {
    const gross = completedAppointments.reduce((sum, a) => sum + (a.consultationFee || 0), 0);
    const upcomingValue = appointments
      .filter((a) => ["PENDING", "CONFIRMED", "ACCEPTED"].includes(a.status))
      .reduce((sum, a) => sum + (a.consultationFee || 0), 0);
    const estimatedNet = gross * 0.9;
    return { gross, upcomingValue, estimatedNet };
  }, [appointments, completedAppointments]);

  const appointmentMix = useMemo(() => {
    const telemedicine = appointments.filter((a) => a.type === "TELEMEDICINE").length;
    const inClinic = appointments.filter((a) => a.type === "IN_CLINIC").length;
    return { telemedicine, inClinic };
  }, [appointments]);

  const statusChart = useMemo(() => {
    const total = Math.max(appointments.length, 1);
    return [
      { key: "PENDING", label: "Pending", count: appointments.filter((a) => a.status === "PENDING").length, color: "bg-blue-500" },
      { key: "CONFIRMED", label: "Confirmed", count: appointments.filter((a) => a.status === "CONFIRMED").length, color: "bg-blue-400" },
      { key: "ACCEPTED", label: "Accepted", count: appointments.filter((a) => a.status === "ACCEPTED").length, color: "bg-cyan-500" },
      { key: "COMPLETED", label: "Completed", count: appointments.filter((a) => a.status === "COMPLETED").length, color: "bg-indigo-500" },
      { key: "CANCELLED", label: "Cancelled", count: appointments.filter((a) => ["CANCELLED", "REJECTED", "NO_SHOW"].includes(a.status)).length, color: "bg-slate-400" },
    ].map((item) => ({ ...item, percentage: Math.round((item.count / total) * 100) }));
  }, [appointments]);

  const statusPie = useMemo(() => {
    const slices = [
      { label: "Upcoming", count: appointmentStats.upcoming, color: "#3B82F6" },
      { label: "Completed", count: appointmentStats.completed, color: "#2563EB" },
      { label: "Cancelled", count: appointmentStats.cancelled, color: "#93C5FD" },
    ];

    const total = Math.max(slices.reduce((sum, item) => sum + item.count, 0), 1);
    let current = 0;
    const gradient = slices
      .filter((item) => item.count > 0)
      .map((item) => {
        const start = current;
        const size = (item.count / total) * 100;
        current += size;
        return `${item.color} ${start}% ${current}%`;
      })
      .join(", ");

    return {
      slices,
      gradient: gradient || "#CBD5E1 0% 100%",
    };
  }, [appointmentStats.completed, appointmentStats.cancelled, appointmentStats.upcoming]);

  const monthlyRevenue = useMemo(() => {
    const buckets = new Map<string, number>();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      buckets.set(key, 0);
    }

    completedAppointments.forEach((a) => {
      const d = new Date(a.appointmentTime);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) || 0) + (a.consultationFee || 0));
      }
    });

    return [...buckets.entries()].map(([key, value]) => {
      const [year, month] = key.split("-").map(Number);
      const label = new Date(year, month, 1).toLocaleString("en-US", { month: "short" });
      return { label, value };
    });
  }, [completedAppointments]);

  useEffect(() => {
    const role = getRole();
    const jwt = getToken();

    if (!jwt || role !== "DOCTOR") {
      toast.error("Please login as a doctor to continue.");
      router.replace("/login");
      return;
    }

    setToken(jwt);
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) return;

    const bootstrap = async () => {
      setLoading(true);
      try {
        const myProfile = await apiGetAuth<DoctorProfile>("/doctors/me", token);
        setProfile(myProfile);
        setProfileForm({
          fullName: myProfile.fullName ?? "",
          specialty: myProfile.specialty ?? "",
          bio: myProfile.bio ?? "",
          experienceYears: myProfile.experienceYears ? String(myProfile.experienceYears) : "",
          consultationFee: myProfile.consultationFee ? String(myProfile.consultationFee) : "",
          qualification: myProfile.qualification ?? "",
        });

        const [myDocuments, myAppointments] = await Promise.all([
          apiGetAuth<DoctorDocument[]>("/doctors/documents", token),
          apiGetAuth<Appointment[]>(`/appointments/doctor/${myProfile.id}`, token),
        ]);

        setDocuments(myDocuments);
        setAppointments(myAppointments);
      } catch (err: unknown) {
        const e = err as { message?: string };
        toast.error(e.message || "Failed to load doctor dashboard");
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [token]);

  const refreshAppointments = async () => {
    if (!token || !profile?.id) return;
    const rows = await apiGetAuth<Appointment[]>(`/appointments/doctor/${profile.id}`, token);
    setAppointments(rows);
  };

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      const updated = await apiPutAuth<DoctorProfile>(
        "/doctors/me",
        {
          fullName: profileForm.fullName,
          specialty: profileForm.specialty,
          bio: profileForm.bio,
          experienceYears: profileForm.experienceYears ? Number(profileForm.experienceYears) : null,
          consultationFee: profileForm.consultationFee ? Number(profileForm.consultationFee) : null,
          qualification: profileForm.qualification,
        },
        token,
      );
      setProfile(updated);
      toast.success("Profile updated.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to update profile");
    }
  };

  const handleUploadDocument = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !docFile) {
      toast.error("Please select a document file.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", docFile);
      formData.append("type", docType);
      const created = await apiPostAuthFormData<DoctorDocument>("/doctors/documents", formData, token);
      setDocuments((prev) => [created, ...prev]);
      setDocFile(null);
      toast.success("Document uploaded for verification.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Document upload failed");
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!token) return;
    try {
      await apiDeleteAuth(`/doctors/documents/${id}`, token);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to delete document");
    }
  };

  const handleAddAvailability = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await apiPostAuth<Availability>("/doctors/availability", availabilityForm, token);
      toast.success("Availability slot added.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to add availability");
    }
  };

  const handleAddLeave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await apiPostAuth<DoctorLeave>("/doctors/leave", leaveForm, token);
      setLeaveForm({ leaveDate: "", reason: "" });
      toast.success("Leave day recorded.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to add leave");
    }
  };

  const handleStatusUpdate = async () => {
    if (!token || !selectedAppointmentId) {
      toast.error("Select an appointment first.");
      return;
    }

    try {
      await apiPutAuth<Appointment>(`/appointments/${selectedAppointmentId}/status?status=${statusToSet}`, {}, token);
      await refreshAppointments();
      toast.success("Appointment status updated.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to update appointment status");
    }
  };

  const handleFetchMeetingLink = async () => {
    if (!token || !selectedAppointmentId) {
      toast.error("Select a telemedicine appointment first.");
      return;
    }

    try {
      const data = await apiGetAuth<{ meetingUrl: string }>(`/appointments/${selectedAppointmentId}/meeting-link`, token);
      setMeetingLink(data.meetingUrl);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to fetch meeting link");
    }
  };

  const handleSaveConsultationNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAppointmentId || !profile) {
      toast.error("Select an appointment first.");
      return;
    }

    const selected = appointments.find((a) => a.id === selectedAppointmentId);
    if (!selected) {
      toast.error("Appointment not found.");
      return;
    }

    const payload: ConsultationNote = {
      appointmentId: selectedAppointmentId,
      doctorId: profile.id,
      patientId: selected.patientId,
      chiefComplaint: consultationNote.chiefComplaint,
      clinicalNotes: consultationNote.clinicalNotes,
      diagnosis: consultationNote.diagnosis,
    };

    try {
      await apiPostAuth<ConsultationNote>(`/appointments/${selectedAppointmentId}/notes`, payload as unknown as Record<string, unknown>, token);
      toast.success("Consultation note saved.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to save note");
    }
  };

  const handleSavePrescription = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAppointmentId || !profile) {
      toast.error("Select an appointment first.");
      return;
    }

    const selected = appointments.find((a) => a.id === selectedAppointmentId);
    if (!selected) {
      toast.error("Appointment not found.");
      return;
    }

    const payload: Prescription = {
      appointmentId: selectedAppointmentId,
      doctorId: profile.id,
      patientId: selected.patientId,
      validUntil: prescription.validUntil,
      notes: prescription.notes,
      items: [
        {
          medicineName: prescription.medicineName,
          dosage: prescription.dosage,
          frequency: prescription.frequency,
          duration: prescription.duration,
          route: prescription.route,
        },
      ],
    };

    try {
      await apiPostAuth<Prescription>(`/appointments/${selectedAppointmentId}/prescriptions`, payload as unknown as Record<string, unknown>, token);
      toast.success("Prescription saved.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to save prescription");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex">
        <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col p-4 gap-4">
          <div className="h-8 w-28 rounded-lg bg-slate-800 animate-pulse" />
          <div className="space-y-2 mt-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-11 rounded-xl bg-slate-800/70 animate-pulse" />
            ))}
          </div>
        </aside>

        <div className="flex-1 p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <div className="h-8 w-48 rounded-xl bg-slate-200 animate-pulse" />
              <div className="h-4 w-72 rounded-xl bg-slate-200 animate-pulse" />
            </div>
            <div className="h-10 w-56 rounded-full bg-slate-200 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="h-3 w-24 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-10 w-16 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-3 w-32 rounded-full bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="h-5 w-40 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-3 w-72 rounded-full bg-slate-200 animate-pulse" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="space-y-2">
                    <div className="h-3 w-full rounded-full bg-slate-100 animate-pulse" />
                    <div className="h-2 w-full rounded-full bg-slate-200 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="h-5 w-36 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-40 rounded-3xl bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-slate-100 grid place-items-center text-slate-700 px-6 text-center">
        <p className="text-lg font-semibold">Doctor profile not found. Please complete registration and try again.</p>
      </main>
    );
  }

  const verificationTone =
    profile.verificationStatus === "APPROVED"
      ? "text-blue-700 bg-blue-50 border-blue-200"
      : profile.verificationStatus === "REJECTED"
        ? "text-rose-700 bg-rose-50 border-rose-200"
        : "text-amber-700 bg-amber-50 border-amber-200";
  const canConsult = profile.verificationStatus === "APPROVED" && profile.active;
  const greetingName = profile.fullName?.trim() || "Doctor";
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map((m) => m.value), 1);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-slate-800">
           <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
             <Stethoscope className="w-6 h-6 text-blue-500" /> CareLabs
           </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            ["overview", "Overview", LayoutDashboard],
            ["profile", "Profile", User],
            ["verification", "Verification", FileCheck],
            ["schedule", "Schedule", CalendarDays],
            ["appointments", "Appointments", Clock],
            ["earnings", "Earnings", DollarSign],
          ].map(([key, label, Icon]) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key as string}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {/* @ts-ignore */}
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold text-sm">{label as string}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h2>
            <p className="text-xs font-semibold text-blue-700">
              {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} {" | "}
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-500 font-semibold">Welcome back</p>
              <p className="text-sm font-bold text-slate-900">{greetingName}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold tracking-wide ${verificationTone}`}>
              {profile.verificationStatus === "APPROVED" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : profile.verificationStatus === "REJECTED" ? (
                <XCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              VERIFICATION: {profile.verificationStatus}
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">

        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
              <StatCard title="All Appointments" value={String(appointmentStats.total)} subtitle="Total encounters" icon={<Activity className="w-4 h-4 text-blue-600" />} />
              <StatCard title="Upcoming" value={String(appointmentStats.upcoming)} subtitle="Pending and confirmed" icon={<Clock className="w-4 h-4 text-blue-600" />} />
              <StatCard title="Completed" value={String(appointmentStats.completed)} subtitle="Finished consultations" icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
              <StatCard title="Cancelled" value={String(appointmentStats.cancelled)} subtitle="Cancelled or rejected" icon={<XCircle className="w-4 h-4 text-rose-600" />} />
              <StatCard title="Telemedicine" value={String(appointmentMix.telemedicine)} subtitle="Remote sessions" icon={<Video className="w-4 h-4 text-blue-600" />} />
              <StatCard title="Projected LKR" value={formatLkr(earnings.upcomingValue)} subtitle="Upcoming appointment value" icon={<TrendingUp className="w-4 h-4 text-blue-600" />} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
                <h2 className="text-lg font-bold text-slate-900">Appointment Status Mix</h2>
                <p className="text-sm text-slate-500 mb-4">Operational distribution across your appointment pipeline.</p>
                <div className="space-y-3">
                  {statusChart.map((row) => (
                    <div key={row.key}>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>{row.label}</span>
                        <span>{row.count} ({row.percentage}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className={`${row.color} h-2 rounded-full`} style={{ width: `${row.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h2 className="text-lg font-bold text-slate-900">Appointment Pie</h2>
                <p className="text-sm text-slate-500 mb-4">Upcoming vs completed vs cancelled.</p>
                <div className="flex items-center justify-center">
                  <div className="relative h-40 w-40 rounded-full" style={{ background: `conic-gradient(${statusPie.gradient})` }}>
                    <div className="absolute inset-6 rounded-full bg-white border border-slate-100 flex flex-col items-center justify-center text-center">
                      <span className="text-xs uppercase tracking-wide text-slate-400 font-bold">Total</span>
                      <span className="text-2xl font-black text-slate-900">{appointmentStats.total}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {statusPie.slices.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 font-medium">{item.label}</span>
                      </div>
                      <span className="font-bold text-slate-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <h2 className="text-lg font-bold text-slate-900">Revenue Trend</h2>
                  <p className="text-sm text-slate-500 mb-4">Last 6 months completed-consultation income.</p>
                  <div className="h-44 flex items-end gap-2">
                    {monthlyRevenue.map((m) => {
                      const h = Math.max(8, Math.round((m.value / maxMonthlyRevenue) * 100));
                      return (
                        <div key={m.label} className="flex-1 flex flex-col items-center justify-end gap-1">
                          <div className="w-full rounded-t-md bg-blue-500/80" style={{ height: `${h}%` }} />
                          <span className="text-[10px] font-bold text-slate-500">{m.label}</span>
                        </div>
                      );
                    })}
                </div>
              </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
                <h2 className="text-lg font-bold text-slate-900">Readiness Checklist</h2>
                <ul className="mt-3 text-sm text-slate-700 space-y-2">
                  <li>Profile completed: {profile.fullName && profile.specialty && profile.consultationFee ? "Yes" : "No"}</li>
                  <li>Documents uploaded: {documents.length > 0 ? "Yes" : "No"}</li>
                  <li>Admin verification approved: {profile.verificationStatus === "APPROVED" ? "Yes" : "No"}</li>
                  <li>Consulting enabled: {profile.verificationStatus === "APPROVED" && profile.active ? "Yes" : "No"}</li>
                </ul>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <h2 className="text-lg font-bold text-slate-900">Next Appointments</h2>
                <div className="mt-3 space-y-2 text-sm">
                  {appointments
                    .filter((a) => ["PENDING", "CONFIRMED", "ACCEPTED"].includes(a.status))
                    .sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime())
                    .slice(0, 4)
                    .map((a) => (
                      <div key={a.id} className="border border-slate-200 rounded-xl p-2.5">
                        <p className="font-semibold text-slate-800">{new Date(a.appointmentTime).toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{a.type} | {a.status}</p>
                      </div>
                    ))}
                  {appointments.filter((a) => ["PENDING", "CONFIRMED", "ACCEPTED"].includes(a.status)).length === 0 && (
                    <p className="text-slate-500">No upcoming appointments.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Gross Earnings" value={formatLkr(earnings.gross)} subtitle="Completed appointments" icon={<DollarSign className="w-4 h-4 text-blue-600" />} />
              <StatCard title="Estimated Net" value={formatLkr(earnings.estimatedNet)} subtitle="After 10% platform fee" icon={<TrendingUp className="w-4 h-4 text-blue-600" />} />
              <StatCard title="Upcoming Value" value={formatLkr(earnings.upcomingValue)} subtitle="Pipeline revenue" icon={<Activity className="w-4 h-4 text-blue-600" />} />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-slate-900">Completed Appointment Earnings</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedAppointments.map((a) => (
                      <tr key={a.id} className="border-b border-slate-100">
                        <td className="py-2 pr-3">{new Date(a.appointmentTime).toLocaleString()}</td>
                        <td className="py-2 pr-3">{a.type}</td>
                        <td className="py-2 pr-3">{a.status}</td>
                        <td className="py-2 pr-3 font-semibold">{formatLkr(a.consultationFee || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {completedAppointments.length === 0 && <p className="text-sm text-slate-500 mt-2">No completed consultations yet.</p>}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <form onSubmit={handleProfileSave} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Profile Information</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Full Name" value={profileForm.fullName} onChange={(value) => setProfileForm((s) => ({ ...s, fullName: value }))} required />
              <Input label="Specialty" value={profileForm.specialty} onChange={(value) => setProfileForm((s) => ({ ...s, specialty: value }))} required />
              <Input label="Experience (years)" type="number" value={profileForm.experienceYears} onChange={(value) => setProfileForm((s) => ({ ...s, experienceYears: value }))} />
              <Input label="Consultation Fee" type="number" value={profileForm.consultationFee} onChange={(value) => setProfileForm((s) => ({ ...s, consultationFee: value }))} />
              <Input label="Qualification" value={profileForm.qualification} onChange={(value) => setProfileForm((s) => ({ ...s, qualification: value }))} />
              <label className="sm:col-span-2 text-sm font-semibold text-slate-700">
                Bio
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  rows={4}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((s) => ({ ...s, bio: e.target.value }))}
                />
              </label>
            </div>
            <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">Save Profile</button>
          </form>
        )}

        {activeTab === "verification" && (
          <div className="grid lg:grid-cols-2 gap-4">
            <form onSubmit={handleUploadDocument} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h2 className="text-lg font-bold text-slate-900">Upload Verification Documents</h2>
              <label className="text-sm font-semibold text-slate-700 block">
                Document Type
                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as DocumentType)}
                >
                  <option value="LICENSE">LICENSE</option>
                  <option value="CERTIFICATE">CERTIFICATE</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700 block">
                File
                <input
                  type="file"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  required
                />
              </label>
              <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">Upload Document</button>
            </form>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-slate-900">Submitted Documents</h2>
              <ul className="mt-3 space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id} className="border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{doc.type}</p>
                      <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">
                        View file
                      </a>
                      <p className="text-xs text-slate-500 mt-1">Status: {doc.status}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700"
                    >
                      Delete
                    </button>
                  </li>
                ))}
                {documents.length === 0 && <li className="text-sm text-slate-500">No documents uploaded yet.</li>}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="grid lg:grid-cols-2 gap-4">
            <form onSubmit={handleAddAvailability} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h2 className="text-lg font-bold text-slate-900">Add Weekly Availability</h2>
              <label className="text-sm font-semibold text-slate-700 block">
                Day
                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  value={availabilityForm.dayOfWeek}
                  onChange={(e) => setAvailabilityForm((s) => ({ ...s, dayOfWeek: e.target.value as Availability["dayOfWeek"] }))}
                >
                  {dayOptions.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Start Time" type="time" value={availabilityForm.startTime} onChange={(value) => setAvailabilityForm((s) => ({ ...s, startTime: value }))} />
                <Input label="End Time" type="time" value={availabilityForm.endTime} onChange={(value) => setAvailabilityForm((s) => ({ ...s, endTime: value }))} />
              </div>
              <Input
                label="Slot Duration (minutes)"
                type="number"
                value={String(availabilityForm.slotDuration)}
                onChange={(value) => setAvailabilityForm((s) => ({ ...s, slotDuration: Number(value || 30) }))}
              />
              <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">Save Availability</button>
            </form>

            <form onSubmit={handleAddLeave} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <h2 className="text-lg font-bold text-slate-900">Add Leave Day</h2>
              <Input label="Leave Date" type="date" value={leaveForm.leaveDate} onChange={(value) => setLeaveForm((s) => ({ ...s, leaveDate: value }))} required />
              <label className="text-sm font-semibold text-slate-700 block">
                Reason
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm((s) => ({ ...s, reason: e.target.value }))}
                />
              </label>
              <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">Save Leave</button>
            </form>
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="space-y-4">
            {!canConsult && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-sm font-semibold">
                Consultation actions are locked until your verification status is APPROVED by admin.
              </div>
            )}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-lg font-bold text-slate-900">Appointment Queue</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-3">ID</th>
                      <th className="py-2 pr-3">Date/Time</th>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr
                        key={a.id}
                        className={`border-b border-slate-100 cursor-pointer ${selectedAppointmentId === a.id ? "bg-slate-50" : ""}`}
                        onClick={() => setSelectedAppointmentId(a.id)}
                      >
                        <td className="py-2 pr-3 font-mono text-xs">{a.id.slice(0, 8)}...</td>
                        <td className="py-2 pr-3">{new Date(a.appointmentTime).toLocaleString()}</td>
                        <td className="py-2 pr-3">{a.type}</td>
                        <td className="py-2 pr-3">{a.status}</td>
                        <td className="py-2 pr-3">{a.reason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-slate-900">Status + Meeting</h3>
                <label className="text-sm font-semibold text-slate-700 block">
                  New Status
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    value={statusToSet}
                    onChange={(e) => setStatusToSet(e.target.value as AppointmentStatus)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" onClick={handleStatusUpdate} disabled={!canConsult} className="w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                  Update Status
                </button>
                <button type="button" onClick={handleFetchMeetingLink} disabled={!canConsult} className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  Get Meeting Link
                </button>
                {meetingLink && (
                  <a href={meetingLink} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline break-all">
                    {meetingLink}
                  </a>
                )}
              </div>

              <form onSubmit={handleSaveConsultationNote} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-slate-900">Consultation Note</h3>
                <Input label="Chief Complaint" value={consultationNote.chiefComplaint} onChange={(value) => setConsultationNote((s) => ({ ...s, chiefComplaint: value }))} required disabled={!canConsult} />
                <label className="text-sm font-semibold text-slate-700 block">
                  Clinical Notes
                  <textarea className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" rows={3} value={consultationNote.clinicalNotes} onChange={(e) => setConsultationNote((s) => ({ ...s, clinicalNotes: e.target.value }))} required disabled={!canConsult} />
                </label>
                <Input label="Diagnosis" value={consultationNote.diagnosis} onChange={(value) => setConsultationNote((s) => ({ ...s, diagnosis: value }))} required disabled={!canConsult} />
                <button disabled={!canConsult} className="w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">Save Note</button>
              </form>

              <form onSubmit={handleSavePrescription} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-slate-900">Prescription</h3>
                <Input label="Valid Until" type="date" value={prescription.validUntil} onChange={(value) => setPrescription((s) => ({ ...s, validUntil: value }))} required disabled={!canConsult} />
                <Input label="Medicine Name" value={prescription.medicineName} onChange={(value) => setPrescription((s) => ({ ...s, medicineName: value }))} required disabled={!canConsult} />
                <Input label="Dosage" value={prescription.dosage} onChange={(value) => setPrescription((s) => ({ ...s, dosage: value }))} required disabled={!canConsult} />
                <Input label="Frequency" value={prescription.frequency} onChange={(value) => setPrescription((s) => ({ ...s, frequency: value }))} required disabled={!canConsult} />
                <Input label="Duration" value={prescription.duration} onChange={(value) => setPrescription((s) => ({ ...s, duration: value }))} required disabled={!canConsult} />
                <Input label="Route" value={prescription.route} onChange={(value) => setPrescription((s) => ({ ...s, route: value }))} required disabled={!canConsult} />
                <label className="text-sm font-semibold text-slate-700 block">
                  Notes
                  <textarea className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" rows={2} value={prescription.notes} onChange={(e) => setPrescription((s) => ({ ...s, notes: e.target.value }))} disabled={!canConsult} />
                </label>
                <button disabled={!canConsult} className="w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed">Save Prescription</button>
              </form>
            </div>
          </div>
        )}
          </div>
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900">Confirm Logout</h3>
            <p className="mt-2 text-sm text-slate-600">Are you sure you want to logout?</p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAuth();
                  router.replace("/login");
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatLkr(value: number) {
  return `LKR ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
        {icon}
      </div>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700 block">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
