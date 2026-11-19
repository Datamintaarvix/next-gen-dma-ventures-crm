import { NextRequest, NextResponse } from "next/server";
import { getAllStaff } from "@/lib/storage/staff-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const list = await getAllStaff();

    const headers = [
      "Staff ID",
      "Full Name",
      "Email Address",
      "Phone Number",
      "Department",
      "Designation",
      "Role",
      "Employment Type",
      "Joining Date",
      "Reporting Manager",
      "Status",
      "Emergency Contact Name",
      "Emergency Contact Phone",
      "Address",
    ];

    const rows = list.map((s) => [
      `"${s.id}"`,
      `"${s.fullName.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.phoneNumber}"`,
      `"${s.department}"`,
      `"${s.designation.replace(/"/g, '""')}"`,
      `"${s.role}"`,
      `"${s.employmentType}"`,
      `"${s.joiningDate}"`,
      `"${s.reportingManager.replace(/"/g, '""')}"`,
      `"${s.employmentStatus}"`,
      `"${s.emergencyContact?.name || ""}"`,
      `"${s.emergencyContact?.phone || ""}"`,
      `"${s.address.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nextgen-staff-directory-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err: any) {
    console.error("GET /api/staff/export error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate CSV export" },
      { status: 500 }
    );
  }
}
