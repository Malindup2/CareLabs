"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, CheckCircle2, Award, Calendar, Stethoscope, ShieldAlert } from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { apiGet } from "@/lib/api";

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

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1594824388853-d0c0b4ac4f0b?auto=format&fit=crop&q=80&w=300&h=300";

export default function DoctorProfile() {
  const params = useParams();
  const id = params?.id as string;

  const [doctor, setDoctor] = useState<LiveDoctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

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
                <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] sticky top-28">
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
                    Preferred Date
                  </h4>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm mb-6"
                  />

                  <Link
                    href={`/appointments?doctorId=${doctor.id}&date=${selectedDate}`}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_8px_30px_rgb(15,23,42,0.15)] hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 group"
                  >
                    Open Appointment <CheckCircle2 className="w-5 h-5 group-hover:scale-125 transition-transform" />
                  </Link>

                  <p className="text-center text-xs text-slate-500 font-medium mt-4">
                    Sign in as a patient to view available slots and confirm booking.
                  </p>
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
