"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { apiPost, apiPutAuth, AuthResponse, saveAuth } from "@/lib/api";

interface DoctorProfileResponse {
  id: string;
  userId: string;
  fullName: string;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function DoctorRegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [consultationFee, setConsultationFee] = useState("1500");
  const [qualification, setQualification] = useState("");
  const [bio, setBio] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const registerData = await apiPost<AuthResponse>("/auth/register", {
        email,
        password,
        role: "DOCTOR",
      });

      saveAuth(registerData);

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const years = Number.parseInt(experienceYears, 10);
      const fee = Number.parseFloat(consultationFee);

      let profileSynced = false;
      let lastProfileError: { status?: number; message?: string } | null = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          await apiPutAuth<DoctorProfileResponse>(
            "/doctors/me",
            {
              fullName,
              specialty: specialization,
              slmcNumber: licenseNo.trim() || "PENDING",
              experienceYears: Number.isNaN(years) ? 0 : years,
              qualification: qualification.trim() || "PENDING",
              bio: bio.trim() || "Pending profile details",
              consultationFee: Number.isNaN(fee) ? 0 : fee,
            },
            registerData.token,
          );
          profileSynced = true;
          break;
        } catch (err: unknown) {
          const error = err as { status?: number; message?: string };
          lastProfileError = error;
          await wait(250 * attempt);
        }
      }

      if (!profileSynced) {
        const statusText = lastProfileError?.status ? ` (HTTP ${lastProfileError.status})` : "";
        const reasonText = lastProfileError?.message ? ` ${lastProfileError.message}` : "";
        toast.error(`Doctor account created, but profile sync failed${statusText}.${reasonText}`);
      } else {
        toast.success("Doctor account created successfully!");
      }
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
                 <option value="Cardiology">Cardiology</option>
                 <option value="Neurology">Neurology</option>
                 <option value="Orthopedics">Orthopedics</option>
                 <option value="Pediatrics">Pediatrics</option>
                 <option value="General Practice">General Practice</option>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block ml-1">Experience (Years)</label>
            <input
              type="number"
              min={0}
              required
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
              placeholder="5"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block ml-1">Consultation Fee (LKR)</label>
            <input
              type="number"
              min={0}
              required
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
              placeholder="1500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 block ml-1">Qualification</label>
          <input
            type="text"
            required
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
            placeholder="MBBS, MD"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 block ml-1">Short Bio</label>
          <textarea
            required
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
            placeholder="Briefly describe your practice and experience"
          />
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
