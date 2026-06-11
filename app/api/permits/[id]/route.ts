import { NextRequest, NextResponse } from 'next/server';
import { getUiPathClient } from '@/lib/api/uipath-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const caseId = params.id;

    const uipathClient = getUiPathClient();
    const caseData = await uipathClient.getCaseStatus(caseId);

    return NextResponse.json({
      success: true,
      case: caseData,
    });
  } catch (error: any) {
    console.error('Get permit error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch permit case' },
      { status: 500 }
    );
  }
}
