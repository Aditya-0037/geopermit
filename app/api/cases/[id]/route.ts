import { NextRequest, NextResponse } from "next/server";
import { getCaseById, createOrUpdateCase } from "@/lib/db";
import { CaseStatus, AuditEntry } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permitCase = getCaseById(params.id);
    if (!permitCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    return NextResponse.json(permitCase);
  } catch (error) {
    console.error("Error fetching case details:", error);
    return NextResponse.json({ error: "Failed to fetch case details" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { decision, notes, officer_name } = body;
    
    if (!decision || !notes) {
      return NextResponse.json({ error: "Decision and notes are required" }, { status: 400 });
    }
    
    const permitCase = getCaseById(params.id);
    if (!permitCase) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }
    
    const actor = officer_name || "Officer Sarah Jenkins";
    let newStatus: CaseStatus = "Closed";
    let actionText = "";
    
    if (decision === "Approved") {
      newStatus = "Closed";
      actionText = "Approved by Officer";
    } else if (decision === "Rejected") {
      newStatus = "Closed";
      actionText = "Rejected by Officer";
    } else if (decision === "MoreInfoRequired") {
      newStatus = "DocumentsRequested";
      actionText = "More Info Requested by Officer";
    }
    
    const timestamp = new Date();
    
    const officerLog: AuditEntry = {
      timestamp,
      actor,
      action: actionText,
      details: `Officer decision: ${decision}. Notes: ${notes}`
    };
    
    const rpaLog: AuditEntry = {
      timestamp: new Date(timestamp.getTime() + 1000),
      actor: "RPA Notification Bot",
      action: decision === "MoreInfoRequired" ? "Applicant Notified (More Info)" : "Notification Sent",
      details: decision === "MoreInfoRequired"
        ? `Sent email to ${permitCase.applicant_email} requesting additional details: ${notes}`
        : `Sent email to ${permitCase.applicant_email} notifying them of permit ${decision.toLowerCase()} status.`
    };
    
    const updatedCase = {
      ...permitCase,
      status: newStatus,
      officer_decision: decision,
      officer_notes: notes,
      assigned_officer: actor,
      audit_log: [...permitCase.audit_log, officerLog, rpaLog]
    };
    
    const success = createOrUpdateCase(updatedCase);
    if (!success) {
      return NextResponse.json({ error: "Failed to save updated case" }, { status: 500 });
    }
    
    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error("Error updating case:", error);
    return NextResponse.json({ error: "Failed to update case" }, { status: 500 });
  }
}
