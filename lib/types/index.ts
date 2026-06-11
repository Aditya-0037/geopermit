// Core type definitions for GeoPermit AI

export type CaseStatus = 
  | "Intake" 
  | "GISCheck" 
  | "Resolution" 
  | "HumanReview"
  | "Approved" 
  | "Rejected" 
  | "DocumentsRequested" 
  | "Closed";

export type PermitType = 
  | "Residential" 
  | "Commercial" 
  | "Industrial"
  | "Mixed-Use" 
  | "Demolition" 
  | "Renovation" 
  | "Utility";

export type AIDecision = 
  | "AutoApprove" 
  | "EscalateHuman" 
  | "RequestDocuments";

export type OfficerDecision = 
  | "Approved" 
  | "Rejected" 
  | "MoreInfoRequired";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AuditEntry {
  timestamp: Date;
  actor: string;
  action: string;
  details: string;
}

export interface PermitCase {
  // Identity
  case_id: string;
  created_at: Date;
  sla_deadline: Date;
  status: CaseStatus;

  // Applicant
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;

  // Application
  permit_type: PermitType;
  site_address: string;
  site_lat: number;
  site_lng: number;
  documents: string[];
  missing_docs: string[];

  // GIS
  detected_zone: string;
  requested_use: string;
  zone_conflict: boolean;
  protected_area: boolean;
  gis_source: string;
  gis_polygon_id: string;

  // Resolution
  ai_decision: AIDecision;
  ai_confidence: number;
  ai_reasoning: string;

  // Human review
  assigned_officer: string;
  officer_decision: OfficerDecision | null;
  officer_notes: string;

  // Audit
  audit_log: AuditEntry[];
}

export interface PermitSubmission {
  applicant_name: string;
  applicant_email: string;
  applicant_phone?: string;
  permit_type: PermitType;
  site_address: string;
  site_description: string;
  documents: File[];
}

export interface GISCheckResult {
  detected_zone: string;
  zone_conflict: boolean;
  protected_area: boolean;
  gis_reasoning: string;
  coords: Coordinates;
  gis_source: string;
  gis_polygon_id: string;
}

export interface IntakeResult {
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  permit_type: PermitType;
  site_address: string;
  site_description: string;
  missing_docs: string[];
}

export interface ResolutionResult {
  ai_decision: AIDecision;
  ai_confidence: number;
  ai_reasoning: string;
}
