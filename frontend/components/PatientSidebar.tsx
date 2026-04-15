"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, FileText, AlertTriangle, BookOpen, Stethoscope, Video } from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", href: "/patient/dashboard", icon: <Stethoscope className="w-5 h-5" /> },
  { label: "Appointments", href: "/patient/appointments", icon: <Video className="w-5 h-5" /> },
  { label: "Profile", href: "/patient/profile", icon: <User className="w-5 h-5" /> },
  { label: "Medical History", href: "/patient/medical-history", icon: <BookOpen className="w-5 h-5" /> },
  { label: "Allergies", href: "/patient/allergies", icon: <AlertTriangle className="w-5 h-5" /> },
  { label: "Medical Reports", href: "/patient/reports", icon: <FileText className="w-5 h-5" /> },
];

export default function PatientSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex shrink-0 flex-col" suppressHydrationWarning>
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-blue-500" /> CareLabs
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                isActive
                  ? "bg-blue-500/10 text-blue-300 border border-blue-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {item.icon}
              <span className="font-semibold text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
