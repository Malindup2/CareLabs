"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle2, Clock3, FileCheck2, ShieldAlert, XCircle } from "lucide-react";
import { apiGetAuth, apiPutAuth, clearAuth, getRole, getToken } from "@/lib/api";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Doctor {
  id: string;
  userId: string;
  fullName: string | null;
  specialty: string | null;
  qualification: string | null;
  verificationStatus: VerificationStatus;
  active: boolean;
  profileImageUrl?: string | null;
}

interface DoctorDocument {
  id: string;
  doctorId: string;
  documentUrl: string;
  type: "LICENSE" | "CERTIFICATE";
  status: VerificationStatus;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
}

export default function AdminDoctorApprovalPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [documents, setDocuments] = useState<DoctorDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const jwt = getToken();
    const role = getRole();

    if (!jwt || role !== "ADMIN") {
      toast.error("Please login as admin.");
      router.replace("/login");
      return;
    }

    setToken(jwt);
  }, [router]);

  const loadDoctors = async (jwt: string) => {
    const rows = await apiGetAuth<Doctor[]>("/doctors/admin/all", jwt);
    setDoctors(rows);

    const firstPending = rows.find((d) => d.verificationStatus === "PENDING");
    setSelectedDoctorId((current) => current || firstPending?.id || rows[0]?.id || "");
  };

  useEffect(() => {
    if (!token) return;

    const bootstrap = async () => {
      setLoading(true);
      try {
        await loadDoctors(token);
      } catch (err: unknown) {
        const e = err as { message?: string };
        toast.error(e.message || "Failed to load doctors for approval.");
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [token]);

  useEffect(() => {
    if (!token || !selectedDoctorId) {
      setDocuments([]);
      return;
    }

    const loadDocuments = async () => {
      setDocsLoading(true);
      try {
        const rows = await apiGetAuth<DoctorDocument[]>(`/doctors/admin/${selectedDoctorId}/documents`, token);
        setDocuments(rows);
      } catch (err: unknown) {
        const e = err as { message?: string };
        toast.error(e.message || "Unable to load doctor documents.");
        setDocuments([]);
      } finally {
        setDocsLoading(false);
      }
    };

    void loadDocuments();
  }, [selectedDoctorId, token]);

  const pendingDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.verificationStatus === "PENDING"),
    [doctors],
  );

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDoctorId) || null,
    [doctors, selectedDoctorId],
  );

  const handleVerify = async (status: "APPROVED" | "REJECTED") => {
    if (!token || !selectedDoctorId) return;

    if (status === "REJECTED" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    try {
      setActionLoading(true);
      const query = new URLSearchParams({ status });
      if (status === "REJECTED") {
        query.set("rejectionReason", rejectionReason.trim());
      }
      const updated = await apiPutAuth<Doctor>(`/doctors/${selectedDoctorId}/verify?${query.toString()}`, {}, token);
      setDoctors((prev) => prev.map((doctor) => (doctor.id === updated.id ? updated : doctor)));
      const rows = await apiGetAuth<DoctorDocument[]>(`/doctors/admin/${selectedDoctorId}/documents`, token);
      setDocuments(rows);
      if (status === "REJECTED") {
        setRejectionReason("");
      }
      toast.success(`Doctor ${status.toLowerCase()} successfully.`);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Verification action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-10 w-80 rounded-xl bg-slate-200 animate-pulse" />
          <div className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="h-96 rounded-2xl bg-slate-200 animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Doctor Approval</h1>
            <p className="text-slate-500 mt-1">Approve doctors first so they can start consultations, notes, and telemedicine sessions.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-sm font-bold">
              <Clock3 className="w-4 h-4" /> Pending: {pendingDoctors.length}
            </div>
            <button
              type="button"
              onClick={() => {
                clearAuth();
                router.replace("/login");
              }}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Doctors</h2>
            <div className="space-y-3 max-h-[30rem] overflow-y-auto pr-1">
              {doctors.map((doctor) => {
                const isSelected = selectedDoctorId === doctor.id;
                return (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => setSelectedDoctorId(doctor.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition ${isSelected ? "border-blue-300 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{doctor.fullName || "Pending Profile"}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{doctor.specialty || "Specialty pending"}</p>
                        <p className="text-xs text-slate-400 mt-1 font-mono">{doctor.id.slice(0, 8)}...</p>
                      </div>
                      <StatusBadge status={doctor.verificationStatus} />
                    </div>
                  </button>
                );
              })}
              {doctors.length === 0 && <p className="text-sm text-slate-500">No doctors found.</p>}
            </div>
          </section>

          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-5 space-y-5">
            {selectedDoctor ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {selectedDoctor.profileImageUrl ? (
                      <img src={selectedDoctor.profileImageUrl} alt="Doctor profile" className="h-16 w-16 rounded-full border border-slate-200 object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-full border border-slate-200 bg-slate-100 text-slate-600 grid place-items-center font-bold">
                        {(selectedDoctor.fullName || "DR").slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{selectedDoctor.fullName || "Pending Profile"}</h3>
                      <p className="text-sm text-slate-500">{selectedDoctor.qualification || "Qualification pending"}</p>
                    </div>
                  </div>
                  <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Rejection Reason (required for reject)</label>
                    <textarea
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Example: License document is not clear or expired"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleVerify("APPROVED")}
                      disabled={actionLoading || selectedDoctor.verificationStatus === "APPROVED"}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleVerify("REJECTED")}
                      disabled={actionLoading || selectedDoctor.verificationStatus === "REJECTED"}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-sm font-bold"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2"><FileCheck2 className="w-4 h-4 text-blue-600" /> Verification Documents</h4>
                  <div className="mt-3 space-y-2">
                    {docsLoading && <p className="text-sm text-slate-500">Loading documents...</p>}
                    {!docsLoading && documents.map((doc) => (
                      <div key={doc.id} className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{doc.type}</p>
                          <p className="text-xs text-slate-500">Status: {doc.status}</p>
                          <p className="text-xs text-slate-500">Reviewed by: {doc.reviewedBy || "-"}</p>
                          <p className="text-xs text-slate-500">Reason: {doc.rejectionReason || "-"}</p>
                        </div>
                        <a href={doc.documentUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-700 underline">
                          Open document
                        </a>
                      </div>
                    ))}
                    {!docsLoading && documents.length === 0 && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> No verification documents uploaded for this doctor yet.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a doctor from the list to review and approve.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: VerificationStatus }) {
  const style =
    status === "APPROVED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "REJECTED"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  return <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${style}`}>{status}</span>;
}
