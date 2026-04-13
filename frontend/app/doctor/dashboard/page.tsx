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
  Loader2,
  Upload,
  Image as ImageIcon,
  BadgeCheck,
  RefreshCw,
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
import { getJitsiRoomName, isJitsiMeetingUrl, toJitsiEmbedUrl } from "@/lib/telemedicine";
import ConfirmDialog from "@/components/ConfirmDialog";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";
type DocumentType = "LICENSE" | "CERTIFICATE";
type AppointmentStatus = "PENDING" | "CONFIRMED" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
type AppointmentType = "IN_CLINIC" | "TELEMEDICINE";

interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string | null;
  profileImageUrl?: string | null;
  specialty: string | null;
  slmcNumber?: string | null;
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

interface SlotAllocationItem {
  slotTime: string;
  booked: boolean;
  appointmentId?: string | null;
  patientId?: string | null;
  appointmentStatus?: AppointmentStatus | null;
  appointmentType?: AppointmentType | null;
  reason?: string | null;
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
  const [pendingDeleteDocumentId, setPendingDeleteDocumentId] = useState<string | null>(null);

  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [documents, setDocuments] = useState<DoctorDocument[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [publishedAvailability, setPublishedAvailability] = useState<Availability[]>([]);
  const [publishedLeaves, setPublishedLeaves] = useState<DoctorLeave[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [slotAllocationDate, setSlotAllocationDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slotAllocation, setSlotAllocation] = useState<SlotAllocationItem[]>([]);
  const [slotAllocationLoading, setSlotAllocationLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    specialty: "",
    slmcNumber: "",
    bio: "",
    experienceYears: "",
    consultationFee: "",
    qualification: "",
  });

  const [docType, setDocType] = useState<DocumentType>("LICENSE");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [profileImageUploading, setProfileImageUploading] = useState(false);

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
  const [meetingLoading, setMeetingLoading] = useState(false);
  const [showJitsiPreview, setShowJitsiPreview] = useState(false);

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
  const selectedAppointment = useMemo(
    () => appointments.find((a) => a.id === selectedAppointmentId) || null,
    [appointments, selectedAppointmentId],
  );
  const isJitsiLink = useMemo(() => isJitsiMeetingUrl(meetingLink), [meetingLink]);
  const jitsiRoomName = useMemo(() => getJitsiRoomName(meetingLink), [meetingLink]);
  const jitsiEmbedUrl = useMemo(() => toJitsiEmbedUrl(meetingLink), [meetingLink]);

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

  const isVerifiedDoctor = profile?.verificationStatus === "APPROVED" && profile?.active === true;

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
          slmcNumber: myProfile.slmcNumber ?? "",
          bio: myProfile.bio ?? "",
          experienceYears: myProfile.experienceYears ? String(myProfile.experienceYears) : "",
          consultationFee: myProfile.consultationFee ? String(myProfile.consultationFee) : "",
          qualification: myProfile.qualification ?? "",
        });

        const [appointmentsResult, availabilityResult, leaveResult, documentsResult] = await Promise.allSettled([
          apiGetAuth<Appointment[]>(`/appointments/doctor/${myProfile.id}`, token),
          apiGetAuth<Availability[]>("/doctors/availability", token),
          apiGetAuth<DoctorLeave[]>("/doctors/leave", token),
          apiGetAuth<DoctorDocument[]>("/doctors/documents", token),
        ]);

        if (appointmentsResult.status === "fulfilled") {
          setAppointments(appointmentsResult.value);
        }

        if (availabilityResult.status === "fulfilled") {
          setPublishedAvailability(
            [...availabilityResult.value].sort((a, b) => dayOptions.indexOf(a.dayOfWeek) - dayOptions.indexOf(b.dayOfWeek)),
          );
        }

        if (leaveResult.status === "fulfilled") {
          setPublishedLeaves(
            [...leaveResult.value].sort((a, b) => new Date(a.leaveDate).getTime() - new Date(b.leaveDate).getTime()),
          );
        }

        if (documentsResult.status === "fulfilled") {
          setDocuments(documentsResult.value);
        }
      } catch (err: unknown) {
        const e = err as { message?: string };
        toast.error(e.message || "Failed to load doctor dashboard");
      } finally {
        setDocumentsLoading(false);
        setScheduleLoading(false);
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

  const refreshDocuments = async () => {
    if (!token) return;
    setDocumentsLoading(true);
    try {
      const rows = await apiGetAuth<DoctorDocument[]>("/doctors/documents", token);
      setDocuments(rows);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to refresh verification documents");
    } finally {
      setDocumentsLoading(false);
    }
  };

  const refreshSchedule = async () => {
    if (!token) return;

    setScheduleLoading(true);
    try {
      const [availRows, leaveRows] = await Promise.all([
        apiGetAuth<Availability[]>('/doctors/availability', token),
        apiGetAuth<DoctorLeave[]>('/doctors/leave', token),
      ]);

      setPublishedAvailability(
        [...availRows].sort((a, b) => dayOptions.indexOf(a.dayOfWeek) - dayOptions.indexOf(b.dayOfWeek)),
      );
      setPublishedLeaves(
        [...leaveRows].sort((a, b) => new Date(a.leaveDate).getTime() - new Date(b.leaveDate).getTime()),
      );
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || 'Unable to load published schedule');
    } finally {
      setScheduleLoading(false);
    }
  };

  const refreshSlotAllocation = async () => {
    if (!token || !profile?.id || !slotAllocationDate) return;

    setSlotAllocationLoading(true);
    try {
      const rows = await apiGetAuth<SlotAllocationItem[]>(
        `/appointments/doctor/${profile.id}/slot-allocation?date=${slotAllocationDate}`,
        token,
      );
      setSlotAllocation(rows);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to load slot allocation details");
    } finally {
      setSlotAllocationLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    if (activeTab === "verification") {
      void refreshDocuments();
    }

    if (activeTab === "schedule") {
      void refreshSchedule();
      void refreshSlotAllocation();
    }
  }, [activeTab, token]);

  useEffect(() => {
    if (activeTab !== "schedule") return;
    void refreshSlotAllocation();
  }, [slotAllocationDate, activeTab, profile?.id, token]);

  const handleProfileSave = async () => {
    if (!token) return;

    try {
      const updated = await apiPutAuth<DoctorProfile>(
        "/doctors/me",
        {
          fullName: profileForm.fullName,
          profileImageUrl: profile?.profileImageUrl || null,
          specialty: profileForm.specialty,
          slmcNumber: profileForm.slmcNumber,
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

  const handleProfileImageUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !profileImageFile) {
      toast.error("Please choose a profile image first.");
      return;
    }

    try {
      setProfileImageUploading(true);
      const formData = new FormData();
      formData.append("file", profileImageFile);
      const updated = await apiPostAuthFormData<DoctorProfile>("/doctors/me/profile-image", formData, token);
      setProfile(updated);
      setProfileImageFile(null);
      toast.success("Profile image uploaded.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to upload profile image (check doctor login/session)." );
    } finally {
      setProfileImageUploading(false);
    }
  };

  useEffect(() => {
    if (!profileImageFile) {
      setProfileImagePreview(null);
      return;
    }

    const nextPreview = URL.createObjectURL(profileImageFile);
    setProfileImagePreview(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [profileImageFile]);

  const handleUploadDocument = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !docFile) {
      toast.error("Please select a document file.");
      return;
    }

    try {
      setDocUploading(true);
      const formData = new FormData();
      formData.append("file", docFile);
      formData.append("type", docType);
      await apiPostAuthFormData<DoctorDocument>("/doctors/documents", formData, token);
      setDocFile(null);
      await refreshDocuments();
      toast.success("Document uploaded for verification.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Document upload failed");
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!token) return;
    try {
      await apiDeleteAuth(`/doctors/documents/${id}`, token);
      await refreshDocuments();
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
      await refreshSchedule();
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
      await refreshSchedule();
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

    if (!isVerifiedDoctor) {
      toast.error("Admin verification approval is required before consultation actions.");
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
    if (!token || !selectedAppointmentId || !selectedAppointment) {
      toast.error("Select a telemedicine appointment first.");
      return;
    }

    if (selectedAppointment.type !== "TELEMEDICINE") {
      toast.error("Meeting link is available only for telemedicine appointments.");
      return;
    }

    try {
      setMeetingLoading(true);
      const data = await apiGetAuth<{ meetingUrl: string }>(`/appointments/${selectedAppointmentId}/meeting-link`, token);
      setMeetingLink(data.meetingUrl);
      setShowJitsiPreview(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to fetch meeting link");
    } finally {
      setMeetingLoading(false);
    }
  };

  const handleStartJitsiCall = async () => {
    if (!token || !selectedAppointmentId || !selectedAppointment) {
      toast.error("Select a telemedicine appointment first.");
      return;
    }

    if (!isVerifiedDoctor) {
      toast.error("Admin verification approval is required before starting consultations.");
      return;
    }

    if (selectedAppointment.status !== "CONFIRMED" && selectedAppointment.status !== "ACCEPTED") {
      toast.error("Meeting can start only after payment is confirmed.");
      return;
    }

    if (!meetingLink) {
      toast.error("Load the Jitsi link first.");
      return;
    }

    try {
      if (selectedAppointment.status !== "ACCEPTED") {
        await apiPutAuth<Appointment>(`/appointments/${selectedAppointmentId}/status?status=ACCEPTED`, {}, token);
        await refreshAppointments();
      }

      if (typeof window !== "undefined") {
        window.alert("Before joining, make sure your microphone and camera are turned on.");
        window.open(meetingLink, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to mark meeting as started");
    }
  };

  useEffect(() => {
    setMeetingLink("");
    setShowJitsiPreview(false);
  }, [selectedAppointmentId]);

  const handleSaveConsultationNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAppointmentId || !profile) {
      toast.error("Select an appointment first.");
      return;
    }

    if (!isVerifiedDoctor) {
      toast.error("Admin verification approval is required before saving consultation notes.");
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

    if (!isVerifiedDoctor) {
      toast.error("Admin verification approval is required before saving prescriptions.");
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
  const canConsult = isVerifiedDoctor;
  const doctorName = profile.fullName?.trim() || "Consultant";
  const greetingName = `Dr. ${doctorName}`;
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
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-slate-500 font-semibold">Welcome back</p>
              <div className="flex items-center justify-end gap-1">
                <p className="text-sm font-bold text-slate-900">{greetingName}</p>
                {profile.verificationStatus === "APPROVED" && (
                  <BadgeCheck className="w-4 h-4 text-blue-600" />
                )}
              </div>
            </div>
            {profile?.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt="Doctor"
                className="h-10 w-10 rounded-full object-cover border border-slate-200"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 font-bold grid place-items-center text-xs border border-slate-200">
                {doctorName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
            {profile.verificationStatus !== "APPROVED" && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold tracking-wide ${verificationTone}`}>
                {profile.verificationStatus === "REJECTED" ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                VERIFICATION: {profile.verificationStatus}
              </div>
            )}
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
              <StatCard title="Published Slots" value={String(publishedAvailability.length)} subtitle="Weekly schedule entries" icon={<CalendarDays className="w-4 h-4 text-blue-600" />} />
              <StatCard title="Leave Entries" value={String(publishedLeaves.length)} subtitle="Published leave days" icon={<TrendingUp className="w-4 h-4 text-blue-600" />} />
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Profile Information</h2>
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center gap-4">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Selected profile preview"
                    className="h-16 w-16 rounded-full object-cover border border-blue-200"
                  />
                ) : profile?.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt="Doctor profile"
                    className="h-16 w-16 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-slate-200 text-slate-600 font-bold grid place-items-center">
                    {(profileForm.fullName || "DR").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">Profile picture</p>
                  <p>Upload an image to Cloudinary and save its secure URL on your profile.</p>
                  {profileImageFile && (
                    <p className="mt-1 text-xs text-blue-700 font-semibold">
                      Staged: {profileImageFile.name}
                    </p>
                  )}
                </div>
              </div>
              <form onSubmit={handleProfileImageUpload} className="mt-3 space-y-3">
                <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-5 text-center hover:border-blue-400 hover:bg-blue-50/40 transition">
                  <div className="flex flex-col items-center gap-2 text-slate-600">
                    <Upload className="w-5 h-5" />
                    <p className="text-sm font-semibold">Click to choose profile image</p>
                    <p className="text-xs">PNG, JPG, WEBP recommended</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>

                {profileImageFile && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2 text-blue-800">
                      <ImageIcon className="w-4 h-4" />
                      <span className="font-semibold">{profileImageFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfileImageFile(null)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!profileImageFile || profileImageUploading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-bold"
                >
                  {profileImageUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    "Upload picture"
                  )}
                </button>
                {profileImageUploading && (
                  <p className="text-xs text-slate-500">Please wait while we upload your image to Cloudinary...</p>
                )}
              </form>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Full Name" value={profileForm.fullName} onChange={(value) => setProfileForm((s) => ({ ...s, fullName: value }))} required />
              <Input label="Specialty" value={profileForm.specialty} onChange={(value) => setProfileForm((s) => ({ ...s, specialty: value }))} required />
              <Input label="SLMC Number" value={profileForm.slmcNumber} onChange={(value) => setProfileForm((s) => ({ ...s, slmcNumber: value }))} required />
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
            <button type="button" onClick={handleProfileSave} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">Save Profile</button>
          </div>
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
              <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-blue-400 hover:bg-blue-50/40 transition">
                <div className="flex flex-col items-center gap-2 text-slate-600">
                  <Upload className="w-5 h-5" />
                  <p className="text-sm font-semibold">Choose a verification file</p>
                  <p className="text-xs">PDF, JPG, PNG</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  required
                />
              </label>
              {docFile && (
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 font-semibold">
                  Staged file: {docFile.name}
                </div>
              )}
              <button disabled={!docFile || docUploading} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold">
                {docUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : "Upload Document"}
              </button>
            </form>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">Submitted Documents</h2>
                <button type="button" onClick={() => void refreshDocuments()} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
              <ul className="mt-3 space-y-2">
                {documentsLoading && <li className="text-sm text-slate-500">Loading documents...</li>}
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
                      onClick={() => setPendingDeleteDocumentId(doc.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700"
                    >
                      Delete
                    </button>
                  </li>
                ))}
                {!documentsLoading && documents.length === 0 && <li className="text-sm text-slate-500">No documents uploaded yet.</li>}
              </ul>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Published Schedule</h2>
                <p className="text-sm text-slate-600">Manage your weekly slots and published leave dates from one place.</p>
              </div>
              <button
                type="button"
                onClick={() => void refreshSchedule()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh schedule
              </button>
            </div>

            <div className="grid xl:grid-cols-3 gap-4">
              <form onSubmit={handleAddAvailability} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 xl:col-span-1">
                <h3 className="text-base font-bold text-slate-900">Add Weekly Availability</h3>
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
                <button className="w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">Publish Availability</button>
              </form>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 xl:col-span-2">
                <h3 className="text-base font-bold text-slate-900 mb-3">Weekly Published Slots</h3>
                {scheduleLoading ? (
                  <p className="text-sm text-slate-500">Loading published availability...</p>
                ) : publishedAvailability.length === 0 ? (
                  <p className="text-sm text-slate-500 rounded-xl border border-dashed border-slate-200 p-4">No availability published yet.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {publishedAvailability.map((slot) => (
                      <div key={slot.id || `${slot.dayOfWeek}-${slot.startTime}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">{slot.dayOfWeek}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{slot.startTime} - {slot.endTime}</p>
                        <p className="text-xs text-slate-500 mt-1">{slot.slotDuration} min slots</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid xl:grid-cols-3 gap-4">
              <form onSubmit={handleAddLeave} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 xl:col-span-1">
                <h3 className="text-base font-bold text-slate-900">Publish Leave Date</h3>
                <Input label="Leave Date" type="date" value={leaveForm.leaveDate} onChange={(value) => setLeaveForm((s) => ({ ...s, leaveDate: value }))} required />
                <label className="text-sm font-semibold text-slate-700 block">
                  Reason
                  <textarea
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    rows={3}
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm((s) => ({ ...s, reason: e.target.value }))}
                    placeholder="Conference, vacation, medical emergency..."
                  />
                </label>
                <button className="w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">Publish Leave</button>
              </form>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 xl:col-span-2">
                <h3 className="text-base font-bold text-slate-900 mb-3">Published Leave Calendar</h3>
                {scheduleLoading ? (
                  <p className="text-sm text-slate-500">Loading leave dates...</p>
                ) : publishedLeaves.length === 0 ? (
                  <p className="text-sm text-slate-500 rounded-xl border border-dashed border-slate-200 p-4">No leave dates published.</p>
                ) : (
                  <div className="space-y-2">
                    {publishedLeaves.map((leave) => (
                      <div key={leave.id || leave.leaveDate} className="rounded-xl border border-slate-200 p-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{new Date(leave.leaveDate).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-500 mt-1">{leave.reason || "No reason provided"}</p>
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                          Leave
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h3 className="text-base font-bold text-slate-900">Daily Slot Allocation</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={slotAllocationDate}
                    onChange={(e) => setSlotAllocationDate(e.target.value)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => void refreshSlotAllocation()}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reload
                  </button>
                </div>
              </div>

              {slotAllocationLoading ? (
                <p className="text-sm text-slate-500">Loading slot allocation...</p>
              ) : slotAllocation.length === 0 ? (
                <p className="text-sm text-slate-500 rounded-xl border border-dashed border-slate-200 p-4">No slot allocation for selected date.</p>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {slotAllocation.map((item) => (
                    <div key={`${slotAllocationDate}-${item.slotTime}`} className={`rounded-xl border p-3 ${item.booked ? "border-blue-200 bg-blue-50/70" : "border-slate-200 bg-slate-50/70"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">{item.slotTime}</p>
                        <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${item.booked ? "text-blue-700 bg-blue-100" : "text-slate-600 bg-slate-200"}`}>
                          {item.booked ? "Booked" : "Free"}
                        </span>
                      </div>
                      {item.booked && (
                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <p>Patient: <span className="font-semibold text-slate-900">{item.patientId?.slice(0, 8)}...</span></p>
                          <p>Status: <span className="font-semibold text-slate-900">{item.appointmentStatus}</span></p>
                          <p>Type: <span className="font-semibold text-slate-900">{item.appointmentType}</span></p>
                          <p className="line-clamp-2">Reason: <span className="font-semibold text-slate-900">{item.reason || "-"}</span></p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Jitsi Meeting</p>
                  <p className="text-xs text-slate-600">Type: {selectedAppointment?.type || "-"}</p>
                  <button
                    type="button"
                    onClick={handleFetchMeetingLink}
                    disabled={!canConsult || selectedAppointment?.type !== "TELEMEDICINE" || meetingLoading}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {meetingLoading ? "Loading..." : "Get Jitsi Link"}
                  </button>

                  {meetingLink && (
                    <>
                      <button
                        type="button"
                        onClick={handleStartJitsiCall}
                        disabled={!selectedAppointment || !["CONFIRMED", "ACCEPTED"].includes(selectedAppointment.status)}
                        className="w-full px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:bg-blue-300 disabled:cursor-not-allowed"
                      >
                        Start appointment call
                      </button>
                      {isJitsiLink && jitsiRoomName && <p className="text-xs text-slate-500">Room: {jitsiRoomName}</p>}

                      {isJitsiLink && (
                        <button
                          type="button"
                          onClick={() => setShowJitsiPreview((state) => !state)}
                          className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-700"
                        >
                          {showJitsiPreview ? "Hide embedded Jitsi" : "Show embedded Jitsi"}
                        </button>
                      )}

                      {showJitsiPreview && jitsiEmbedUrl && (
                        <iframe
                          src={jitsiEmbedUrl}
                          title="Doctor Jitsi Meeting"
                          className="w-full h-64 rounded-xl border border-slate-200"
                          allow="camera; microphone; fullscreen; display-capture"
                        />
                      )}
                    </>
                  )}
                </div>
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

      <ConfirmDialog
        open={!!pendingDeleteDocumentId}
        title="Delete Document"
        message="Are you sure you want to delete this document?"
        cancelLabel="Cancel"
        confirmLabel="Yes, Delete"
        confirmTone="danger"
        onCancel={() => setPendingDeleteDocumentId(null)}
        onConfirm={() => {
          if (pendingDeleteDocumentId) {
            void handleDeleteDocument(pendingDeleteDocumentId);
          }
          setPendingDeleteDocumentId(null);
        }}
      />
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
