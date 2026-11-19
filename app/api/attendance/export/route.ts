import { NextRequest, NextResponse } from "next/server";
import { getAttendanceRecords } from "@/lib/storage/attendance-store";

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

    const records = await getAttendanceRecords({
      search,
      course,
      batch,
      status,
      dateRange,
      date,
      sortBy: "date",
      sortOrder: "desc",
    });

    const headers = [
      "Record ID",
      "Date",
      "Student ID",
      "Student Name",
      "Course",
      "Batch Code",
      "Batch Name",
      "Session Title",
      "Status",
      "Check-in Time",
      "Remarks",
      "Recorded By",
      "Created At",
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvRows = [headers.join(",")];

    for (const r of records) {
      csvRows.push(
        [
          escapeCsv(r.id),
          escapeCsv(r.date),
          escapeCsv(r.studentCode),
          escapeCsv(r.studentName),
          escapeCsv(r.courseName),
          escapeCsv(r.batchCode),
          escapeCsv(r.batchName),
          escapeCsv(r.sessionTitle),
          escapeCsv(r.status),
          escapeCsv(r.checkInTime || "--"),
          escapeCsv(r.remarks || "--"),
          escapeCsv(r.recordedBy),
          escapeCsv(r.createdAt),
        ].join(",")
      );
    }

    const csvContent = csvRows.join("\r\n");
    const filename = `Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/attendance/export error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export attendance" },
      { status: 500 }
    );
  }
}
