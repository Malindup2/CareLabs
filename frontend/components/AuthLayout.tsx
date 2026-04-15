import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { Activity, ChevronLeft } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  heading: string;
  subheading?: string;
}

export default function AuthLayout({ children, heading, subheading }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left fixed side - 1:1 image container or full height depending on viewport */}
      <div className="hidden lg:flex lg:w-1/2 relative p-12 items-end justify-center">
        {/* Background Image Setup */}
        <div className="absolute inset-0 z-0 bg-slate-100 overflow-hidden">
             <Image
              src="/images/login.png"
              alt="CareLabs Hero Image"
              fill
              className="object-cover"
              priority
             />
             {/* Subtle gradient overlay to ensure readability of the brand text */}
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
        </div>
        
        {/* Optional marketing contextual overlay on top of the image */}
        <div className="relative z-10 w-full max-w-lg mb-10 text-slate-50 backdrop-blur-md bg-white/10 p-8 rounded-2xl border border-white/20 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-14 w-14 overflow-hidden rounded-2xl">
               <img
                src="/images/carelabs.png"
                alt="CareLabs Logo"
                className="w-full h-full object-contain"
               />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">CareLabs</h2>
          </div>
          <p className="text-lg text-slate-200 leading-relaxed font-light">
            Empowering modern healthcare through AI-driven insights and streamlined medical workflows.
          </p>
        </div>
      </div>

      {/* Right side - scrollable form container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12 py-12 bg-slate-50 z-10 relative">
        <div className="w-full max-w-lg relative bg-white border border-slate-200 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl shadow-slate-200/50">
          
          <Link
            href="/"
            className="group absolute -top-16 left-4 sm:left-0 flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            <div className="h-10 w-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-blue-600 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </div>
            Back to Home
          </Link>

          {/* Mobile Logo View */}
          <div className="lg:hidden flex items-center gap-3 mb-8 text-slate-900 font-black text-2xl tracking-tighter">
             <div className="h-10 w-10 overflow-hidden rounded-xl">
               <img
                src="/images/carelabs.png"
                alt="CareLabs Logo"
                className="w-full h-full object-contain"
               />
            </div>
            <span>CareLabs</span>
          </div>

          <div className="space-y-1 mb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              {heading}
            </h1>
            {subheading && (
              <p className="text-slate-500 text-lg font-medium">
                {subheading}
              </p>
            )}
          </div>

          <div className="w-full">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}
