import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateCase } from "@/lib/db";
import { PermitCase, AuditEntry, CaseStatus, AIDecision } from "@/lib/types";
import mockZones from "@/lib/mock_zones.json";
import { calculateBusinessDays } from "@/lib/utils";

// Ray casting algorithm for point-in-polygon check
function isPointInPolygon(point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]) {
  const x = point.lng;
  const y = point.lat;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Geocode using Nominatim API or fallback
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  // Check if address matches pre-seeded scenarios for perfect demo consistency
  const addrLower = address.toLowerCase();
  if (addrLower.includes("14 green valley")) {
    return { lat: 28.611, lng: 77.205 };
  } else if (addrLower.includes("42 green valley")) {
    return { lat: 28.613, lng: 77.206 };
  } else if (addrLower.includes("10 cbd plaza")) {
    return { lat: 28.615, lng: 77.225 };
  } else if (addrLower.includes("wetland") || addrLower.includes("reserve") || addrLower.includes("lake")) {
    // Falls into Protected Area (Nature Reserve)
    return { lat: 28.616, lng: 77.265 };
  }

  // Live geocoding call
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "GeoPermitAI/1.0 (contact@geopermitai.gov)"
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    }
  } catch (error) {
    console.error("Nominatim geocoding failed, using fallback:", error);
  }

  // Default fallback to Green Valley Residential
  return { lat: 28.611, lng: 77.205 };
}

