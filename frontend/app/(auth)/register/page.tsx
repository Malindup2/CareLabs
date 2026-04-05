import Link from "next/link";
import { User, Stethoscope, ArrowRight } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function RegisterSelectionPage() {
  return (
    <AuthLayout 
      heading="Create your account" 
      subheading="Join CareLabs today. Please choose your account type to proceed."
    >
      <div className="space-y-4">
        <Link href="/register/patient" className="block group">
          <div className="flex items-center p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-600 hover:shadow-lg hover:shadow-blue-600/5 transition-all duration-300">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors duration-300">
              <User className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-slate-900">I am a Patient</h3>
              <p className="text-sm text-slate-500 mt-1">Book appointments, manage records, and connect with doctors.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <Link href="/register/doctor" className="block group">
          <div className="flex items-center p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-blue-600 hover:shadow-lg hover:shadow-blue-600/5 transition-all duration-300">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors duration-300">
              <Stethoscope className="h-6 w-6 text-slate-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-slate-900">I am a Doctor</h3>
              <p className="text-sm text-slate-500 mt-1">Manage patients, schedules, and leverage AI diagnostic tools.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        <p className="text-center text-sm text-slate-600 mt-8 pt-8 border-t border-slate-100">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
            Sign in here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
