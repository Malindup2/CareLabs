"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { apiPost, apiPutAuth, AuthResponse, saveAuth } from "@/lib/api";

interface PatientProfileResponse {
  id: string;
  userId: string;
  fullName: string;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function PatientRegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
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
        role: "PATIENT",
      });

      saveAuth(registerData);

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

      let profileSynced = false;
      let lastProfileError: { status?: number; message?: string } | null = null;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          await apiPutAuth<PatientProfileResponse>(
            "/patients/me",
            {
              fullName,
              phone: phone.trim() || null,
              dateOfBirth: dob || null,
              gender: gender || null,
              addressLine1: addressLine1.trim() || null,
              city: city.trim() || null,
              district: district.trim() || null,
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
        toast.error(`Patient account created, but profile sync failed${statusText}.${reasonText}`);
      } else {
        toast.success("Patient account created successfully!");
      }
      router.push("/");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      heading="Patient Sign Up" 
      subheading="Get started to book appointments."
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
              placeholder="Emma"
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
              placeholder="Watson"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 block ml-1">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
            placeholder="emma@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 block ml-1">Date of Birth</label>
           <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block ml-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
              placeholder="0771234567"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block ml-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
            >
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700 block ml-1">Address</label>
          <input
            type="text"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
            placeholder="12 Main Street"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block ml-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
              placeholder="Colombo"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block ml-1">District</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200"
              placeholder="Colombo"
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
          {loading ? "Creating account..." : "Sign Up as Patient"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>

        <div className="flex items-center justify-between text-sm text-slate-600 pt-3 border-t border-slate-100">
          <Link href="/register" className="flex items-center gap-1 font-medium hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
