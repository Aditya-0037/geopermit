import { NextResponse } from "next/server";
import { getCases } from "@/lib/db";

export async function GET() {
  try {
    const cases = getCases();
    
    const total = cases.length;
    const autoApproved = cases.filter(c => c.ai_decision === 'AutoApprove').length;
    const pendingReview = cases.filter(c => c.status === 'HumanReview').length;
    const missingDocs = cases.filter(c => c.status === 'DocumentsRequested').length;
    
    // Sort by created_at descending
    const sortedCases = [...cases].sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    
    return NextResponse.json({
      cases: sortedCases,
      stats: {
        total,
        autoApproved,
        pendingReview,
        missingDocs,
      }
    });
  } catch (error) {
    console.error("Error in dashboard API:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
