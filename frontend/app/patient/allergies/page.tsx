"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Edit3,
  Activity,
  ShieldAlert,
  Users,
  Search,
  RefreshCw,
  X,
  ArrowRight,
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import {
  apiGetAuth,
  apiPostAuth,
  apiPutAuth,
  apiDeleteAuth,
  getToken,
} from "@/lib/api";

type AllergyType = "MEDICINE" | "FOOD" | "ENVIRONMENTAL";
type AllergySeverity = "MILD" | "MODERATE" | "SEVERE";

interface Allergy {
  id: string;
  allergen: string;
  type: AllergyType;
  severity: AllergySeverity;
  reaction: string;
}

interface AllergyForm {
  allergen: string;
  type: AllergyType;
  severity: AllergySeverity;
  reaction: string;
}

const ALLERGY_TYPES: AllergyType[] = ["MEDICINE", "FOOD", "ENVIRONMENTAL"];
const ALLERGY_SEVERITIES: AllergySeverity[] = ["MILD", "MODERATE", "SEVERE"];

export default function AllergiesPage() {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<AllergyForm>({
    allergen: "",
    type: "MEDICINE",
    severity: "MILD",
    reaction: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const token = getToken();

  const fetchAllergies = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiGetAuth<Allergy[]>("/patients/allergies", token);
      setAllergies(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load allergies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllergies();
    // eslint-disable-next-line
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    setForm({ allergen: "", type: "MEDICINE", severity: "MILD", reaction: "" });
    setEditingId(null);
    setFormOpen(true);
  };

  const handleEdit = (allergy: Allergy) => {
    setForm({
      allergen: allergy.allergen,
      type: allergy.type,
      severity: allergy.severity,
      reaction: allergy.reaction || "",
    });
    setEditingId(allergy.id);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Delete this clinical alert?")) return;
    try {
      await apiDeleteAuth(`/patients/allergies/${id}`, token);
      toast.success("Clinical alert revoked");
      fetchAllergies();
    } catch (err: any) {
      toast.error(err.message || "Deletion failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      if (editingId) {
        await apiPutAuth(`/patients/allergies/${editingId}`, form, token);
        toast.success("Clinic report synchronized");
      } else {
        await apiPostAuth(`/patients/allergies`, form, token);
        toast.success("New alert registered");
      }
      setFormOpen(false);
      fetchAllergies();
    } catch (err: any) {
      toast.error(err.message || "Registry synchronization failed");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-rose-500 transition-colors">Safety Protocols & Alerts</p>
            <h1 className="mt-3 text-4xl font-black text-slate-900 tracking-tight">Clinical Sensitivity Registry</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 leading-relaxed">
              Maintain an accurate ledger of your physiological sensitivities to ensure patient safety during procedural encounters and medication protocols.
            </p>
          </div>
          <button
            className="rounded-2xl bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3"
            onClick={handleAdd}
          >
            <Plus className="w-4 h-4" /> Register New Alert
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <MetricCard 
            title="Total Registered" 
            value={allergies.length} 
            subtitle="Identified Sensitivities" 
            icon={<ShieldAlert className="w-5 h-5 text-rose-500" />} 
          />
          <MetricCard 
            title="Dominant Type" 
            value={allergies.length ? allergies[0].type : "N/A"} 
            subtitle="Clinical Classification" 
            icon={<Activity className="w-5 h-5 text-blue-500" />} 
          />
          <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden group">
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-colors" />
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 relative z-10">Care Safety</p>
             <h3 className="mt-4 text-xl font-black tracking-tight relative z-10 leading-tight">Accurate allergies prevent adverse drug events.</h3>
             <p className="mt-4 text-xs font-medium text-slate-400 relative z-10 leading-relaxed">Always verify your allergy registry before scheduling surgery or high-risk diagnostic procedures.</p>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {loading ? (
             <div className="flex h-64 items-center justify-center rounded-[2.5rem] border border-slate-200 bg-white">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
             </div>
          ) : allergies.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center opacity-50 bg-white border border-slate-200 rounded-[2.5rem]">
               <LayoutDashboard className="w-16 h-16 text-slate-200 mb-6" />
               <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 tracking-[0.3em]">No Historical Alerts Recorded</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {allergies.map((a) => (
                <div key={a.id} className="group/item relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                         <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                         <p className="text-2xl font-black text-slate-900 tracking-tight">{a.allergen}</p>
                      </div>
                      <p className="text-sm font-medium text-slate-500 max-w-lg leading-relaxed italic">"{a.reaction || "No objective reaction recorded in safety protocol"}"</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">{a.type}</span>
                        <span className={`rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-widest ${
                          a.severity === 'SEVERE' ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200' : 'bg-white border-slate-200 text-slate-600'
                        }`}>{a.severity}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white hover:border-blue-200 transition-all active:scale-90"
                          onClick={() => handleEdit(a)}
                          title="Edit Alert"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white hover:border-rose-200 transition-all active:scale-90"
                          onClick={() => handleDelete(a.id)}
                          title="Revoke Alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl rounded-[3rem] border border-white/20 bg-white p-10 shadow-2xl space-y-10 relative overflow-hidden"
          >
            <button 
              type="button" 
              onClick={() => setFormOpen(false)}
              className="absolute right-8 top-8 p-3 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="h-14 w-14 rounded-[1.5rem] bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                 <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{editingId ? "Revise Identity Alert" : "Registry Official Alert"}</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">Provide high-fidelity clinical data to ensure patient safety.</p>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
               <FormInput
                  label="Physiological Allergen"
                  name="allergen"
                  value={form.allergen}
                  onChange={handleFormChange}
                  placeholder="e.g. Paracetamol, Peanuts"
                  required
                />
               <FormInput
                  label="Subjective Reaction"
                  name="reaction"
                  value={form.reaction}
                  onChange={handleFormChange}
                  placeholder="Objective clinical signs..."
                />
              <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Clinical Modality</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
                    required
                  >
                    {ALLERGY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
              </div>
              <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1">Risk Severity</label>
                  <select
                    name="severity"
                    value={form.severity}
                    onChange={handleFormChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none"
                    required
                  >
                    {ALLERGY_SEVERITIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-end">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-900 px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3"
                >
                  {editingId ? "Commit Synchronicity" : "Initialize Registration"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
          </form>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon }: { title: string; value: string | number; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
      <div className="flex flex-col h-full relative z-10">
        <div className="mb-6 h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:scale-110 shadow-sm transition-all duration-300">
           {icon}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tight leading-none truncate">{value}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 block">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function FormInput({ label, value, onChange, name, type = "text", required = false, disabled = false, placeholder, icon }: any) {
  return (
    <div className="space-y-2 group">
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 block px-1 group-focus-within:text-blue-500 transition-colors">
        {label}
      </label>
      <div className="relative">
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none disabled:opacity-50"
        />
      </div>
    </div>
  );
}

