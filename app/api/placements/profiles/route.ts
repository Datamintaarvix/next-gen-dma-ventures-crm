import { NextRequest, NextResponse } from "next/server";
import { getPlacementProfiles } from "@/lib/storage/placements-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const course = searchParams.get("course") || undefined;
    const batch = searchParams.get("batch") || undefined;
    const status = searchParams.get("status") || undefined;
    const eligibility = searchParams.get("eligibility") || undefined;

    const profiles = await getPlacementProfiles({
      search,
      course,
      batch,
      status,
      eligibility,
    });

    return NextResponse.json({
      success: true,
      count: profiles.length,
      profiles,
    });
  } catch (error: any) {
    console.error("GET /api/placements/profiles error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch placement profiles" },
      { status: 500 }
    );
  }
}
