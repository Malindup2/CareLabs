import Link from "next/link";
import { Activity } from "lucide-react";

export default function PublicNavbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.02)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-gradient-to-tr from-primary to-blue-500 rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.25)] group-hover:scale-105 transition-transform duration-300 ease-out">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 group-hover:opacity-80 transition-opacity">CareLabs</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1.5 p-1.5 bg-slate-50/50 rounded-full border border-slate-200/50">
            <Link href="#how-it-works" className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all duration-300">
              How it Works
            </Link>
            <Link href="#features" className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all duration-300">
              Platform
            </Link>
            <Link href="#ai" className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all duration-300">
              AI Checker
            </Link>
          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 px-2 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="relative inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_14px_0_rgba(15,23,42,0.15)] overflow-hidden group"
            >
              <span className="absolute inset-0 w-full h-full -right-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shimmer"></span>
              Get Started
            </Link>
          </div>

        </div>
      </div>
    </nav>
  );
}
