"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, CheckCircle2, Award, Calendar, Stethoscope, ShieldAlert, Clock3, Loader2, CreditCard } from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import toast from "react-hot-toast";
import { apiGet, apiGetAuth, apiPostAuth, getRole, getToken, getUserIdFromToken } from "@/lib/api";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

interface LiveDoctor {
  id: string;
  userId: string;
  fullName: string | null;
  specialty: string | null;
  bio: string | null;
  experienceYears: number | null;
  qualification: string | null;
  slmcNumber: string | null;
  profileImageUrl: string | null;
  consultationFee: number | null;
  averageRating: number | null;
  totalReviews: number | null;
  verificationStatus: VerificationStatus;
  active: boolean;
}

interface PatientProfile {
  id: string;
  userId: string;
  fullName?: string | null;
  phone?: string | null;
  city?: string | null;
  district?: string | null;
}

interface Appointment {
  id: string;
}

interface PayHereCheckoutResponse {
  checkoutUrl?: string;
  merchantId: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
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

interface DoctorAvailability {
  id?: string;
  dayOfWeek: "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
  startTime: string;
  endTime: string;
  slotDuration: number;
}

const WEEKDAY_ORDER: DoctorAvailability["dayOfWeek"][] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const WEEKDAY_LABELS: Record<DoctorAvailability["dayOfWeek"], string> = {
  SUNDAY: "Sun",
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
};

function getDayOfWeek(value: string): DoctorAvailability["dayOfWeek"] {
  const date = new Date(`${value}T00:00:00`);
  return WEEKDAY_ORDER[date.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6];
}

function toMinutes(value: string) {
  const [hours = "0", minutes = "0"] = value.slice(0, 5).split(":");
  return Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);
}

