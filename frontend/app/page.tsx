"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Zap, HeartPulse, ArrowRight, 
  Search, CreditCard, Video, FileText, Star, Sparkles, Send, Calendar,
  Stethoscope, Clock, CheckCircle2, Bot, ShieldCheck, Shield, MapPin, Filter, ChevronDown
} from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { MOCK_DOCTORS, SPECIALTIES, IDoctorProfile } from "@/lib/mock-data";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [selectedAvailability, setSelectedAvailability] = useState("Any Time");
  
  // Basic filtering based on mock data
  const filteredDoctors = MOCK_DOCTORS.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.hospital.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === "All Specialties" || doc.specialty === selectedSpecialty;
    const matchesAvailability = selectedAvailability === "Any Time" || 
                                doc.availability.some(d => d.dayName === selectedAvailability && d.slots.some(s => s.isAvailable));
    
    return matchesSearch && matchesSpecialty && matchesAvailability;
  });

  return (
    <div className="min-h-screen bg-slate-50/30 selection:bg-primary/20 selection:text-primary scroll-smooth">
      <PublicNavbar />

      <main className="pt-20">
        
        {/* --- 0. HERO SECTION (1% Polish) --- */}
        <section className="relative pt-32 pb-40 lg:pt-48 lg:pb-56 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/login.png" 
              alt="CareLabs Platform" 
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-slate-900/70 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent"></div>
          </div>
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-100 text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              CareLabs Network
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05] mb-6 drop-shadow-lg">
              Find your specialist and <br className="hidden sm:block" />
              <span className="text-blue-400">book instantly.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-200 leading-relaxed mb-12 max-w-2xl mx-auto font-medium drop-shadow-md">
              Connect with top-rated doctors, view verified reviews, and schedule secure video consultations in seconds.
            </p>
            
            {/* Search Doctor Widget (Centered & Massive) */}
            <div className="bg-white/10 backdrop-blur-2xl p-3 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/20 flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto mb-8">
              <div className="flex-1 flex items-center px-5 bg-white rounded-2xl border-2 border-transparent focus-within:border-blue-500 transition-colors">
                <Search className="w-6 h-6 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by Doctor name, Specialty, or Symptoms..."
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 px-4 py-4 text-slate-900 placeholder:text-slate-500 text-base md:text-lg font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => document.getElementById('advanced-directory')?.scrollIntoView({behavior: 'smooth'})}
                className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl text-lg font-bold transition-all shadow-lg flex items-center justify-center gap-2 group whitespace-nowrap cursor-pointer"
              >
                Search
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Popular Specialties */}
            <div className="flex flex-wrap gap-2 text-sm justify-center items-center">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-300 mr-2 drop-shadow-md">Popular Searches:</span>
              {["Cardiology", "Neurology", "Psychiatry", "Pediatrics"].map((spec) => (
                <Link 
                  key={spec} 
                  href="/doctors" 
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold transition-colors border border-white/20 shadow-sm"
                >
                  {spec}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* --- 0.5 ADVANCED DOCTOR DIRECTORY --- */}
        <section id="advanced-directory" className="py-24 lg:py-32 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/60 via-white to-white pointer-events-none z-0"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-xs font-bold tracking-[0.2em] text-blue-600 uppercase mb-4">Book Instantly</h2>
                <p className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Doctor Directory</p>
                <p className="text-xl text-slate-500 font-medium">Filter by specialty, availability, and symptoms to find the ideal match.</p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
              {/* Filters Sidebar */}
              <aside className="w-full lg:w-64 shrink-0">
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm sticky top-28">
                  <div className="flex items-center gap-2 mb-6 text-slate-900">
                    <Filter className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Filters</h3>
                  </div>

                  {/* Specialty Filter */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Specialty</h4>
                    <div className="space-y-2">
                      {SPECIALTIES.map((spec) => (
                        <label key={spec} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="specialty" 
                            checked={selectedSpecialty === spec}
                            onChange={() => setSelectedSpecialty(spec)}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600 cursor-pointer" 
                          />
                          <span className={`text-sm font-medium ${selectedSpecialty === spec ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                            {spec}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Availability Filter */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Availability</h4>
                    <div className="space-y-2">
                      {["Any Time", "Today", "Tomorrow"].map((day) => (
                        <label key={day} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="radio" 
                            name="availability" 
                            checked={selectedAvailability === day}
                            onChange={() => setSelectedAvailability(day)}
                            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600 cursor-pointer" 
                          />
                          <span className={`text-sm font-medium ${selectedAvailability === day ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                            {day}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <button 
                    onClick={() => {
                      setSelectedSpecialty("All Specialties");
                      setSelectedAvailability("Any Time");
                      setSearchTerm("");
                    }}
                    className="w-full py-2.5 mt-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </aside>

              {/* Results Grid */}
              <div className="flex-1">
                <div className="mb-6 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {selectedSpecialty === "All Specialties" ? "Available Doctors" : selectedSpecialty}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">{filteredDoctors.length} results found</p>
                  </div>
                  
                  {/* Sort Dropdown Hook (Visual Only) */}
                  <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                    Sort by: <span className="text-slate-900 font-bold">Recommended</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {filteredDoctors.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
                     <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                       <Search className="w-8 h-8 text-slate-300" />
                     </div>
                     <h3 className="text-xl font-bold text-slate-900 mb-2">No doctors found</h3>
                     <p className="text-slate-500">Try adjusting your filters or search terms.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {filteredDoctors.map((doc) => (
                      <DoctorCard key={doc.id} doctor={doc} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* --- 1. SOCIAL PROOF STRIP --- */}
        <section className="bg-white border-y border-slate-100 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.02)] relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10 lg:py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0 md:divide-x divide-slate-100">
              <div className="text-center group">
                <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight group-hover:text-primary transition-colors duration-300">1,200+</p>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-2">Verified doctors</p>
              </div>
              <div className="text-center group hidden md:block">
                <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight group-hover:text-primary transition-colors duration-300">48,000+</p>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-2">Patients served</p>
              </div>
              <div className="text-center group">
                <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight group-hover:text-primary transition-colors duration-300">4.9<span className="text-slate-300 font-medium">/5</span></p>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-2">Average rating</p>
              </div>
              <div className="text-center group hidden md:block">
                <p className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight group-hover:text-primary transition-colors duration-300">50,000+</p>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mt-2">AI checks done</p>
              </div>
            </div>
          </div>
        </section>

        {/* --- 2. HOW IT WORKS --- */}
        <section id="how-it-works" className="py-24 lg:py-32 bg-[#FAFBFF]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-xs font-bold tracking-[0.2em] text-blue-600 uppercase mb-4">How it works</h2>
              <p className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">From symptom to consultation</p>
              <p className="text-xl text-slate-500 font-medium">No queues. No paperwork. Just healthcare in four simple steps.</p>
            </div>

            <div className="grid md:grid-cols-4 gap-12 md:gap-6 lg:gap-8 relative">
              {/* Decorative line for desktop */}
              <div className="hidden md:block absolute top-[36px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 z-0 rounded-full"></div>

              {[
                { step: "1", title: "Describe symptoms", desc: "Use our tailored AI checker or search directly by specialty.", icon: Sparkles },
                { step: "2", title: "Choose a doctor", desc: "Browse verified doctors, view ratings, and see availability.", icon: Search },
                { step: "3", title: "Book & pay securely", desc: "PayHere or Stripe —  confirmed instantly with zero hassle.", icon: ShieldCheck },
                { step: "4", title: "Consult & get notes", desc: "Crystal clear video call, digital prescriptions, all saved.", icon: Video },
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center group">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-center justify-center text-primary mb-8 group-hover:-translate-y-2 transition-transform duration-300 ease-out relative">
                    <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-md border-2 border-white">{item.step}</span>
                    <item.icon className="w-8 h-8 opacity-80" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-500 text-center text-sm leading-relaxed max-w-[220px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 3. AI FEATURE SPOTLIGHT (The Apple Style Mock) --- */}
        <section id="ai" className="py-24 lg:py-32 bg-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/30 to-white pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
              
              {/* Left Side: Copy */}
              <div className="lg:col-span-5 mb-16 lg:mb-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-100/80 text-violet-700 border border-violet-200/50 text-xs font-bold tracking-widest uppercase mb-8 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI-powered
                </div>
                <h2 className="text-4xl lg:text-[44px] font-extrabold text-slate-900 leading-[1.15] mb-6 tracking-tight">
                  Not sure what's wrong?<br />
                  <span className="text-violet-600">Ask the AI first.</span>
                </h2>
                <p className="text-lg text-slate-500 leading-relaxed mb-10 font-medium">
                  Describe your symptoms in plain language. Our proprietary checker analyses patterns, suggests possible conditions, and directs you to the right specialist instantly.
                </p>
                
                <ul className="space-y-5 mb-12">
                  {[
                    "Trained on millions of verified medical records",
                    "Acts as a clinical guide, never a replacement",
                    "Analysis saved directly to your history"
                  ].map((bullet, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="p-1 rounded-full bg-violet-100 text-violet-600 mt-1">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="text-slate-600 font-medium">{bullet}</span>
                    </li>
                  ))}
                </ul>

                <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-[0_8px_30px_rgb(124,58,237,0.2)] hover:shadow-[0_8px_30px_rgb(124,58,237,0.3)] hover:-translate-y-0.5 group">
                  Try AI symptom checker
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Right Side: Mock UI */}
              <div className="lg:col-span-7 relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-violet-400/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
                
                <div className="relative border border-slate-200/80 rounded-[2.5rem] p-3 bg-white/60 backdrop-blur-xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.08)] transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group">
                  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                      <div className="flex items-center gap-3 text-slate-800 font-bold">
                        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                          <Bot className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p>CareLabs AI</p>
                          <p className="text-[11px] text-green-500 font-semibold uppercase tracking-widest flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 mb-8 font-medium">
                      {/* User bubble */}
                      <div className="bg-[#E9E9EB] text-slate-900 p-4 rounded-3xl rounded-tr-sm text-[15px] w-[85%] sm:w-3/4 ml-auto leading-relaxed shadow-sm">
                        I have a massive headache, mild fever, and a sore throat that's been bothering me for 2 days.
                      </div>

                      {/* AI bubble */}
                      <div className="bg-gradient-to-br from-violet-50 to-indigo-50/50 border border-violet-100 p-5 rounded-3xl rounded-tl-sm shadow-sm w-[95%] sm:w-[85%] group-hover:shadow-md transition-shadow duration-500">
                        <p className="text-slate-700 text-[15px] leading-relaxed mb-4">
                          Based on your symptoms, this may indicate a viral upper respiratory infection. Rest and hydration are key.
                        </p>
                        <div className="bg-white rounded-2xl p-4 border border-violet-100/50 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis</span>
                            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                              Moderate Priority
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 mb-1">Recommended Specialist:</p>
                          <p className="text-base font-bold text-violet-700 mb-3">General Physician</p>
                          
                          <button className="w-full bg-violet-600 text-white hover:bg-violet-700 rounded-xl py-3 flex justify-between items-center px-4 text-sm font-bold transition-colors">
                            View 3 available doctors
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Input mock */}
                    <div className="flex gap-3 items-center">
                      <div className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3.5 flex items-center focus-within:ring-2 ring-violet-500/20 transition-all">
                        <span className="text-slate-400 text-[15px] font-medium">Describe your symptom...</span>
                      </div>
                      <button className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md transform active:scale-95 transition-transform disabled:opacity-50">
                        <Send className="w-5 h-5 ml-1" />
                      </button>
                    </div>

                  </div>
                </div>
            </div>
            </div>
          </div>
        </section>

        {/* --- 4. SYSTEM CAPABILITIES --- */}
        <section id="features" className="py-24 lg:py-32 bg-slate-50 border-y border-slate-200/50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
             <div className="mb-20 text-center max-w-3xl mx-auto">
              <h2 className="text-xs font-bold tracking-[0.2em] text-blue-600 uppercase mb-4">System Capabilities</h2>
              <p className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Comprehensive Hospital Management</p>
              <p className="text-xl text-slate-500 font-medium leading-relaxed">Seamlessly integrating clinical workflows, digital records, and hospital administration into a single secure platform.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {[
                { icon: Calendar, title: "Instant booking", desc: "Real-time slot availability. Book and get confirmed in exact seconds, no waiting.", tag: "Core", tagBg: "bg-slate-100 text-slate-600 border border-slate-200/60" },
                { icon: HeartPulse, title: "AI symptom checker", desc: "Submit symptoms, get instant AI-powered triage and the perfect specialist recommendation.", tag: "AI-powered", tagBg: "bg-violet-50 text-violet-700 border border-violet-200/60" },
                { icon: Video, title: "Secure telemedicine", desc: "Crystal clear, Jitsi-powered end-to-end encrypted video consultations anywhere.", tag: "Video", tagBg: "bg-blue-50 text-blue-700 border border-blue-200/60" },
                { icon: FileText, title: "Digital prescriptions", desc: "Doctors issue prescriptions digitally. Stored safely forever in your medical records.", tag: "Clinical", tagBg: "bg-emerald-50 text-emerald-700 border border-emerald-200/60" },
                { icon: CreditCard, title: "Secure payments", desc: "Integrated PayHere and Stripe. Payment confirmed safely before any session starts.", tag: "Payments", tagBg: "bg-amber-50 text-amber-700 border border-amber-200/60" },
                { icon: Shield, title: "Medical records", desc: "Upload, store, and share lab reports with your chosen doctors securely.", tag: "Records", tagBg: "bg-indigo-50 text-indigo-700 border border-indigo-200/60" },
              ].map((f, i) => (
                <div key={i} className="p-8 pb-10 rounded-[2rem] border border-slate-200/80 bg-white hover:border-blue-500/30 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none">
                     <f.icon className="w-32 h-32" />
                   </div>
                   
                   <div className="flex justify-between items-start mb-8 relative z-10">
                     <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 group-hover:-translate-y-1 transition-transform duration-300 group-hover:text-blue-600 group-hover:border-blue-100 group-hover:shadow-md">
                        <f.icon className="w-6 h-6" />
                     </div>
                     <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full ${f.tagBg}`}>
                       {f.tag}
                     </span>
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">{f.title}</h3>
                   <p className="text-slate-500 leading-relaxed font-medium mt-auto relative z-10">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* --- 5. TESTIMONIALS --- */}
        <section className="py-24 lg:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-20">
              <h2 className="text-xs font-bold tracking-[0.2em] text-blue-600 uppercase mb-4">Patient reviews</h2>
              <p className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Trusted by thousands</p>
              <p className="text-xl text-slate-500 max-w-2xl font-medium">Real feedback from real patients and doctors on the CareLabs network.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  quote: "Booked a cardiologist in under 3 minutes. The video call was crystal clear and the prescription was sent instantly to my phone. A total game changer.",
                  initials: "AK", name: "Ashan K.", role: "Patient · Colombo"
                },
                { 
                  quote: "The AI checker told me exactly what specialist I needed. Saved me hours of guessing and the anxiety of wondering what was wrong.",
                  initials: "NP", name: "Nimali P.", role: "Patient · Kandy"
                },
                { 
                  quote: "As a doctor, the scheduling tools are brilliant. My patients love the digital prescriptions and I love my organized transparent dashboard.",
                  initials: "SP", name: "Dr. S. Perera", role: "Doctor · Gampaha"
                }
              ].map((review, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 p-8 rounded-[2rem] flex flex-col h-full hover:bg-white hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-slate-200 transition-all duration-300">
                  <div className="flex gap-1.5 mb-6">
                    {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-10 flex-1 font-medium text-lg tracking-tight">
                    "{review.quote}"
                  </p>
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-700 font-bold tracking-wider text-sm">
                      {review.initials}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">{review.name}</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 6. FINAL CTA --- */}
        <section className="py-16 lg:py-20 bg-blue-600 relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-px bg-blue-500/50"></div>
          
          <div className="max-w-4xl mx-auto px-6 lg:px-12 relative z-10 flex flex-col items-center justify-center text-center gap-8">
            
            <div className="max-w-2xl">
              <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight leading-[1.1]">
                Ready to take control of<br className="hidden sm:block"/> your health?
              </h2>
              <p className="text-blue-100 text-lg font-medium leading-relaxed max-w-xl mx-auto">
                Join 48,000+ patients already using CareLabs to simplify their medical journey.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto mt-2">
               <Link 
                 href="/register" 
                 className="bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400/30 text-white px-8 py-3.5 rounded-full text-[15px] font-bold transition-colors whitespace-nowrap inline-flex items-center justify-center backdrop-blur-sm"
               >
                 Create free account
               </Link>
               <Link 
                 href="/doctors" 
                 className="bg-white hover:bg-blue-50 text-blue-700 px-8 py-3.5 rounded-full text-[15px] font-bold transition-all shadow-lg whitespace-nowrap inline-flex items-center justify-center hover:scale-[1.02]"
               >
                 Browse doctors
               </Link>
            </div>
          </div>
        </section>

      </main>

      <PublicFooter />
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: IDoctorProfile }) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/50 p-6 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 flex flex-col h-full group">
      
      {/* Header Info */}
      <div className="flex gap-5 items-start mb-8">
        <div className="relative shrink-0 mt-1">
           <img 
             src={doctor.imageUrl} 
             alt={doctor.name} 
             className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-500" 
           />
           {doctor.featured && (
             <div className="absolute -top-3 -right-3 bg-gradient-to-tr from-amber-500 to-amber-400 text-white p-1.5 rounded-full shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300 border-2 border-white" title="Featured">
               <Star className="w-3.5 h-3.5 fill-current" />
             </div>
           )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-2">
            <div>
              <Link href={`/doctors/${doctor.id}`} className="block">
                <h3 className="text-[22px] font-extrabold text-slate-900 truncate group-hover:text-blue-600 transition-colors tracking-tight leading-none mb-1.5">
                  {doctor.name}
                </h3>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-bold text-blue-700 bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-100/50 uppercase tracking-widest">
                  {doctor.specialty}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <span className="text-sm font-bold text-slate-700">{doctor.rating}</span> 
              <span className="text-xs font-semibold text-slate-400">({doctor.reviewCount} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital/Location Tags */}
      <div className="mb-8 space-y-3.5 flex-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100/60 shrink-0 group-hover:bg-blue-50 transition-colors">
             <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>
          <span className="text-[15px] text-slate-600 font-medium leading-tight truncate">{doctor.hospital}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50/50 flex items-center justify-center border border-emerald-100/50 shrink-0">
             <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-[15px] text-slate-600 font-medium leading-tight truncate">Available: <span className="text-emerald-600 font-bold">{doctor.availability[0]?.dayName || "Contact for slots"}</span></span>
        </div>
      </div>

      {/* Action Border */}
      <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
        <div>
          <span className="text-[11px] uppercase tracking-widest font-extrabold text-slate-400 block mb-1">Fee</span>
          <p className="font-black text-slate-900 text-xl tracking-tight">Rs. {doctor.consultationFee}</p>
        </div>
        <Link 
          href={`/doctors/${doctor.id}`} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl text-[15px] font-bold transition-all shadow-[0_8px_20px_rgb(37,99,235,0.2)] hover:shadow-[0_8px_25px_rgb(37,99,235,0.3)] hover:-translate-y-0.5 whitespace-nowrap"
        >
          Book Now
        </Link>
      </div>

    </div>
  );
}
