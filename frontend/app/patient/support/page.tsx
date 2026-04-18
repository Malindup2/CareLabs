"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { 
  ShieldAlert, 
  Plus, 
  History, 
  HelpCircle, 
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Building,
  CreditCard,
  Hash
} from "lucide-react";
import { apiGetAuth, apiPostAuth, getToken } from "@/lib/api";

type TicketCategory = "TECHNICAL_PROBLEM" | "REFUND" | "OTHER";
type TicketStatus = "OPEN" | "RESOLVED" | "REJECTED";

interface Appointment {
  id: string;
  doctorFullName: string;
  appointmentTime: string;
  status: string;
  consultationFee: number;
}

interface SupportTicket {
  id: string;
  category: TicketCategory;
  description: string;
  appointmentId?: string;
  status: TicketStatus;
  createdAt: string;
  resolvedAt?: string;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [category, setCategory] = useState<TicketCategory>("TECHNICAL_PROBLEM");
  const [description, setDescription] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const jwt = getToken();
    setToken(jwt);
  }, []);

  const loadData = async (jwt: string) => {
    setLoading(true);
    try {
      const profile = await apiGetAuth<{ userId: string }>("/patients/me", jwt);
      
      const [ticketList, appList] = await Promise.all([
        apiGetAuth<SupportTicket[]>("/appointments/support/tickets/me", jwt),
        apiGetAuth<Appointment[]>(`/appointments/patient/${profile.userId}`, jwt).catch(() => []) 
      ]);
      
      // Filter appointments suitable for refund: PENDING or CONFIRMED
      const refundable = appList.filter(app => 
        app.status === "PENDING" || app.status === "CONFIRMED"
      );
      
      setTickets(ticketList);
      setAppointments(refundable);
    } catch (err: any) {
      toast.error("Failed to load support data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadData(token);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (category === "REFUND") {
      if (!selectedAppointmentId || !accountNumber || !bankName || !branchName) {
        toast.error("Please provide all refund and bank details.");
        return;
      }
    } else if (!description.trim()) {
      toast.error("Please describe your issue.");
      return;
    }

    setSubmitting(true);
    try {
      await apiPostAuth("/appointments/support/tickets", {
        category,
        description,
        appointmentId: category === "REFUND" ? selectedAppointmentId : null,
        accountNumber: category === "REFUND" ? accountNumber : null,
        bankName: category === "REFUND" ? bankName : null,
        branchName: category === "REFUND" ? branchName : null,
      }, token);
      
      toast.success("Support ticket created successfully.");
      setShowCreateModal(false);
      resetForm();
      loadData(token);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCategory("TECHNICAL_PROBLEM");
    setDescription("");
    setSelectedAppointmentId("");
    setAccountNumber("");
    setBankName("");
    setBranchName("");
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 opacity-50">
      <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mb-4" />
      <p className="text-xs font-black uppercase tracking-widest">Synchronizing Support Registry...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Support Center</h1>
          <p className="text-sm font-medium text-slate-500 max-w-xl">
            Need assistance with your clinical sessions or billing? Raise a ticket and our administrative team will assist you.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          <Plus className="w-4 h-4" /> New Support Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-blue-500" /> Ticket History
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tickets.length} Registered Records</span>
            </div>
            
            <div className="divide-y divide-slate-50">
              {tickets.length > 0 ? [...tickets].reverse().map(ticket => (
                <div key={ticket.id} className="p-8 hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          ticket.category === 'REFUND' ? 'bg-amber-100 text-amber-700' : 
                          ticket.category === 'TECHNICAL_PROBLEM' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ticket.category.replace('_', ' ')}
                        </span>
                        <StatusPill status={ticket.status} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 leading-relaxed">{ticket.description || "Refund Request for Appointment"}</p>
                      {ticket.appointmentId && (
                        (() => {
                          const app = appointments.find(a => a.id === ticket.appointmentId);
                          return (
                            <div className="flex flex-col gap-1 mt-2">
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5" /> REF: {ticket.appointmentId.slice(0, 12)}...
                              </p>
                              {app && (
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                  Consultation with Dr. {app.doctorFullName} on {new Date(app.appointmentTime).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                    {ticket.status === 'RESOLVED' && (
                      <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="py-24 flex flex-col items-center justify-center opacity-30">
                  <HelpCircle className="w-16 h-16 mb-4" />
                  <p className="text-[11px] font-black uppercase tracking-widest">No support tickets found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/20">
            <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />
            <h3 className="text-xl font-black tracking-tight mb-4 relative z-10">Administrative Policy</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 relative z-10">
              Refunds are only eligible for appointments that haven't been accepted or completed by the practitioner. Please allow 3-5 business days for bank processing.
            </p>
            <div className="space-y-4 relative z-10">
               <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Full reimbursement for cancelled slots
               </div>
               <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Encrypted bank detail handling
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
               <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Raise Support Ticket</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Registry Submission</p>
               </div>
               <button onClick={() => setShowCreateModal(false)} className="p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <ArrowRight className="w-5 h-5 text-slate-400" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
              <div className="space-y-6 p-2">
                <div className="space-y-3">
                   <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Enquiry Classification</label>
                   <div className="grid grid-cols-3 gap-3">
                      {(["TECHNICAL_PROBLEM", "REFUND", "OTHER"] as TicketCategory[]).map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                            category === cat 
                              ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" 
                              : "bg-white text-slate-600 border-slate-200 hover:border-blue-500"
                          }`}
                        >
                          {cat.replace('_', ' ')}
                        </button>
                      ))}
                   </div>
                </div>

                {category === "REFUND" && (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Select Eligible Appointment</label>
                      <select
                        value={selectedAppointmentId}
                        onChange={(e) => setSelectedAppointmentId(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
                        required
                      >
                        <option value="">-- Choose Appointment --</option>
                        {appointments.map(app => (
                          <option key={app.id} value={app.id}>
                            {new Date(app.appointmentTime).toLocaleDateString()} - Rs. {app.consultationFee.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Bank Name</label>
                          <div className="relative">
                             <Building className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                             <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Bank of Ceylon" className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 ring-blue-50 focus:border-blue-500 outline-none" required />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Branch Name</label>
                          <div className="relative">
                             <ArrowRight className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                             <input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="e.g. Colombo Fort" className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 ring-blue-50 focus:border-blue-500 outline-none" required />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Account Number</label>
                       <div className="relative">
                          <Hash className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="000123456789" className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 ring-blue-50 focus:border-blue-500 outline-none" required />
                       </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                   <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Subjective Narrative</label>
                   <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={category === 'REFUND' ? "Please state the reason for cancellation..." : "Describe the technical difficulty or query..."}
                    className="w-full rounded-[2.5rem] border border-slate-200 bg-slate-50 px-6 py-6 text-sm font-bold text-slate-900 focus:ring-4 ring-blue-50 focus:border-blue-200 outline-none transition-all min-h-[150px]"
                    required
                   />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-3xl shadow-2xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {submitting ? "Transmitting Registry Request..." : "Submit Professional Enquiry"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-full py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Discard Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: TicketStatus }) {
  const tones = {
    OPEN: "bg-blue-50 text-blue-700 border-blue-100",
    RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-100"
  };
  return (
    <span className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${tones[status]}`}>
      {status}
    </span>
  );
}
