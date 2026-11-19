import { NextRequest, NextResponse } from "next/server";
import { getFullAnalyticsData } from "@/lib/storage/reports-store";
import { ReportPeriod } from "@/lib/validations/report";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") as ReportPeriod) || "all";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const course = searchParams.get("course") || undefined;
    const department = searchParams.get("department") || undefined;

    const analytics = await getFullAnalyticsData({
      period,
      startDate,
      endDate,
      course,
      department,
    });

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error generating analytics data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate analytics report. Please try again.",
      },
      { status: 500 }
    );
  }
}
