"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { PermitType } from "@/lib/types";

export default function SubmitPermitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // For the simulated agent processing popup
  const [showProcessing, setShowProcessing] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState<PermitType>("Residential");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const availableFiles = [
    { id: "site_plan.pdf", label: "Site Layout Plan" },
    { id: "property_deed.pdf", label: "Property Title Deed" },
    { id: "structural_cert.pdf", label: "Structural Safety Certificate" },
    { id: "applicant_id.pdf", label: "Applicant Identity Verification" },
    { id: "neighbor_noc.pdf", label: "No-Objection Certificate (Neighbor)" },
    { id: "eia_clearance.pdf", label: "Environmental Impact Clearance" }
  ];

  const handleFileToggle = (fileId: string) => {
    if (uploadedFiles.includes(fileId)) {
      setUploadedFiles(uploadedFiles.filter(f => f !== fileId));
    } else {
      setUploadedFiles([...uploadedFiles, fileId]);
    }
  };

  // Quick fill buttons for demo scenarios
  const quickFill = (scenario: number) => {
    if (scenario === 1) {
      setName("Rahul Sharma");
      setEmail("rahul.sharma@example.com");
      setPhone("+91 98765 43210");
      setType("Residential");
      setAddress("14 Green Valley Rd, New Delhi");
      setDescription("Proposed residential backyard extension and construction of a two-car garage.");
      setUploadedFiles(["site_plan.pdf", "property_deed.pdf", "structural_cert.pdf", "applicant_id.pdf"]);
    } else if (scenario === 2) {
      setName("TechCorp Ltd");
      setEmail("contact@techcorp.com");
      setPhone("+91 99999 88888");
      setType("Commercial");
      setAddress("42 Green Valley Rd, New Delhi");
      setDescription("Construction of a three-story commercial office building with basement parking.");
      setUploadedFiles(["site_plan.pdf", "structural_cert.pdf", "applicant_id.pdf"]);
    } else if (scenario === 3) {
      setName("BuildCo Developers");
      setEmail("info@buildco.in");
      setPhone("+91 91111 22222");
      setType("Commercial");
      setAddress("10 CBD Plaza, New Delhi");
      setDescription("Renovation and expansion of existing commercial building facade and retail lobby.");
      setUploadedFiles(["structural_cert.pdf"]); // missing site plan & NOC
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !address || !description) {
      alert("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    setShowProcessing(true);
    setCurrentStep(1);

    try {
      // Step 1: Simulated Intake Classifier Agent (Delay 1.5s)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentStep(2);

      // Step 2: Simulated GIS Agent (Delay 2s)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep(3);

      // Step 3: Simulated Case Resolution Advisor (Delay 1.5s)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setCurrentStep(4);

      // Call actual API
      const res = await fetch("/api/permits/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicant_name: name,
          applicant_email: email,
          applicant_phone: phone,
          permit_type: type,
          site_address: address,
          site_description: description,
          uploaded_documents: uploadedFiles
        })
      });

      if (!res.ok) throw new Error("API call failed");

      const data = await res.json();
      setCreatedCaseId(data.case_id);
      setAiResult(data);
      setCurrentStep(5);
    } catch (err) {
      console.error(err);
      alert("Error submitting permit application.");
      setShowProcessing(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 text-stone-800 flex flex-col items-center py-12 px-4 relative">{/* Background removed */}

      <div className="w-full max-w-4xl z-10">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-stone-600 hover:text-orange-600 mb-8 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-black tracking-tight text-orange-600">
            Submit Permit Application
          </h1>
          <p className="text-stone-600 mt-2 text-md">
            Fill out the form below. AI agents will evaluate landuse compliance instantly.
          </p>
        </div>

        {/* Quick Fill Scenarios Card */}
        <div className="bg-white border-2 border-orange-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-600" /> Demo Quick-Fill Scenarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => quickFill(1)}
              type="button"
              className="p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-300 rounded-xl text-left transition-all group"
            >
              <div className="font-semibold text-green-700 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                S1: Clean Approval →
              </div>
              <p className="text-xs text-green-600 mt-1">Residential permit in residential zone. Fully compliant.</p>
            </button>
            <button
              onClick={() => quickFill(2)}
              type="button"
              className="p-4 bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-300 rounded-xl text-left transition-all group"
            >
              <div className="font-semibold text-amber-700 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                S2: Zone Conflict (HITL) →
              </div>
              <p className="text-xs text-amber-600 mt-1">Commercial building in residential zone. Escalates to officer.</p>
            </button>
            <button
              onClick={() => quickFill(3)}
              type="button"
              className="p-4 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 hover:border-rose-300 rounded-xl text-left transition-all group"
            >
              <div className="font-semibold text-rose-700 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                S3: Missing Documents →
              </div>
              <p className="text-xs text-rose-600 mt-1">Commercial zone but missing site plans & approvals.</p>
            </button>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          {/* Left Side: Text Fields */}
          <div className="bg-white border-2 border-orange-200 rounded-2xl p-8 shadow-sm flex flex-col gap-6">
            <h3 className="text-lg font-semibold text-stone-800 border-b-2 border-orange-100 pb-3">Applicant & Project Details</h3>
            
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full bg-white border-2 border-orange-200 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 transition-colors text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  required
                  className="w-full bg-white border-2 border-orange-200 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-white border-2 border-orange-200 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 transition-colors text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Permit Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as PermitType)}
                  className="w-full bg-white border-2 border-orange-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:border-orange-400 transition-colors text-sm"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Mixed-Use">Mixed-Use</option>
                  <option value="Renovation">Renovation</option>
                  <option value="Demolition">Demolition</option>
                  <option value="Utility">Utility</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Site Address *</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 14 Green Valley Rd, New Delhi"
                  required
                  className="w-full bg-white border-2 border-orange-200 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Detailed Work Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of the proposed project..."
                required
                rows={4}
                className="w-full bg-white border-2 border-orange-200 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-orange-400 transition-colors text-sm resize-none"
              />
            </div>
          </div>

          {/* Right Side: Document Uploads & Actions */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border-2 border-orange-200 rounded-2xl p-8 shadow-sm flex-1 flex flex-col gap-6">
              <h3 className="text-lg font-semibold text-stone-800 border-b-2 border-orange-100 pb-3 flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-600" /> Document Intake Checklist
              </h3>
              
              <p className="text-xs text-stone-600">
                Select documents to include with your application submission. Missing mandatory records will trigger document correction loops.
              </p>

              <div className="flex-1 flex flex-col gap-3">
                {availableFiles.map((file) => {
                  const isUploaded = uploadedFiles.includes(file.id);
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => handleFileToggle(file.id)}
                      className={`flex items-center justify-between p-4 border-2 rounded-xl transition-all text-left ${
                        isUploaded
                          ? "bg-orange-50 border-orange-400 text-orange-800 shadow-sm"
                          : "bg-white border-orange-200 text-stone-600 hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className={`w-5 h-5 ${isUploaded ? "text-orange-600" : "text-stone-400"}`} />
                        <div>
                          <div className="text-sm font-semibold">{file.label}</div>
                          <div className="text-[10px] text-stone-500">{file.id}</div>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isUploaded ? "border-orange-600 bg-orange-100 text-orange-600" : "border-orange-200 bg-white"
                      }`}>
                        {isUploaded && <span className="text-[10px] font-bold">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition-all py-4 rounded-xl text-white font-bold tracking-wide shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Submit Permit for Orchestration
            </button>
          </div>
        </form>
      </div>

      {/* Simulated Agent Pipeline Overlay */}
      {showProcessing && (
        <div className="fixed inset-0 bg-stone-900/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-orange-200 rounded-3xl p-8 max-w-xl w-full shadow-xl relative overflow-hidden flex flex-col gap-6">
            {/* Top border */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-orange-500" />
            
            <h2 className="text-xl font-bold text-center text-orange-600">
              UiPath Maestro Orchestrator Active
            </h2>

            <div className="flex flex-col gap-4">
              {/* Step 1: Intake */}
              <div className={`flex items-start gap-4 p-3 rounded-xl transition-all border-2 ${
                currentStep > 1 ? "bg-green-50 text-green-700 border-green-200" : currentStep === 1 ? "bg-blue-50 text-blue-700 border-blue-200" : "opacity-40 border-stone-200"
              }`}>
                {currentStep > 1 ? (
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-green-600 mt-0.5" />
                ) : currentStep === 1 ? (
                  <Loader2 className="w-6 h-6 shrink-0 animate-spin mt-0.5" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-stone-300 bg-white shrink-0 flex items-center justify-center text-xs text-stone-600">1</div>
                )}
                <div>
                  <h4 className="font-bold text-sm">Agent 1: Intake Classifier Agent</h4>
                  <p className="text-xs text-stone-600 mt-1">Reading permit fields and checking mandatory attachments checklist.</p>
                </div>
              </div>

              {/* Step 2: GIS Check */}
              <div className={`flex items-start gap-4 p-3 rounded-xl transition-all border-2 ${
                currentStep > 2 ? "bg-green-50 text-green-700 border-green-200" : currentStep === 2 ? "bg-blue-50 text-blue-700 border-blue-200" : "opacity-40 border-stone-200"
              }`}>
                {currentStep > 2 ? (
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-green-600 mt-0.5" />
                ) : currentStep === 2 ? (
                  <Loader2 className="w-6 h-6 shrink-0 animate-spin mt-0.5" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-stone-300 bg-white shrink-0 flex items-center justify-center text-xs text-stone-600">2</div>
                )}
                <div>
                  <h4 className="font-bold text-sm">Agent 2: GIS Compliance Agent</h4>
                  <p className="text-xs text-stone-600 mt-1">Geocoding site address, mapping coordinates, and querying landuse zoning tag via Overpass API.</p>
                </div>
              </div>

              {/* Step 3: Resolution Advisor */}
              <div className={`flex items-start gap-4 p-3 rounded-xl transition-all border-2 ${
                currentStep > 3 ? "bg-green-50 text-green-700 border-green-200" : currentStep === 3 ? "bg-blue-50 text-blue-700 border-blue-200" : "opacity-40 border-stone-200"
              }`}>
                {currentStep > 3 ? (
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-green-600 mt-0.5" />
                ) : currentStep === 3 ? (
                  <Loader2 className="w-6 h-6 shrink-0 animate-spin mt-0.5" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-stone-300 bg-white shrink-0 flex items-center justify-center text-xs text-stone-600">3</div>
                )}
                <div>
                  <h4 className="font-bold text-sm">Agent 3: Case Resolution Agent</h4>
                  <p className="text-xs text-stone-600 mt-1">Evaluating compliance matrices and compiling routing recommendations.</p>
                </div>
              </div>

              {/* Step 4: Finished/Decision */}
              <div className={`flex items-start gap-4 p-3 rounded-xl transition-all border-2 ${
                currentStep >= 5 ? "bg-green-50 text-green-700 border-green-200" : currentStep === 4 ? "bg-blue-50 text-blue-700 border-blue-200" : "opacity-40 border-stone-200"
              }`}>
                {currentStep >= 5 ? (
                  <CheckCircle2 className="w-6 h-6 shrink-0 text-green-600 mt-0.5" />
                ) : currentStep === 4 ? (
                  <Loader2 className="w-6 h-6 shrink-0 animate-spin mt-0.5" />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-stone-300 bg-white shrink-0 flex items-center justify-center text-xs text-stone-600">4</div>
                )}
                <div>
                  <h4 className="font-bold text-sm">Agent 4: RPA Notification / Human Center</h4>
                  <p className="text-xs text-stone-600 mt-1">Triggering notifications and dispatching exception cases to human-in-the-loop queue.</p>
                </div>
              </div>
            </div>

            {/* Results Display */}
            {currentStep === 5 && aiResult && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 animate-fade-in flex flex-col gap-3 mt-2">
                <div className="flex items-center justify-between border-b-2 border-orange-100 pb-2">
                  <span className="text-xs text-stone-600 font-semibold uppercase tracking-wider">Evaluation Result</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase border-2 ${
                    aiResult.ai_decision === "AutoApprove" 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : aiResult.ai_decision === "RequestDocuments" 
                      ? "bg-rose-50 text-rose-700 border-rose-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {aiResult.ai_decision}
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  {aiResult.ai_reasoning}
                </p>
                
                {aiResult.missing_docs && aiResult.missing_docs.length > 0 && (
                  <div className="text-xs text-rose-700 flex items-start gap-1 bg-rose-50 p-2 rounded-lg border-2 border-rose-200">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Missing Docs: </span>
                      {aiResult.missing_docs.join(", ")}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Link
                    href={`/track?id=${createdCaseId}`}
                    className="py-2.5 bg-white hover:bg-orange-50 border-2 border-orange-300 text-orange-700 rounded-xl text-center text-xs font-semibold"
                  >
                    Track Status (Citizen)
                  </Link>
                  <Link
                    href={`/cases/${createdCaseId}`}
                    className="py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-center text-xs font-semibold shadow-sm"
                  >
                    Review Case (Officer)
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
