"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Filter,
  LayoutDashboard,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Star,
  Stethoscope,
  Trash2,
  Video,
  XCircle,
} from "lucide-react";
import {
  apiDeleteAuth,
  apiGetAuth,
  apiPostAuth,
  apiPutAuth,
  clearAuth,
  getRole,
  getToken,
} from "@/lib/api";

const APPOINTMENT_STATUS_OPTIONS = ["PENDING", "CONFIRMED", "ACCEPTED", "REJECTED", "CANCELLED", "COMPLETED", "NO_SHOW"] as const;
const APPOINTMENT_TYPES = ["IN_CLINIC", "TELEMEDICINE"] as const;

type AppointmentStatus = (typeof APPOINTMENT_STATUS_OPTIONS)[number];
type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

type Role = "PATIENT" | "DOCTOR" | "ADMIN";

interface PatientProfile {
  id: string;
  userId: string;
  fullName?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  district?: string | null;
}

interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string | null;
  specialty: string | null;
  bio: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  qualification: string | null;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  active: boolean;
}

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  symptomCheckId?: string | null;
  appointmentTime: string;
  durationMinutes?: number | null;
  status: AppointmentStatus;
  type: AppointmentType;
  meetingLink?: string | null;
  reason?: string | null;
  consultationFee: number;
}

