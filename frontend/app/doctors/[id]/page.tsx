"use client";

import { use, useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, CheckCircle2, Award, Clock, Calendar, Check, Stethoscope } from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { MOCK_DOCTORS, IDoctorProfile, ITimeSlot } from "@/lib/mock-data";

export default function DoctorProfile() {
  const params = useParams();
  const id = params?.id as string;
  const [doctor, setDoctor] = useState<IDoctorProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ITimeSlot | null>(null);

  useEffect(() => {
    if (!id) return;
    const foundDoc = MOCK_DOCTORS.find((d) => d.id === id);
    if (!foundDoc) {
      notFound();
    } else {
      setDoctor(foundDoc);
      // Default select the first available date
      if (foundDoc.availability.length > 0) {
        setSelectedDate(foundDoc.availability[0].date);
      }
    }
  }, [id]);

  if (!doctor) return null; // Or a sleek skeleton loader

  const activeDay = doctor.availability.find(a => a.date === selectedDate);

  return (
    <div className="min-h-screen bg-slate-50/50 selection:bg-primary/20 selection:text-primary flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-20">
        
        {/* --- PROFILE HEADER --- */}
        <section className="bg-white border-b border-slate-200/60 pt-10 pb-16 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/doctors" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-8 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to search
            </Link>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              
              {/* Avatar Layout */}
              <div className="relative shrink-0 text-center mx-auto md:mx-0">
                 <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                   <img src={doctor.imageUrl} alt={doctor.name} className="w-full h-full object-cover" />
                 </div>
                 {doctor.featured && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> Featured
                    </div>
                 )}
              </div>

              {/* Main Info */}
              <div className="flex-1 mt-2 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-2 justify-center md:justify-start">
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">{doctor.name}</h1>
                  <span className="inline-flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-100 self-center">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
                
                <h2 className="text-lg text-blue-600 font-bold mb-4">{doctor.specialty}</h2>
                
                <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-slate-600 font-medium justify-center md:justify-start">
                  <div className="flex items-center gap-2 justify-center">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{doctor.hospital}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Award className="w-4 h-4 text-slate-400" />
                    <span>{doctor.experienceYears} Years Exp.</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-amber-700 font-bold">{doctor.rating}</span>
                    <span className="text-amber-700/60 lowercase">({doctor.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* --- MAIN CONTENT & BOOKING GRID --- */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-10">
              
              {/* LEFT COLUMN: ABOUT */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-12">
                
                {/* About Bio */}
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    About Doctor
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-[15px] p-6 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                    {doctor.bio}
                  </p>
                </div>

                {/* Education */}
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Education & Credentials
                  </h3>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] overflow-hidden">
                    <ul className="divide-y divide-slate-100">
                      {doctor.education.map((edu, idx) => (
                        <li key={idx} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                           <div className="mt-1">
                             <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                           </div>
                           <span className="text-slate-700 font-medium text-[15px]">{edu}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Patient Reviews */}
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
                     <Star className="w-5 h-5 text-blue-600" />
                     Patient Feedback
                  </h3>
                  <div className="space-y-4">
                    {doctor.reviews.map((review) => (
                      <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600">
                              {review.patientName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{review.patientName}</p>
                              <p className="text-xs text-slate-400">{review.date}</p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 text-[15px] italic leading-relaxed">
                          "{review.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: STICKY BOOKING WIDGET */}
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 lg:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] sticky top-28">
                  
                  <div className="flex justify-between items-end mb-8 pb-6 border-b border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">Consultation Fee</p>
                      <p className="text-3xl font-extrabold text-slate-900">Rs. {doctor.consultationFee}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase px-2.5 py-1 rounded">
                      <Clock className="w-3.5 h-3.5" /> 15 mins
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Select a Date
                  </h4>

                  {/* Horizontal Date Picker */}
                  <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                    {doctor.availability.map((day) => (
                      <button 
                        key={day.date}
                        onClick={() => { setSelectedDate(day.date); setSelectedSlot(null); }}
                        className={`shrink-0 flex flex-col items-center p-3 rounded-2xl border ${selectedDate === day.date ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'} transition-all min-w-[80px]`}
                      >
                         <span className={`text-xs font-bold uppercase tracking-wider ${selectedDate === day.date ? 'text-blue-600' : 'text-slate-400'}`}>{day.dayName}</span>
                         <span className={`text-lg font-extrabold ${selectedDate === day.date ? 'text-blue-700' : 'text-slate-800'}`}>{day.date.split("-")[2]}</span>
                      </button>
                    ))}
                  </div>

                  {/* Time Slots */}
                  {activeDay && (
                    <div className="mb-8">
                      <p className="text-sm font-bold text-slate-600 mb-3">Available Time Slots</p>
                      <div className="grid grid-cols-3 gap-2">
                        {activeDay.slots.map((slot) => (
                          <button
                            key={slot.id}
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedSlot(slot)}
                            className={`
                              py-2.5 rounded-xl border text-sm font-bold transition-all
                              ${!slot.isAvailable ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed line-through' : ''}
                              ${slot.isAvailable && selectedSlot?.id !== slot.id ? 'bg-white border-blue-200 text-blue-600 hover:bg-blue-50' : ''}
                              ${selectedSlot?.id === slot.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : ''}
                            `}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Booking Action */}
                  <button 
                    disabled={!selectedSlot}
                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-lg py-4 rounded-2xl shadow-[0_8px_30px_rgb(15,23,42,0.15)] disabled:shadow-none hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 group"
                  >
                    {!selectedSlot && "Select a Time Slot"}
                    {selectedSlot && (
                      <>
                        Book Appointment <Check className="w-5 h-5 group-hover:scale-125 transition-transform" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-slate-400 font-medium mt-4">Safe and secure payment gateway ahead</p>

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