// Query zoning details using Overpass API or local mock zones
async function queryZoning(lat: number, lng: number): Promise<{
  detected_zone: string;
  gis_source: string;
  gis_polygon_id: string;
}> {
  // 1. Try local mock zones first
  for (const zone of mockZones) {
    if (isPointInPolygon({ lat, lng }, zone.coordinates)) {
      return {
        detected_zone: zone.landuse,
        gis_source: "GeoPermit Local Zoning GIS",
        gis_polygon_id: `zone/${zone.id}`
      };
    }
  }

  // 2. Try live Overpass API
  try {
    const query = `[out:json][timeout:10];
    is_in(${lat},${lng})->.a;
    (
      way(pivot.a)[landuse];
      relation(pivot.a)[landuse];
    );
    out tags;`;
    
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "GeoPermitAI/1.0"
      }
    });

    if (response.ok) {
      const data = await response.json();
      for (const element of data.elements || []) {
        if (element.tags && element.tags.landuse) {
          return {
            detected_zone: element.tags.landuse,
            gis_source: "OpenStreetMap Overpass API",
            gis_polygon_id: `${element.type}/${element.id}`
          };
        }
      }
    }
  } catch (error) {
    console.error("Overpass API query failed:", error);
  }

  // Fallback to residential if not inside any specific polygon
  return {
    detected_zone: "residential",
    gis_source: "GeoPermit GIS Fallback",
    gis_polygon_id: "default/residential"
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      applicant_name,
      applicant_email,
      applicant_phone,
      permit_type,
      site_address,
      site_description,
      uploaded_documents = [] // list of filenames uploaded
    } = body;

    if (!applicant_name || !applicant_email || !permit_type || !site_address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const caseId = crypto.randomUUID();
    const createdAt = new Date();
    const slaDeadline = calculateBusinessDays(createdAt, 10);

    const auditLog: AuditEntry[] = [];
    
    // Stage 1: Intake Classifier Agent Simulation
    auditLog.push({
      timestamp: new Date(),
      actor: "Intake Classifier Agent",
      action: "Intake Parsed",
      details: `Received permit application. Applicant: ${applicant_name}, Type: ${permit_type}. Checked uploaded documents: [${uploaded_documents.join(", ")}].`
    });

    // Check required documents based on permit type
    const requiredDocs: Record<string, string[]> = {
      Residential: ["site_plan.pdf", "property_deed.pdf", "applicant_id.pdf"],
      Commercial: ["site_plan.pdf", "structural_cert.pdf", "applicant_id.pdf"],
      Industrial: ["site_plan.pdf", "eia_clearance.pdf", "structural_cert.pdf"],
      "Mixed-Use": ["site_plan.pdf", "property_deed.pdf", "structural_cert.pdf"],
      Renovation: ["site_plan.pdf", "applicant_id.pdf"],
      Demolition: ["site_plan.pdf", "demolition_plan.pdf"],
      Utility: ["site_plan.pdf", "utility_clearance.pdf"]
    };

    const expected = requiredDocs[permit_type] || ["site_plan.pdf"];
    const missingDocs = expected.filter(
      doc => !uploaded_documents.some((uploaded: string) => uploaded.toLowerCase().includes(doc.split(".")[0]))
    ).map(doc => doc.replace("_", " ").replace(".pdf", ""));

    if (missingDocs.length > 0) {
      auditLog.push({
        timestamp: new Date(),
        actor: "Intake Classifier Agent",
        action: "Missing Documents Flagged",
        details: `Identified missing documents required for ${permit_type}: ${missingDocs.join(", ")}.`
      });
    }

    // Stage 2: GIS Compliance Agent Execution
    const coords = await geocodeAddress(site_address);
    const zoningInfo = await queryZoning(coords.lat, coords.lng);
    
    // Zoning conflict rules logic
    const ALLOWED: Record<string, string[]> = {
      Residential: ["residential"],
      Commercial: ["commercial", "retail", "mixed_use"],
      Industrial: ["industrial"],
      "Mixed-Use": ["residential", "commercial", "mixed_use"],
      Renovation: ["residential", "commercial", "industrial"],
      Demolition: ["residential", "commercial", "industrial", "park"],
      Utility: ["residential", "commercial", "industrial"]
    };

    const allowedZones = ALLOWED[permit_type] || [];
    const zoneConflict = !allowedZones.includes(zoningInfo.detected_zone);
    const protectedArea = zoningInfo.detected_zone === "nature_reserve" || zoningInfo.detected_zone === "park";

    auditLog.push({
      timestamp: new Date(),
      actor: "GIS Compliance Agent",
      action: "GIS Compliance Checked",
      details: `Geocoded site coordinates to (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}). Detected zone: '${zoningInfo.detected_zone}'. Zone Conflict: ${zoneConflict}, Protected Area: ${protectedArea} (via ${zoningInfo.gis_source}).`
    });

    // Stage 3: Case Resolution Agent Execution
    let aiDecision: AIDecision = "AutoApprove";
    let aiConfidence = 0.95;
    let aiReasoning = "";

    if (protectedArea) {
      aiDecision = "EscalateHuman";
      aiConfidence = 0.98;
      aiReasoning = `CRITICAL: The proposed site is located within a protected Nature Reserve or Park zone. Construction is highly restricted. Case must be reviewed by the environmental planning board.`;
    } else if (zoneConflict) {
      aiDecision = "EscalateHuman";
      aiConfidence = 0.92;
      aiReasoning = `ZONING CONFLICT: The applicant requested a '${permit_type}' permit, but the GIS check indicates the site is in a '${zoningInfo.detected_zone}' zone. Commercial or industrial activities in residential areas require planning variance review.`;
    } else if (missingDocs.length > 0) {
      aiDecision = "RequestDocuments";
      aiConfidence = 0.90;
      aiReasoning = `INCOMPLETE APPLICATION: Zoning is compliant (requested '${permit_type}' in '${zoningInfo.detected_zone}' zone), but required documents are missing: ${missingDocs.join(", ")}.`;
    } else {
      aiDecision = "AutoApprove";
      aiConfidence = 0.95;
      aiReasoning = `COMPLIANT: Zoning is compliant (requested '${permit_type}' in '${zoningInfo.detected_zone}' zone), no environmental concerns, and all required documents are successfully attached.`;
    }

    auditLog.push({
      timestamp: new Date(),
      actor: "Case Resolution Agent",
      action: "Resolution Evaluated",
      details: `AI Decision: ${aiDecision} (Confidence: ${aiConfidence.toFixed(2)}). Reasoning: ${aiReasoning}`
    });

    // Stage 4 & 5: Determine final status, create tasks, or run Notification Bot
    let finalStatus: CaseStatus = "Intake";
    let assignedOfficer = "System Automated";

    if (aiDecision === "AutoApprove") {
      finalStatus = "Closed";
      
      // Simulating RPA Notification Bot
      auditLog.push({
        timestamp: new Date(),
        actor: "RPA Notification Bot",
        action: "Auto Approval Issued",
        details: `Zoning check passed automatically. Approval permit issued. Sent notification email to ${applicant_email}.`
      });
    } else if (aiDecision === "RequestDocuments") {
      finalStatus = "DocumentsRequested";
      
      auditLog.push({
        timestamp: new Date(),
        actor: "RPA Notification Bot",
        action: "Missing Docs Request Sent",
        details: `Emailed applicant at ${applicant_email} requesting: ${missingDocs.join(", ")}. Case status set to DocumentsRequested.`
      });
    } else if (aiDecision === "EscalateHuman") {
      finalStatus = "HumanReview";
      assignedOfficer = "Officer Sarah Jenkins";
      
      auditLog.push({
        timestamp: new Date(),
        actor: "Maestro Case Engine",
        action: "HITL Task Created",
        details: `Escalated to human review. Created task 'task-${crypto.randomUUID().slice(0,6)}' for ${assignedOfficer} (SLA: 5 business days).`
      });
    }

    const newCase: PermitCase = {
      case_id: caseId,
      created_at: createdAt,
      sla_deadline: slaDeadline,
      status: finalStatus,
      applicant_name,
      applicant_email,
      applicant_phone: applicant_phone || null,
      permit_type,
      site_address,
      site_lat: coords.lat,
      site_lng: coords.lng,
      documents: uploaded_documents.length > 0 ? uploaded_documents : ["submitted_form.pdf"],
      missing_docs: missingDocs,
      detected_zone: zoningInfo.detected_zone,
      requested_use: permit_type.toLowerCase(),
      zone_conflict: zoneConflict,
      protected_area: protectedArea,
      gis_source: zoningInfo.gis_source,
      gis_polygon_id: zoningInfo.gis_polygon_id,
      ai_decision: aiDecision,
      ai_confidence: aiConfidence,
      ai_reasoning: aiReasoning,
      assigned_officer: assignedOfficer,
      officer_decision: aiDecision === "AutoApprove" ? "Approved" : null,
      officer_notes: aiDecision === "AutoApprove" ? "System auto-approved." : "",
      audit_log: auditLog
    };

    const success = createOrUpdateCase(newCase);
    if (!success) {
      return NextResponse.json({ error: "Failed to save case to database" }, { status: 500 });
    }

    return NextResponse.json(newCase);
  } catch (error) {
    console.error("Error submitting permit:", error);
    return NextResponse.json({ error: "Failed to submit permit" }, { status: 500 });
  }
}
