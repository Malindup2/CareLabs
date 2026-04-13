"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Star, Filter, ChevronDown, ShieldCheck } from "lucide-react";
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
  profileImageUrl: string | null;
  consultationFee: number | null;
  averageRating: number | null;
  totalReviews: number | null;
  verificationStatus: VerificationStatus;
  active: boolean;
}

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300";

export default function DoctorsDirectory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<LiveDoctor[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [verificationFilter, setVerificationFilter] = useState("Approved Only");

  useEffect(() => {
    const loadDoctors = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet<LiveDoctor[]>("/doctors");
        setDoctors(data);
      } catch {
        setError("Unable to load doctors right now. Please try again shortly.");
      } finally {
        setLoading(false);
      }
    };

    void loadDoctors();
  }, []);

  const specialties = useMemo(() => {
    const values = Array.from(
      new Set(
        doctors
          .map((d) => d.specialty?.trim())
          .filter((value): value is string => Boolean(value && value.length > 0)),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return ["All Specialties", ...values];
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSearch =
        !searchTerm ||
        `${doc.fullName || ""} ${doc.specialty || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesSpecialty =
        selectedSpecialty === "All Specialties" || doc.specialty === selectedSpecialty;

      const matchesVerification =
        verificationFilter === "All Doctors"
          ? true
          : doc.verificationStatus === "APPROVED";

      return matchesSearch && matchesSpecialty && matchesVerification && doc.active;
    });
  }, [doctors, searchTerm, selectedSpecialty, verificationFilter]);

  return (
    <div className="min-h-screen bg-slate-50/50 selection:bg-primary/20 selection:text-primary flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-20">
        <section className="bg-white border-b border-slate-200/60 pt-16 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                Find the right specialist
              </h1>
              <p className="text-lg text-slate-500 mb-10 font-medium">
                Book appointments with verified healthcare professionals across Sri Lanka.
              </p>

              <div className="bg-white p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
                <div className="flex-1 flex items-center px-4 bg-slate-50/50 rounded-xl border border-transparent focus-within:border-blue-500/30 focus-within:bg-white transition-colors">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search doctors or specialties..."
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 px-3 py-3.5 text-slate-700 placeholder:text-slate-400 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all whitespace-nowrap shadow-md">
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-10">
            <aside className="w-full lg:w-64 shrink-0">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm sticky top-28">
                <div className="flex items-center gap-2 mb-6 text-slate-900">
                  <Filter className="w-5 h-5" />
                  <h3 className="font-bold text-lg">Filters</h3>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Specialty</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {specialties.map((spec) => (
                      <label key={spec} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="specialty"
                          checked={selectedSpecialty === spec}
                          onChange={() => setSelectedSpecialty(spec)}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600 cursor-pointer"
                        />
                        <span className={`text-sm font-medium ${selectedSpecialty === spec ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"}`}>
                          {spec}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Verification</h4>
                  <div className="space-y-2">
                    {["Approved Only", "All Doctors"].map((item) => (
                      <label key={item} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name="verification"
                          checked={verificationFilter === item}
                          onChange={() => setVerificationFilter(item)}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600 cursor-pointer"
                        />
                        <span className={`text-sm font-medium ${verificationFilter === item ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"}`}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedSpecialty("All Specialties");
                    setVerificationFilter("Approved Only");
                    setSearchTerm("");
                  }}
                  className="w-full py-2.5 mt-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </aside>

            <div className="flex-1">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedSpecialty === "All Specialties" ? "Available Doctors" : selectedSpecialty}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">{filteredDoctors.length} results found</p>
                </div>

                <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                  Sort by: <span className="text-slate-900 font-bold">Recommended</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-3 animate-pulse">
                      <div className="h-16 w-16 rounded-2xl bg-slate-200" />
                      <div className="h-4 w-40 rounded bg-slate-200" />
                      <div className="h-4 w-24 rounded bg-slate-100" />
                      <div className="h-4 w-full rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="bg-white rounded-2xl border border-rose-200 p-10 text-center">
                  <h3 className="text-xl font-bold text-rose-700 mb-2">Unable to load doctors</h3>
                  <p className="text-slate-600">{error}</p>
                </div>
              )}

              {!loading && !error && filteredDoctors.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No doctors found</h3>
                  <p className="text-slate-500">Try adjusting your filters or search terms.</p>
                </div>
              )}

              {!loading && !error && filteredDoctors.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredDoctors.map((doc) => (
                    <DoctorCard key={doc.id} doctor={doc} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: LiveDoctor }) {
  const name = doctor.fullName || "Doctor";
  const specialty = doctor.specialty || "General Practice";
  const rating = doctor.averageRating || 0;
  const reviewCount = doctor.totalReviews || 0;
  const fee = doctor.consultationFee || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 flex flex-col h-full group">
      <div className="flex gap-4 items-start mb-5">
        <div className="relative shrink-0">
          <img src={doctor.profileImageUrl || FALLBACK_AVATAR} alt={name} className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm" />
          {doctor.verificationStatus === "APPROVED" && (
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-sm" title="Verified">
              <ShieldCheck className="w-3 h-3" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link href={`/doctors/${doctor.id}`} className="block">
            <h3 className="text-[17px] font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{name}</h3>
          </Link>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100/50">{specialty}</span>
            <span className="text-xs text-slate-500 flex items-center font-medium">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 mr-1" />
              {rating.toFixed(1)} ({reviewCount})
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-2.5 flex-1">
        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">Sri Lanka</span>
        </div>
        <p className="text-sm text-slate-500 line-clamp-2">{doctor.bio || "Doctor profile available. Open to view details and book an appointment."}</p>
      </div>

      <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between">
        <div className="text-sm">
          <span className="text-slate-500 font-medium">Consultation Fee</span>
          <p className="font-bold text-slate-900 mt-0.5">Rs. {fee.toLocaleString("en-US")}</p>
        </div>
        <Link href={`/doctors/${doctor.id}`} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
          Book
        </Link>
      </div>
    </div>
  );
}
