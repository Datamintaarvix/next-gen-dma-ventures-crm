import { NextRequest, NextResponse } from "next/server";
import { getStudents, generateStudentsCsv } from "@/lib/storage/students-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const course = searchParams.get("course") || "All";
    const status = searchParams.get("status") || "All";

    let students = await getStudents();

    if (course !== "All") {
      students = students.filter((s) => s.course === course);
    }
    if (status !== "All") {
      students = students.filter((s) => s.status === status);
    }

    const csvContent = generateStudentsCsv(students);
    const dateStr = new Date().toISOString().split("T")[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="nextgen_students_${dateStr}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Export CSV error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export students CSV" },
      { status: 500 }
    );
  }
}
