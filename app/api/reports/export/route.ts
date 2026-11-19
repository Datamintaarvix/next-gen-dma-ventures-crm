import { NextRequest, NextResponse } from "next/server";
import { getFullAnalyticsData } from "@/lib/storage/reports-store";
import { ReportPeriod } from "@/lib/validations/report";

export const dynamic = "force-dynamic";

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") as ReportPeriod) || "all";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const course = searchParams.get("course") || undefined;

    const data = await getFullAnalyticsData({
      period,
      startDate,
      endDate,
      course,
    });

    const lines: string[] = [];

    // Header Info
    lines.push(`"NEXT GEN DMA VENTURES - INSTITUTIONAL ANALYTICS & EXECUTIVE REPORT"`);
    lines.push(`"Generated On:","${new Date().toLocaleString()}"`);
    lines.push(`"Reporting Period:","${data.dateRangeDisplay}"`);
    lines.push("");

    // Section 1: KPIs
    lines.push(`"--- 1. EXECUTIVE KEY PERFORMANCE INDICATORS ---"`);
    lines.push(`"Metric","Value"`);
    lines.push(`"Total Leads Generated",${data.kpis.totalLeads}`);
    lines.push(`"Total Enquiries Recorded",${data.kpis.totalEnquiries}`);
    lines.push(`"Total Active Students",${data.kpis.totalStudents}`);
    lines.push(`"Total Confirmed Admissions",${data.kpis.totalAdmissions}`);
    lines.push(`"Total Revenue Collected (INR)",${data.kpis.totalRevenueCollected}`);
    lines.push(`"Total Expected Billed (INR)",${data.kpis.totalExpectedRevenue}`);
    lines.push(`"Total Outstanding Fees (INR)",${data.kpis.totalOutstandingFees}`);
    lines.push(`"Active Training Batches",${data.kpis.activeBatches}`);
    lines.push(`"Placement Success Rate (%)","${data.kpis.placementSuccessRate}%"`);
    lines.push(`"Average Student Attendance (%)","${data.kpis.averageAttendancePercentage}%"`);
    lines.push(`"Total Counselling Sessions",${data.kpis.totalCounsellingSessions}`);
    lines.push("");

    // Section 2: Counsellor Performance
    lines.push(`"--- 2. COUNSELLOR PERFORMANCE & CONVERSIONS ---"`);
    lines.push(
      `"Counsellor Name","Leads Assigned","Leads Converted","Conversion Rate (%)","Admissions Closed","Revenue Generated (INR)"`
    );
    data.counsellorPerformance.forEach((c) => {
      lines.push(
        [
          escapeCsv(c.counsellorName),
          c.leadsAssigned,
          c.leadsConverted,
          `"${c.conversionRate}%"`,
          c.admissionsCount,
          c.revenueGenerated,
        ].join(",")
      );
    });
    lines.push("");

    // Section 3: Admissions by Course
    lines.push(`"--- 3. COURSE-WISE ADMISSIONS & REVENUE ---"`);
    lines.push(`"Course Name","Confirmed Admissions","Total Revenue (INR)"`);
    data.admissionsByCourse.forEach((c) => {
      lines.push(
        [
          escapeCsv(c.fullName || c.name),
          c.admissions,
          c.revenue,
        ].join(",")
      );
    });
    lines.push("");

    // Section 4: Recent Financial Collections
    lines.push(`"--- 4. RECENT FINANCIAL COLLECTIONS ---"`);
    lines.push(`"Receipt ID","Student Name","Course","Amount (INR)","Payment Method","Date"`);
    data.financials.recentCollections.forEach((p) => {
      lines.push(
        [
          escapeCsv(p.paymentId),
          escapeCsv(p.studentName),
          escapeCsv(p.course),
          p.amount,
          escapeCsv(p.paymentMethod),
          escapeCsv(p.date),
        ].join(",")
      );
    });
    lines.push("");

    // Section 5: Low Attendance Watchlist
    lines.push(`"--- 5. LOW ATTENDANCE WATCHLIST (< 75%) ---"`);
    lines.push(`"Student ID","Student Name","Course","Batch","Attendance Rate"`);
    data.attendance.lowAttendanceStudents.forEach((s) => {
      lines.push(
        [
          escapeCsv(s.studentCode),
          escapeCsv(s.studentName),
          escapeCsv(s.courseName),
          escapeCsv(s.batchCode),
          `"${s.attendancePercentage}%"`,
        ].join(",")
      );
    });
    lines.push("");

    // Section 6: Placement & Recruiter Report
    lines.push(`"--- 6. RECRUITER & PLACEMENT REPORT ---"`);
    lines.push(`"Company Name","Industry","Hired Candidates","Recruited Roles"`);
    data.placements.companyHires.forEach((comp) => {
      lines.push(
        [
          escapeCsv(comp.companyName),
          escapeCsv(comp.industry),
          comp.hiredCount,
          escapeCsv(comp.roles.join("; ")),
        ].join(",")
      );
    });
    lines.push("");

    // Section 7: Staff Performance Overview
    lines.push(`"--- 7. STAFF PERFORMANCE SUMMARY ---"`);
    lines.push(
      `"Staff Name","Role","Department","Leads","Counselling","Follow-ups","Admissions","Conversion (%)","Revenue (INR)"`
    );
    data.staffPerformance.forEach((sp) => {
      lines.push(
        [
          escapeCsv(sp.staffName),
          escapeCsv(sp.role),
          escapeCsv(sp.department),
          sp.leadsHandled,
          sp.counsellingSessions,
          sp.followUpsDone,
          sp.admissionsClosed,
          `"${sp.conversionRate}%"`,
          sp.revenueGenerated,
        ].join(",")
      );
    });

    const csvContent = lines.join("\n");
    const filename = `nextgen-crm-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating CSV export:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate CSV export." },
      { status: 500 }
    );
  }
}
