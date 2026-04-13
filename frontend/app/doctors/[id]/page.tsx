"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, CheckCircle2, Award, Calendar, Stethoscope, ShieldAlert, Clock3, Loader2, Sparkles } from "lucide-react";
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

  const handleBookAndPay = async () => {
    if (!doctor) return;

    if (!token || !isPatient) {
      toast.error("Please login as a patient to book an appointment.");
      router.push("/login");
      return;
    }

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
    <div className="min-h-screen bg-slate-50/50 selection:bg-primary/20 selection:text-primary flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-20">
        <section className="bg-white border-b border-slate-200/60 pt-10 pb-16 relative">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7 xl:col-span-8 space-y-12">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    About Doctor
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-[15px] p-6 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                    {doctor.bio || "Professional profile is available. Please proceed to booking for consultation details."}
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Credentials
                  </h3>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
                    <ul className="divide-y divide-slate-100">
                      <li className="p-4 flex gap-4">
                        <div className="mt-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div></div>
                        <span className="text-slate-700 font-medium text-[15px]">Qualification: {doctor.qualification || "Not specified"}</span>
                      </li>
                      <li className="p-4 flex gap-4">
                        <div className="mt-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div></div>
                        <span className="text-slate-700 font-medium text-[15px]">SLMC Number: {doctor.slmcNumber || "Not available"}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 xl:col-span-4">
                <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] sticky top-28 space-y-6">
                  <div className="flex justify-between items-end mb-8 pb-6 border-b border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Consultation Fee</p>
                      <p className="text-3xl font-extrabold text-slate-900">Rs. {fee.toLocaleString("en-US")}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 font-bold text-xs uppercase px-2.5 py-1 rounded">
                      <Calendar className="w-3.5 h-3.5" /> Booking
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Book a Slot
                  </h4>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                    <label className="block text-sm font-bold text-slate-700">
                      Preferred date
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white"
                      />
                    </label>

                    <div className="rounded-2xl bg-white border border-emerald-100 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Selected day</p>
                          <p className="text-sm font-bold text-slate-900">{selectedDay}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Published slots</p>
                          <p className="text-sm font-bold text-slate-900">{availableSlots.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-900">Available Slots</h4>
                      <button
                        type="button"
                        onClick={() => setSelectedTime("")}
                        className="text-xs font-bold text-blue-600"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {slotsLoading ? (
                        <div className="col-span-2 rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading available slots...
                        </div>
                      ) : availableSlots.length > 0 ? (
                        availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`rounded-2xl border px-3 py-3 text-sm font-bold transition text-left ${selectedTime === slot ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200"}`}
                          >
                            {formatClock(slot)}
                          </button>
                        ))
                      ) : (
                        <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-500 space-y-2">
                          <p className="font-bold text-slate-700">No slots available for this day.</p>
                          <p>
                            {selectedAvailability.length > 0
                              ? `This doctor publishes ${selectedAvailability.length} window(s) on ${selectedDay}. Try another time or date.`
                              : "This doctor has not published a schedule for the selected day."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" /> Weekly Schedule
                      </h4>
                      <span className="text-xs font-bold text-slate-500">{scheduleCount} published windows</span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-auto pr-1">
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
                              <p className="text-sm font-bold text-slate-900">{window.dayOfWeek}</p>
                              <p className="text-xs text-slate-500">
                                {formatClock(window.startTime)} - {formatClock(window.endTime)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Slot length</p>
                              <p className="text-sm font-bold text-slate-900">{window.slotDuration} min</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                          This doctor has not published any weekly availability yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Appointment Type
                    <select
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value as "TELEMEDICINE" | "IN_CLINIC")}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                    >
                      <option value="TELEMEDICINE">Telemedicine</option>
                      <option value="IN_CLINIC">In-Clinic</option>
                    </select>
                  </label>

                  <label className="block text-sm font-semibold text-slate-700 mb-6">
                    Reason
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                      placeholder="Describe symptoms or reason for consultation"
                    />
                  </label>

                  {bookingCount !== null && (
                    <p className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                      Your total bookings: {bookingCount}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleBookAndPay}
                    disabled={bookingLoading || !isPatient || !selectedTime}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_8px_30px_rgb(15,23,42,0.15)] hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 group"
                  >
                    {bookingLoading ? "Booking..." : selectedTime ? "Book & Continue to Payment" : "Select a time slot"}
                  </button>

                  <p className="text-center text-xs text-slate-500 font-medium mt-4">
                    {isPatient ? "Select a slot and continue to payment." : "Sign in as a patient to confirm booking."}
                  </p>

                  {!isPatient && (
                    <Link
                      href={`/appointments?doctorId=${doctor.id}&date=${selectedDate}`}
                      className="mt-3 inline-flex w-full justify-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Open full appointment page
                    </Link>
                  )}
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
