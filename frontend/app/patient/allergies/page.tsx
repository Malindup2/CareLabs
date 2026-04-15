"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
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
    if (!window.confirm("Delete this allergy?")) return;
    try {
      await apiDeleteAuth(`/patients/allergies/${id}`, token);
      toast.success("Allergy deleted");
      fetchAllergies();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      if (editingId) {
        await apiPutAuth(`/patients/allergies/${editingId}`, form, token);
        toast.success("Allergy updated");
      } else {
        await apiPostAuth(`/patients/allergies`, form, token);
        toast.success("Allergy added");
      }
      setFormOpen(false);
      fetchAllergies();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Allergy Management</p>
            <h1 className="mt-3 text-3xl font-black text-slate-900 tracking-tight">Keep track of your sensitivities</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Add, edit, and review your allergy history with an easy-to-scan layout optimized for patient care.
            </p>
          </div>
          <button
            className="rounded-2xl bg-blue-600 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
            onClick={handleAdd}
          >
            Add Allergy
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Summary</p>
          <div className="mt-6 grid gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total allergies</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{allergies.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Most common type</p>
              <p className="mt-2 text-lg font-bold text-slate-900">{allergies.length ? allergies[0].type : "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm text-slate-500">Loading...</div>
          ) : allergies.length === 0 ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm text-slate-500">
              No allergies recorded yet. Add one to keep your healthcare team informed.
            </div>
          ) : (
            <div className="space-y-4">
              {allergies.map((a) => (
                <div key={a.id} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-xl font-black text-slate-900">{a.allergen}</p>
                      <p className="mt-2 text-sm text-slate-500">{a.reaction || "No reaction details provided."}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{a.type}</span>
                      <span className="rounded-full bg-white border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{a.severity}</span>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                      className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-700 transition-all"
                      onClick={() => handleEdit(a)}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-2xl bg-rose-100 px-4 py-2 text-xs font-bold uppercase tracking-widest text-rose-700 hover:bg-rose-200 transition-all"
                      onClick={() => handleDelete(a.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4 py-6">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-xl rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{editingId ? "Edit Allergy" : "Add Allergy"}</h2>
                <p className="mt-2 text-sm text-slate-500">Add or update an allergy record for your medical profile.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Allergen</span>
                <input
                  name="allergen"
                  value={form.allergen}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-[2rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Reaction</span>
                <input
                  name="reaction"
                  value={form.reaction}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-[2rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  placeholder="Optional"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Type</span>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-[2rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  required
                >
                  {ALLERGY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Severity</span>
                <select
                  name="severity"
                  value={form.severity}
                  onChange={handleFormChange}
                  className="mt-2 w-full rounded-[2rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  required
                >
                  {ALLERGY_SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-8 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-2xl border border-slate-200 bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                {editingId ? "Update Allergy" : "Add Allergy"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
