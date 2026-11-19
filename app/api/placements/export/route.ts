import { NextRequest, NextResponse } from "next/server";
import { readPlacementsFromDisk } from "@/lib/storage/placements-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "profiles"; // profiles | jobs | companies | offers

    const store = await readPlacementsFromDisk();

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    let csvContent = "";
    let filename = "";

    if (type === "offers") {
      const headers = [
        "Offer ID",
        "Student Code",
        "Student Name",
        "Course",
        "Batch",
        "Company",
        "Job Title",
        "Salary LPA",
        "Offer Date",
        "Joining Date",
        "Offer Letter Ref",
        "Status",
        "Acceptance Date",
      ];
      const rows = [headers.join(",")];
      store.offers.forEach((o) => {
        rows.push(
          [
            escapeCsv(o.id),
            escapeCsv(o.studentCode),
            escapeCsv(o.studentName),
            escapeCsv(o.courseName),
            escapeCsv(o.batchCode),
            escapeCsv(o.companyName),
            escapeCsv(o.jobTitle),
            escapeCsv(o.offeredSalaryLPA),
            escapeCsv(o.offerDate),
            escapeCsv(o.joiningDate),
            escapeCsv(o.offerLetterRef || "--"),
            escapeCsv(o.status),
            escapeCsv(o.acceptanceDate || "--"),
          ].join(",")
        );
      });
      csvContent = rows.join("\r\n");
      filename = `Placement_Offers_${new Date().toISOString().split("T")[0]}.csv`;
    } else {
      // Default: Student Placement Profiles
      const headers = [
        "Student Code",
        "Student Name",
        "Course",
        "Batch",
        "Attendance %",
        "Eligibility",
        "Placement Status",
        "Placed Company",
        "Placed Job Title",
        "Placed Salary (LPA)",
        "Placed Date",
        "Total Applications",
        "Total Interviews",
        "Offers Count",
        "Skills",
      ];
      const rows = [headers.join(",")];
      store.profiles.forEach((p) => {
        rows.push(
          [
            escapeCsv(p.studentCode),
            escapeCsv(p.studentName),
            escapeCsv(p.courseName),
            escapeCsv(p.batchCode),
            escapeCsv(`${p.attendancePercentage}%`),
            escapeCsv(p.placementEligibility),
            escapeCsv(p.placementStatus),
            escapeCsv(p.placedCompany || "--"),
            escapeCsv(p.placedJobTitle || "--"),
            escapeCsv(p.placedSalaryLPA ? `${p.placedSalaryLPA} LPA` : "--"),
            escapeCsv(p.placedDate || "--"),
            escapeCsv(p.totalApplications),
            escapeCsv(p.totalInterviews),
            escapeCsv(p.activeOffersCount),
            escapeCsv(p.skills.join("; ")),
          ].join(",")
        );
      });
      csvContent = rows.join("\r\n");
      filename = `Student_Placements_Report_${new Date().toISOString().split("T")[0]}.csv`;
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/placements/export error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export report" },
      { status: 500 }
    );
  }
}