function formatClock(value: string) {
  const [hoursRaw = "0", minutes = "00"] = value.slice(0, 5).split(":");
  const hours = Number.parseInt(hoursRaw, 10);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${minutes} ${suffix}`;
}

function buildSlotsForWindow(window: DoctorAvailability) {
  const duration = window.slotDuration && window.slotDuration > 0 ? window.slotDuration : 30;
  const start = toMinutes(window.startTime);
  const end = toMinutes(window.endTime);
  const slots: string[] = [];

  for (let current = start; current + duration <= end; current += duration) {
    const hours = Math.floor(current / 60)
      .toString()
      .padStart(2, "0");
    const minutes = (current % 60).toString().padStart(2, "0");
    slots.push(`${hours}:${minutes}`);
  }

  return slots;
}

function buildSlotsForDate(availability: DoctorAvailability[], selectedDate: string) {
  const dayOfWeek = getDayOfWeek(selectedDate);
  return availability
    .filter((window) => window.dayOfWeek === dayOfWeek)
    .flatMap((window) => buildSlotsForWindow(window))
    .filter((slot, index, list) => list.indexOf(slot) === index)
    .sort((a, b) => toMinutes(a) - toMinutes(b));
}

function toAppointmentDateTime(selectedDate: string, selectedTime: string) {
  const normalizedTime = selectedTime.length >= 8 ? selectedTime.slice(0, 8) : `${selectedTime}:00`;
  return `${selectedDate}T${normalizedTime}`;
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

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1594824388853-d0c0b4ac4f0b?auto=format&fit=crop&q=80&w=300&h=300";

export default function DoctorProfile() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [doctor, setDoctor] = useState<LiveDoctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [appointmentType, setAppointmentType] = useState<"TELEMEDICINE" | "IN_CLINIC">("TELEMEDICINE");
  const [reason, setReason] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [availability, setAvailability] = useState<DoctorAvailability[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const isPatient = role === "PATIENT";

  useEffect(() => {
    setToken(getToken());
    setRole(getRole());
  }, []);

  useEffect(() => {
    if (!id) return;

    const loadDoctor = async () => {
      setLoading(true);
      setNotFoundState(false);
      try {
        const data = await apiGet<LiveDoctor>(`/doctors/${id}`);
        setDoctor(data);
      } catch {
        setNotFoundState(true);
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    };

    void loadDoctor();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      try {
        const rows = await apiGet<DoctorAvailability[]>(`/doctors/${id}/availability`);
        setAvailability(rows);

        // Auto-select the next available date if the current selected date has no slots
        if (rows.length > 0) {
          const availableDays = rows.map((a) => a.dayOfWeek.toUpperCase());
          let checkDate = new Date();
          
          // Check next 14 days for a match
          for (let i = 0; i < 14; i++) {
            const dateStr = checkDate.toISOString().split("T")[0];
            const dayName = getDayOfWeek(dateStr).toUpperCase();
            
            if (availableDays.includes(dayName)) {
              setSelectedDate(dateStr);
              break;
            }
            checkDate.setDate(checkDate.getDate() + 1);
          }
        }
      } catch {
        setAvailability([]);
      } finally {
        setAvailabilityLoading(false);
      }
    };

    void loadAvailability();
  }, [id]);

  useEffect(() => {
    const loadSlots = async () => {
      setSlotsLoading(true);
      setSelectedTime("");
      try {
        if (!id || !selectedDate) {
          setAvailableSlots([]);
          return;
        }

        const derivedSlots = buildSlotsForDate(availability, selectedDate);

        if (!token || role !== "PATIENT") {
          setAvailableSlots(derivedSlots);
          return;
        }

        const endpoint = `/appointments/available-slots?doctorId=${id}&date=${selectedDate}`;
        const liveSlots = await apiGetAuth<string[]>(endpoint, token);
        // For logged-in patients, trust backend slot computation only.
        setAvailableSlots(liveSlots);
      } catch {
        // If the live slot API fails for patient flows, prevent selecting stale local slots.
        if (token && role === "PATIENT") {
          setAvailableSlots([]);
          return;
        }
        setAvailableSlots(buildSlotsForDate(availability, selectedDate));
      } finally {
        setSlotsLoading(false);
      }
    };

    void loadSlots();
  }, [id, selectedDate, token, role, availability]);

  useEffect(() => {
    if (!token || role !== "PATIENT") {
      setPatientProfile(null);
      setBookingCount(null);
      return;
    }

    const loadPatientContext = async () => {
      try {
        const profile = await apiGetAuth<PatientProfile>("/patients/me", token);
        setPatientProfile(profile);
        const rows = await apiGetAuth<Appointment[]>(`/appointments/patient/${profile.userId}`, token);
        setBookingCount(rows.length);
      } catch {
        setPatientProfile(null);
        setBookingCount(null);
      }
    };

    void loadPatientContext();
  }, [token, role]);

  const ensureAuth = () => {
    if (!token || !isPatient) {
      toast.error("Please login to make an appointment.");
      router.push("/login");
      return false;
    }
    return true;
  };

  const handleBookAndPay = async () => {
    if (!doctor) return;

    if (!ensureAuth()) return;

    if (!patientProfile?.userId) {
      toast.error("Patient profile is not ready yet. Please try again.");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error("Please select an available time slot.");
      return;
    }

    const appointmentTime = toAppointmentDateTime(selectedDate, selectedTime);

    setBookingLoading(true);
    try {
      const created = await apiPostAuth<Appointment>(
        "/appointments",
        {
          patientId: getUserIdFromToken() || patientProfile.userId,
          doctorId: doctor.id,
          appointmentTime,
          type: appointmentType,
          reason,
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

      setBookingCount((prev) => (prev === null ? 1 : prev + 1));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("carelabs:appointment-created"));
        localStorage.setItem("carelabs:lastAppointmentCreatedAt", String(Date.now()));
      }
      toast.success("Appointment booked. Redirecting to payment.");
      submitPayHereCheckout(checkoutPayload);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Unable to book appointment");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col">
        <PublicNavbar />
        <main className="flex-1 pt-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <div className="h-6 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-4">
            <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse" />
            <div className="h-7 w-64 rounded bg-slate-200 animate-pulse" />
            <div className="h-4 w-40 rounded bg-slate-100 animate-pulse" />
            <div className="h-24 w-full rounded bg-slate-100 animate-pulse" />
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (notFoundState || !doctor) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col">
        <PublicNavbar />
        <main className="flex-1 pt-20 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl font-black text-slate-900">Doctor not found</h1>
          <p className="mt-3 text-slate-600">The requested doctor profile could not be loaded.</p>
          <Link href="/doctors" className="inline-flex mt-8 px-5 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition">
            Back to doctors
          </Link>
        </main>
        <PublicFooter />
      </div>
    );
  }

  const name = doctor.fullName || "Doctor";
  const specialty = doctor.specialty || "General Practice";
  const fee = doctor.consultationFee || 0;
  const rating = doctor.averageRating || 0;
  const totalReviews = doctor.totalReviews || 0;
  const selectedDay = getDayOfWeek(selectedDate);
  const selectedAvailability = availability.filter((window) => window.dayOfWeek === selectedDay);
  const scheduleCount = availability.length;

  return (
    <div className="min-h-screen bg-white selection:bg-primary/20 selection:text-primary flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-20">
        <section className="bg-slate-50/30 border-b border-slate-200/60 pt-10 pb-16 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/doctors" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to search
            </Link>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative shrink-0 text-center mx-auto md:mx-0">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                  <img src={doctor.profileImageUrl || FALLBACK_AVATAR} alt={name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                  {doctor.verificationStatus === "APPROVED" ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />} {doctor.verificationStatus}
                </div>
              </div>

              <div className="flex-1 mt-2 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-2 justify-center md:justify-start">
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">{name}</h1>
                  <span className="inline-flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-100 self-center">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {doctor.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <h2 className="text-lg text-blue-600 font-bold mb-4">{specialty}</h2>

                <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-slate-600 font-medium justify-center md:justify-start">
                  <div className="flex items-center gap-2 justify-center">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Sri Lanka</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span>{doctor.experienceYears || 0} Years Exp.</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-amber-700 font-bold">{rating.toFixed(1)}</span>
                    <span className="text-amber-700/60 lowercase">({totalReviews} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Top Section: About & Credentials */}
            <div className="grid lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-12">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-6 tracking-tight flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    About Doctor
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-[15px] p-8 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
                    {doctor.bio || "Professional profile is available. Please proceed to booking for consultation details."}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-6 tracking-tight flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Credentials
                  </h3>
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-2">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-white border border-slate-200 flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Qualification</p>
                          <p className="text-slate-900 font-bold text-sm leading-snug">{doctor.qualification || "Not specified"}</p>
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100/50 flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <ShieldAlert className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">SLMC Number</p>
                          <p className="text-slate-900 font-bold text-sm leading-snug">{doctor.slmcNumber || "Not available"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Mini-Summary */}
              <div className="lg:col-span-4 self-start sticky top-28">
                <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl space-y-6">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Consultation Fee</p>
                    <p className="text-4xl font-extrabold tracking-tight">Rs. {fee.toLocaleString("en-US")}</p>
                  </div>
                  <div className="pt-6 border-t border-white/10 flex items-center gap-4 text-sm font-medium text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      Booking Available
                    </div>
                  </div>
                  <button 
                    onClick={() => document.getElementById("booking-workflow")?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full bg-white text-slate-900 hover:bg-blue-50 font-black uppercase tracking-widest text-xs py-4 rounded-2xl transition-all"
                  >
                    Secure You Slot Below
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Booking Workflow Board */}
            <div id="booking-workflow" className="scroll-mt-32">
              <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                Secure Your Appointment
              </h3>

              <div className="bg-white/80 backdrop-blur-2xl border border-blue-100 rounded-[3rem] p-8 lg:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8 relative divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                  
                  {/* PART 1: Date & Day Selection */}
                  <div className="pb-12 lg:pb-0 lg:pr-12 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">1</div>
                        <h4 className="font-extrabold text-slate-900 uppercase tracking-tight">Select Date</h4>
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                          type="date"
                          value={selectedDate}
                          onClick={(e) => {
                            if (!ensureAuth()) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => ensureAuth() && setSelectedDate(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 text-slate-900 font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          <Clock3 className="w-4 h-4 text-blue-600" /> Weekly Schedule
                        </h4>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{scheduleCount} windows</span>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-auto pr-1 select-none">
                        {availabilityLoading ? (
                          <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                            Loading schedule...
                          </div>
                        ) : availability.length > 0 ? (
                          availability.map((window) => (
                            <div
                              key={`${window.dayOfWeek}-${window.startTime}-${window.endTime}`}
                              className={`rounded-xl border px-3 py-2 flex items-center justify-between gap-3 ${window.dayOfWeek === selectedDay ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"}`}
                            >
                              <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{window.dayOfWeek}</p>
                                <p className="text-[10px] text-slate-500 font-bold">
                                  {formatClock(window.startTime)} - {formatClock(window.endTime)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black text-blue-700 uppercase leading-none">Min</p>
                                <p className="text-xs font-black text-slate-900">{window.slotDuration}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                            No schedule published.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-200">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Selection Highlights</p>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-600">Selected Day</span>
                          <span className="px-3 py-1 rounded-full bg-blue-900 text-white text-[10px] font-black uppercase">{selectedDay}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-600">Available Slots</span>
                          <span className="text-lg font-black text-slate-900">{availableSlots.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PART 2: Availabilty Slots Grid */}
                  <div className="py-12 lg:py-0 lg:px-12 space-y-6 flex flex-col items-center">
                    <div className="w-full flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">2</div>
                        <h4 className="font-extrabold text-slate-900 uppercase tracking-tight">Available Slots</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTime("")}
                        className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="w-full flex-1">
                      {slotsLoading ? (
                        <div className="h-48 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-3 text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-sm font-bold">Scanning schedule...</span>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar pb-4">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => ensureAuth() && setSelectedTime(slot)}
                              className={`rounded-2xl border-2 p-4 text-center transition-all ${
                                selectedTime === slot 
                                ? "border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-[0.98]" 
                                : "border-slate-100 bg-white hover:border-blue-200 text-slate-900 font-bold"
                              }`}
                            >
                              <div className="text-sm tracking-tight">{formatClock(slot)}</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="h-48 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center p-8 text-center space-y-4">
                          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                            <Clock3 className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">No Slots Available</p>
                            <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed italic">
                              Try another date or check the weekly schedule on the right.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PART 3: Details & Confirmation */}
                  <div className="pt-12 lg:pt-0 lg:pl-12 space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black">3</div>
                      <h4 className="font-extrabold text-slate-900 uppercase tracking-tight">Final Details</h4>
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <label className="block space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Type</p>
                            <select
                              value={appointmentType}
                              onChange={(e) => setAppointmentType(e.target.value as "TELEMEDICINE" | "IN_CLINIC")}
                              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                              <option value="TELEMEDICINE" className="text-slate-900">Telemedicine</option>
                              <option value="IN_CLINIC" className="text-slate-900">In-Clinic</option>
                            </select>
                          </label>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Fee</p>
                            <div className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-900">
                              Rs. {fee.toLocaleString()}
                            </div>
                          </div>
                        </div>

                          <label className="block space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Reason for Visit</p>
                            <textarea
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              rows={2}
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                              placeholder="Describe symptoms or reason..."
                            />
                          </label>
                      </div>

                      <button
                        type="button"
                        onClick={handleBookAndPay}
                        disabled={bookingLoading || !selectedTime}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black uppercase tracking-widest text-xs py-5 rounded-[1.5rem] shadow-xl hover:shadow-2xl transition-all flex justify-center items-center gap-3 active:scale-[0.98]"
                      >
                        {bookingLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Book & Pay Now
                            <CreditCard className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
