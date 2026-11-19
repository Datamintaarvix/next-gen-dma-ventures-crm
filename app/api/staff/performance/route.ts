import { NextRequest, NextResponse } from "next/server";
import { getStaffPerformanceMetrics } from "@/lib/storage/staff-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const performance = getStaffPerformanceMetrics();

    return NextResponse.json({
      success: true,
      performance,
    });
  } catch (err: any) {
    console.error("GET /api/staff/performance error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to calculate performance metrics" },
      { status: 500 }
    );
  }
}
