"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { 
  Phone, 
  Calendar, 
  User, 
  Home, 
  MapPin, 
  Camera, 
  ShieldCheck, 
  ArrowRight,
  X
} from "lucide-react";
import { apiGetAuth, apiPutAuth, getToken } from "@/lib/api";

type Gender = "MALE" | "FEMALE" | "OTHER";

interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: Gender;
  addressLine1: string;
  city: string;
  district: string;
}

const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<PatientProfile>>({});
  const [loading, setLoading] = useState(true);
  const token = getToken();

  const fetchProfile = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiGetAuth<PatientProfile>("/patients/me", token);
      setProfile(data);
      setForm(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const updated = await apiPutAuth<PatientProfile>("/patients/me", form, token);
      setProfile(updated);
      setEditMode(false);
      toast.success("Identity updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );

  if (!profile) return (
    <div className="p-8 rounded-[2.5rem] bg-rose-50 border border-rose-100 text-rose-700">
      <p className="font-black uppercase tracking-widest text-xs">Access Denied</p>
      <p className="mt-2 font-bold">Profile registry could not be synchronized.</p>
    </div>
  );

  const initials = profile.fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-blue-500 transition-colors">Personal Identity Record</p>
            <h1 className="mt-3 text-4xl font-black text-slate-900 tracking-tight">Digital Health Passport</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 leading-relaxed">
              Manage your secure credentials, contact protocols, and demographic data. 
              Consistent data ensures high-fidelity clinical matching during consultations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditMode((prev) => !prev)}
            className={`rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
              editMode 
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-slate-200/50" 
                : "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200"
            }`}
          >
            {editMode ? "Cancel Revision" : "Modify Record"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center group">
            <div className="relative group/avatar">
              <div className="h-32 w-32 rounded-[3.5rem] bg-slate-50 border-4 border-white shadow-xl grid place-items-center text-4xl font-black text-slate-900 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                {initials || "P"}
              </div>
              <button className="absolute bottom-0 right-0 p-2.5 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200 opacity-0 group-hover/avatar:opacity-100 transition-all hover:scale-110">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{profile.fullName}</h2>
              <div className="mt-4 flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Verified Identity</span>
              </div>
            </div>

            <div className="w-full mt-10 space-y-3">
              <QuickInfoCard icon={<Phone className="w-4 h-4" />} label="Line of Contact" value={profile.phone} />
              <QuickInfoCard icon={<Calendar className="w-4 h-4" />} label="Clinical Age Index" value={profile.dateOfBirth} />
              <QuickInfoCard icon={<User className="w-4 h-4" />} label="Gender Specification" value={profile.gender} />
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden group">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 relative z-10">Care Integration</p>
             <h3 className="mt-4 text-xl font-black tracking-tight relative z-10 leading-tight">Your data is secured with AES-256 encryption.</h3>
             <p className="mt-4 text-xs font-medium text-slate-400 relative z-10 leading-relaxed">Only authorized medical practitioners in the CareLabs network can access your full medical history during active appointments.</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-10">
            <div>
               <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                     <User className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Primary Identity</h3>
               </div>
               <div className="grid gap-8 lg:grid-cols-2">
                <FormInput
                  label="Full Legal Name"
                  name="fullName"
                  value={form.fullName || ""}
                  onChange={handleChange}
                  disabled={!editMode}
                  required
                />
                <FormInput
                  label="Primary Contact Number"
                  name="phone"
                  value={form.phone || ""}
                  onChange={handleChange}
                  disabled={!editMode}
                  placeholder="+94 7X XXX XXXX"
                />
                <FormInput
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth || ""}
                  onChange={handleChange}
                  disabled={!editMode}
                />
                <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Gender Identity</label>
                    <select
                      name="gender"
                      value={form.gender || ""}
                      onChange={handleChange}
                      disabled={!editMode}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none disabled:opacity-50"
                    >
                      <option value="">SPECIFY GENDER</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-slate-100">
               <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                     <Home className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Geographic Protocol</h3>
               </div>
               <div className="grid gap-8">
                <FormInput
                  label="Residential Address Line"
                  name="addressLine1"
                  value={form.addressLine1 || ""}
                  onChange={handleChange}
                  disabled={!editMode}
                  icon={<MapPin className="w-4 h-4" />}
                />
                <div className="grid lg:grid-cols-2 gap-8">
                  <FormInput
                    label="Municipality / City"
                    name="city"
                    value={form.city || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                  <FormInput
                    label="District Region"
                    name="district"
                    value={form.district || ""}
                    onChange={handleChange}
                    disabled={!editMode}
                  />
                </div>
              </div>
            </div>

            {editMode && (
              <div className="pt-8 flex flex-wrap gap-4 items-center justify-end">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-blue-600 px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-3"
                >
                  Commit Modifications <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function QuickInfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100 group/card border-transparent hover:bg-white hover:border-slate-200 hover:shadow-md transition-all">
      <div className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover/card:text-blue-600 shadow-sm transition-colors">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-sm font-black text-slate-900 mt-0.5">{value || "NOT SPECIFIED"}</p>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, name, type = "text", required = false, disabled = false, placeholder, icon }: any) {
  return (
    <div className="space-y-2 group">
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1 group-focus-within:text-blue-500 transition-colors">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
             {icon}
          </div>
        )}
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none disabled:opacity-50 ${icon ? "pl-12 pr-5" : "px-5"}`}
        />
      </div>
    </div>
  );
}

