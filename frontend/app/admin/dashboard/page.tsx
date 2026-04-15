"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  CheckCircle2, Clock3, FileCheck2, ShieldAlert, XCircle, 
  LayoutDashboard, Users, Calendar, Megaphone, LogOut,
  UserCheck, HeartPulse, CreditCard, Activity, ArrowRight,
  PlusCircle, Search, Filter, Eye, Paperclip, Send,
  TrendingUp, TrendingDown, Users2, Stethoscope, BriefcaseMedical,
  Clock, RefreshCw, ChevronDown, ChevronRight, FileText, ShieldX,
  Video
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { apiGetAuth, apiPutAuth, apiPostAuth, apiDeleteAuth, clearAuth, getRole, getToken } from "@/lib/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ConfirmDialog from "@/components/ConfirmDialog";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

type Tab = "overview" | "verification" | "appointments" | "users" | "broadcast" | "finance";

interface Doctor {
  id: string;
  userId: string;
  fullName: string | null;
  specialty: string | null;
  qualification: string | null;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  active: boolean;
  profileImageUrl?: string | null;
  experienceYears?: number;
  consultationFee?: number;
}

interface Patient {
  id: string;
  userId: string;
  fullName: string | null;
  phone: string | null;
  city: string | null;
  district: string | null;
}

interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentTime: string;
  status: "REQUESTED" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  meetingUrl?: string;
  consultationFee?: number;
  type?: string;
}

interface Payment {
  id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  createdAt: string;
}

