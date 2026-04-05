import Link from "next/link";
import { Activity } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Col */}
          <div className="md:col-span-12 lg:col-span-4">
            <Link href="/" className="flex items-center gap-2 mb-6 group inline-flex">
              <div className="p-2 bg-gradient-to-tr from-primary/10 to-blue-500/10 rounded-xl">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors">CareLabs</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-6">
              Modern telemedicine and AI-powered healthcare for everyone. Available 24/7. Built with precision and care for the next generation.
            </p>
          </div>

          {/* Nav Links Cols */}
          <div className="md:col-span-4 lg:col-span-2 lg:col-start-6">
            <h4 className="font-semibold text-slate-900 mb-6 tracking-wide">Platform</h4>
            <ul className="space-y-4 text-[15px] font-medium text-slate-500">
              <li><Link href="#how-it-works" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">How it works</Link></li>
              <li><Link href="#features" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Features</Link></li>
              <li><Link href="#ai" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">AI Diagnostics</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Pricing</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 lg:col-span-2">
            <h4 className="font-semibold text-slate-900 mb-6 tracking-wide">For providers</h4>
            <ul className="space-y-4 text-[15px] font-medium text-slate-500">
              <li><Link href="/register/doctor" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Join network</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Provider login</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Clinical tools</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 lg:col-span-2">
            <h4 className="font-semibold text-slate-900 mb-6 tracking-wide">Company</h4>
            <ul className="space-y-4 text-[15px] font-medium text-slate-500">
              <li><Link href="#" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">About us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Privacy policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Terms of service</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200">Contact</Link></li>
            </ul>
          </div>
          
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-slate-500 font-medium">
            © {new Date().getFullYear()} CareLabs Technologies Inc. All rights reserved.
          </p>
          <div className="flex gap-4">
             <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               HIPAA Compliant
             </div>
             <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
               SSL Secured
             </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
