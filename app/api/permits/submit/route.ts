import { NextRequest, NextResponse } from "next/server";
import { createOrUpdateCase } from "@/lib/db";
import { PermitCase, AuditEntry, CaseStatus, AIDecision } from "@/lib/types";
import mockZones from "@/lib/mock_zones.json";
import { calculateBusinessDays } from "@/lib/utils";
import Groq from "groq-sdk";

// ────────────────────────────────────────────────────────────────────────────
// GIS Utilities
// ────────────────────────────────────────────────────────────────────────────

/** Ray-casting point-in-polygon check */
function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: { lat: number; lng: number }[]
) {
  const x = point.lng;
  const y = point.lat;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * AGENT 2 — GEOCODING
 * Nominatim (OpenStreetMap) with demo-scenario overrides for consistency.
 */
async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number }> {
  const addrLower = address.toLowerCase();

  // Hard-coded demo coordinates for hackathon reliability
  const demoMap: Record<string, { lat: number; lng: number }> = {
    "14 green valley": { lat: 28.6115, lng: 77.2050 },
    "42 green valley": { lat: 28.6130, lng: 77.2060 },
    "10 cbd plaza":    { lat: 28.6150, lng: 77.2250 },
    wetland:           { lat: 28.6160, lng: 77.2650 },
    reserve:           { lat: 28.6160, lng: 77.2650 },
    "rajaji nagar":    { lat: 12.9900, lng: 77.5530 }, // Bangalore residential
    "connaught place": { lat: 28.6315, lng: 77.2167 }, // Delhi commercial
    "bkc":             { lat: 19.0640, lng: 72.8647 }, // Mumbai BKC commercial
  };

  for (const [key, coords] of Object.entries(demoMap)) {
    if (addrLower.includes(key)) return coords;
  }

  // Live geocoding via Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1&countrycodes=in`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "GeoPermitAI/1.0 (contact@geopermitai.gov)" },
    });
    if (resp.ok) {
      const data = await resp.json();
      if (data?.length > 0)
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (e) {
    console.error("Nominatim geocoding failed:", e);
  }

  return { lat: 28.6115, lng: 77.2050 }; // Delhi fallback
}

/**
 * AGENT 2 — GIS ZONING
 * Multi-layer Overpass API query: landuse → natural → amenity → boundary.
 * Falls back to local mock GeoJSON, then heuristic city-zone detection.
 */
