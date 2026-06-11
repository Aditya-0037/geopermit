"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  MapPin, 
  Clock, 
  FileText, 
  AlertTriangle, 
  Loader2, 
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Building,
  Upload
} from "lucide-react";
import { PermitCase } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

function TrackStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const caseIdParam = searchParams.get("id") || "";
  
  const [caseId, setCaseId] = useState(caseIdParam);
  const [permitCase, setPermitCase] = useState<PermitCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolvingDocs, setResolvingDocs] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const fetchCase = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPermitCase(data);
      } else {
        setPermitCase(null);
        alert("Case ID not found in system registry");
      }
    } catch (error) {
      console.error(error);
      setPermitCase(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseIdParam) {
      setCaseId(caseIdParam);
      fetchCase(caseIdParam);
    }
  }, [caseIdParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;
    router.push(`/track?id=${caseId}`);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Closed":
      case "Approved":
        return "bg-green-50 text-green-700 border-green-200";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "HumanReview":
        return "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
      case "DocumentsRequested":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-stone-50 text-stone-700 border-stone-200";
    }
  };

  // Simulating uploading missing documents to clear the request
  const handleUploadMissingDocs = async () => {
    if (!permitCase) return;
    setResolvingDocs(true);

    try {
      // Simulate file upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Build updated case data
      const updatedCase: PermitCase = {
        ...permitCase,
        status: permitCase.ai_decision === "EscalateHuman" ? "HumanReview" : "Closed",
        documents: [...permitCase.documents, ...permitCase.missing_docs.map(d => `${d.replace(" ", "_")}.pdf`)],
        missing_docs: [],
        audit_log: [
          ...permitCase.audit_log,
          {
            timestamp: new Date(),
            actor: "Citizen Portal",
            action: "Missing Documents Uploaded",
            details: `Applicant uploaded required documents: [${permitCase.missing_docs.join(", ")}].`
          },
          {
            timestamp: new Date(new Date().getTime() + 1000),
            actor: "Maestro Case Engine",
            action: "Intake Checked Passed",
            details: `All mandatory checklist items are now satisfied. Transitioned status to ${
              permitCase.ai_decision === "EscalateHuman" ? "HumanReview" : "Closed"
            }.`
          }
        ]
      };

      // If zoning matches, we can auto-approve now!
      if (permitCase.ai_decision === "RequestDocuments" && !permitCase.zone_conflict && !permitCase.protected_area) {
        updatedCase.status = "Closed";
        updatedCase.officer_decision = "Approved";
        updatedCase.officer_notes = "System auto-approved following document resolution.";
        
        updatedCase.audit_log.push({
          timestamp: new Date(new Date().getTime() + 2000),
          actor: "RPA Notification Bot",
          action: "Case Closed",
          details: `Sent approval email to ${permitCase.applicant_email}. Permit registered.`
        });
      } else if (permitCase.ai_decision === "EscalateHuman" || permitCase.zone_conflict || permitCase.protected_area) {
        updatedCase.status = "HumanReview";
        updatedCase.assigned_officer = "Officer Sarah Jenkins";
        
        updatedCase.audit_log.push({
          timestamp: new Date(new Date().getTime() + 2000),
          actor: "Maestro Case Engine",
          action: "Review Task Reactivated",
          details: `HITL Action Task reactivated for Officer Sarah Jenkins.`
        });
      }

      // Save to server
      const res = await fetch(`/api/permits/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updatedCase,
          uploaded_documents: updatedCase.documents
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Overwrite standard submit to update the exact case ID
        // To update in db directly, let's call our cases PUT endpoint instead!
        const updateRes = await fetch(`/api/cases/${permitCase.case_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: updatedCase.status === "Closed" ? "Approved" : "MoreInfoRequired",
            notes: "Documents resubmitted by citizen.",
            officer_name: "Citizen Self-Service"
          })
        });

        // Let's reload case from DB to get latest exact audit trail
        await fetchCase(permitCase.case_id);
        alert("Documents uploaded successfully. Application resumed.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit documents");
    } finally {
      setResolvingDocs(false);
    }
  };

  return (
    <div className="w-full max-w-4xl z-10">
      {/* Back Link */}
      <Link href="/" className="inline-flex items-center gap-2 text-stone-600 hover:text-orange-600 mb-8 transition-colors text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-orange-600">
          Track Permit Application
        </h1>
        <p className="text-stone-600 mt-2 text-md">
          Search by case ID to track the real-time evaluation status.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 mb-8 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter 36-character UUID (e.g. c8d19760-449e-4c9f-8557-b08bc44b80b1)"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              required
              className="w-full bg-white border-2 border-orange-200 rounded-xl pl-12 pr-4 py-3.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 transition-colors text-sm font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 bg-orange-600 hover:bg-orange-700 rounded-xl text-white font-bold transition-all text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
          </button>
        </form>
      </div>

      {/* Results View */}
      {loading ? (
        <div className="bg-white border-2 border-orange-200 rounded-2xl p-20 text-center text-stone-500 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-2" />
          <p className="text-sm">Fetching case from registry...</p>
        </div>
      ) : permitCase ? (
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {/* Left Panel (2 cols): Stages and Details */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Case Summary */}
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b-2 border-orange-100 pb-3">
                <span className="text-orange-600 font-bold bg-orange-50 px-2.5 py-0.5 rounded border-2 border-orange-200 text-xs">
                  {permitCase.permit_type} Permit
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 border-2 rounded-full ${getStatusBadgeStyle(permitCase.status)}`}>
                  {permitCase.status === "Closed" && permitCase.officer_decision ? permitCase.officer_decision : permitCase.status}
                </span>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-stone-800">{permitCase.applicant_name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-1">
                  <MapPin className="w-4 h-4 text-stone-500 shrink-0" />
                  <span>{permitCase.site_address}</span>
                </div>
              </div>
            </div>

            {/* Stages Timeline */}
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-8 shadow-sm flex flex-col gap-6">
              <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-orange-600" /> Evaluation Pipeline Stages
              </h3>

              <div className="flex flex-col gap-6 relative pl-1">
                {/* Stage 1: Intake */}
                <TimelineStage 
                  num={1}
                  title="Stage 1: Application Intake"
                  desc="Intake Agent extracts applicant details, geocodes site, and validates attachments checklist."
                  completed={true}
                />

                {/* Stage 2: GIS Check */}
                <TimelineStage 
                  num={2}
                  title="Stage 2: GIS Compliance Check"
                  desc="GIS Coded Agent queries landuse polygons via OpenStreetMap to identify zoning rules."
                  completed={true}
                  badge={permitCase.zone_conflict ? "Exception Flagged" : "Zoning Compliant"}
                  badgeType={permitCase.zone_conflict ? "warning" : "success"}
                />

                {/* Stage 3: Resolution Advisor */}
                <TimelineStage 
                  num={3}
                  title="Stage 3: AI Case Resolution Advisor"
                  desc="Resolution Agent evaluates compliance criteria and computes routing action."
                  completed={true}
                  badge={permitCase.ai_decision}
                  badgeType={permitCase.ai_decision === "AutoApprove" ? "success" : "info"}
                />

                {/* Stage 4: Officer Review */}
                <TimelineStage 
                  num={4}
                  title="Stage 4: Municipal Officer Review"
                  desc="Human reviewer evaluates exception details and issues municipal decision."
                  completed={permitCase.status === "Closed"}
                  active={permitCase.status === "HumanReview"}
                  badge={permitCase.status === "Closed" && permitCase.officer_decision ? permitCase.officer_decision : permitCase.status === "HumanReview" ? "Pending Review" : "Bypassed (Auto)"}
                  badgeType={permitCase.officer_decision === "Approved" ? "success" : permitCase.officer_decision === "Rejected" ? "error" : permitCase.status === "HumanReview" ? "warning" : "info"}
                />

                {/* Stage 5: System Notification */}
                <TimelineStage 
                  num={5}
                  title="Stage 5: RPA Notification Dispatch"
                  desc="RPA Bot delivers legal permit certificates or missing info requests to the citizen."
                  completed={permitCase.status === "Closed" || permitCase.status === "DocumentsRequested"}
                  active={permitCase.status === "Closed" || permitCase.status === "DocumentsRequested"}
                />
              </div>
            </div>
          </div>

          {/* Right Panel (1 col): Alerts & Documents Loop */}
          <div className="flex flex-col gap-6">
            {/* Missing Documents Resolution Panel */}
            {permitCase.status === "DocumentsRequested" && (
              <div className="bg-white border-2 border-rose-300 rounded-2xl p-6 shadow-sm relative overflow-hidden ring-2 ring-rose-200">
                <div className="absolute top-0 right-0 bg-rose-50 border-l-2 border-b-2 border-rose-300 px-3.5 py-1.5 rounded-bl-xl text-[10px] text-rose-700 font-bold uppercase tracking-wider">
                  Action Required
                </div>

                <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5" /> Missing Documents
                </h3>

                <p className="text-xs text-stone-600 leading-relaxed mb-4">
                  Our intake classifier identified that the following mandatory documents are missing or invalid:
                </p>

                <div className="flex flex-col gap-2.5 mb-6">
                  {permitCase.missing_docs.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 p-3 bg-rose-50 border-2 border-rose-200 rounded-xl text-xs">
                      <FileText className="w-4 h-4 text-rose-600" />
                      <span className="font-semibold text-stone-800 uppercase text-[10px]">{doc}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleUploadMissingDocs}
                  disabled={resolvingDocs}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {resolvingDocs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload Missing Files & Resume
                </button>
              </div>
            )}

            {/* Audit Logs summary for citizen */}
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider border-b-2 border-orange-100 pb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" /> Tracking Logs
              </h3>
              
              <div className="flex flex-col gap-3 pr-1 max-h-[300px] overflow-y-auto">
                {permitCase.audit_log.slice().reverse().map((log, idx) => (
                  <div key={idx} className="text-[11px] p-3 bg-orange-50 border-2 border-orange-100 rounded-xl">
                    <div className="flex justify-between font-bold text-stone-800">
                      <span>{log.actor}</span>
                      <span className="text-[9px] text-stone-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[9px] text-orange-600 font-bold uppercase tracking-wider mt-0.5">{log.action}</div>
                    <p className="text-stone-600 mt-1.5 leading-relaxed">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : caseIdParam ? (
        <div className="bg-white border-2 border-orange-200 rounded-2xl p-20 text-center text-stone-500 shadow-sm">
          <AlertTriangle className="w-8 h-8 mx-auto text-rose-600 mb-2" />
          <p className="text-sm">No record found. Please verify the Case ID and try again.</p>
        </div>
      ) : (
        <div className="bg-white border-2 border-orange-200 rounded-2xl p-16 text-center text-stone-500 shadow-sm">
          <Building className="w-8 h-8 mx-auto text-stone-400 mb-2" />
          <p className="text-sm">Submit your ID above to trace permit status.</p>
        </div>
      )}
    </div>
  );
}

function TimelineStage({ 
  num, 
  title, 
  desc, 
  completed, 
  active = false,
  badge,
  badgeType = "info"
}: { 
  num: number; 
  title: string; 
  desc: string; 
  completed: boolean; 
  active?: boolean;
  badge?: string;
  badgeType?: "success" | "warning" | "error" | "info";
}) {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case "success": return "bg-green-50 text-green-700 border-green-200";
      case "warning": return "bg-amber-50 text-amber-700 border-amber-200";
      case "error": return "bg-rose-50 text-rose-700 border-rose-200";
      default: return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="flex gap-4 text-xs relative">
      {/* Connector Line */}
      {num < 5 && (
        <div className={`absolute left-[13px] top-7 bottom-[-24px] w-[2px] ${completed ? "bg-green-400" : "bg-orange-200"}`} />
      )}
      
      {/* Icon Bullet */}
      <div className={`w-[28px] h-[28px] rounded-full shrink-0 border-2 flex items-center justify-center font-bold text-xs z-10 ${
        completed 
          ? "bg-green-50 border-green-500 text-green-700" 
          : active 
          ? "bg-amber-50 border-amber-500 text-amber-700 animate-pulse" 
          : "bg-white border-orange-200 text-stone-500"
      }`}>
        {completed ? "✓" : num}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className={`font-bold ${completed ? "text-stone-800" : active ? "text-amber-700" : "text-stone-500"}`}>{title}</h4>
          {badge && (
            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border-2 rounded-full ${getBadgeStyle()}`}>
              {badge}
            </span>
          )}
        </div>
        <p className={`mt-1 leading-relaxed ${completed || active ? "text-stone-600" : "text-stone-400"}`}>{desc}</p>
      </div>
    </div>
  );
}

export default function TrackStatusPage() {
  return (
    <div className="min-h-screen bg-orange-50 text-stone-800 flex flex-col items-center py-12 px-4 relative overflow-hidden">
      <Suspense fallback={
        <div className="text-center text-stone-500 mt-20">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-600 mb-2" />
          <p className="text-sm">Loading tracker...</p>
        </div>
      }>
        <TrackStatusContent />
      </Suspense>
    </div>
  );
}
