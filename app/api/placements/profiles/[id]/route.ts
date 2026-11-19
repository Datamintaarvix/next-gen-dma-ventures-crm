import { NextRequest, NextResponse } from "next/server";
import {
  getPlacementProfileByStudentId,
  updateStudentPlacementProfile,
} from "@/lib/storage/placements-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getPlacementProfileByStudentId(id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Student placement profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("GET /api/placements/profiles/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateStudentPlacementProfile(id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Student placement profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Updated placement profile for ${updated.studentName}`,
      profile: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/placements/profiles/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile" },
      { status: 400 }
    );
  }
}
