import { NextRequest, NextResponse } from "next/server";
import { getPlacementAnalytics } from "@/lib/storage/placements-store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const analytics = await getPlacementAnalytics();

    return NextResponse.json({
      success: true,
      ...analytics,
    });
  } catch (error: any) {
    console.error("GET /api/placements/reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch placement analytics" },
      { status: 500 }
    );
  }
}
