"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  ShieldAlert, 
  MessageSquare,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { PermitCase } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import GISMap from "@/components/maps/GISMap";
import SLATimer from "@/components/ui/SLATimer";

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [permitCase, setPermitCase] = useState<PermitCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<"Approved" | "Rejected" | "MoreInfoRequired" | "">("");
  const [notes, setNotes] = useState("");

  const fetchCaseDetails = async () => {
    try {
      const res = await fetch(`/api/cases/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setPermitCase(data);
      } else {
        alert("Case not found");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching case details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseDetails();
  }, [params.id]);

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision) {
      alert("Please select a decision");
      return;
    }
    if (notes.length < 10) {
      alert("Please enter at least 10 characters of justification notes.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/cases/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          notes,
          officer_name: "Officer Sarah Jenkins"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setPermitCase(data);
        setDecision("");
        setNotes("");
        alert(`Decision successfully recorded. Case updated to ${data.status}.`);
      } else {
        alert("Failed to submit decision");
      }
    } catch (error) {
      console.error("Error submitting decision:", error);
      alert("Failed to submit decision");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
          <p className="text-sm">Retrieving case record...</p>
        </div>
      </div>
    );
  }

  if (!permitCase) return null;

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Closed":
      case "Approved":
        return "bg-green-950/40 text-green-400 border-green-900";
      case "Rejected":
        return "bg-red-950/40 text-red-400 border-red-900";
      case "HumanReview":
        return "bg-amber-950/40 text-amber-400 border-amber-900 animate-pulse";
      case "DocumentsRequested":
        return "bg-blue-950/40 text-blue-400 border-blue-900";
      default:
        return "bg-slate-900 text-slate-400 border-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Header Links */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <span className="text-xs text-slate-500 font-mono">Case Reference: {permitCase.case_id}</span>
        </div>

        {/* Title Area */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 border-b border-slate-900 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold text-white">{permitCase.applicant_name}</h1>
              <span className={`text-xs uppercase font-bold tracking-wider px-2.5 py-1 border rounded-full ${getStatusBadgeStyle(permitCase.status)}`}>
                {permitCase.status === "Closed" && permitCase.officer_decision ? permitCase.officer_decision : permitCase.status}
              </span>
            </div>
            <p className="text-slate-400 mt-1 text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" /> {permitCase.site_address}
            </p>
          </div>

          <SLATimer deadline={permitCase.sla_deadline} status={permitCase.status} />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT PANEL: Case Details */}
          <div className="flex flex-col gap-6">
            
            {/* Applicant Profile */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" /> Applicant Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-900">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="text-[10px] text-slate-500">Email Address</div>
                    <a href={`mailto:${permitCase.applicant_email}`} className="text-slate-200 hover:underline font-semibold">{permitCase.applicant_email}</a>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-900">
                  <Phone className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="text-[10px] text-slate-500">Phone Number</div>
                    <div className="text-slate-200 font-semibold">{permitCase.applicant_phone || "Not provided"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-900">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="text-[10px] text-slate-500">Submission Date</div>
                    <div className="text-slate-200 font-semibold">{new Date(permitCase.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Parameters */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-850 pb-3">
                Zoning & Permit Specifics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                  <div className="text-[10px] text-slate-500">Requested Permit</div>
                  <div className="text-indigo-400 font-bold mt-0.5">{permitCase.permit_type}</div>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                  <div className="text-[10px] text-slate-500">GIS Detected Zone</div>
                  <div className="text-slate-200 font-bold mt-0.5 capitalize">{permitCase.detected_zone}</div>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                  <div className="text-[10px] text-slate-500">Zoning Conflict</div>
                  <div className={`font-bold mt-0.5 ${permitCase.zone_conflict ? "text-rose-400" : "text-green-400"}`}>
                    {permitCase.zone_conflict ? "Yes (Variance Needed)" : "No Conflict"}
                  </div>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-900">
                  <div className="text-[10px] text-slate-500">Protected Area</div>
                  <div className={`font-bold mt-0.5 ${permitCase.protected_area ? "text-rose-400 animate-pulse" : "text-slate-400"}`}>
                    {permitCase.protected_area ? "Protected Zone" : "Standard Zone"}
                  </div>
                </div>
              </div>

              {/* Documents Checklist */}
              <div className="mt-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Intake Files Checklist</h4>
                <div className="flex flex-col gap-2">
                  {permitCase.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-900 rounded-xl text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="font-semibold text-slate-300">{doc}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-950/40 border border-green-900 text-green-400 font-medium">Uploaded</span>
                    </div>
                  ))}

                  {permitCase.missing_docs.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-950/10 border border-red-950/20 rounded-xl text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-rose-500/80" />
                        <span className="font-semibold text-rose-300">{doc}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/40 border border-red-900 text-red-400 font-medium animate-pulse">Missing</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Advisor Panel */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-500/10 border-l border-b border-indigo-900 px-3.5 py-1.5 rounded-bl-xl text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                Agent 3 recommendation
              </div>

              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4.5 h-4.5 text-indigo-400" /> AI Advisor Recommendation
              </h3>
              
              <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-xs text-slate-500 font-semibold">Suggested Action</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500">Confidence: {(permitCase.ai_confidence * 100).toFixed(0)}%</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      permitCase.ai_decision === "AutoApprove" 
                        ? "bg-green-950 text-green-400 border border-green-800" 
                        : permitCase.ai_decision === "RequestDocuments" 
                        ? "bg-red-950 text-red-400 border border-red-800" 
                        : "bg-amber-950 text-amber-400 border border-amber-800"
                    }`}>
                      {permitCase.ai_decision}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {permitCase.ai_reasoning}
                </p>
              </div>
            </div>

            {/* Audit Logs */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-850 pb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Maestro Case Process Audit Trail
              </h3>

              <div className="flex flex-col gap-4 pl-1">
                {permitCase.audit_log.map((log, idx) => (
                  <div key={idx} className="flex gap-3 text-xs relative">
                    {idx < permitCase.audit_log.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-[-20px] w-[1.5px] bg-slate-800" />
                    )}
                    
                    <div className={`w-[24px] h-[24px] rounded-full shrink-0 border flex items-center justify-center font-bold text-[9px] ${
                      log.actor === "RPA Notification Bot" 
                        ? "bg-green-950 border-green-800 text-green-400" 
                        : log.actor === "GIS Compliance Agent" 
                        ? "bg-blue-950 border-blue-800 text-blue-400"
                        : log.actor.includes("Officer") 
                        ? "bg-amber-950 border-amber-800 text-amber-400"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}>
                      {log.actor.slice(0, 1)}
                    </div>
                    
                    <div className="flex-1 bg-slate-950/40 border border-slate-900 p-3 rounded-xl">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-900 pb-1.5 mb-1.5">
                        <span className="font-bold text-slate-200">{log.actor}</span>
                        <span className="text-[9px] text-slate-500">{formatDateTime(log.timestamp)}</span>
                      </div>
                      <div className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider mb-1">{log.action}</div>
                      <p className="text-slate-400 leading-relaxed text-[11px]">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Interactive GIS Map & HITL Action */}
          <div className="flex flex-col gap-6 sticky top-6">
            
            {/* GIS Map */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-slate-850 pb-3">
                <span>Spatial Zoning Validation</span>
                <span className="text-[10px] text-slate-500 normal-case font-medium">Source: {permitCase.gis_source}</span>
              </h3>
              
              <div className="w-full h-[380px]">
                <GISMap
                  lat={permitCase.site_lat}
                  lng={permitCase.site_lng}
                  detectedZone={permitCase.detected_zone}
                  zoneConflict={permitCase.zone_conflict}
                  protectedArea={permitCase.protected_area}
                />
              </div>
              
              <div className="text-[10px] text-slate-500 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 flex justify-between font-mono">
                <span>Polygon Ref: {permitCase.gis_polygon_id}</span>
                <span>Lat/Lng: {permitCase.site_lat.toFixed(4)}, {permitCase.site_lng.toFixed(4)}</span>
              </div>
            </div>

            {/* Officer Action Tasks (Human-in-the-loop) */}
            {permitCase.status === "HumanReview" && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl ring-2 ring-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500/15 border-l border-b border-amber-900 px-3.5 py-1.5 rounded-bl-xl text-[10px] text-amber-400 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Action Required (HITL)
                </div>

                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4.5 h-4.5 text-amber-400" /> Officer Review Panel
                </h3>

                <form onSubmit={handleSubmitDecision} className="flex flex-col gap-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Evaluate the zoning conflict detected above and record the final municipal decision. Your inputs will update the Maestro case and trigger the RPA notification bot.
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setDecision("Approved")}
                      className={`py-3.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                        decision === "Approved"
                          ? "bg-green-950 border-green-500 text-green-400 shadow-lg"
                          : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400"
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" /> Approve Permit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision("Rejected")}
                      className={`py-3.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                        decision === "Rejected"
                          ? "bg-red-950 border-red-500 text-red-400 shadow-lg"
                          : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400"
                      }`}
                    >
                      <XCircle className="w-5 h-5" /> Reject Permit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision("MoreInfoRequired")}
                      className={`py-3.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-2 cursor-pointer ${
                        decision === "MoreInfoRequired"
                          ? "bg-blue-950 border-blue-500 text-blue-400 shadow-lg"
                          : "bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400"
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5" /> Request Info
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Justification & Notes * (min. 10 chars)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Explain your decision rationale..."
                      rows={4}
                      required
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-indigo-500 transition-colors text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !decision}
                    className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 active:scale-[0.99] transition-all py-3 rounded-xl text-slate-950 font-bold text-xs tracking-wider shadow-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Submit Decision to Maestro
                  </button>
                </form>
              </div>
            )}

            {/* Decision Notes Display (If Closed/Completed) */}
            {permitCase.status === "Closed" && permitCase.officer_decision && (
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-850 pb-3 flex items-center gap-2">
                  {permitCase.officer_decision === "Approved" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  )}
                  <span>Official Municipal Decision Record</span>
                </h3>
                
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Assigned Reviewer:</span>
                    <span className="font-semibold text-slate-200">{permitCase.assigned_officer}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Final Decision:</span>
                    <span className={`font-bold ${permitCase.officer_decision === "Approved" ? "text-green-400" : "text-rose-400"}`}>
                      {permitCase.officer_decision}
                    </span>
                  </div>
                  
                  <div className="mt-3 bg-slate-950/60 p-4 rounded-xl border border-slate-900">
                    <div className="text-[10px] text-slate-500 mb-1.5 uppercase font-semibold">Decision notes & justification</div>
                    <p className="text-slate-300 italic font-medium leading-relaxed">
                      "{permitCase.officer_notes}"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
