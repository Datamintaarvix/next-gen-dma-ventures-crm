import { NextRequest, NextResponse } from "next/server";
import { getPlacementKPIs } from "@/lib/storage/placements-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const course = searchParams.get("course") || undefined;
    const batch = searchParams.get("batch") || undefined;

    const stats = await getPlacementKPIs({ course, batch });

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("GET /api/placements error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch placement metrics" },
      { status: 500 }
    );
  }
}
