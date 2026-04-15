"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
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
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!profile) return <div className="text-rose-600">Profile not found.</div>;

  const initials = profile.fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const inputClass =
    "w-full rounded-[2rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all";

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Patient Profile</p>
            <h1 className="mt-3 text-3xl font-black text-slate-900 tracking-tight">Your profile details</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">Keep your contact information and address up to date for a seamless care experience.</p>
          </div>
          <button
            type="button"
            onClick={() => setEditMode((prev) => !prev)}
            className="rounded-2xl bg-slate-900 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            {editMode ? "Cancel Edit" : "Edit Profile"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex flex-col items-center text-center gap-5">
            <div className="h-32 w-32 rounded-[2.5rem] bg-slate-200 border border-slate-200 grid place-items-center text-4xl font-black text-slate-500">
              {initials || "P"}
            </div>
            <div>
              <p className="text-xl font-black text-slate-900">{profile.fullName}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-blue-600 mt-2">Patient</p>
            </div>
            <div className="w-full space-y-4 text-sm text-slate-600">
              <div className="rounded-3xl bg-white border border-slate-200 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Phone</p>
                <p className="font-bold text-slate-900 mt-2">{profile.phone || "-"}</p>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Date of Birth</p>
                <p className="font-bold text-slate-900 mt-2">{profile.dateOfBirth || "-"}</p>
              </div>
              <div className="rounded-3xl bg-white border border-slate-200 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Gender</p>
                <p className="font-bold text-slate-900 mt-2">{profile.gender || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input
                  name="fullName"
                  value={form.fullName || ""}
                  onChange={handleChange}
                  className={inputClass}
                  disabled={!editMode}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                <input
                  name="phone"
                  value={form.phone || ""}
                  onChange={handleChange}
                  className={inputClass}
                  disabled={!editMode}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
                <input
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth || ""}
                  onChange={handleChange}
                  className={inputClass}
                  disabled={!editMode}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={form.gender || ""}
                  onChange={handleChange}
                  className={inputClass}
                  disabled={!editMode}
                >
                  <option value="">Select</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                <input
                  name="addressLine1"
                  value={form.addressLine1 || ""}
                  onChange={handleChange}
                  className={inputClass}
                  disabled={!editMode}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                <input
                  name="city"
                  value={form.city || ""}
                  onChange={handleChange}
                  className={inputClass}
                  disabled={!editMode}
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">District</label>
              <input
                name="district"
                value={form.district || ""}
                onChange={handleChange}
                className={inputClass}
                disabled={!editMode}
              />
            </div>

            {editMode && (
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="rounded-2xl border border-slate-200 bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            )}

            {!editMode && (
              <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-500">
                <p className="font-semibold text-slate-900 mb-2">Profile Overview</p>
                <p>Keep your patient profile updated so the care team has your latest contact details and medical history context.</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