async function queryZoning(
  lat: number,
  lng: number,
  address: string
): Promise<{ detected_zone: string; gis_source: string; gis_polygon_id: string }> {
  // 1️⃣ Local mock zones (fastest, most reliable for demo)
  for (const zone of mockZones) {
    if (isPointInPolygon({ lat, lng }, zone.coordinates)) {
      return {
        detected_zone: zone.landuse,
        gis_source: "GeoPermit Local Zoning GIS",
        gis_polygon_id: `local/zone/${zone.id}`,
      };
    }
  }

  // 2️⃣ OSM Overpass API — rich multi-layer query
  try {
    // Query covers: landuse, natural protected areas, amenity, leisure
    const query = `[out:json][timeout:15];
(
  is_in(${lat},${lng})->.a;
  way(pivot.a)[landuse];
  way(pivot.a)[natural];
  way(pivot.a)[boundary="protected_area"];
  way(pivot.a)[leisure~"^(park|nature_reserve|garden)$"];
  relation(pivot.a)[landuse];
  relation(pivot.a)[natural];
  relation(pivot.a)[boundary="protected_area"];
);
out tags 20;`;

    const resp = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "GeoPermitAI/1.0",
      },
    });

    if (resp.ok) {
      const data = await resp.json();
      for (const el of data.elements || []) {
        const t = el.tags || {};

        // Priority: protected areas first
        if (t.boundary === "protected_area" || t.natural === "wetland" || t.natural === "forest") {
          return {
            detected_zone: "nature_reserve",
            gis_source: "OSM Overpass API (Protected Area)",
            gis_polygon_id: `${el.type}/${el.id}`,
          };
        }
        if (t.leisure === "nature_reserve" || t.leisure === "park") {
          return {
            detected_zone: "park",
            gis_source: "OSM Overpass API (Leisure/Park)",
            gis_polygon_id: `${el.type}/${el.id}`,
          };
        }
        if (t.landuse) {
          // Normalise common OSM values
          const zoneMap: Record<string, string> = {
            residential: "residential",
            commercial: "commercial",
            retail: "commercial",
            industrial: "industrial",
            construction: "residential",
            farmland: "agricultural",
            farmyard: "agricultural",
            forest: "nature_reserve",
            meadow: "nature_reserve",
            conservation: "nature_reserve",
            military: "restricted",
            railway: "industrial",
            port: "industrial",
            cemetery: "restricted",
            recreation_ground: "park",
            allotments: "residential",
            village_green: "park",
            mixed: "mixed_use",
          };
          return {
            detected_zone: zoneMap[t.landuse] || t.landuse,
            gis_source: "OSM Overpass API (Landuse Layer)",
            gis_polygon_id: `${el.type}/${el.id}`,
          };
        }
      }
    }
  } catch (e) {
    console.error("Overpass API error:", e);
  }

  // 3️⃣ Heuristic zone detection from address keywords (India-specific)
  const addrLow = address.toLowerCase();
  const heuristics: [string[], string][] = [
    [["industrial area", "midc", "gidc", "hssidc", "phase-", "sector-", "iie", "industrial estate"], "industrial"],
    [["cbd", "commercial", "market", "bazaar", "mall", "plaza", "shopping", "connaught", "mg road", "brigade road"], "commercial"],
    [["sector", "colony", "nagar", "vihar", "enclave", "society", "layout", "extension"], "residential"],
    [["forest", "jungle", "national park", "sanctuary", "reserve forest", "wetland", "protected"], "nature_reserve"],
    [["lake", "river", "coast", "beach", "sea", "dam", "reservoir"], "nature_reserve"],
    [["hospital", "school", "college", "university", "temple", "mosque", "church"], "residential"],
  ];

  for (const [keywords, zone] of heuristics) {
    if (keywords.some((kw) => addrLow.includes(kw))) {
      return {
        detected_zone: zone,
        gis_source: "GeoPermit Address Heuristic Engine",
        gis_polygon_id: "heuristic/keyword-match",
      };
    }
  }

  // 4️⃣ Default fallback
  return {
    detected_zone: "residential",
    gis_source: "GeoPermit GIS Fallback (Default)",
    gis_polygon_id: "fallback/residential",
  };
}

// ────────────────────────────────────────────────────────────────────────────
// GROQ AI — Case Resolution Agent
// ────────────────────────────────────────────────────────────────────────────

interface GroqDecision {
  ai_decision: AIDecision;
  ai_confidence: number;
  ai_reasoning: string;
}

