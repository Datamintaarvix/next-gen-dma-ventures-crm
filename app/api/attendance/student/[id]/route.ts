import { NextRequest, NextResponse } from "next/server";
import { getStudentAttendanceProfile } from "@/lib/storage/attendance-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getStudentAttendanceProfile(id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error("GET /api/attendance/student/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch student attendance profile" },
      { status: 500 }
    );
  }
}
