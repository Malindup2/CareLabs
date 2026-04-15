"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, Mail, Lock, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { apiPost, saveAuth, AuthResponse } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiPost<AuthResponse>("/auth/login", { email, password });
      saveAuth(data);
      toast.success("Successfully logged in!");

      // Redirect based on role
      switch (data.role) {
        case "ADMIN":
          router.push("/admin/dashboard");
          break;
        case "DOCTOR":
          router.push("/doctor/dashboard");
          break;
        case "PATIENT":
          router.push("/patient/dashboard");
          break;
        default:
          router.push("/");
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      heading="Welcome back" 
      subheading="Sign in to your account."
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 block ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200 outline-none"
                placeholder="doctor@carelabs.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all duration-200 outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {loading ? "Signing in..." : "Sign in"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>

        <p className="text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
