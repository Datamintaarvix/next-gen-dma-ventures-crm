import { NextRequest, NextResponse } from "next/server";
import {
  readAttendanceFromDisk,
  updateAttendanceRecord,
  deleteAttendanceRecord,
} from "@/lib/storage/attendance-store";
import { AttendanceStatus, attendanceStatusEnum } from "@/lib/validations/attendance";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { records } = await readAttendanceFromDisk();
    const record = records.find((r) => r.id === id);

    if (!record) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error("GET /api/attendance/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch attendance record" },
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

    if (body.status && !attendanceStatusEnum.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid attendance status" },
        { status: 400 }
      );
    }

    const updated = await updateAttendanceRecord(
      id,
      {
        status: body.status as AttendanceStatus,
        checkInTime: body.checkInTime,
        remarks: body.remarks,
      },
      body.operatorName
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Updated attendance for ${updated.studentName}`,
      record: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/attendance/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update attendance record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteAttendanceRecord(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Attendance record deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/attendance/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete attendance record" },
      { status: 500 }
    );
  }
}
