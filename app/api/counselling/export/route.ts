import { NextRequest, NextResponse } from "next/server";
import { getCounsellingSessions } from "@/lib/storage/counselling-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const counsellor = searchParams.get("counsellor") || undefined;
    const status = searchParams.get("status") || undefined;
    const sessionType = searchParams.get("sessionType") || undefined;
    const dateRange = searchParams.get("dateRange") || undefined;
    const date = searchParams.get("date") || undefined;

    const sessions = await getCounsellingSessions({
      search,
      counsellor,
      status,
      sessionType,
      dateRange,
      date,
      sortBy: "date",
      sortOrder: "desc",
    });

    const headers = [
      "Session Code",
      "Date",
      "Time Slot",
      "Person Name",
      "Participant Type",
      "Contact Number",
      "Email",
      "Interested Course",
      "Assigned Counsellor",
      "Session Type",
      "Purpose",
      "Meeting Location / Link",
      "Priority",
      "Status",
      "Converted to Admission",
      "Admission Code",
      "Discussion Notes",
      "Next Action",
      "Recommended Follow-up",
      "Completed By",
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = [headers.join(",")];

    for (const s of sessions) {
      rows.push(
        [
          escapeCsv(s.sessionCode),
          escapeCsv(s.counsellingDate),
          escapeCsv(`${s.startTime} - ${s.endTime}`),
          escapeCsv(s.personName),
          escapeCsv(s.participantType),
          escapeCsv(s.contactNumber),
          escapeCsv(s.email || "--"),
          escapeCsv(s.interestedCourse),
          escapeCsv(s.assignedCounsellor),
          escapeCsv(s.sessionType),
          escapeCsv(s.purpose),
          escapeCsv(s.meetingLocationOrLink),
          escapeCsv(s.priority),
          escapeCsv(s.status),
          escapeCsv(s.isConvertedToAdmission ? "Yes" : "No"),
          escapeCsv(s.admissionCode || "--"),
          escapeCsv(s.discussionNotes || "--"),
          escapeCsv(s.nextAction || "--"),
          escapeCsv(s.recommendedFollowUpDate || "--"),
          escapeCsv(s.completedBy || "--"),
        ].join(",")
      );
    }

    const csvContent = rows.join("\r\n");
    const filename = `Counselling_Report_${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/counselling/export error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export counselling report" },
      { status: 500 }
    );
  }
}
