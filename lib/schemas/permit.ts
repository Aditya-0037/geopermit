import { z } from "zod";

export const permitTypeSchema = z.enum([
  "Residential",
  "Commercial", 
  "Industrial",
  "Mixed-Use",
  "Demolition",
  "Renovation",
  "Utility"
]);

export const permitSubmissionSchema = z.object({
  applicant_name: z.string().min(2, "Name must be at least 2 characters").max(100),
  applicant_email: z.string().email("Invalid email address"),
  applicant_phone: z.string().optional(),
  permit_type: permitTypeSchema,
  site_address: z.string().min(10, "Please provide a complete address"),
  site_description: z.string().min(20, "Please provide a detailed description").max(500),
  documents: z.array(z.any()).optional(),
});

export type PermitSubmissionFormData = z.infer<typeof permitSubmissionSchema>;

export const officerDecisionSchema = z.object({
  case_id: z.string().uuid(),
  decision: z.enum(["Approved", "Rejected", "MoreInfoRequired"]),
  notes: z.string().min(10, "Please provide detailed notes").max(1000),
});

export type OfficerDecisionFormData = z.infer<typeof officerDecisionSchema>;
