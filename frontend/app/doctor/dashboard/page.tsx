"use client";

import React, { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
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
  FileText,
  ShieldAlert,
  ShieldX,
  ChevronRight,
  Edit2,
  Trash2,
  Plus,
  X,
  Search,
  Filter,
  Download,
  ClipboardList,
  Pill,
  ChevronDown,
  FileDigit,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import Modal from "@/components/Modal";
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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  patientFullName?: string;
  description?: string;
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
  instructions: string;
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
  const [editingAvailabilityId, setEditingAvailabilityId] = useState<string | null>(null);

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
    medicineName: "",
    dosage: "",
    frequency: "",
    duration: "",
    route: "ORAL",
    instructions: "",
    validUntil: "",
    notes: "",
  });

  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [earningsSearchQuery, setEarningsSearchQuery] = useState("");
  const [appointmentFilterStatus, setAppointmentFilterStatus] = useState<AppointmentStatus | "ALL">("ALL");
  const [activeClinicalAppointmentId, setActiveClinicalAppointmentId] = useState<string | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isRxModalOpen, setIsRxModalOpen] = useState(false);

  const appointmentStats = useMemo(() => {
    const total = appointments.length;
    const upcoming = appointments.filter((a) => ["PENDING", "CONFIRMED", "ACCEPTED"].includes(a.status)).length;
    const completed = appointments.filter((a) => a.status === "COMPLETED").length;
    const cancelled = appointments.filter((a) => ["CANCELLED", "REJECTED", "NO_SHOW"].includes(a.status)).length;
    return { total, upcoming, completed, cancelled };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const matchesSearch =
        (a.patientFullName || "").toLowerCase().includes(appointmentSearch.toLowerCase()) ||
        a.id?.toLowerCase().includes(appointmentSearch.toLowerCase());
      const matchesStatus = appointmentFilterStatus === "ALL" || a.status === appointmentFilterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, appointmentSearch, appointmentFilterStatus]);
  const completedAppointments = useMemo(() => appointments.filter((a) => a.status === "COMPLETED"), [appointments]);

  const openNoteModal = (appointmentId: string) => {
    setActiveClinicalAppointmentId(appointmentId);
    setSelectedAppointmentId(appointmentId);
    setIsNoteModalOpen(true);
  };

  const openRxModal = (appointmentId: string) => {
    setActiveClinicalAppointmentId(appointmentId);
    setSelectedAppointmentId(appointmentId);
    setIsRxModalOpen(true);
  };

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

  const filteredEarnings = useMemo(() => {
    return completedAppointments.filter((a) => {
      const matchesSearch =
        (a.patientFullName || "").toLowerCase().includes(earningsSearchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(earningsSearchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [completedAppointments, earningsSearchQuery]);

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

  const weeklyRevenue = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const weeklyGroups = Array.from({ length: 5 }, () => [] as Appointment[]);
    appointments.forEach((a) => {
      const d = new Date(a.appointmentTime);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        const day = d.getDate();
        const weekIdx = Math.min(Math.floor((day - 1) / 7), 4);
        weeklyGroups[weekIdx].push(a);
      }
    });

    return [
      { label: "Week 1", value: weeklyGroups[0].reduce((sum, a) => sum + (a.consultationFee || 1500), 0) },
      { label: "Week 2", value: weeklyGroups[1].reduce((sum, a) => sum + (a.consultationFee || 1500), 0) },
      { label: "Week 3", value: weeklyGroups[2].reduce((sum, a) => sum + (a.consultationFee || 1500), 0) },
      { label: "Week 4", value: (weeklyGroups[3].concat(weeklyGroups[4])).reduce((sum, a) => sum + (a.consultationFee || 1500), 0) },
    ];
  }, [appointments]);

  const maxWeeklyRevenue = Math.max(...weeklyRevenue.map(w => w.value), 1000);

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

  // Auto-refresh appointments every 30 seconds to pick up payment confirmations
  useEffect(() => {
    if (!token || !profile?.id) return;
    const pollTimer = setInterval(() => {
        void refreshAppointments();
    }, 30000);
    return () => clearInterval(pollTimer);
  }, [token, profile?.id]);

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

  useEffect(() => {
    if (isNoteModalOpen && selectedAppointmentId && token) {
      const fetchCurrentNote = async () => {
        try {
          const existing = await apiGetAuth<ConsultationNote>(`/appointments/${selectedAppointmentId}/notes`, token);
          if (existing) {
            setConsultationNote({
              chiefComplaint: existing.chiefComplaint || "",
              clinicalNotes: existing.clinicalNotes || "",
              diagnosis: existing.diagnosis || "",
            });
          } else {
            setConsultationNote({ chiefComplaint: "", clinicalNotes: "", diagnosis: "" });
          }
        } catch (err) {
          // Record doesn't exist yet, reset form
          setConsultationNote({ chiefComplaint: "", clinicalNotes: "", diagnosis: "" });
        }
      };
      void fetchCurrentNote();
    }
  }, [isNoteModalOpen, selectedAppointmentId, token]);

  useEffect(() => {
    if (isRxModalOpen && selectedAppointmentId && token) {
      const fetchCurrentRx = async () => {
        try {
          const existing = await apiGetAuth<Prescription>(`/appointments/${selectedAppointmentId}/prescriptions`, token);
          if (existing) {
            setPrescriptionPayload({
              validUntil: existing.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              notes: existing.notes || "",
              items: existing.items || [],
            });
          } else {
            setPrescriptionPayload({
              validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              notes: "",
              items: [],
            });
          }
        } catch (err) {
          // Record doesn't exist yet, reset form
          setPrescriptionPayload({
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            notes: "",
            items: [],
          });
        }
      };
      void fetchCurrentRx();
    }
  }, [isRxModalOpen, selectedAppointmentId, token]);

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
      if (editingAvailabilityId) {
        await apiPutAuth<Availability>(`/doctors/availability/${editingAvailabilityId}`, availabilityForm, token);
        toast.success("Availability slot updated.");
        setEditingAvailabilityId(null);
      } else {
        await apiPostAuth<Availability>("/doctors/availability", availabilityForm, token);
        toast.success("Availability slot added.");
      }
      setAvailabilityForm({ dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30 });
      await refreshSchedule();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to save availability");
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!token) return;
    try {
      await apiDeleteAuth(`/doctors/availability/${id}`, token);
      toast.success("Availability slot deleted.");
      await refreshSchedule();
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to delete availability");
    }
  };

  const handleEditAvailability = (slot: Availability) => {
    setEditingAvailabilityId(slot.id || null);
    setAvailabilityForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      slotDuration: slot.slotDuration,
    });
  };

  const handleCancelAvailabilityEdit = () => {
    setEditingAvailabilityId(null);
    setAvailabilityForm({ dayOfWeek: "MONDAY", startTime: "09:00", endTime: "17:00", slotDuration: 30 });
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

  const handleStatusUpdate = async (id?: string, status?: AppointmentStatus) => {
    const targetId = id || selectedAppointmentId;
    const targetStatus = status || statusToSet;

    if (!token || !targetId) {
      toast.error("Select an appointment first.");
      return;
    }

    if (!isVerifiedDoctor) {
      toast.error("Admin verification approval is required before consultation actions.");
      return;
    }

    const loadingToast = toast.loading(`Updating status to ${targetStatus}...`);
    try {
      await apiPutAuth<Appointment>(`/appointments/${targetId}/status?status=${targetStatus}`, {}, token);
      await refreshAppointments();
      toast.success(`Appointment marked as ${targetStatus}.`, { id: loadingToast });
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to update appointment status", { id: loadingToast });
    }
  };

  const handleJoinMeeting = async (appointment: Appointment) => {
    if (!token) {
      toast.error("Authentication required.");
      return;
    }

    if (!isVerifiedDoctor) {
      toast.error("Admin verification approval is required before starting consultations.");
      return;
    }

    if (appointment.type !== "TELEMEDICINE") {
      toast.error("Meeting link is available only for telemedicine appointments.");
      return;
    }

    if (appointment.status !== "CONFIRMED" && appointment.status !== "ACCEPTED") {
      toast.error("Meeting can start only after payment is confirmed.");
      return;
    }

    try {
      setMeetingLoading(true);
      setSelectedAppointmentId(appointment.id);

      // Step 1: Fetch the meeting link
      const data = await apiGetAuth<{ meetingUrl: string }>(`/appointments/${appointment.id}/meeting-link`, token);
      const url = data.meetingUrl;

      if (!url) {
        toast.error("No meeting URL returned from the server.");
        return;
      }

      setMeetingLink(url);

      // Step 2: Update status to ACCEPTED if not already
      if (appointment.status !== "ACCEPTED") {
        await apiPutAuth<Appointment>(`/appointments/${appointment.id}/status?status=ACCEPTED`, {}, token);
        await refreshAppointments();
      }

      // Step 3: Open the meeting
      if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
        toast.success("Meeting opened in a new tab.");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Unable to start meeting");
    } finally {
      setMeetingLoading(false);
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
          instructions: prescription.instructions,
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

  const handleDownloadCSV = () => {
    if (completedAppointments.length === 0) {
      toast.error("No transactional records to export.");
      return;
    }

    const headers = ["Date & Time", "Patient Name", "Consultation Type", "Status", "Fee (LKR)"];
    const rows = completedAppointments.map((a) => [
      new Date(a.appointmentTime).toLocaleString(),
      a.patientFullName || "Unregistered",
      a.type,
      "Settled",
      a.consultationFee || 0,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CareLabs_Earnings_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Earnings CSV downloaded successfully.");
  };

  const handleDownloadPDF = () => {
    if (filteredAppointments.length === 0) {
      toast.error("No appointment records to export.");
      return;
    }

    const doc = new jsPDF();
    const doctorName = profile?.fullName || "Consultant";
    
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("CareLabs Clinical Ledger", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Doctor: Dr. ${doctorName}`, 14, 30);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, 35);
    doc.text(`Total Records: ${filteredAppointments.length}`, 14, 40);
    
    autoTable(doc, {
      startY: 50,
      head: [["ID", "Patient", "Date/Time", "Type", "Status", "Note/Desc"]],
      body: filteredAppointments.map(a => [
        a.id?.slice(0, 8) || "-",
        a.patientFullName || "Unregistered",
        new Date(a.appointmentTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
        a.type,
        a.status,
        a.description || "-"
      ]),
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 50 },
    });

    doc.save(`CareLabs_Appointments_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Clinical PDF report generated.");
  };

  const handleDownloadEarningsPDF = () => {
    if (filteredEarnings.length === 0) {
      toast.error("No transactional records to export.");
      return;
    }

    const doc = new jsPDF();
    const doctorName = profile?.fullName || "Consultant";
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("CareLabs Financial Ledger", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Doctor: Dr. ${doctorName}`, 14, 30);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, 35);
    doc.text(`Total Revenue: LKR ${earnings.gross.toLocaleString()}`, 14, 40);
    doc.text(`Net Wallet: LKR ${earnings.estimatedNet.toLocaleString()}`, 14, 45);
    
    autoTable(doc, {
      startY: 55,
      head: [["Date & Time", "Patient", "Consultation Type", "Status", "Credit (LKR)"]],
      body: filteredEarnings.map(a => [
        new Date(a.appointmentTime).toLocaleString(),
        a.patientFullName || "Unregistered",
        a.type,
        "Settled",
        (a.consultationFee || 1500).toLocaleString()
      ]),
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: [51, 65, 85] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 55 },
    });

    doc.save(`CareLabs_Earnings_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Financial PDF report generated.");
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
    <div className="flex h-screen overflow-hidden bg-slate-50" suppressHydrationWarning>
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-col hidden md:flex shrink-0" suppressHydrationWarning>
        <div className="p-6 border-b border-slate-800">
           <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-xl flex items-center justify-center">
                <img
                 src="/images/carelabs.png"
                 alt="CareLabs Logo"
                 className="w-full h-full object-contain"
                />
             </div>
             CareLabs
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

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
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
            <NotificationBell />
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <StatCard title="Total Traffic" value={String(appointmentStats.total)} subtitle="Cumulative encounters" icon={<Activity className="w-5 h-5 text-blue-500" />} />
              <StatCard title="Active Pipeline" value={String(appointmentStats.upcoming)} subtitle="Pending / Confirmed" icon={<Clock className="w-5 h-5 text-indigo-500" />} />
              <StatCard title="Clinical Volume" value={String(appointmentStats.completed)} subtitle="Finished Care" icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} />
              <StatCard title="Cancellation Rate" value={String(appointmentStats.cancelled)} subtitle="Rejected / Revoked" icon={<XCircle className="w-5 h-5 text-rose-500" />} />
              <StatCard title="Published Availability" value={String(publishedAvailability.length)} subtitle="Active weekly slots" icon={<CalendarDays className="w-5 h-5 text-fuchsia-500" />} />
              <StatCard title="Vacation Index" value={String(publishedLeaves.length)} subtitle="Scheduled leave days" icon={<TrendingUp className="w-5 h-5 text-amber-500" />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* [x] Lifecycle Mapping */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm overflow-hidden relative group">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                   <div className="mb-6">
                      <h2 className="text-lg font-bold text-slate-900 leading-tight">Lifecycle Mapping</h2>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Status Distribution</p>
                   </div>
                   <div className="space-y-4">
                     {statusChart.slice(0, 4).map((row) => (
                       <div key={row.key} className="group/item">
                         <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 group-hover/item:text-slate-900 transition-colors">
                           <span>{row.label}</span>
                           <span>{row.count}</span>
                         </div>
                         <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div 
                             className={`${row.color} h-full rounded-full transition-all duration-1000`} 
                             style={{ width: `${row.percentage}%` }} 
                           />
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                {/* [y] Status Breakdown (Pie Chart) */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm overflow-hidden relative group flex flex-col items-center">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                   <div className="w-full mb-6">
                      <h2 className="text-lg font-bold text-slate-900 leading-tight text-left">Clinical Split</h2>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1 text-left">Real-time Breakdown</p>
                   </div>
                   
                   <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        {statusChart.reduce((acc, row, i) => {
                          const prev = acc.total;
                          const current = (row.percentage / 100) * 100;
                          acc.total += current;
                          const strokeDash = `${current} 100`;
                          const strokeOffset = -prev;
                          // Use simple hex colors or similar for SVG
                          const colors = ["#3b82f6", "#10b981", "#6366f1", "#f59e0b", "#ef4444", "#a855f7"];
                          return {
                            ...acc,
                            elements: [
                              ...acc.elements,
                              <circle 
                                key={row.key}
                                cx="18" cy="18" r="15.915" 
                                fill="transparent" 
                                stroke={colors[i % colors.length]}
                                strokeWidth="3.5"
                                strokeDasharray={strokeDash}
                                strokeDashoffset={strokeOffset}
                                className="transition-all duration-1000"
                              />
                            ]
                          };
                        }, { total: 0, elements: [] as ReactNode[] }).elements}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-2xl font-black text-slate-900 leading-none">{appointmentStats.total}</span>
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Total</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-6 w-full">
                      {statusChart.slice(0, 4).map((row, i) => {
                        const colors = ["bg-blue-500", "bg-emerald-500", "bg-indigo-500", "bg-amber-500"];
                        return (
                          <div key={row.key} className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${colors[i]}`} />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate">{row.label}</span>
                          </div>
                        );
                      })}
                   </div>
                </div>

                {/* [z] Up Next */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm overflow-hidden relative">
                   <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
                   <div className="mb-6 flex items-center justify-between">
                     <div>
                       <h2 className="text-lg font-bold text-slate-900 leading-tight">Patient Queue</h2>
                       <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Upcoming Sessions</p>
                     </div>
                     <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">LIVE</span>
                   </div>
                   <div className="space-y-3">
                     {appointments
                       .filter((a) => ["PENDING", "CONFIRMED", "ACCEPTED"].includes(a.status))
                       .sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime())
                       .slice(0, 3)
                       .map((a) => (
                         <div key={a.id} className="group/item border border-slate-200 bg-slate-50/50 rounded-2xl p-3.5 hover:bg-white hover:shadow-md transition-all">
                           <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-extrabold text-slate-900 text-xs">{new Date(a.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600/60">{a.type}</span>
                           </div>
                           <p className="text-[10px] font-bold text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap uppercase tracking-tight">{a.patientFullName || "Unregistered Patient"}</p>
                         </div>
                       ))}
                     {appointments.filter((a) => ["PENDING", "CONFIRMED", "ACCEPTED"].includes(a.status)).length === 0 && (
                       <p className="text-[11px] font-bold text-slate-400 text-center py-8 italic uppercase tracking-widest">No active queue</p>
                     )}
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Revenue Performance */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
                   <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                   <div className="flex items-center justify-between mb-8">
                     <div>
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight">Revenue Analytics</h2>
                       <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Marketplace Performance Index</p>
                     </div>
                     <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Real-time Vault</span>
                     </div>
                   </div>
                   
                   <div className="h-64 flex items-end gap-4 px-2 pt-4">
                     {weeklyRevenue.map((w) => {
                       const h = Math.max(12, Math.round((w.value / maxWeeklyRevenue) * 100));
                       return (
                         <div key={w.label} className="flex-1 flex flex-col items-center group/bar">
                           <div className="w-full relative">
                             <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 whitespace-nowrap z-10 shadow-xl">
                               {formatLkr(w.value)}
                             </div>
                             <div 
                               className="w-full rounded-2xl bg-gradient-to-t from-slate-900 to-slate-700 group-hover/bar:from-blue-600 group-hover/bar:to-blue-400 transition-all duration-500 shadow-lg shadow-slate-900/10"
                               style={{ height: `${h}%` }}
                             />
                           </div>
                           <span className="mt-5 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/bar:text-slate-900 transition-colors">{w.label}</span>
                         </div>
                       );
                     })}
                   </div>
                </div>

                {/* Patient Sentiment / Feedback (High Premium Look) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
                   <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors" />
                   <div className="mb-8">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Reputation</h2>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Patient Sentiment Audit</p>
                   </div>

                   <div className="flex items-center gap-6 mb-8">
                      <div className="flex flex-col items-center px-6 py-4 bg-amber-50 border border-amber-100 rounded-[2rem]">
                         <span className="text-3xl font-black text-amber-600 leading-none">4.9</span>
                         <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 mt-2">Overall</span>
                      </div>
                      <div className="flex-1 space-y-2">
                         {[100, 85, 40, 10, 5].map((val, i) => (
                           <div key={i} className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-slate-400 w-2">{5-i}</span>
                             <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${val}%` }} />
                             </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Latest Feedback Snippet</p>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl relative">
                         <div className="absolute -top-3 left-4 px-3 py-1 bg-white border border-slate-100 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-widest shadow-sm">Verified Patient</div>
                         <p className="text-[13px] font-medium text-slate-700 italic leading-relaxed py-1">"Exceptional care and very detailed consultation. The doctor took time to explain the procedure clearly..."</p>
                         <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            <span>Mylessa P.</span>
                            <span>2 days ago</span>
                         </div>
                      </div>
                   </div>
                </div>
            </div>
          </div>
        )}

        {activeTab === "earnings" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Revenue" value={formatLkr(earnings.gross)} subtitle="Gross" icon={<DollarSign className="w-5 h-5 text-blue-500" />} compact />
              <StatCard title="Platform fee" value={formatLkr(earnings.gross * 0.1)} subtitle="10% Commission" icon={<TrendingUp className="w-5 h-5 text-indigo-500" />} compact />
              <StatCard title="Wallet" value={formatLkr(earnings.estimatedNet)} subtitle="Net Balance" icon={<Activity className="w-5 h-5 text-emerald-500" />} compact />
              <StatCard title="Pipeline" value={formatLkr(earnings.upcomingValue)} subtitle="Upcoming" icon={<Clock className="w-5 h-5 text-amber-500" />} compact />
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                   <div>
                     <h2 className="text-xl font-bold text-slate-900 leading-tight">Ledger Logs</h2>
                     <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Activity Statement</p>
                   </div>
                   
                   <div className="flex flex-1 min-w-[300px] items-center gap-4">
                      <div className="relative flex-1 group">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                         <input 
                           type="text" 
                           placeholder="Search ledger by patient or type..." 
                           value={earningsSearchQuery}
                           onChange={(e) => setEarningsSearchQuery(e.target.value)}
                           className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                         />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleDownloadCSV}
                          className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-all active:scale-95 flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5" /> CSV
                        </button>
                        <button 
                          onClick={handleDownloadEarningsPDF}
                          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-slate-200"
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                   </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px] font-bold text-slate-700">
                      <thead>
                        <tr className="text-left text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100">
                          <th className="pb-4 px-2">Date & Time</th>
                          <th className="pb-4 px-2">Consultation Type</th>
                          <th className="pb-4 px-2">Payout Status</th>
                          <th className="pb-4 px-2 text-right">Credit (LKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredEarnings.map((a) => (
                          <tr key={a.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-2 font-mono text-[10px] text-slate-400 group-hover:text-slate-900 transition-colors">{new Date(a.appointmentTime).toLocaleString()}</td>
                            <td className="py-4 px-2 uppercase tracking-tight">{a.type}</td>
                            <td className="py-4 px-2">
                               <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                  <CheckCircle2 className="w-3 h-3" /> Settled
                               </span>
                            </td>
                            <td className="py-4 px-2 text-right font-black text-slate-900">{formatLkr(a.consultationFee || 1500)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
                {filteredEarnings.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                     <DollarSign className="w-12 h-12 text-slate-300 mb-4" />
                     <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No Transactional Records</p>
                  </div>
                )}
            </div>
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Professional Profile</h2>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Identity & Credentials</p>
               </div>
               <button type="button" onClick={handleProfileSave} className="px-8 py-3.5 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">Save Changes</button>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
               <div className="space-y-6">
                  <div className="bg-slate-50/50 rounded-[2.5rem] p-6 border border-slate-100 flex flex-col items-center text-center">
                    <div className="relative group">
                       <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity" />
                       {profileImagePreview ? (
                         <img src={profileImagePreview} alt="Preview" className="h-32 w-32 rounded-[2.5rem] object-cover border-4 border-white shadow-xl relative z-10" />
                       ) : profile?.profileImageUrl ? (
                         <img src={profile.profileImageUrl} alt="Doctor" className="h-32 w-32 rounded-[2.5rem] object-cover border-4 border-white shadow-xl relative z-10" />
                       ) : (
                         <div className="h-32 w-32 rounded-[2.5rem] bg-slate-200 border-4 border-white shadow-xl flex items-center justify-center text-2xl font-black text-slate-500 relative z-10">
                           {(profileForm.fullName || "DR").slice(0, 2).toUpperCase()}
                         </div>
                       )}
                    </div>
                    
                    <div className="mt-6 space-y-1">
                       <p className="text-lg font-black text-slate-900">{profileForm.fullName || "Unnamed Consultant"}</p>
                       <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{profileForm.specialty || "Specialty Not Set"}</p>
                    </div>

                    <form onSubmit={handleProfileImageUpload} className="mt-8 w-full space-y-4">
                       <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all">
                          <Upload className="w-4 h-4" />
                          <span>Change Photo</span>
                          <input type="file" accept="image/*" onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)} className="hidden" />
                       </label>
                       
                       {profileImageFile && (
                         <div className="animate-in fade-in slide-in-from-top-2">
                           <button type="submit" disabled={profileImageUploading} className="w-full py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                             {profileImageUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm Upload"}
                           </button>
                         </div>
                       )}
                    </form>
                  </div>
               </div>

               <div className="lg:col-span-2 space-y-8">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <Input label="Registry Full Name" value={profileForm.fullName} onChange={(val) => setProfileForm(s => ({...s, fullName: val}))} required />
                    <Input label="Primary Specialty" value={profileForm.specialty} onChange={(val) => setProfileForm(s => ({...s, specialty: val}))} required />
                    <Input label="SLMC License Number" value={profileForm.slmcNumber} onChange={(val) => setProfileForm(s => ({...s, slmcNumber: val}))} required />
                    <Input label="Academic Qualification" value={profileForm.qualification} onChange={(val) => setProfileForm(s => ({...s, qualification: val}))} />
                    <Input label="Experience (Years)" type="number" value={profileForm.experienceYears} onChange={(val) => setProfileForm(s => ({...s, experienceYears: val}))} />
                    <Input label="Consultation Fee (LKR)" type="number" value={profileForm.consultationFee} onChange={(val) => setProfileForm(s => ({...s, consultationFee: val}))} />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Professional Biography</label>
                    <textarea 
                      className="w-full rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-5 text-sm font-bold text-slate-900 focus:ring-4 ring-blue-500/10 focus:border-blue-500 transition-all outline-none min-h-[160px]"
                      rows={5}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm(s => ({...s, bio: e.target.value}))}
                      placeholder="Share your expertise, clinical focus, and patient care philosophy..."
                    />
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === "verification" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-wrap items-center justify-between gap-6 overflow-hidden relative group">
               <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 -mr-32 -mt-32 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
               <div className="relative z-10">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Clinical Verification</h2>
                 <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Registry Compliance & Credentialing</p>
               </div>
               <div className={`relative z-10 flex items-center gap-3 px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${verificationTone}`}>
                  {profile.verificationStatus === "APPROVED" ? <BadgeCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  Status: {profile.verificationStatus}
               </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
               <div className="lg:col-span-2 space-y-6">
                  <form onSubmit={handleUploadDocument} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-6">
                     <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Selected Document Type</label>
                        <select 
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                          value={docType}
                          onChange={(e) => setDocType(e.target.value as DocumentType)}
                        >
                          <option value="LICENSE">PROFESSIONAL LICENSE</option>
                          <option value="CERTIFICATE">QUALIFICATION CERTIFICATE</option>
                        </select>
                     </div>
                     
                     <label className="block cursor-pointer rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center hover:border-blue-400 hover:bg-white transition-all group">
                        <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-blue-500 transition-colors">
                           <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                              <Upload className="w-6 h-6" />
                           </div>
                           <p className="text-sm font-black uppercase tracking-tight text-slate-900 mt-2">Stage Credential File</p>
                           <p className="text-[10px] font-bold uppercase tracking-widest">PDF, JPG or PNG (Max 10MB)</p>
                        </div>
                        <input type="file" className="hidden" onChange={(e) => setDocFile(e.target.files?.[0] || null)} required />
                     </label>

                     {docFile && (
                        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <FileCheck className="w-5 h-5 text-blue-600 shrink-0" />
                              <span className="text-xs font-bold text-blue-800 truncate">{docFile.name}</span>
                           </div>
                           <button type="button" onClick={() => setDocFile(null)} className="p-1 text-blue-400 hover:text-blue-600"><XCircle className="w-4 h-4" /></button>
                        </div>
                     )}

                     <button disabled={!docFile || docUploading} className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg shadow-slate-200">
                        {docUploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Initiate Secure Upload"}
                     </button>
                  </form>
               </div>

               <div className="lg:col-span-3 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm flex flex-col min-h-[500px]">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                           <h3 className="text-xl font-bold text-slate-900 leading-tight">Submitted Evidence</h3>
                           <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Clinical Vault</p>
                        </div>
                        <button type="button" onClick={() => void refreshDocuments()} className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                           <RefreshCw className="w-4 h-4" />
                        </button>
                     </div>

                     <div className="space-y-4 pr-2 overflow-y-auto custom-scrollbar">
                        {documentsLoading && (
                          <div className="space-y-3">
                             {[1,2,3].map(i => <div key={i} className="h-20 rounded-3xl bg-slate-50 animate-pulse" />)}
                          </div>
                        )}
                        {documents.map((doc) => (
                           <div key={doc.id} className="group border border-slate-100 bg-slate-50/50 rounded-3xl p-5 hover:bg-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
                              <div className="flex items-start justify-between gap-4">
                                 <div className="flex items-start gap-4">
                                    <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm text-slate-400 group-hover:text-blue-500 transition-colors">
                                       <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                       <h4 className="font-black text-slate-900 tracking-tight">{doc.type}</h4>
                                       <div className="flex items-center gap-3 mt-1.5 font-bold text-[10px] uppercase tracking-widest text-slate-400">
                                          <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Link Verified</a>
                                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                                          <span className={doc.status === "APPROVED" ? "text-emerald-500" : "text-amber-500"}>{doc.status}</span>
                                       </div>
                                    </div>
                                 </div>
                                 <button
                                   type="button"
                                   onClick={() => setPendingDeleteDocumentId(doc.id)}
                                   className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-95"
                                 >
                                    <ChevronRight className="w-4 h-4" />
                                 </button>
                              </div>
                           </div>
                        ))}
                        {!documentsLoading && documents.length === 0 && (
                          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50">
                             <ShieldX className="w-12 h-12 text-slate-300 mb-4" />
                             <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No Credentials Hosted</p>
                          </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === "schedule" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-wrap items-center justify-between gap-6 overflow-hidden relative group">
               <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 -mr-32 -mt-32 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
               <div className="relative z-10">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Schedule</h2>
                 <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">Timeline & Availability Ledger</p>
               </div>
               <button
                 type="button"
                 onClick={() => void refreshSchedule()}
                 className="relative z-10 p-3.5 rounded-2xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95"
               >
                 <RefreshCw className="w-5 h-5" />
               </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
               <form onSubmit={handleAddAvailability} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm space-y-6 lg:col-span-1">
                 <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingAvailabilityId ? "Modify Slot" : "Publish Slots"}</h3>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">Weekly Configuration</p>
                    </div>
                    {editingAvailabilityId && (
                      <button type="button" onClick={handleCancelAvailabilityEdit} className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-rose-600 transition-all"><X className="w-4 h-4" /></button>
                    )}
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Selected Weekday</label>
                       <select
                         className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                         value={availabilityForm.dayOfWeek}
                         onChange={(e) => setAvailabilityForm((s) => ({ ...s, dayOfWeek: e.target.value as Availability["dayOfWeek"] }))}
                       >
                         {dayOptions.map((day) => (
                           <option key={day} value={day}>{day}</option>
                         ))}
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <Input label="Session Start" type="time" value={availabilityForm.startTime} onChange={(val) => setAvailabilityForm(s => ({...s, startTime: val}))} />
                       <Input label="Session End" type="time" value={availabilityForm.endTime} onChange={(val) => setAvailabilityForm(s => ({...s, endTime: val}))} />
                    </div>

                    <Input label="Granularity (Min)" type="number" value={String(availabilityForm.slotDuration)} onChange={(val) => setAvailabilityForm(s => ({...s, slotDuration: Number(val || 30)}))} />

                    <button className="w-full py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2">
                       {editingAvailabilityId ? <RefreshCw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                       {editingAvailabilityId ? "Commit Changes" : "Broadcast Availability"}
                    </button>
                 </div>
               </form>

               <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm min-h-[460px]">
                     <div className="mb-8">
                       <h3 className="text-xl font-bold text-slate-900 leading-tight">Weekly Published Slots</h3>
                       <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Operational Windows</p>
                     </div>

                     {scheduleLoading ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                           {[1,2,3].map(i => <div key={i} className="h-32 rounded-3xl bg-slate-50 animate-pulse" />)}
                        </div>
                     ) : publishedAvailability.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                           <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
                           <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Schedule Empty</p>
                        </div>
                     ) : (
                       <div className="grid sm:grid-cols-2 gap-4">
                          {publishedAvailability.map((slot) => {
                             const dayColors: Record<string, { bg: string, text: string, border: string, dot: string }> = {
                               MONDAY: { bg: "bg-blue-50/50", text: "text-blue-700", border: "border-blue-100", dot: "bg-blue-500" },
                               TUESDAY: { bg: "bg-indigo-50/50", text: "text-indigo-700", border: "border-indigo-100", dot: "bg-indigo-500" },
                               WEDNESDAY: { bg: "bg-emerald-50/50", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500" },
                               THURSDAY: { bg: "bg-amber-50/50", text: "text-amber-700", border: "border-amber-100", dot: "bg-amber-500" },
                               FRIDAY: { bg: "bg-rose-50/50", text: "text-rose-700", border: "border-rose-100", dot: "bg-rose-500" },
                               SATURDAY: { bg: "bg-cyan-50/50", text: "text-cyan-700", border: "border-cyan-100", dot: "bg-cyan-500" },
                               SUNDAY: { bg: "bg-slate-50/50", text: "text-slate-700", border: "border-slate-100", dot: "bg-slate-500" },
                             };
                             const colors = dayColors[slot.dayOfWeek] || dayColors.MONDAY;
                             const isEditing = editingAvailabilityId === slot.id;

                             return (
                               <div key={slot.id || `${slot.dayOfWeek}-${slot.startTime}`} className={`group relative rounded-[2rem] border ${colors.border} ${colors.bg} p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 ${isEditing ? "ring-4 ring-blue-500/20 shadow-lg scale-[1.02]" : ""}`}>
                                  <div className="flex items-start justify-between mb-4">
                                     <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
                                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${colors.text}`}>{slot.dayOfWeek}</span>
                                     </div>
                                     <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditAvailability(slot)} className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 shadow-sm transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDeleteAvailability(slot.id!)} className="p-2 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-600 shadow-sm transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                     </div>
                                  </div>
                                  <div className="space-y-1">
                                     <p className="text-xl font-black text-slate-900 tracking-tight">{slot.startTime} — {slot.endTime}</p>
                                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3" /> {slot.slotDuration} Minute Granularity</p>
                                  </div>
                               </div>
                             );
                          })}
                       </div>
                     )}
                  </div>
               </div>
            </div>

            <div className="grid xl:grid-cols-3 gap-6">
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
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm flex flex-wrap items-center justify-between gap-6">
               <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">Patient Records</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Live Connection Active</p>
                  </div>
               </div>
               <div className="flex flex-1 min-w-[300px] items-center gap-4">
                  <div className="relative flex-1 group">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                     <input 
                       type="text" 
                       placeholder="Search by patient name or ID..." 
                       value={appointmentSearch}
                       onChange={(e) => setAppointmentSearch(e.target.value)}
                       className="w-full pl-12 pr-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                     />
                  </div>
                  <div className="relative group">
                     <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <select 
                       value={appointmentFilterStatus}
                       onChange={(e) => setAppointmentFilterStatus(e.target.value as AppointmentStatus | "ALL")}
                       className="pl-12 pr-10 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                     >
                        <option value="ALL">All Status</option>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                     <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
               </div>
                <button 
                  onClick={handleDownloadPDF}
                  className="px-6 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 active:scale-95"
                >
                   <Download className="w-4 h-4" /> Download Records
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
               {!canConsult && (
                 <div className="m-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-3xl p-5 text-xs font-bold flex items-center gap-4">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p>Standard documentation and consultation tools are restricted until professional verification is complete.</p>
                 </div>
               )}

               <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                     <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                           <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Patient Data</th>
                           <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Schedule</th>
                           <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Consultation Type</th>
                           <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Lead Complaint</th>
                           <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                           <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {filteredAppointments.length === 0 ? (
                          <tr>
                             <td colSpan={6} className="px-8 py-20 text-center">
                                <div className="flex flex-col items-center justify-center opacity-30">
                                   <CalendarDays className="w-12 h-12 mb-4" />
                                   <p className="text-sm font-black uppercase tracking-widest">No matching records</p>
                                </div>
                             </td>
                          </tr>
                        ) : (
                          filteredAppointments.map((a) => {
                             const statusColors: Record<string, string> = {
                               PENDING: "bg-amber-100 text-amber-700",
                               CONFIRMED: "bg-blue-100 text-blue-700",
                               ACCEPTED: "bg-indigo-100 text-indigo-700",
                               COMPLETED: "bg-emerald-100 text-emerald-700",
                               CANCELLED: "bg-slate-100 text-slate-500",
                               REJECTED: "bg-rose-100 text-rose-700",
                               NO_SHOW: "bg-orange-100 text-orange-700"
                             };
                             const isSelected = selectedAppointmentId === a.id;
                             
                             return (
                               <tr key={a.id} className={`group hover:bg-slate-50/50 transition-colors ${isSelected ? "bg-blue-50/30" : ""}`}>
                                  <td className="px-8 py-6">
                                     <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-200">
                                           {a.patientFullName?.slice(0, 1).toUpperCase() || "P"}
                                        </div>
                                        <div>
                                           <p className="text-sm font-black text-slate-900 tracking-tight">{a.patientFullName || "Patient"}</p>
                                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {a.id.slice(0, 12)}</p>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-6 py-6">
                                     <div className="space-y-1">
                                        <p className="text-xs font-black text-slate-800">{new Date(a.appointmentTime).toLocaleDateString()}</p>
                                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(a.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                     </div>
                                  </td>
                                  <td className="px-6 py-6">
                                     <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 w-fit">
                                        {a.type === "TELEMEDICINE" ? <Video className="w-3 h-3" /> : <Stethoscope className="w-3 h-3" />}
                                        {a.type}
                                     </span>
                                  </td>
                                  <td className="px-6 py-6">
                                     <p className="text-xs font-bold text-slate-600 line-clamp-1 max-w-[200px]">{a.reason || "General Consultation Request"}</p>
                                  </td>
                                  <td className="px-6 py-6">
                                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest whitespace-nowrap ${statusColors[a.status] || "bg-slate-100"}`}>
                                         {a.status.replace("_", " ")}
                                      </span>
                                  </td>
                                  <td className="px-8 py-6">
                                     <div className="flex items-center justify-end gap-2">
                                        {/* Status Management Actions */}
                                        {a.status === "CONFIRMED" && (
                                          <>
                                            <button 
                                              onClick={() => handleStatusUpdate(a.id, "ACCEPTED")}
                                              disabled={!canConsult}
                                              className="p-2.5 rounded-xl border border-emerald-100 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 disabled:opacity-30"
                                              title="Accept Appointment"
                                            >
                                              <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                              onClick={() => handleStatusUpdate(a.id, "REJECTED")}
                                              disabled={!canConsult}
                                              className="p-2.5 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95 disabled:opacity-30"
                                              title="Reject Appointment"
                                            >
                                              <XCircle className="w-4 h-4" />
                                            </button>
                                          </>
                                        )}

                                        {a.status === "ACCEPTED" && (
                                          <>
                                            <button 
                                              onClick={() => handleStatusUpdate(a.id, "COMPLETED")}
                                              disabled={!canConsult}
                                              className="p-2.5 rounded-xl border border-indigo-100 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all active:scale-95 disabled:opacity-30"
                                              title="Mark as Completed"
                                            >
                                              <CheckCircle2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                              onClick={() => handleStatusUpdate(a.id, "NO_SHOW")}
                                              disabled={!canConsult}
                                              className="p-2.5 rounded-xl border border-amber-100 text-amber-500 hover:bg-amber-500 hover:text-white transition-all active:scale-95 disabled:opacity-30"
                                              title="Mark as No Show"
                                            >
                                              <ShieldAlert className="w-4 h-4" />
                                            </button>
                                          </>
                                        )}

                                        {a.type === "TELEMEDICINE" && (() => {
                                           const canJoin = a.status === "CONFIRMED" || a.status === "ACCEPTED";
                                           const isThisLoading = meetingLoading && selectedAppointmentId === a.id;
                                           const isOtherLoading = meetingLoading && selectedAppointmentId !== a.id;
                                           const isDisabled = !canJoin || meetingLoading;
                                           return (
                                             <button 
                                               onClick={() => handleJoinMeeting(a)}
                                               disabled={isDisabled}
                                               className={`px-4 py-2 rounded-xl text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 ${
                                                 !canJoin
                                                   ? "bg-slate-300 cursor-not-allowed opacity-40"
                                                   : isOtherLoading
                                                     ? "bg-slate-300 cursor-not-allowed opacity-50"
                                                     : isThisLoading
                                                       ? "bg-blue-500 opacity-80"
                                                       : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                                               }`}
                                             >
                                               {isThisLoading ? "Connecting..." : "Join Meeting"}
                                             </button>
                                           );
                                        })()}
                                        <button 
                                          onClick={() => openNoteModal(a.id)}
                                          disabled={!canConsult}
                                          className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95 disabled:opacity-30"
                                          title="Session Note"
                                        >
                                           <ClipboardList className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => openRxModal(a.id)}
                                          disabled={!canConsult}
                                          className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-30"
                                          title="Digital Rx"
                                        >
                                           <Pill className="w-4 h-4" />
                                        </button>
                                     </div>
                                  </td>
                               </tr>
                             );
                          })
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Documentation Modals */}
            <Modal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} title="Clinical Observation Session">
               <form onSubmit={handleSaveConsultationNote} className="space-y-6">
                  <div className="p-4 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                     <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Active Patient</p>
                        <p className="text-sm font-black text-slate-900 mt-0.5">{selectedAppointment?.patientFullName || "Loading..."}</p>
                     </div>
                     <div className="p-2.5 rounded-2xl bg-white text-blue-600 shadow-sm">
                        <User className="w-5 h-5" />
                     </div>
                  </div>
                  <Input label="Main Complaint" value={consultationNote.chiefComplaint} onChange={(value) => setConsultationNote((s) => ({ ...s, chiefComplaint: value }))} required placeholder="Why is the patient seeking care?" />
                  <div className="space-y-2">
                     <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Detailed Findings</label>
                     <textarea 
                       className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none min-h-[160px]" 
                       rows={4} 
                       value={consultationNote.clinicalNotes} 
                       onChange={(e) => setConsultationNote((s) => ({ ...s, clinicalNotes: e.target.value }))} 
                       required 
                       placeholder="Enter clinical observations, symptoms, and examination results..." 
                     />
                  </div>
                  <Input label="Final Diagnosis" value={consultationNote.diagnosis} onChange={(value) => setConsultationNote((s) => ({ ...s, diagnosis: value }))} required placeholder="e.g. Simple Viral Fever" />
                  <div className="pt-4">
                     <button className="w-full py-5 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2">
                        <FileDigit className="w-4 h-4" /> Save to EMR Ledger
                     </button>
                  </div>
               </form>
            </Modal>

            <Modal isOpen={isRxModalOpen} onClose={() => setIsRxModalOpen(false)} title="Digital Prescription Generator">
               <form onSubmit={handleSavePrescription} className="space-y-6">
                  <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 relative overflow-hidden">
                     <div className="relative z-10">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Issuing For</p>
                        <p className="text-lg font-black text-slate-900 mt-1">{selectedAppointment?.patientFullName || "Loading..."}</p>
                     </div>
                     <Stethoscope className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 text-emerald-200/50" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <Input label="Generic Name" value={prescription.medicineName} onChange={(val) => setPrescription(s => ({...s, medicineName: val}))} required />
                    <Input label="Dosage (e.g. 500mg)" value={prescription.dosage} onChange={(val) => setPrescription(s => ({...s, dosage: val}))} required />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <Input label="Frequency" value={prescription.frequency} onChange={(val) => setPrescription(s => ({...s, frequency: val}))} required placeholder="e.g. 3 times daily" />
                    <Input label="Duration" value={prescription.duration} onChange={(val) => setPrescription(s => ({...s, duration: val}))} required placeholder="e.g. 5 days" />
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                       <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Route</label>
                       <select 
                         className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                         value={prescription.route}
                         onChange={(e) => setPrescription(s => ({...s, route: e.target.value}))}
                       >
                          <option value="ORAL">Oral (PO)</option>
                          <option value="INJECTION">Injection (IM/IV)</option>
                          <option value="TOPICAL">Topical</option>
                          <option value="INHALED">Inhaled</option>
                           <option value="OTHER">Other</option>
                       </select>
                    </div>
                    <Input label="Valid Until" type="date" value={prescription.validUntil} onChange={(val) => setPrescription(s => ({...s, validUntil: val}))} required />
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Specific Intake Instructions</label>
                     <textarea 
                       className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none min-h-[80px]" 
                       rows={2} 
                       value={prescription.instructions} 
                       onChange={(e) => setPrescription(s => ({...s, instructions: e.target.value}))} 
                       placeholder="e.g. After meals, avoid dairy..." 
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Pharmacist Instructions</label>
                     <textarea 
                       className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none min-h-[100px]" 
                       rows={3} 
                       value={prescription.notes} 
                       onChange={(e) => setPrescription(s => ({...s, notes: e.target.value}))} 
                       placeholder="Enter additional instructions for intake..." 
                     />
                  </div>

                  <div className="pt-4">
                     <button className="w-full py-5 rounded-2xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2">
                        <Pill className="w-4 h-4" /> Finalize Prescription
                     </button>
                  </div>
               </form>
            </Modal>
          </div>
        )}
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout? Your secure session will be terminated."
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
  compact,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group ${compact ? "py-4 px-6" : "aspect-square p-5"} flex flex-col justify-between items-center text-center`}>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full gap-2">
        <div className={`${compact ? "p-2" : "p-3"} shadow-sm bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-white group-hover:scale-110 transition-all duration-300 mb-1`}>
          {icon && React.cloneElement(icon as React.ReactElement, { className: compact ? "w-4 h-4 text-blue-500" : (icon as React.ReactElement).props.className })}
        </div>
        
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
          <p className={`${compact ? "text-xl" : "text-3xl"} font-black text-slate-900 tracking-tight leading-none`}>{value}</p>
        </div>

        {subtitle && (
          <p className="mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{subtitle}</p>
        )}
      </div>
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
    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">
      {label}
      <input
        className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