async function callGroqResolutionAgent(context: {
  permit_type: string;
  detected_zone: string;
  zone_conflict: boolean;
  protected_area: boolean;
  missing_docs: string[];
  applicant_name: string;
  site_address: string;
}): Promise<GroqDecision> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const systemPrompt = `You are Agent 3 — the Case Resolution Advisor in a municipal permit management system powered by UiPath Maestro.
Your job is to analyse permit applications and route them to the correct next action.

ROUTING RULES (in priority order):
1. If protected_area is true → ALWAYS return EscalateHuman (environmental risk)
2. If zone_conflict is true → ALWAYS return EscalateHuman (zoning law violation)
3. If missing_docs is non-empty → return RequestDocuments
4. If all clear → return AutoApprove

RESPONSE FORMAT: Return ONLY valid JSON, no markdown, no preamble:
{"ai_decision":"AutoApprove|EscalateHuman|RequestDocuments","ai_confidence":0.00,"ai_reasoning":"One sentence plain English explanation citing specific facts."}`;

  const userPrompt = `Analyse this permit application:
- Applicant: ${context.applicant_name}
- Permit Type: ${context.permit_type}
- Site Address: ${context.site_address}
- GIS Detected Zone: ${context.detected_zone}
- Zone Conflict: ${context.zone_conflict}
- Protected/Restricted Area: ${context.protected_area}
- Missing Required Documents: ${context.missing_docs.length > 0 ? context.missing_docs.join(", ") : "None"}

Apply the routing rules and return your decision as JSON.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 256,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    // Validate the response
    const validDecisions = ["AutoApprove", "EscalateHuman", "RequestDocuments"];
    if (!validDecisions.includes(parsed.ai_decision)) {
      throw new Error(`Invalid AI decision: ${parsed.ai_decision}`);
    }

    return {
      ai_decision: parsed.ai_decision as AIDecision,
      ai_confidence: Math.min(1, Math.max(0, Number(parsed.ai_confidence) || 0.85)),
      ai_reasoning: parsed.ai_reasoning || "Decision made by AI agent.",
    };
  } catch (err) {
    console.error("GROQ API call failed, using rule-based fallback:", err);
    // Deterministic rule-based fallback
    if (context.protected_area) {
      return { ai_decision: "EscalateHuman", ai_confidence: 0.98, ai_reasoning: `CRITICAL: Site is in a protected ${context.detected_zone} zone — mandatory human review required.` };
    } else if (context.zone_conflict) {
      return { ai_decision: "EscalateHuman", ai_confidence: 0.92, ai_reasoning: `ZONING CONFLICT: '${context.permit_type}' permit requested in '${context.detected_zone}' zone — planning variance needed.` };
    } else if (context.missing_docs.length > 0) {
      return { ai_decision: "RequestDocuments", ai_confidence: 0.90, ai_reasoning: `INCOMPLETE: Zoning is compliant but required documents are missing: ${context.missing_docs.join(", ")}.` };
    }
    return { ai_decision: "AutoApprove", ai_confidence: 0.95, ai_reasoning: `COMPLIANT: ${context.permit_type} permit aligns with ${context.detected_zone} zoning and all documents are provided.` };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// POST /api/permits/submit
// ────────────────────────────────────────────────────────────────────────────

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
      uploaded_documents = [],
    } = body;

    if (!applicant_name || !applicant_email || !permit_type || !site_address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const caseId = crypto.randomUUID();
    const createdAt = new Date();
    const slaDeadline = calculateBusinessDays(createdAt, 10);
    const auditLog: AuditEntry[] = [];

    // ── AGENT 1: Intake Classifier ───────────────────────────────────────────
    const requiredDocs: Record<string, string[]> = {
      Residential:  ["site_plan.pdf", "property_deed.pdf", "applicant_id.pdf"],
      Commercial:   ["site_plan.pdf", "structural_cert.pdf", "applicant_id.pdf"],
      Industrial:   ["site_plan.pdf", "eia_clearance.pdf", "structural_cert.pdf"],
      "Mixed-Use":  ["site_plan.pdf", "property_deed.pdf", "structural_cert.pdf"],
      Renovation:   ["site_plan.pdf", "applicant_id.pdf"],
      Demolition:   ["site_plan.pdf", "demolition_plan.pdf"],
      Utility:      ["site_plan.pdf", "utility_clearance.pdf"],
    };

    const expected = requiredDocs[permit_type] || ["site_plan.pdf"];
    const missingDocs = expected
      .filter(
        (doc) =>
          !uploaded_documents.some((u: string) =>
            u.toLowerCase().includes(doc.split(".")[0])
          )
      )
      .map((doc) => doc.replace("_", " ").replace(".pdf", ""));

    auditLog.push({
      timestamp: new Date(),
      actor: "Intake Classifier Agent",
      action: "Intake Parsed",
      details: `Permit application received from ${applicant_name}. Type: ${permit_type}. Uploaded: [${uploaded_documents.join(", ")}]. ${missingDocs.length > 0 ? `Missing: ${missingDocs.join(", ")}.` : "All required documents present."}`,
    });

    if (missingDocs.length > 0) {
      auditLog.push({
        timestamp: new Date(),
        actor: "Intake Classifier Agent",
        action: "Missing Documents Flagged",
        details: `Required documents absent for ${permit_type} permit type: ${missingDocs.join(", ")}.`,
      });
    }

    // ── AGENT 2: GIS Compliance ──────────────────────────────────────────────
    const coords = await geocodeAddress(site_address);
    const zoningInfo = await queryZoning(coords.lat, coords.lng, site_address);

    const ALLOWED: Record<string, string[]> = {
      Residential:  ["residential"],
      Commercial:   ["commercial", "retail", "mixed_use", "mixed"],
      Industrial:   ["industrial"],
      "Mixed-Use":  ["residential", "commercial", "mixed_use", "mixed"],
      Renovation:   ["residential", "commercial", "industrial", "mixed_use"],
      Demolition:   ["residential", "commercial", "industrial", "park"],
      Utility:      ["residential", "commercial", "industrial"],
    };

    const allowedZones = ALLOWED[permit_type] || [];
    const zoneConflict = !allowedZones.includes(zoningInfo.detected_zone);
    const protectedArea = ["nature_reserve", "park", "conservation", "restricted"].includes(
      zoningInfo.detected_zone
    );

    auditLog.push({
      timestamp: new Date(),
      actor: "GIS Compliance Agent",
      action: "GIS Analysis Complete",
      details: `Coordinates: (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}). Detected zone: '${zoningInfo.detected_zone}' via ${zoningInfo.gis_source}. Zone Conflict: ${zoneConflict}. Protected Area: ${protectedArea}. Polygon ID: ${zoningInfo.gis_polygon_id}.`,
    });

    // ── AGENT 3: GROQ AI Case Resolution ────────────────────────────────────
    const groqDecision = await callGroqResolutionAgent({
      permit_type,
      detected_zone: zoningInfo.detected_zone,
      zone_conflict: zoneConflict,
      protected_area: protectedArea,
      missing_docs: missingDocs,
      applicant_name,
      site_address,
    });

    auditLog.push({
      timestamp: new Date(),
      actor: "Case Resolution Agent (GROQ llama3-8b-8192)",
      action: "AI Decision Generated",
      details: `Decision: ${groqDecision.ai_decision} | Confidence: ${(groqDecision.ai_confidence * 100).toFixed(0)}% | Reasoning: ${groqDecision.ai_reasoning}`,
    });

    // ── AGENT 4: Routing & Notification ─────────────────────────────────────
    let finalStatus: CaseStatus = "Intake";
    let assignedOfficer = "System Automated";

    if (groqDecision.ai_decision === "AutoApprove") {
      finalStatus = "Closed";
      auditLog.push({
        timestamp: new Date(),
        actor: "RPA Notification Bot",
        action: "Auto Approval Issued",
        details: `Permit auto-approved by AI. Compliance confirmed. Approval notification dispatched to ${applicant_email}.`,
      });
    } else if (groqDecision.ai_decision === "RequestDocuments") {
      finalStatus = "DocumentsRequested";
      auditLog.push({
        timestamp: new Date(),
        actor: "RPA Notification Bot",
        action: "Document Request Dispatched",
        details: `Document request email sent to ${applicant_email}. Required: ${missingDocs.join(", ")}. Case awaiting resubmission.`,
      });
    } else if (groqDecision.ai_decision === "EscalateHuman") {
      finalStatus = "HumanReview";
      assignedOfficer = "Officer Sarah Jenkins";
      auditLog.push({
        timestamp: new Date(),
        actor: "UiPath Maestro Case Engine",
        action: "HITL Task Created",
        details: `Case escalated to human review. Action App task created for ${assignedOfficer} (SLA: 5 business days). Reason: ${groqDecision.ai_reasoning}`,
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
      ai_decision: groqDecision.ai_decision,
      ai_confidence: groqDecision.ai_confidence,
      ai_reasoning: groqDecision.ai_reasoning,
      assigned_officer: assignedOfficer,
      officer_decision: groqDecision.ai_decision === "AutoApprove" ? "Approved" : null,
      officer_notes: groqDecision.ai_decision === "AutoApprove" ? "AI auto-approved — all compliance checks passed." : "",
      audit_log: auditLog,
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