export default function AdminCommandCenter() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Data States
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Verification State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastRole, setBroadcastRole] = useState("ALL");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Identity Audit State
  const [auditUser, setAuditUser] = useState<{ type: 'doctor' | 'patient', data: any } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Deletion State
  const [userToDelete, setUserToDelete] = useState<{ type: 'doctor' | 'patient', data: any } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter States for Ledger
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("ALL");
  const [appDateFilter, setAppDateFilter] = useState("");

  // Finance Filter States
  const [finSearch, setFinSearch] = useState("");
  const [finStatusFilter, setFinStatusFilter] = useState("ALL");

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const matchesSearch = app.id.toLowerCase().includes(appSearch.toLowerCase()) ||
                            app.patientId.toLowerCase().includes(appSearch.toLowerCase()) ||
                            app.doctorId.toLowerCase().includes(appSearch.toLowerCase());
      const matchesStatus = appStatusFilter === "ALL" || app.status === appStatusFilter;
      const matchesDate = !appDateFilter || new Date(app.appointmentTime).toISOString().split('T')[0] === appDateFilter;
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, appSearch, appStatusFilter, appDateFilter]);

  // Analytics Transformations
  const userDistData = useMemo(() => [
    { name: 'Doctors', value: doctors.length },
    { name: 'Patients', value: patients.length }
  ], [doctors.length, patients.length]);

  const paymentLifecycleData = useMemo(() => {
    const counts = payments.reduce((acc: any, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(status => ({ name: status, value: counts[status] }));
  }, [payments]);

  const appVelocityData = useMemo(() => {
    const counts = appointments.reduce((acc: any, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(status => ({ name: status, count: counts[status] }));
  }, [appointments]);

  const COLORS = ['#2563eb', '#6366f1', '#f43f5e', '#10b981', '#f59e0b'];

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const q = finSearch.toLowerCase();
      const matchesSearch = p.id.toLowerCase().includes(q) || p.appointmentId.toLowerCase().includes(q);
      const matchesStatus = finStatusFilter === "ALL" || p.status === finStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, finSearch, finStatusFilter]);

  const downloadLedgerPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); 
    doc.text("CareLabs Global Care Ledger", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Official Administrative Audit`, 14, 28);

    const tableData = filteredAppointments.map(app => [
      new Date(app.appointmentTime).toLocaleDateString(),
      app.id.slice(0, 8),
      app.patientId.slice(0, 8),
      app.doctorId.slice(0, 8),
      `Rs. ${app.consultationFee?.toLocaleString() || '2,500'}`,
      app.status
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'App ID', 'Patient', 'Doctor', 'Fee', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 35 },
    });

    doc.save(`CareLabs_Ledger_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("Ledger downloaded successfully.");
  };

  const downloadFinancePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); 
    doc.text("CareLabs Financial Audit Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Official Financial Oversight`, 14, 28);

    const tableData = filteredPayments.map(p => [
      new Date(p.createdAt).toLocaleDateString(),
      p.id.slice(0, 8),
      p.appointmentId.slice(0, 8),
      `Rs. ${p.amount.toLocaleString()}`,
      p.status
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Trans ID', 'App ID', 'Amount', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 249, 255] },
      margin: { top: 35 },
    });

    doc.save(`CareLabs_Finance_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("Financial report downloaded.");
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const jwt = getToken();
    const role = getRole();
    if (!jwt || role !== "ADMIN") {
      toast.error("Administrative access required.");
      router.replace("/login");
      return;
    }
    setToken(jwt);
  }, [router]);

  const loadAllData = async (jwt: string) => {
    setLoading(true);
    try {
      const [docs, pats, apps, pmts] = await Promise.all([
        apiGetAuth<Doctor[]>("/doctors/admin/all", jwt),
        apiGetAuth<Patient[]>("/patients", jwt),
        apiGetAuth<Appointment[]>("/appointments", jwt),
        apiGetAuth<Payment[]>("/payments/admin/transactions", jwt),
      ]);
      setDoctors(docs);
      setPatients(pats);
      setAppointments(apps);
      setPayments(pmts);
      
      const firstPending = docs.find(d => d.verificationStatus === "PENDING");
      setSelectedDoctorId(firstPending?.id || docs[0]?.id || "");
    } catch (err: any) {
      toast.error(err.message || "Security breach or data retrieval failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadAllData(token);
  }, [token]);

  // Document Loading for verification
  useEffect(() => {
    if (!token || !selectedDoctorId || activeTab !== "verification") return;
    const fetchDocs = async () => {
      setDocsLoading(true);
      try {
        const rows = await apiGetAuth<any[]>(`/doctors/admin/${selectedDoctorId}/documents`, token);
        setDocuments(rows);
      } catch { setDocuments([]); }
      finally { setDocsLoading(false); }
    };
    fetchDocs();
  }, [selectedDoctorId, token, activeTab]);

  const handleVerify = async (status: "APPROVED" | "REJECTED") => {
    if (!token || !selectedDoctorId) return;
    if (status === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Reason required for rejection.");
      return;
    }
    try {
      const q = new URLSearchParams({ status });
      if (status === "REJECTED") q.set("rejectionReason", rejectionReason);
      const updated = await apiPutAuth<Doctor>(`/doctors/${selectedDoctorId}/verify?${q.toString()}`, {}, token);
      setDoctors(prev => prev.map(d => d.id === updated.id ? updated : d));
      toast.success(`Doctor ${status.toLowerCase()} successfully.`);
      setRejectionReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update verification status.");
    }
  };

  const handleBroadcast = async () => {
    if (!token || !broadcastTitle || !broadcastMessage) {
      toast.error("Please fill in title and message.");
      return;
    }
    setSendingBroadcast(true);
    try {
      await apiPostAuth("/notifications/broadcast", {
        title: broadcastTitle,
        message: broadcastMessage,
        targetRole: broadcastRole
      }, token);
      toast.success("Broadcast sent successfully to " + broadcastRole);
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err: any) {
      toast.error(err.message || "Broadcast failed.");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!token || !userToDelete) return;
    setIsDeleting(true);
    const loadingToast = toast.loading(`Permanently removing ${userToDelete.type}...`);
    
    try {
      // 1. Delete from Profile Service
      const profileEndpoint = userToDelete.type === 'doctor' 
        ? `/doctors/admin/${userToDelete.data.id}` 
        : `/patients/admin/${userToDelete.data.id}`;
      await apiDeleteAuth(profileEndpoint, token);
      
      // 2. Delete from Auth Service
      await apiDeleteAuth(`/auth/admin/users/${userToDelete.data.userId}`, token);
      
      toast.success(`${userToDelete.type === 'doctor' ? 'Doctor' : 'Patient'} identity purged successfully.`, { id: loadingToast });
      loadAllData(token);
    } catch (err: any) {
      toast.error(err.message || "Removal failure. Identity lifecycle intact.", { id: loadingToast });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Activity className="w-12 h-12 text-blue-600 animate-pulse" />
        <p className="font-bold text-slate-400 animate-pulse uppercase tracking-widest text-[10px]">Initializing CommandCenter...</p>
      </div>
    </div>
  );

  const revenue = payments.reduce((acc, p) => p.status === 'SUCCESS' ? acc + p.amount : acc, 0);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-slate-800">
           <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-xl flex items-center justify-center">
                <img src="/images/carelabs.png" alt="Logo" className="w-full h-full object-contain" />
             </div>
             CareLabs
           </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutDashboard} label="Overview" />
          <NavItem active={activeTab === "verification"} onClick={() => setActiveTab("verification")} icon={UserCheck} label="Verification" badge={doctors.filter(d => d.verificationStatus === "PENDING").length} />
          <NavItem active={activeTab === "appointments"} onClick={() => setActiveTab("appointments")} icon={Calendar} label="Appointments" />
          <NavItem active={activeTab === "users"} onClick={() => setActiveTab("users")} icon={Users} label="User Directory" />
          <NavItem active={activeTab === "finance"} onClick={() => setActiveTab("finance")} icon={CreditCard} label="Finance Hub" />
          <NavItem active={activeTab === "broadcast"} onClick={() => setActiveTab("broadcast")} icon={Megaphone} label="Broadcast" />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 capitalize tracking-tight">{activeTab} Hub</h2>
            <p className="text-xs font-semibold text-blue-700">
               {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} {" | "}
               {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Administrator</p>
               <p className="text-sm font-black text-slate-900 tracking-tight">System Authority</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-600">A</div>
             <NotificationBell />
             <button
               onClick={() => setShowLogoutConfirm(true)}
               className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
             >
               Logout
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <StatCard icon={Stethoscope} label="Providers" value={String(doctors.length)} subtitle="Verified Practitioners" />
                   <StatCard icon={Users2} label="Patients" value={String(patients.length)} subtitle="Registered Lives" />
                   <StatCard icon={Calendar} label="Sessions" value={String(appointments.length)} subtitle="Activity Ledger" />
                   <StatCard icon={CreditCard} label="Revenue" value={`Rs. ${revenue.toLocaleString()}`} subtitle="Net Ecosystem Flow" accent="blue" />
                </div>

                <div className="space-y-8">
                   {/* Main Analytics Row */}
                   <div className="grid lg:grid-cols-3 gap-8">
                      {/* Left: Bar Chart (2/3 width) */}
                      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group relative overflow-hidden h-full flex flex-col">
                         <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                         <div className="flex items-center justify-between mb-8 relative z-10">
                            <div>
                               <h3 className="text-xl font-black text-slate-900 tracking-tight">Booking Velocity</h3>
                               <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Status Progression Analytics</p>
                            </div>
                            <Calendar className="w-5 h-5 text-blue-500" />
                         </div>
                         <div className="flex-1 w-full relative z-10 min-h-[100px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={appVelocityData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                               </BarChart>
                            </ResponsiveContainer>
                         </div>
                      </div>

                      {/* Right: Pie Charts Stack (1/3 width) */}
                      <div className="lg:col-span-1 space-y-8 h-full flex flex-col">
                         <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group">
                            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Patient vs Provider</h2>
                            <div className="h-[150px]">
                               <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                     <Pie data={userDistData} innerRadius={45} outerRadius={60} paddingAngle={5} dataKey="value">
                                        {userDistData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                     </Pie>
                                     <Tooltip />
                                     <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                  </PieChart>
                               </ResponsiveContainer>
                            </div>
                         </div>
                         <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Financial Lifecycle</h2>
                            <div className="h-[150px]">
                               <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                     <Pie data={paymentLifecycleData} outerRadius={60} dataKey="value">
                                        {paymentLifecycleData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                        ))}
                                     </Pie>
                                     <Tooltip />
                                     <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                  </PieChart>
                               </ResponsiveContainer>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Operational Status & Feed */}
                   <div className="grid lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/40">
                         <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                         <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-6">Ecosystem Health</p>
                         <h3 className="text-xl font-black tracking-tight leading-none mb-8">Platform is healthy and operational.</h3>
                         <div className="space-y-6">
                            <div className="flex items-center justify-between">
                               <span className="text-xs font-bold text-slate-400">API Gateway</span>
                               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest font-mono">STABLE</span>
                            </div>
                            <div className="flex items-center justify-between">
                               <span className="text-xs font-bold text-slate-400">Auth Cluster</span>
                               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest font-mono">SYNCED</span>
                            </div>
                            <div className="flex items-center justify-between">
                               <span className="text-xs font-bold text-slate-400">Financial Ops</span>
                               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest font-mono">FLOW_OK</span>
                            </div>
                         </div>
                      </div>

                      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group">
                         <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Live Audit Feed</h3>
                            <RefreshCw className="w-4 h-4 text-slate-300 group-hover:rotate-180 transition-transform duration-700" />
                         </div>
                         <div className="grid md:grid-cols-2 gap-4">
                            {appointments.slice(-4).reverse().map(app => (
                               <div key={app.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-50 hover:bg-white hover:border-slate-200 transition-all shadow-sm">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                  <div className="flex-1 min-w-0">
                                     <p className="text-[10px] font-black text-slate-900 truncate uppercase">#{app.id.slice(0, 8)}</p>
                                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{app.status}</p>
                                  </div>
                                  <p className="text-[9px] font-black text-slate-300">{formatRelativeTime(app.appointmentTime)}</p>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === "finance" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <StatCard icon={CreditCard} label="Net Revenue" value={`Rs. ${revenue.toLocaleString()}`} subtitle="Successfully Processed" accent="blue" />
                   <StatCard icon={TrendingDown} label="Failed attempts" value={String(payments.filter(p => p.status === 'FAILED').length)} subtitle="Transaction Friction" />
                   <StatCard icon={RefreshCw} label="Pending Ledger" value={String(payments.filter(p => p.status === 'PENDING').length)} subtitle="Awaiting Settlement" />
                </div>

                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                   <div className="p-8 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 gap-6">
                     <div className="flex-1 min-w-[300px]">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial Audit Hub</h3>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Real-time Transaction Lifecycle Monitoring</p>
                     </div>
                     <div className="flex flex-wrap items-center gap-4">
                       <div className="relative group min-w-[200px]">
                         <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                         <input 
                           type="text" 
                           placeholder="Search Transactions..." 
                           value={finSearch}
                           onChange={(e) => setFinSearch(e.target.value)}
                           className="w-full pl-11 pr-5 py-3 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none shadow-sm" 
                         />
                       </div>
                       <select 
                         value={finStatusFilter}
                         onChange={(e) => setFinStatusFilter(e.target.value)}
                         className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none shadow-sm cursor-pointer"
                       >
                           <option value="ALL">All Payments</option>
                           <option value="SUCCESS">Success</option>
                           <option value="PENDING">Pending</option>
                           <option value="FAILED">Failed</option>
                           <option value="REFUNDED">Refunded</option>
                       </select>
                       <button 
                         onClick={downloadFinancePDF}
                         className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                       >
                           <FileText className="w-4 h-4" /> Export Financial Report
                       </button>
                     </div>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full border-collapse">
                         <thead>
                           <tr className="bg-slate-50/50 border-b border-slate-100">
                             <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                             <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction ID</th>
                             <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Linked Appointment</th>
                             <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Settlement Amount</th>
                             <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Lifecycle State</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                           {filteredPayments.slice().reverse().map(p => (
                             <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                               <td className="px-8 py-7">
                                   <p className="text-sm font-black text-slate-900 tracking-tight">{new Date(p.createdAt).toLocaleDateString()}</p>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(p.createdAt).toLocaleTimeString()}</p>
                               </td>
                               <td className="px-6 py-7">
                                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">TRX_{p.id.slice(0, 12)}</p>
                               </td>
                               <td className="px-6 py-7">
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">APP_{p.appointmentId.slice(0, 12)}</p>
                               </td>
                               <td className="px-6 py-7">
                                   <p className="text-sm font-black text-slate-900 tracking-tight">Rs. {p.amount.toLocaleString()}</p>
                               </td>
                               <td className="px-8 py-7 text-right"><StatusPill status={p.status} /></td>
                             </tr>
                           ))}
                           {payments.length === 0 && (
                             <tr><td colSpan={5} className="py-24 text-center"><CreditCard className="w-12 h-12 text-slate-200 mx-auto mb-4" /><p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No transactions recorded</p></td></tr>
                           )}
                         </tbody>
                     </table>
                   </div>
                </div>
              </div>
            )}

            {activeTab === "verification" && (
               <div className="grid lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-5 bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
                    <div className="mb-6 px-4">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">Registry Audit Queue</h3>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Provider Compliance Oversight</p>
                    </div>
                    <div className="space-y-3 px-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                      {doctors.map(d => (
                        <button key={d.id} onClick={() => setSelectedDoctorId(d.id)} className={`w-full text-left p-5 rounded-[2rem] border transition-all duration-300 ${selectedDoctorId === d.id ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-slate-400 shadow-sm overflow-hidden">
                                {d.profileImageUrl ? <img src={d.profileImageUrl} className="w-full h-full object-cover" /> : (d.fullName?.slice(0, 1) || 'D')}
                             </div>
                             <div className="flex-1 min-w-0">
                               <p className="font-black text-slate-900 text-sm tracking-tight truncate">{d.fullName || 'New Provider Profile'}</p>
                               <div className="flex justify-between items-center mt-1">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{d.specialty || 'General Practitioner'}</span>
                                 <StatusPill status={d.verificationStatus} />
                               </div>
                             </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="lg:col-span-7">
                    {doctors.find(d => d.id === selectedDoctorId) ? (
                      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 -mr-32 -mt-32 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-8 mb-10">
                             <div className="w-24 h-24 rounded-[2.5rem] bg-slate-100 overflow-hidden ring-4 ring-slate-50 shadow-xl relative">
                               <img src={doctors.find(d => d.id === selectedDoctorId)?.profileImageUrl || '/images/default.png'} className="w-full h-full object-cover" alt="Profile" />
                             </div>
                             <div>
                               <div className="flex items-center gap-3">
                                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{doctors.find(d => d.id === selectedDoctorId)?.fullName}</h2>
                                  <StatusPill status={doctors.find(d => d.id === selectedDoctorId)?.verificationStatus || "PENDING"} />
                               </div>
                               <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 mt-1">{doctors.find(d => d.id === selectedDoctorId)?.qualification || 'Academic Credentials Pending'}</p>
                             </div>
                          </div>
                          <div className="space-y-6">
                            <h4 className="flex items-center gap-3 text-sm font-black text-slate-900 uppercase tracking-widest"><FileCheck2 className="w-5 h-5 text-blue-600" /> Evidence Audit Ledger</h4>
                            <div className="grid gap-4">
                              {docsLoading ? (
                                <div className="space-y-3">
                                   {[1,2].map(i => <div key={i} className="h-16 rounded-2xl bg-slate-50 animate-pulse" />)}
                                </div>
                               ) : documents.map((doc, idx) => (
                                <a key={idx} href={doc.documentUrl} target="_blank" className="flex items-center justify-between p-5 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group/doc">
                                  <div className="flex items-center gap-4">
                                     <div className="p-3 rounded-2xl bg-white border border-slate-100 text-slate-400 group-hover/doc:text-blue-600 transition-colors"><FileText className="w-5 h-5" /></div>
                                     <span className="text-xs font-black uppercase tracking-widest text-slate-700">{doc.type}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-blue-600">
                                     <span className="text-[10px] font-black uppercase tracking-widest">Verify Document</span>
                                     <Eye className="w-4 h-4" />
                                  </div>
                                </a>
                              ))}
                              {documents.length === 0 && !docsLoading && (
                                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed text-slate-400">
                                   <ShieldX className="w-12 h-12 mb-3 opacity-30" /><p className="text-[11px] font-black uppercase tracking-widest italic">No clinical evidence submitted for this audit.</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-12 pt-10 border-t border-slate-100 space-y-6">
                             <div className="space-y-3">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-4">Internal Auditor Decision Notes</label>
                                <textarea className="w-full rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-5 text-sm font-bold text-slate-900 focus:ring-4 ring-blue-50 focus:border-blue-200 outline-none transition-all placeholder:text-slate-300 min-h-[120px]" placeholder="Input audit findings or reasons for non-compliance..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                             </div>
                             <div className="grid grid-cols-2 gap-6">
                                <button onClick={() => handleVerify("REJECTED")} className="py-5 bg-white border border-slate-200 hover:border-rose-200 hover:text-rose-600 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-3xl transition-all shadow-sm active:scale-95">Deny Authorization</button>
                                <button onClick={() => handleVerify("APPROVED")} className="py-5 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-slate-200 transition-all active:scale-95">Grant Clinical Access</button>
                             </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-[700px] bg-slate-100/50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 font-black uppercase tracking-[0.2em] italic">
                         <Search className="w-20 h-20 mb-4 opacity-10" />Audit Target Selection Pending
                      </div>
                    )}
                  </div>
               </div>
            )}

            {activeTab === "appointments" && (
              <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                 <div className="p-8 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 gap-6">
                   <div className="flex-1 min-w-[300px]">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Global Care Ledger</h3>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Activity Tracking & Financial Audit</p>
                   </div>
                   <div className="flex flex-wrap items-center gap-4">
                     <div className="relative group min-w-[200px]">
                       <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                       <input 
                        type="text" 
                        placeholder="Search IDs..." 
                        value={appSearch}
                        onChange={(e) => setAppSearch(e.target.value)}
                        className="w-full pl-11 pr-5 py-3 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none shadow-sm" 
                       />
                     </div>
                     <select 
                      value={appStatusFilter}
                      onChange={(e) => setAppStatusFilter(e.target.value)}
                      className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none shadow-sm cursor-pointer"
                     >
                        <option value="ALL">All Status</option>
                        <option value="REQUESTED">Requested</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="REJECTED">Rejected</option>
                     </select>
                     <input 
                      type="date" 
                      value={appDateFilter}
                      onChange={(e) => setAppDateFilter(e.target.value)}
                      className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-600 focus:ring-4 focus:ring-blue-50 focus:border-blue-200 outline-none shadow-sm cursor-pointer"
                     />
                     <button 
                      onClick={downloadLedgerPDF}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                     >
                        <FileText className="w-4 h-4" /> Download PDF
                     </button>
                   </div>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                       <thead>
                         <tr className="bg-slate-50/50 border-b border-slate-100">
                           <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled Datum</th>
                           <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Network Participants</th>
                           <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Financial Ledger</th>
                           <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Clinical Channel</th>
                           <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Ledger State</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                         {filteredAppointments.length === 0 ? (
                           <tr><td colSpan={5} className="py-24 text-center"><Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" /><p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No matching records found</p></td></tr>
                         ) : filteredAppointments.slice().reverse().map(app => (
                           <tr key={app.id} className="hover:bg-slate-50 transition-colors group">
                             <td className="px-8 py-7">
                                <p className="text-sm font-black text-slate-900 tracking-tight">{new Date(app.appointmentTime).toLocaleDateString()}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5"><Clock className="w-3 h-3" /> {new Date(app.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                             </td>
                             <td className="px-6 py-7">
                                <div className="space-y-1">
                                   <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">PTR: {app.patientId.slice(0, 8)}</p></div>
                                   <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DOC: {app.doctorId.slice(0, 8)}</p></div>
                                </div>
                             </td>
                             <td className="px-6 py-7">
                                <p className="text-sm font-black text-slate-900 tracking-tight">Rs. {app.consultationFee?.toLocaleString() || '2,500'}</p>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 border border-emerald-100 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">Registry Settled</p>
                             </td>
                             <td className="px-6 py-7">
                               {app.meetingUrl ? (
                                 <a href={app.meetingUrl} className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2 underline-offset-4"><Video className="w-4 h-4" /> Virtual Consultation</a>
                               ) : (
                                 <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 italic"><Clock3 className="w-4 h-4" /> {app.type || 'Physical'} Channel</span>
                               )}
                             </td>
                             <td className="px-8 py-7 text-right"><StatusPill status={app.status} /></td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}

            {activeTab === "users" && (
               <div className="space-y-10 animate-in fade-in duration-700">
                  <div className="grid lg:grid-cols-2 gap-10">
                     <UserDirectory 
                        title="Credentialed Practitioners" 
                        items={doctors} 
                        type="doctor" 
                        onViewDetail={(d) => setAuditUser({ type: 'doctor', data: d })}
                        onDelete={(d) => {
                          setUserToDelete({ type: 'doctor', data: d });
                          setShowDeleteConfirm(true);
                        }}
                     />
                     <UserDirectory 
                        title="Registered Patient Base" 
                        items={patients} 
                        type="patient" 
                        onViewDetail={(p) => setAuditUser({ type: 'patient', data: p })}
                        onDelete={(p) => {
                          setUserToDelete({ type: 'patient', data: p });
                          setShowDeleteConfirm(true);
                        }}
                     />
                  </div>
               </div>
            )}

            {auditUser && (
               <IdentityAuditModal 
                  user={auditUser.data} 
                  type={auditUser.type} 
                  appointments={appointments}
                  payments={payments}
                  onClose={() => setAuditUser(null)} 
               />
            )}

            {activeTab === "broadcast" && (
               <div className="max-w-3xl mx-auto">
                 <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-700">
                      <Megaphone className="w-64 h-64 text-white" />
                   </div>
                   <div className="relative z-10">
                     <div className="mb-12">
                        <h3 className="text-3xl font-black text-white tracking-tight mb-3">Platform Intelligence Broadcast</h3>
                        <p className="text-slate-400 text-sm font-medium tracking-wide leading-relaxed max-w-lg">Dispatch mission-critical announcements to your clinical and patient network. Verified authenticated delivery guaranteed.</p>
                     </div>
                     <div className="space-y-8">
                        <div className="space-y-3">
                           <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-4">Internal Announcement Title</label>
                           <input className="w-full rounded-[2rem] bg-slate-800/50 border border-slate-700 px-6 py-5 font-bold text-white placeholder:text-slate-600 focus:ring-4 ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all" placeholder="e.g., Scheduled System Optimization" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-4">Messaging Payload</label>
                           <textarea className="w-full rounded-[2.5rem] bg-slate-800/50 border border-slate-700 px-6 py-6 text-sm font-medium text-slate-300 placeholder:text-slate-600 focus:ring-4 ring-blue-500/10 focus:border-blue-500/50 outline-none min-h-[160px] leading-relaxed" placeholder="Compose your transmission here..." value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-4">Selection Subnet</label>
                          <div className="grid grid-cols-3 gap-4">
                            {["ALL", "DOCTOR", "PATIENT"].map(r => (
                              <button key={r} onClick={() => setBroadcastRole(r)} className={`py-4 rounded-2xl border font-black text-[10px] tracking-widest uppercase transition-all duration-300 ${broadcastRole === r ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-slate-800/30 border-slate-700 text-slate-500 hover:text-slate-300'}`}>{r}</button>
                            ))}
                          </div>
                        </div>
                        <div className="pt-6">
                           <button disabled={sendingBroadcast} onClick={handleBroadcast} className="w-full py-6 bg-white hover:bg-slate-100 text-slate-900 rounded-[2.5rem] font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-4 shadow-xl active:scale-95 disabled:opacity-50 group/send">
                             {sendingBroadcast ? "Delivering Network Packets..." : "Initiate Global Dispatch"}
                             <Send className={`w-5 h-5 transition-transform duration-500 ${sendingBroadcast ? 'animate-pulse' : 'group-hover:translate-x-1 group-hover:-translate-y-1'}`} />
                           </button>
                        </div>
                     </div>
                   </div>
                 </div>
               </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={`Purge ${userToDelete?.type === 'doctor' ? 'Doctor' : 'Patient'} Identity`}
        message={`Are you sure you want to permanently remove ${userToDelete?.data.fullName || userToDelete?.data.id.slice(0,8)} from the system? This will delete all clinical records, medical history, and authentication access. This action is IRREVERSIBLE.`}
        confirmLabel={isDeleting ? "Processing..." : "Purge Identity"}
        cancelLabel="Abort"
        onCancel={() => !isDeleting && setShowDeleteConfirm(false)}
        onConfirm={handleDeleteUser}
        danger
      />

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        cancelLabel="Cancel"
        confirmLabel="Yes, Logout"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          clearAuth();
          router.replace("/login");
        }}
      />
    </div>
  );
}

function NavItem({ active, onClick, icon: Icon, label, badge }: { active: boolean, onClick: () => void, icon: any, label: string, badge?: number }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition group ${active ? 'bg-blue-600/10 text-blue-300 border border-blue-600/30 shadow-lg shadow-blue-900/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
       <div className="flex items-center gap-3"><Icon className="w-5 h-5 flex-shrink-0" /><span className="text-sm font-semibold">{label}</span></div>
       {badge ? <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${active ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' : 'bg-slate-800 text-slate-400'}`}>{badge}</span> : null}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, subtitle, accent }: any) {
  return (
    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between items-center text-center overflow-visible">
       <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
       <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
       <div className="relative z-10 flex flex-col items-center justify-center w-full gap-3">
          <div className="p-3 shadow-sm bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-white group-hover:scale-110 transition-all duration-500 ring-4 ring-transparent group-hover:ring-blue-50"><Icon className={`w-5 h-5 ${accent === 'blue' ? 'text-blue-600' : 'text-slate-600 group-hover:text-blue-600'}`} /></div>
          <div className="space-y-0.5"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">{label}</p><h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</h2></div>
          {subtitle && <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{subtitle}</p>}
       </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: any = {
    PENDING: "bg-amber-100 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
    REQUESTED: "bg-amber-100 text-amber-700 border-amber-200",
    ACCEPTED: "bg-blue-100 text-blue-700 border-blue-200",
    COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-slate-100 text-slate-400 border-slate-200",
    SUCCESS: "bg-emerald-100 text-emerald-700 border-emerald-200",
    FAILED: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (<span className={`px-2.5 py-1 rounded-full border text-[9px] font-black tracking-[0.15em] uppercase shadow-sm ${styles[status] || 'bg-slate-50 border-slate-100'}`}>{status}</span>);
}

function UserDirectory({ title, items, type, onViewDetail, onDelete }: { title: string, items: any[], type: 'doctor' | 'patient', onViewDetail: (user: any) => void, onDelete: (user: any) => void }) {
  const [search, setSearch] = useState("");
  
  const filtered = items.filter(u => {
    const q = search.toLowerCase();
    return (u.fullName?.toLowerCase() || "").includes(q) || 
           (u.id.toLowerCase()).includes(q) ||
           (type === 'doctor' ? (u.specialty?.toLowerCase() || "").includes(q) : (u.city?.toLowerCase() || "").includes(q));
  });

  return (
    <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm flex flex-col h-full">
       <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-6">
          <div className="flex-1 min-w-[200px]">
             <h3 className="font-black text-slate-900 tracking-tight text-2xl">{title}</h3>
             <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Platform Identity Repository</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative group">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                   type="text" 
                   placeholder={`Search ${type}s...`}
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="pl-11 pr-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-700 focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none shadow-sm"
                />
             </div>
             <span className="text-[10px] font-black px-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-600">{filtered.length} Records</span>
          </div>
       </div>
       <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar space-y-4">
          {filtered.map(user => (
            <div key={user.id} className="group flex items-center gap-5 p-5 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-xl transition-all duration-300">
               <div className="w-16 h-16 rounded-[2rem] bg-white border border-slate-100 shadow-inner overflow-hidden flex items-center justify-center text-slate-400 font-black text-xl group-hover:scale-105 transition-transform duration-500">{user.profileImageUrl ? <img src={user.profileImageUrl} alt="P" className="w-full h-full object-cover" /> : (user.fullName?.slice(0, 1) || 'U')}</div>
               <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-base leading-tight truncate tracking-tight">{user.fullName || 'Unidentified'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-1 italic">{type === 'doctor' ? user.specialty : (user.city || 'Geolocation Pending')}</p>
               </div>
               <div className="flex items-center gap-2">
                  <button 
                     onClick={() => onViewDetail(user)}
                     className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-blue-600 hover:border-blue-100 hover:shadow-md transition-all active:scale-95 shrink-0"
                  >
                     <Eye className="w-5 h-5" />
                  </button>
                  <button 
                     onClick={() => onDelete(user)}
                     className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:border-rose-100 hover:shadow-md transition-all active:scale-95 shrink-0"
                  >
                     <ShieldX className="w-5 h-5" />
                  </button>
               </div>
            </div>
          ))}
          {filtered.length === 0 && (<div className="py-32 flex flex-col items-center justify-center text-center opacity-30 grayscale"><Users2 className="w-16 h-16 mb-4" /><p className="text-[11px] font-black uppercase tracking-widest">No matching identities found</p></div>)}
       </div>
    </div>
  );
}

function IdentityAuditModal({ user, type, appointments, payments, onClose }: { user: any, type: 'doctor' | 'patient', appointments: any[], payments: any[], onClose: () => void }) {
  const userAppointments = useMemo(() => {
    return appointments.filter(a => type === 'doctor' ? a.doctorId === user.id : a.patientId === user.id);
  }, [appointments, user.id, type]);

  const userPayments = useMemo(() => {
    const appIds = userAppointments.map(a => a.id);
    return payments.filter(p => appIds.includes(p.appointmentId));
  }, [payments, userAppointments]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
       <div className="bg-white w-full max-w-5xl max-h-full overflow-y-auto rounded-[3.5rem] shadow-2xl relative border border-slate-200">
          <button onClick={onClose} className="absolute right-8 top-8 w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all z-20"><XCircle className="w-6 h-6" /></button>
          
          <div className="p-10 md:p-14">
             <div className="flex flex-col md:flex-row gap-12 items-start mb-16 pb-16 border-b border-slate-100">
                <div className="w-48 h-48 rounded-[3.5rem] bg-slate-50 border-4 border-white shadow-2xl overflow-hidden ring-1 ring-slate-100 shrink-0">
                   {user.profileImageUrl ? <img src={user.profileImageUrl} className="w-full h-full object-cover" /> : (user.fullName?.slice(0, 1) || 'U')}
                </div>
                <div className="flex-1 space-y-6">
                   <div className="flex items-center gap-4 flex-wrap">
                      <h2 className="text-5xl font-black text-slate-900 tracking-tight">{user.fullName || 'Verified Patient'}</h2>
                      <StatusPill status={type === 'doctor' ? user.verificationStatus : 'ACTIVE'} />
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Identity ID</p>
                         <p className="text-sm font-bold text-slate-700 font-mono">#{user.id.slice(0,12)}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{type === 'doctor' ? 'Clinical Specialty' : 'Geographic Hub'}</p>
                         <p className="text-sm font-bold text-slate-700">{type === 'doctor' ? user.specialty : `${user.city}, ${user.district}`}</p>
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Contact Anchor</p>
                         <p className="text-sm font-bold text-slate-700">{user.phone || 'Registry Private'}</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid lg:grid-cols-2 gap-16">
                <div>
                   <div className="flex items-center justify-between mb-8 cursor-default">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600"><Calendar className="w-5 h-5" /></div>
                         <h4 className="text-lg font-black text-slate-900 tracking-tight">Activity History</h4>
                      </div>
                      <span className="text-[10px] font-black px-3 py-1 bg-slate-50 rounded-full border border-slate-100 text-slate-500">{userAppointments.length} Entries</span>
                   </div>
                   <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                      {userAppointments.length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 italic text-xs font-bold uppercase tracking-widest">Zero activity records</div>
                      ) : userAppointments.slice().reverse().map(app => (
                        <div key={app.id} className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <div>
                                 <p className="text-sm font-black text-slate-900">{new Date(app.appointmentTime).toLocaleDateString()}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.status}</p>
                              </div>
                           </div>
                           <p className="text-[9px] font-black text-slate-300 font-mono tracking-tighter">REF_{app.id.slice(0,8)}</p>
                        </div>
                      ))}
                   </div>
                </div>

                <div>
                   <div className="flex items-center justify-between mb-8 cursor-default">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600"><CreditCard className="w-5 h-5" /></div>
                         <h4 className="text-lg font-black text-slate-900 tracking-tight">{type === 'doctor' ? 'Earnings Ledger' : 'Financial Statement'}</h4>
                      </div>
                      <span className="text-[10px] font-black px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 text-emerald-600">Rs. {userPayments.reduce((acc, p) => p.status === 'SUCCESS' ? acc + (type === 'doctor' ? (p.amount * 0.8) : p.amount) : acc, 0).toLocaleString()} Total</span>
                   </div>
                   <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                      {userPayments.length === 0 ? (
                        <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300 italic text-xs font-bold uppercase tracking-widest">No financial data documented</div>
                      ) : userPayments.slice().reverse().map(pmt => (
                        <div key={pmt.id} className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                           <div className="flex items-center gap-4">
                              <div className={`w-2 h-2 rounded-full ${pmt.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <div>
                                 <p className="text-sm font-black text-slate-900">Rs. {(type === 'doctor' ? (pmt.amount * 0.8) : pmt.amount).toLocaleString()}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(pmt.createdAt).toLocaleDateString()} • {pmt.status}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[9px] font-black text-slate-300 font-mono tracking-tighter uppercase">{pmt.status}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}

function formatRelativeTime(date: string | Date | undefined) {
  if (!date) return "Just Now";
  const now = new Date();
  const then = new Date(date);
  if (isNaN(then.getTime())) return "Recently";
  const diffInMs = now.getTime() - then.getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));

  if (diffInMins < 1) return "Just Now";
  if (diffInMins < 60) return `${diffInMins}m ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return then.toLocaleDateString();
}
