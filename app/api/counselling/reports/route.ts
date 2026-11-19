import { NextRequest, NextResponse } from "next/server";
import { getCounsellorPerformanceReports } from "@/lib/storage/counselling-store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const reportData = await getCounsellorPerformanceReports();

    return NextResponse.json({
      success: true,
      ...reportData,
    });
  } catch (error: any) {
    console.error("GET /api/counselling/reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
