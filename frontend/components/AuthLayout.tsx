import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { Activity } from "lucide-react";

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
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">CareLabs</h2>
          </div>
          <p className="text-lg text-slate-200 leading-relaxed font-light">
            Empowering modern healthcare through AI-driven insights and streamlined medical workflows.
          </p>
        </div>
      </div>

      {/* Right side - scrollable form container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 sm:px-12 lg:px-24 py-12 bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10 relative">
        <div className="w-full max-w-md mx-auto relative">
          
          {/* Mobile Logo View */}
          <div className="lg:hidden flex items-center gap-2 mb-8 text-blue-600 font-semibold text-2xl tracking-tight">
            <Activity className="w-8 h-8" />
            <span>CareLabs</span>
          </div>

          <div className="space-y-1 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {heading}
            </h1>
            {subheading && (
              <p className="text-slate-500 text-lg">
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
