"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { apiPost, AuthResponse } from "@/lib/api";

export default function DoctorRegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiPost<AuthResponse>("/auth/register", {
        email,
        password,
        role: "DOCTOR",
      });
      toast.success("Doctor account created successfully!");
      router.push("/login");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      heading="Doctor Application" 
      subheading="Join the CareLabs professional network."
    >
      <form onSubmit={handleRegister} className="space-y-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block ml-1">First Name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
              placeholder="John"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block ml-1">Last Name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
              placeholder="Doe, MD"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 block ml-1">Professional Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
            placeholder="doctor@hospital.com"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block ml-1">Specialization</label>
             <select
               required
               value={specialization}
               onChange={(e) => setSpecialization(e.target.value)}
               className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
             >
                <option value="" disabled>Select Department</option>
                <option value="cardiology">Cardiology</option>
                <option value="neurology">Neurology</option>
                <option value="orthopedics">Orthopedics</option>
                <option value="pediatrics">Pediatrics</option>
                <option value="general">General Practice</option>
             </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block ml-1">Medical Lic. No.</label>
            <input
              type="text"
              required
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
              placeholder="MLE-12345"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 block ml-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {loading ? "Submitting application..." : "Apply as Doctor"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>

        <div className="flex items-center justify-between text-sm text-slate-600 pt-4 border-t border-slate-100">
          <Link href="/register" className="flex items-center gap-1 font-medium hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <p>
            Already an affiliate?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
