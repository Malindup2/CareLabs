"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  getUserIdFromToken,
} from "@/lib/api";
import { getJitsiRoomName, isJitsiMeetingUrl, toJitsiEmbedUrl } from "@/lib/telemedicine";
import ConfirmDialog from "@/components/ConfirmDialog";
import Modal from "@/components/Modal";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  doctorName?: string | null;
  doctorFullName?: string | null;
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

interface PayHereCheckoutResponse {
  merchantId: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  checkoutUrl?: string;
  orderId: string;
  items: string;
  currency: string;
  amount: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash: string;
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

function splitFullName(value?: string | null) {
  const normalized = (value || "").trim();
  if (!normalized) {
    return { firstName: "CareLabs", lastName: "Patient" };
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Patient" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function submitPayHereCheckout(payload: PayHereCheckoutResponse) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = payload.checkoutUrl || "https://sandbox.payhere.lk/pay/checkout";

  const fields: Record<string, string> = {
    merchant_id: payload.merchantId,
    return_url: payload.returnUrl,
    cancel_url: payload.cancelUrl,
    notify_url: payload.notifyUrl,
    order_id: payload.orderId,
    items: payload.items,
    currency: payload.currency,
    amount: payload.amount,
    first_name: payload.firstName,
    last_name: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
    city: payload.city,
    country: payload.country,
    hash: payload.hash,
  };

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

export default function AppointmentsHubPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
  const [showCancelAppointmentConfirm, setShowCancelAppointmentConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);

  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>(emptyAppointmentForm);
  const [doctorPreview, setDoctorPreview] = useState<DoctorProfile | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const [rescheduleTime, setRescheduleTime] = useState("");
  const [statusToSet, setStatusToSet] = useState<AppointmentStatus>("CONFIRMED");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [showJitsiPreview, setShowJitsiPreview] = useState(false);
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
  const [selectedNote, setSelectedNote] = useState<ConsultationNote | null>(null);
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
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
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
    return [...appointments]
      .filter((appointment) => {
        const searchLower = searchTerm.trim().toLowerCase();
        const haystack = `${appointment.id} ${appointment.reason || ""} ${appointment.type} ${appointment.status} ${appointment.doctorId} ${appointment.doctorName || ""} ${appointment.doctorFullName || ""}`.toLowerCase();
        const matchesSearch = !searchLower || haystack.includes(searchLower);
        const matchesStatus = statusFilter === "ALL" || appointment.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime());
  }, [appointments, searchTerm, statusFilter]);

  const handleDownloadPDF = () => {
    if (visibleAppointments.length === 0) {
      toast.error("No appointment records to export.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("CareLabs Appointment Queue", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(226, 232, 240);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Records: ${visibleAppointments.length}`, 14, 34);

    autoTable(doc, {
      startY: 42,
      head: [["ID", "Time", "Type", "Status", "Doctor", "Reason"]],
      body: visibleAppointments.map((appointment) => [
        appointment.id.slice(0, 8),
        new Date(appointment.appointmentTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }),
        appointment.type,
        appointment.status,
        appointment.doctorName || appointment.doctorFullName || appointment.doctorId.slice(0, 8),
        appointment.reason || "-",
      ]),
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
      bodyStyles: { textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      theme: "grid",
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    doc.save(`CareLabs_Appointments_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Appointment queue PDF downloaded.");
  };

  const appointmentStats = useMemo(() => {
    const total = appointments.length;
    const upcoming = appointments.filter((appointment) => ["PENDING", "CONFIRMED", "ACCEPTED"].includes(appointment.status)).length;
    const completed = appointments.filter((appointment) => appointment.status === "COMPLETED").length;
    const cancelled = appointments.filter((appointment) => ["CANCELLED", "REJECTED", "NO_SHOW"].includes(appointment.status)).length;
    return { total, upcoming, completed, cancelled };
  }, [appointments]);

  const isJitsiLink = useMemo(() => isJitsiMeetingUrl(meetingLink), [meetingLink]);
  const jitsiRoomName = useMemo(() => getJitsiRoomName(meetingLink), [meetingLink]);
  const jitsiEmbedUrl = useMemo(() => toJitsiEmbedUrl(meetingLink), [meetingLink]);
  const canPatientJoinMeeting = useMemo(
    () => (selectedAppointment ? selectedAppointment.status === "ACCEPTED" : false),
    [selectedAppointment],
  );

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

  const getNextAppointmentId = (rows: Appointment[]) => {
    if (rows.length === 0) return "";
    const sorted = [...rows].sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime());
    const now = Date.now();
    const next = sorted.find((appointment) => new Date(appointment.appointmentTime).getTime() >= now);
    return next?.id || sorted[0]?.id || "";
  };

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
          setSelectedAppointmentId(getNextAppointmentId(rows));
        } else if (role === "DOCTOR") {
          const profile = await apiGetAuth<DoctorProfile>("/doctors/me", token);
          setDoctorProfile(profile);
          const rows = await apiGetAuth<Appointment[]>(`/appointments/doctor/${profile.id}`, token);
          setAppointments(rows);
          setSelectedAppointmentId(getNextAppointmentId(rows));
        } else {
          const rows = await apiGetAuth<Appointment[]>("/appointments", token);
          setAppointments(rows);
          setSelectedAppointmentId(getNextAppointmentId(rows));
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
      setShowJitsiPreview(false);
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
        const shouldLoadMeeting = selectedAppointment?.type === "TELEMEDICINE";
        const [link, chat, appointment, note, prescription] = await Promise.all([
          shouldLoadMeeting
            ? apiGetAuth<{ meetingUrl: string }>(`/appointments/${selectedAppointmentId}/meeting-link`, token).catch(() => null)
            : Promise.resolve(null),
          apiGetAuth<ChatMessage[]>(`/appointments/${selectedAppointmentId}/chat`, token).catch(() => []),
          apiGetAuth<Appointment>(`/appointments/${selectedAppointmentId}`, token).catch(() => null),
          apiGetAuth<ConsultationNote>(`/appointments/${selectedAppointmentId}/notes`, token).catch(() => null),
          apiGetAuth<Prescription>(`/appointments/${selectedAppointmentId}/prescriptions`, token).catch(() => null),
        ]);

        if (link?.meetingUrl) setMeetingLink(link.meetingUrl);
        if (chat) setChatHistory(chat);
        if (note) {
          setSelectedNote(note);
          setNoteForm(note);
        } else {
          setSelectedNote(null);
        }
        if (prescription) {
          setSelectedPrescription(prescription);
          setPrescriptionForm(prescription);
        } else {
          setSelectedPrescription(null);
        }
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

    const patientId = getUserIdFromToken() || patientProfile.userId || patientProfile.id;
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

      const { firstName, lastName } = splitFullName(patientProfile.fullName);
      const fallbackEmail = typeof window !== "undefined" ? (localStorage.getItem("email") || "patient@carelabs.local") : "patient@carelabs.local";
      const checkoutPayload = await apiPostAuth<PayHereCheckoutResponse>(
        "/payments/initiate",
        {
          appointmentId: created.id,
          patientFirstName: firstName,
          patientLastName: lastName,
          patientEmail: fallbackEmail,
          patientPhone: patientProfile.phone || "0700000000",
          patientCity: patientProfile.city || patientProfile.district || "Colombo",
        },
        token,
      );

      toast.success("Appointment booked. Redirecting to PayHere checkout.");
      await refreshAppointments();
      setSelectedAppointmentId(created.id);
      setAppointmentForm((state) => ({ ...state, reason: "" }));
      submitPayHereCheckout(checkoutPayload);
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

    if (isDoctor && !doctorCanConsult) {
      toast.error("Doctor must be admin-verified before managing consultation actions.");
      return;
    }

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

  const handleRefreshMeeting = async () => {
    if (!token || !selectedAppointmentId || !selectedAppointment) return;
    if (selectedAppointment.type !== "TELEMEDICINE") {
      toast.error("Meeting link is available only for telemedicine appointments.");
      return;
    }

    try {
      setMeetingLoading(true);
      const response = await apiGetAuth<{ meetingUrl: string }>(`/appointments/${selectedAppointmentId}/meeting-link`, token);
      setMeetingLink(response.meetingUrl || "");
      setShowJitsiPreview(false);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Unable to load Jitsi meeting link");
    } finally {
      setMeetingLoading(false);
    }
  };

  const openMeetingWithChecklist = (mode: "START" | "JOIN") => {
    if (!meetingLink) {
      toast.error("Load the Jitsi link first.");
      return;
    }

    if (mode === "JOIN" && isPatient && !canPatientJoinMeeting) {
      toast.error("Doctor has not started the meeting yet. Please wait.");
      return;
    }

    if (typeof window !== "undefined") {
      window.alert("Before joining, make sure your microphone and camera are turned on.");
      window.open(meetingLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleStartMeeting = async () => {
    if (!token || !selectedAppointmentId || !selectedAppointment) return;

    if (isDoctor && !doctorCanConsult) {
      toast.error("Doctor must be admin-verified before starting consultations.");
      return;
    }

    if (selectedAppointment.status !== "CONFIRMED" && selectedAppointment.status !== "ACCEPTED") {
      toast.error("Meeting can start only after payment is confirmed.");
      return;
    }

    try {
      if (selectedAppointment.status !== "ACCEPTED") {
        await apiPutAuth<Appointment>(`/appointments/${selectedAppointmentId}/status?status=ACCEPTED`, {}, token);
        await refreshAppointments();
      }
      openMeetingWithChecklist("START");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Unable to mark meeting as started");
    }
  };

  const handleSaveNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAppointmentId || !doctorProfile || !patientProfile) return;

    if (isDoctor && !doctorCanConsult) {
      toast.error("Doctor must be admin-verified before saving consultation notes.");
      return;
    }

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

    if (isDoctor && !doctorCanConsult) {
      toast.error("Doctor must be admin-verified before saving prescriptions.");
      return;
    }

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

  const pathname = usePathname();
  const isPatient = role === "PATIENT";
  const isDoctor = role === "DOCTOR";
  const doctorCanConsult = !isDoctor || (doctorProfile?.verificationStatus === "APPROVED" && doctorProfile?.active);
  const canManage = role === "ADMIN" || (isDoctor && doctorCanConsult);
  const bookingPreview = doctorPreview || null;
  const patientNameDisplay = isPatient ? (patientProfile?.fullName?.trim() || "Patient") : "Patient";
  const mainClasses = pathname?.startsWith("/patient") ? "pb-12" : "pt-20 pb-12";

  const canJoinAppointment = (appointment: Appointment) => appointment.type === "TELEMEDICINE" && appointment.status === "ACCEPTED";

  const handleJoinMeetingFromRow = async (appointment: Appointment) => {
    if (!token || !canJoinAppointment(appointment)) return;

    try {
      const response = await apiGetAuth<{ meetingUrl: string }>(`/appointments/${appointment.id}/meeting-link`, token);
      if (!response.meetingUrl) {
        toast.error("Meeting link not available yet.");
        return;
      }
      window.open(response.meetingUrl, "_blank", "noopener,noreferrer");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Unable to open the meeting link.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className={mainClasses}>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {isPatient ? `${patientNameDisplay}'s Appointments` : "Appointments"}
              </h1>
              <p className="text-sm text-slate-500">
                Review your scheduled consultations, join telemedicine calls, and see the appointment details below.
              </p>
            </div>
            {isPatient && (
              <button
                type="button"
                onClick={() => setShowAppointmentModal(true)}
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                Book appointment
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard title="All" value={appointmentStats.total} icon={<Activity className="w-4 h-4 text-blue-600" />} />
            <MetricCard title="Upcoming" value={appointmentStats.upcoming} icon={<Clock className="w-4 h-4 text-blue-600" />} />
            <MetricCard title="Completed" value={appointmentStats.completed} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />} />
            <MetricCard title="Cancelled" value={appointmentStats.cancelled} icon={<XCircle className="w-4 h-4 text-rose-600" />} />
          </div>

          {selectedAppointment && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.4)]">
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Selected appointment</p>
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">{formatDateTime(selectedAppointment.appointmentTime)}</h3>
                        <p className="text-slate-300 mt-1">{selectedAppointment.reason || "No reason provided"}</p>
                      </div>
                      <StatusPill status={selectedAppointment.status} dark />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <InfoTile label="Type" value={selectedAppointment.type} />
                      <InfoTile label="Consultation fee" value={formatCurrency(selectedAppointment.consultationFee || 0)} />
                      <InfoTile
                        label="Doctor"
                        value={
                          selectedAppointment.doctorName ||
                          selectedAppointment.doctorFullName ||
                          selectedAppointment.doctorId.slice(0, 8)
                        }
                      />
                      <InfoTile label="Patient ID" value={selectedAppointment.patientId.slice(0, 8)} />
                    </div>
                  </div>
                </div>

                {selectedAppointment.type === "TELEMEDICINE" && (
                  <div className="rounded-3xl border border-slate-700 bg-slate-950 p-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold">Jitsi Telemedicine</p>
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xl font-black tracking-tight">Join Jitsi</p>
                        {isJitsiLink && jitsiRoomName && <p className="text-sm text-blue-100/80">Room: {jitsiRoomName}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRefreshMeeting}
                          disabled={meetingLoading}
                          className="rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold px-4 py-2.5 text-sm"
                        >
                          {meetingLoading ? "Loading..." : "Refresh link"}
                        </button>
                        {meetingLink && (
                          <button
                            type="button"
                            onClick={() => (isPatient ? openMeetingWithChecklist("JOIN") : handleStartMeeting())}
                            className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-100 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isPatient && !canPatientJoinMeeting}
                          >
                            Join Jitsi
                          </button>
                        )}
                      </div>
                      {isPatient && !canPatientJoinMeeting && (
                        <p className="text-xs text-amber-200 bg-amber-600/10 border border-amber-200 rounded-xl px-3 py-2">
                          Join is enabled only after doctor starts the meeting.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="lg:col-span-12">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm w-full">
                <div className="p-6 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

                {isPatient && (
                  <div className="px-6 py-4 border-b border-slate-100">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                          placeholder="Search appointment id, reason, doctor, status"
                        />
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full max-w-xs rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                        >
                          <option value="ALL">All statuses</option>
                          {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadPDF}
                        className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto max-h-[34rem]">
                  {visibleAppointments.length > 0 ? (
                    <table className="min-w-full w-full border-separate border-spacing-0">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Time</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Note</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Type</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Fee</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {visibleAppointments.map((appointment) => (
                          <tr
                            key={appointment.id}
                            onClick={() => setSelectedAppointmentId(appointment.id)}
                            className={`border-b border-slate-100 transition cursor-pointer ${selectedAppointmentId === appointment.id ? "bg-blue-50/50" : "hover:bg-slate-50"}`}
                          >
                            <td className="px-4 py-4 align-top">
                              <div className="flex flex-col gap-1">
                                <span className="font-mono text-xs text-slate-500">{appointment.id.slice(0, 8)}...</span>
                                <span className="font-semibold text-slate-900">Appointment ID</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <p className="text-slate-900 font-semibold">{formatDateTime(appointment.appointmentTime)}</p>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <p className="text-sm text-slate-600 line-clamp-2">{appointment.reason || "No reason provided."}</p>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <StatusPill status={appointment.status} />
                            </td>
                            <td className="px-4 py-4 align-top">
                              <span className="text-sm font-bold text-slate-700">{appointment.type}</span>
                            </td>
                            <td className="px-4 py-4 align-top text-right">
                              <span className="font-semibold text-slate-900">{formatCurrency(appointment.consultationFee || 0)}</span>
                            </td>
                            <td className="px-4 py-4 align-top text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleJoinMeetingFromRow(appointment);
                                }}
                                disabled={!canJoinAppointment(appointment)}
                                className="rounded-2xl border px-3 py-2 text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 text-blue-700 border-blue-500 hover:bg-blue-50"
                              >
                                Join
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-slate-500">
                      No appointments available.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Modal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        title="Book an appointment"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          void handleBookingSubmit(e as unknown as FormEvent<HTMLFormElement>);
        }} className="space-y-4">
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
            {bookingLoading ? "Booking & preparing payment..." : "Book & continue to payment"}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={showCancelAppointmentConfirm}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment?"
        cancelLabel="Keep"
        confirmLabel="Yes, Cancel"
        confirmTone="danger"
        onCancel={() => setShowCancelAppointmentConfirm(false)}
        onConfirm={() => {
          void handleCancelAppointment();
          setShowCancelAppointmentConfirm(false);
        }}
      />
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
