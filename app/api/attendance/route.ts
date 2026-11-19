import { NextRequest, NextResponse } from "next/server";
import {
  getAttendanceRecords,
  getAttendanceKPIs,
  saveOrUpdateAttendanceSession,
} from "@/lib/storage/attendance-store";
import { markAttendanceSessionSchema } from "@/lib/validations/attendance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const course = searchParams.get("course") || undefined;
    const batch = searchParams.get("batch") || undefined;
    const status = searchParams.get("status") || undefined;
    const dateRange = searchParams.get("dateRange") || undefined;
    const date = searchParams.get("date") || undefined;
    const sortBy = (searchParams.get("sortBy") as any) || "date";
    const sortOrder = (searchParams.get("sortOrder") as any) || "desc";
    const includeStats = searchParams.get("includeStats") === "true";

    const records = await getAttendanceRecords({
      search,
      course,
      batch,
      status,
      dateRange,
      date,
      sortBy,
      sortOrder,
    });

    let stats = null;
    if (includeStats) {
      stats = await getAttendanceKPIs(date, batch);
    }

    return NextResponse.json({
      success: true,
      count: records.length,
      records,
      stats,
    });
  } catch (error: any) {
    console.error("GET /api/attendance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = markAttendanceSessionSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { session, isNew } = await saveOrUpdateAttendanceSession(parsed.data);

    return NextResponse.json({
      success: true,
      message: isNew
        ? `Attendance marked successfully for ${session.batchName} (${session.records.length} students)`
        : `Attendance updated successfully for ${session.batchName}`,
      session,
      isNew,
    });
  } catch (error: any) {
    console.error("POST /api/attendance error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record attendance session" },
      { status: 500 }
    );
  }
}