interface ChatMessage {
  id?: string;
  appointmentId: string;
  senderId: string;
  message: string;
  sentAt?: string;
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

interface Review {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment: string;
}

interface AppointmentFormState {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  type: AppointmentType;
  reason: string;
}

const emptyAppointmentForm: AppointmentFormState = {
  doctorId: "",
  appointmentDate: "",
  appointmentTime: "",
  type: "TELEMEDICINE",
  reason: "",
};

function formatDateTime(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatCurrency(value: number) {
  return `LKR ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function toLocalDateTimeValue(date: string, time: string) {
  if (!date || !time) return "";
  const [hours, minutes] = time.split(":");
  return `${date}T${hours}:${minutes}:00`;
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CL";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default function AppointmentsHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);

  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>(emptyAppointmentForm);
  const [doctorPreview, setDoctorPreview] = useState<DoctorProfile | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [rescheduleTime, setRescheduleTime] = useState("");
  const [statusToSet, setStatusToSet] = useState<AppointmentStatus>("CONFIRMED");
  const [meetingLink, setMeetingLink] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [noteForm, setNoteForm] = useState<ConsultationNote>({
    appointmentId: "",
    doctorId: "",
    patientId: "",
    chiefComplaint: "",
    clinicalNotes: "",
    diagnosis: "",
  });
  const [prescriptionForm, setPrescriptionForm] = useState<Prescription>({
    appointmentId: "",
    doctorId: "",
    patientId: "",
    validUntil: "",
    notes: "",
    items: [
      {
        medicineName: "",
        dosage: "",
        frequency: "",
        duration: "",
        route: "ORAL",
      },
    ],
  });
  const [reviewForm, setReviewForm] = useState<Review>({
    appointmentId: "",
    patientId: "",
    doctorId: "",
    rating: 5,
    comment: "",
  });

  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment.id === selectedAppointmentId) || null,
    [appointments, selectedAppointmentId],
  );

  const visibleAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesStatus = statusFilter === "ALL" || appointment.status === statusFilter;
      const haystack = `${appointment.id} ${appointment.reason || ""} ${appointment.type} ${appointment.status}`.toLowerCase();
      const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [appointments, searchTerm, statusFilter]);

  const appointmentStats = useMemo(() => {
    const total = appointments.length;
    const upcoming = appointments.filter((appointment) => ["PENDING", "CONFIRMED", "ACCEPTED"].includes(appointment.status)).length;
    const completed = appointments.filter((appointment) => appointment.status === "COMPLETED").length;
    const cancelled = appointments.filter((appointment) => ["CANCELLED", "REJECTED", "NO_SHOW"].includes(appointment.status)).length;
    return { total, upcoming, completed, cancelled };
  }, [appointments]);

  useEffect(() => {
    const jwt = getToken();
    const currentRole = getRole() as Role | null;

    if (!jwt || !currentRole) {
      router.replace("/login");
      return;
    }

    if (!["PATIENT", "DOCTOR", "ADMIN"].includes(currentRole)) {
      toast.error("Please login with a valid account to view appointments.");
      router.replace("/login");
      return;
    }

    setToken(jwt);
    setRole(currentRole);
  }, [router]);

  useEffect(() => {
    if (!token || !role) return;

    const loadAppointments = async () => {
      setLoading(true);
      try {
        if (role === "PATIENT") {
          const profile = await apiGetAuth<PatientProfile>("/patients/me", token);
          setPatientProfile(profile);
          const rows = await apiGetAuth<Appointment[]>(`/appointments/patient/${profile.userId}`, token);
          setAppointments(rows);
          setSelectedAppointmentId(rows[0]?.id || "");
        } else if (role === "DOCTOR") {
          const profile = await apiGetAuth<DoctorProfile>("/doctors/me", token);
          setDoctorProfile(profile);
          const rows = await apiGetAuth<Appointment[]>(`/appointments/doctor/${profile.id}`, token);
          setAppointments(rows);
          setSelectedAppointmentId(rows[0]?.id || "");
        } else {
          const rows = await apiGetAuth<Appointment[]>("/appointments", token);
          setAppointments(rows);
          setSelectedAppointmentId(rows[0]?.id || "");
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        toast.error(error.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    void loadAppointments();
  }, [role, token]);

  useEffect(() => {
    const doctorId = searchParams.get("doctorId") || "";
    const appointmentDate = searchParams.get("date") || "";

    if (doctorId) {
      setAppointmentForm((state) => ({ ...state, doctorId }));
    }

    if (appointmentDate) {
      setAppointmentForm((state) => ({ ...state, appointmentDate }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!token || role !== "PATIENT") return;
    if (!appointmentForm.doctorId) {
      setDoctorPreview(null);
      setAvailableSlots([]);
      return;
    }

    const loadDoctorPreview = async () => {
      try {
        const preview = await apiGetAuth<DoctorProfile>(`/doctors/${appointmentForm.doctorId}`, token);
        setDoctorPreview(preview);
      } catch {
        setDoctorPreview(null);
      }
    };

    const loadSlots = async () => {
      if (!appointmentForm.appointmentDate) {
        setAvailableSlots([]);
        return;
      }

      try {
        const slots = await apiGetAuth<string[]>(
          `/appointments/available-slots?doctorId=${appointmentForm.doctorId}&date=${appointmentForm.appointmentDate}`,
          token,
        );
        setAvailableSlots(slots);
      } catch {
        setAvailableSlots([]);
      }
    };

    void loadDoctorPreview();
    void loadSlots();
  }, [appointmentForm.appointmentDate, appointmentForm.doctorId, role, token]);

  useEffect(() => {
    if (!token || !selectedAppointmentId) return;

    const loadSelectedDetails = async () => {
      setMeetingLink("");
      setChatHistory([]);
      setNoteForm({
        appointmentId: selectedAppointmentId,
        doctorId: doctorProfile?.id || "",
        patientId: patientProfile?.userId || patientProfile?.id || "",
        chiefComplaint: "",
        clinicalNotes: "",
        diagnosis: "",
      });
      setPrescriptionForm({
        appointmentId: selectedAppointmentId,
        doctorId: doctorProfile?.id || "",
        patientId: patientProfile?.userId || patientProfile?.id || "",
        validUntil: "",
        notes: "",
        items: [
          {
            medicineName: "",
            dosage: "",
            frequency: "",
            duration: "",
            route: "ORAL",
          },
        ],
      });
      setReviewForm({
        appointmentId: selectedAppointmentId,
        patientId: patientProfile?.userId || patientProfile?.id || "",
        doctorId: selectedAppointment?.doctorId || "",
        rating: 5,
        comment: "",
      });

      try {
        const [link, chat, appointment] = await Promise.all([
          apiGetAuth<{ meetingUrl: string }>(`/appointments/${selectedAppointmentId}/meeting-link`, token).catch(() => null),
          apiGetAuth<ChatMessage[]>(`/appointments/${selectedAppointmentId}/chat`, token).catch(() => []),
          apiGetAuth<Appointment>(`/appointments/${selectedAppointmentId}`, token).catch(() => null),
        ]);

        if (link?.meetingUrl) setMeetingLink(link.meetingUrl);
        if (chat) setChatHistory(chat);
        if (appointment?.type) {
          setStatusToSet(appointment.status);
          setRescheduleTime(appointment.appointmentTime.slice(0, 16));
          setReviewForm((state) => ({
            ...state,
            doctorId: appointment.doctorId,
          }));
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        toast.error(error.message || "Unable to load appointment details");
      }
    };

    void loadSelectedDetails();
  }, [doctorProfile?.id, patientProfile?.id, patientProfile?.userId, selectedAppointment, selectedAppointmentId, token]);

  const refreshAppointments = async () => {
    if (!token || !role) return;

    if (role === "PATIENT" && patientProfile?.userId) {
      const rows = await apiGetAuth<Appointment[]>(`/appointments/patient/${patientProfile.userId}`, token);
      setAppointments(rows);
      return;
    }

    if (role === "DOCTOR" && doctorProfile?.id) {
      const rows = await apiGetAuth<Appointment[]>(`/appointments/doctor/${doctorProfile.id}`, token);
      setAppointments(rows);
      return;
    }

    const rows = await apiGetAuth<Appointment[]>("/appointments", token);
    setAppointments(rows);
  };

  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !patientProfile) return;

    const patientId = patientProfile.userId || patientProfile.id;
    const appointmentTime = toLocalDateTimeValue(appointmentForm.appointmentDate, appointmentForm.appointmentTime);

    if (!appointmentForm.doctorId || !appointmentTime) {
      toast.error("Choose a doctor, date, and time first.");
      return;
    }

    setBookingLoading(true);
    try {
      const created = await apiPostAuth<Appointment>(
        "/appointments",
        {
          patientId,
          doctorId: appointmentForm.doctorId,
          appointmentTime,
          type: appointmentForm.type,
          reason: appointmentForm.reason,
        },
        token,
      );

      toast.success("Appointment booked successfully.");
      await refreshAppointments();
      setSelectedAppointmentId(created.id);
      setAppointmentForm((state) => ({ ...state, reason: "" }));
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Unable to book appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!token || !selectedAppointmentId) return;

    try {
      await apiDeleteAuth(`/appointments/${selectedAppointmentId}`, token);
      toast.success("Appointment cancelled.");
      await refreshAppointments();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Unable to cancel appointment");
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!token || !selectedAppointmentId || !rescheduleTime) return;

    try {
      await apiPutAuth<Appointment>(`/appointments/${selectedAppointmentId}?newTime=${encodeURIComponent(rescheduleTime)}`, {}, token);
      toast.success("Appointment rescheduled.");
      await refreshAppointments();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Unable to reschedule appointment");
    }
  };

  const handleStatusUpdate = async () => {
    if (!token || !selectedAppointmentId) return;

    try {
      await apiPutAuth<Appointment>(`/appointments/${selectedAppointmentId}/status?status=${statusToSet}`, {}, token);
      toast.success("Appointment status updated.");
      await refreshAppointments();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Unable to update status");
    }
  };

  const handleSendChat = async () => {
    if (!token || !selectedAppointmentId || !chatMessage.trim()) return;

    const senderId = role === "DOCTOR" ? (doctorProfile?.userId || doctorProfile?.id || "") : (patientProfile?.userId || patientProfile?.id || "");

    try {
      await apiPostAuth<ChatMessage>(
        `/appointments/${selectedAppointmentId}/chat`,
        {
          senderId,
          message: chatMessage.trim(),
        },
        token,
      );
      setChatMessage("");
      const updated = await apiGetAuth<ChatMessage[]>(`/appointments/${selectedAppointmentId}/chat`, token);
      setChatHistory(updated);
      toast.success("Message sent.");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Unable to send message");
    }
  };

  const handleSaveNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAppointmentId || !doctorProfile || !patientProfile) return;

    try {
      await apiPostAuth<ConsultationNote>(
        `/appointments/${selectedAppointmentId}/notes`,
        noteForm,
        token,
      );
      toast.success("Consultation note saved.");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Unable to save consultation note");
    }
  };

  const handleSavePrescription = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAppointmentId || !doctorProfile || !patientProfile) return;

    try {
      await apiPostAuth<Prescription>(
        `/appointments/${selectedAppointmentId}/prescriptions`,
        prescriptionForm,
        token,
      );
      toast.success("Prescription saved.");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Unable to save prescription");
    }
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAppointmentId || !patientProfile) return;

    try {
      await apiPostAuth<Review>(
        `/appointments/${selectedAppointmentId}/review`,
        reviewForm,
        token,
      );
      toast.success("Review submitted.");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Unable to submit review");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <div className="h-7 w-48 rounded-full bg-slate-200 animate-pulse" />
              <div className="h-4 w-72 rounded-full bg-slate-200 animate-pulse" />
            </div>
            <div className="h-10 w-40 rounded-full bg-slate-200 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                <div className="h-3 w-24 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-8 w-16 rounded-lg bg-slate-200 animate-pulse" />
                <div className="h-3 w-32 rounded-full bg-slate-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const isPatient = role === "PATIENT";
  const isDoctor = role === "DOCTOR";
  const canManage = isDoctor || role === "ADMIN";
  const bookingPreview = doctorPreview || null;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="pt-20 pb-12">
        <section className="bg-white border-b border-slate-200/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold tracking-[0.18em] uppercase border border-blue-100">
                  <Activity className="w-4 h-4" /> Appointment Center
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900">Appointments</h1>
                  <p className="mt-3 text-lg text-slate-500 max-w-3xl">
                    Manage consultations, review the schedule, book a new visit, and keep the chat, notes, and prescriptions tied to the live backend workflow.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-bold">Role: {role}</div>
                  <div className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">
                    {appointmentStats.total} total appointments
                  </div>
                  <div className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100">
                    {appointmentStats.upcoming} upcoming
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="bg-slate-950 text-white rounded-3xl p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.45)]">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Quick Actions</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-200">
                    <div className="flex items-center gap-3"><LayoutDashboard className="w-4 h-4 text-blue-400" /> View the appointment queue and status history</div>
                    <div className="flex items-center gap-3"><CalendarDays className="w-4 h-4 text-blue-400" /> Book using the live /appointments endpoint</div>
                    <div className="flex items-center gap-3"><ClipboardList className="w-4 h-4 text-blue-400" /> Save notes, prescriptions, and reviews</div>
                  </div>
                  <button
                    onClick={() => {
                      clearAuth();
                      router.replace("/login");
                    }}
                    className="mt-6 w-full px-4 py-3 rounded-2xl bg-white text-slate-950 font-bold hover:bg-slate-100 transition"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard title="All" value={appointmentStats.total} icon={<Activity className="w-4 h-4 text-blue-600" />} />
            <MetricCard title="Upcoming" value={appointmentStats.upcoming} icon={<Clock className="w-4 h-4 text-blue-600" />} />
            <MetricCard title="Completed" value={appointmentStats.completed} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
            <MetricCard title="Cancelled" value={appointmentStats.cancelled} icon={<XCircle className="w-4 h-4 text-rose-600" />} />
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {isPatient && (
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Book an appointment</h2>
                    <p className="text-sm text-slate-500 mt-1">Use a real doctor UUID from the backend. The selected time will be submitted directly to /appointments.</p>
                  </div>

                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">
                      Doctor ID
                      <input
                        value={appointmentForm.doctorId}
                        onChange={(e) => setAppointmentForm((state) => ({ ...state, doctorId: e.target.value.trim() }))}
                        className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                        placeholder="Paste doctor UUID"
                        required
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block text-sm font-semibold text-slate-700">
                        Date
                        <input
                          type="date"
                          value={appointmentForm.appointmentDate}
                          onChange={(e) => setAppointmentForm((state) => ({ ...state, appointmentDate: e.target.value, appointmentTime: "" }))}
                          className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                          required
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-700">
                        Type
                        <select
                          value={appointmentForm.type}
                          onChange={(e) => setAppointmentForm((state) => ({ ...state, type: e.target.value as AppointmentType }))}
                          className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                        >
                          {APPOINTMENT_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">Available slots</span>
                        <button
                          type="button"
                          onClick={() => setAppointmentForm((state) => ({ ...state, appointmentTime: "" }))}
                          className="text-xs font-bold text-blue-600"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.length > 0 ? availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setAppointmentForm((state) => ({ ...state, appointmentTime: slot }))}
                            className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${appointmentForm.appointmentTime === slot ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"}`}
                          >
                            {slot}
                          </button>
                        )) : (
                          <div className="col-span-3 text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 p-4">
                            Select a doctor and date to fetch available slots.
                          </div>
                        )}
                      </div>
                    </div>

                    <label className="block text-sm font-semibold text-slate-700">
                      Reason
                      <textarea
                        value={appointmentForm.reason}
                        onChange={(e) => setAppointmentForm((state) => ({ ...state, reason: e.target.value }))}
                        className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                        rows={4}
                        placeholder="Describe symptoms or consultation reason"
                      />
                    </label>

                    {bookingPreview && (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-blue-600 font-bold">Doctor preview</p>
                            <h3 className="text-lg font-bold text-slate-900">{bookingPreview.fullName || "Doctor"}</h3>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-bold text-blue-700">{bookingPreview.specialty || "Specialty unavailable"}</p>
                            <p className="text-slate-500">{bookingPreview.verificationStatus}</p>
                          </div>
                        </div>
                        <div className="text-sm text-slate-600 flex items-center justify-between">
                          <span>Fee</span>
                          <span className="font-bold text-slate-900">{bookingPreview.consultationFee ? formatCurrency(bookingPreview.consultationFee) : "Pending"}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3.5 transition"
                    >
                      {bookingLoading ? "Booking..." : "Book appointment"}
                    </button>
                  </form>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Filter className="w-4 h-4 text-blue-600" /> Filters</h3>
                  <div className="mt-4 space-y-3">
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                      placeholder="Search appointment id, reason, status"
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                    >
                      <option value="ALL">All statuses</option>
                      {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className={isPatient ? "lg:col-span-8" : "lg:col-span-5"}>
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Appointment queue</h2>
                    <p className="text-sm text-slate-500">Select an appointment to manage meeting, chat, notes, prescriptions, or review actions.</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!token) return;
                      try {
                        await refreshAppointments();
                        toast.success("Appointments refreshed.");
                      } catch {
                        toast.error("Unable to refresh appointments");
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw className="w-4 h-4" /> Refresh
                  </button>
                </div>

                <div className="divide-y divide-slate-100 max-h-[34rem] overflow-y-auto">
                  {visibleAppointments.map((appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => setSelectedAppointmentId(appointment.id)}
                      className={`w-full text-left p-5 transition ${selectedAppointmentId === appointment.id ? "bg-blue-50/60" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{appointment.id.slice(0, 8)}...</span>
                            <StatusPill status={appointment.status} />
                            <span className="text-xs font-bold text-slate-500">{appointment.type}</span>
                          </div>
                          <h3 className="font-bold text-slate-900">{formatDateTime(appointment.appointmentTime)}</h3>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{appointment.reason || "No reason provided."}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Fee</p>
                          <p className="font-bold text-slate-900">{formatCurrency(appointment.consultationFee || 0)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {visibleAppointments.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      No appointments match your filters.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={isPatient ? "lg:col-span-4" : "lg:col-span-7"}>
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.4)] mb-6">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Selected appointment</p>
                {selectedAppointment ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">{formatDateTime(selectedAppointment.appointmentTime)}</h3>
                        <p className="text-slate-300 mt-1">{selectedAppointment.reason || "No reason provided"}</p>
                      </div>
                      <StatusPill status={selectedAppointment.status} dark />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <InfoTile label="Type" value={selectedAppointment.type} />
                      <InfoTile label="Consultation fee" value={formatCurrency(selectedAppointment.consultationFee || 0)} />
                      <InfoTile label="Doctor ID" value={selectedAppointment.doctorId.slice(0, 8)} />
                      <InfoTile label="Patient ID" value={selectedAppointment.patientId.slice(0, 8)} />
                    </div>
                    {meetingLink && (
                      <a href={meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-blue-300 hover:text-blue-200 underline break-all">
                        <Video className="w-4 h-4" /> Open meeting link
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-slate-300">Pick an appointment from the queue to load the detail actions.</p>
                )}
              </div>

              {selectedAppointment && (
                <div className="grid xl:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <ActionPanel title="Lifecycle actions" icon={<ShieldAlert className="w-4 h-4" />}>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {canManage ? (
                          <>
                            <label className="block text-sm font-semibold text-slate-700">
                              New status
                              <select value={statusToSet} onChange={(e) => setStatusToSet(e.target.value as AppointmentStatus)} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900">
                                {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            </label>
                            <button onClick={handleStatusUpdate} className="mt-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3">
                              Update status
                            </button>
                          </>
                        ) : (
                          <>
                            <label className="block text-sm font-semibold text-slate-700">
                              Reschedule time
                              <input type="datetime-local" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                            </label>
                            <button onClick={handleRescheduleAppointment} className="mt-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3">
                              Reschedule
                            </button>
                          </>
                        )}
                      </div>
                      {!canManage && (
                        <button onClick={handleCancelAppointment} className="mt-3 w-full rounded-2xl border border-rose-200 text-rose-700 font-bold px-4 py-3 hover:bg-rose-50">
                          Cancel appointment
                        </button>
                      )}
                    </ActionPanel>

                    <ActionPanel title="Chat" icon={<MessageSquare className="w-4 h-4" />}>
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {chatHistory.length > 0 ? chatHistory.map((message, index) => (
                          <div key={message.id || index} className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                            <div className="flex items-center justify-between gap-3 text-xs text-slate-400 mb-1">
                              <span className="font-bold text-slate-500">{message.senderId.slice(0, 8)}...</span>
                              <span>{message.sentAt ? formatDateTime(message.sentAt) : "Just now"}</span>
                            </div>
                            <p className="text-sm text-slate-700">{message.message}</p>
                          </div>
                        )) : (
                          <p className="text-sm text-slate-500">No messages yet.</p>
                        )}
                      </div>
                      <div className="mt-4 flex gap-3">
                        <input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Type a message" className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                        <button onClick={handleSendChat} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3">
                          <Send className="w-4 h-4" /> Send
                        </button>
                      </div>
                    </ActionPanel>
                  </div>

                  <div className="space-y-6">
                    {canManage && (
                      <ActionPanel title="Consultation note" icon={<FileText className="w-4 h-4" />}>
                        <form onSubmit={handleSaveNote} className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">
                            Chief complaint
                            <input value={noteForm.chiefComplaint} onChange={(e) => setNoteForm((state) => ({ ...state, chiefComplaint: e.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                          </label>
                          <label className="block text-sm font-semibold text-slate-700">
                            Clinical notes
                            <textarea value={noteForm.clinicalNotes} onChange={(e) => setNoteForm((state) => ({ ...state, clinicalNotes: e.target.value }))} rows={4} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                          </label>
                          <label className="block text-sm font-semibold text-slate-700">
                            Diagnosis
                            <input value={noteForm.diagnosis} onChange={(e) => setNoteForm((state) => ({ ...state, diagnosis: e.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                          </label>
                          <button type="submit" className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-3">
                            Save note
                          </button>
                        </form>
                      </ActionPanel>
                    )}

                    {canManage && (
                      <ActionPanel title="Prescription" icon={<ClipboardList className="w-4 h-4" />}>
                        <form onSubmit={handleSavePrescription} className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <label className="block text-sm font-semibold text-slate-700">
                              Valid until
                              <input type="date" value={prescriptionForm.validUntil} onChange={(e) => setPrescriptionForm((state) => ({ ...state, validUntil: e.target.value }))} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                            </label>
                            <label className="block text-sm font-semibold text-slate-700">
                              Route
                              <input value={prescriptionForm.items[0].route} onChange={(e) => setPrescriptionForm((state) => ({ ...state, items: [{ ...state.items[0], route: e.target.value }] }))} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                            </label>
                          </div>
                          <label className="block text-sm font-semibold text-slate-700">
                            Medicine name
                            <input value={prescriptionForm.items[0].medicineName} onChange={(e) => setPrescriptionForm((state) => ({ ...state, items: [{ ...state.items[0], medicineName: e.target.value }] }))} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            <label className="block text-sm font-semibold text-slate-700">
                              Dosage
                              <input value={prescriptionForm.items[0].dosage} onChange={(e) => setPrescriptionForm((state) => ({ ...state, items: [{ ...state.items[0], dosage: e.target.value }] }))} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                            </label>
                            <label className="block text-sm font-semibold text-slate-700">
                              Frequency
                              <input value={prescriptionForm.items[0].frequency} onChange={(e) => setPrescriptionForm((state) => ({ ...state, items: [{ ...state.items[0], frequency: e.target.value }] }))} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                            </label>
                            <label className="block text-sm font-semibold text-slate-700">
                              Duration
                              <input value={prescriptionForm.items[0].duration} onChange={(e) => setPrescriptionForm((state) => ({ ...state, items: [{ ...state.items[0], duration: e.target.value }] }))} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                            </label>
                          </div>
                          <label className="block text-sm font-semibold text-slate-700">
                            Prescription notes
                            <textarea value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm((state) => ({ ...state, notes: e.target.value }))} rows={3} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                          </label>
                          <button type="submit" className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3">
                            Save prescription
                          </button>
                        </form>
                      </ActionPanel>
                    )}

                    {isPatient && selectedAppointment.status === "COMPLETED" && (
                      <ActionPanel title="Review your doctor" icon={<Star className="w-4 h-4" />}>
                        <form onSubmit={handleSubmitReview} className="space-y-3">
                          <label className="block text-sm font-semibold text-slate-700">
                            Rating
                            <select value={reviewForm.rating} onChange={(e) => setReviewForm((state) => ({ ...state, rating: Number(e.target.value) }))} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900">
                              {[5, 4, 3, 2, 1].map((rating) => (
                                <option key={rating} value={rating}>{rating} stars</option>
                              ))}
                            </select>
                          </label>
                          <label className="block text-sm font-semibold text-slate-700">
                            Comment
                            <textarea value={reviewForm.comment} onChange={(e) => setReviewForm((state) => ({ ...state, comment: e.target.value }))} rows={4} className="mt-1 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900" />
                          </label>
                          <button type="submit" className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-3">
                            Submit review
                          </button>
                        </form>
                      </ActionPanel>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">{icon}</div>
      </div>
    </div>
  );
}

function StatusPill({ status, dark = false }: { status: AppointmentStatus; dark?: boolean }) {
  const tone =
    status === "COMPLETED"
      ? dark
        ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/30"
        : "bg-emerald-50 text-emerald-700 border-emerald-100"
      : status === "CANCELLED" || status === "REJECTED"
        ? dark
          ? "bg-rose-500/15 text-rose-200 border-rose-500/30"
          : "bg-rose-50 text-rose-700 border-rose-100"
        : dark
          ? "bg-blue-500/15 text-blue-200 border-blue-500/30"
          : "bg-blue-50 text-blue-700 border-blue-100";

  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold ${tone}`}>{status}</span>;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">{label}</p>
      <p className="mt-1 text-sm font-bold text-white truncate">{value}</p>
    </div>
  );
}

function ActionPanel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-slate-900">
        <span className="text-blue-600">{icon}</span>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      {children}
    </div>
  );
}
