import { NextRequest, NextResponse } from "next/server";
import {
  getStudents,
  createStudent,
  getStudentStats,
} from "@/lib/storage/students-store";
import { studentSchema } from "@/lib/validations/student";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const course = searchParams.get("course") || "All";
    const batch = searchParams.get("batch") || "All";
    const status = searchParams.get("status") || "All";
    const joiningDate = searchParams.get("joiningDate") || "";
    const sortBy = searchParams.get("sortBy") || "newest";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    let students = await getStudents();

    // Search filter: student name, phone number, email, student ID
    if (search) {
      const cleanSearch = search.replace(/[^0-9]/g, "");
      students = students.filter(
        (s) =>
          s.fullName.toLowerCase().includes(search) ||
          s.studentCode.toLowerCase().includes(search) ||
          s.phoneNumber.includes(search) ||
          (cleanSearch.length >= 4 && s.phoneNumber.replace(/[^0-9]/g, "").includes(cleanSearch)) ||
          s.email.toLowerCase().includes(search) ||
          (s.batchName && s.batchName.toLowerCase().includes(search)) ||
          (s.course && s.course.toLowerCase().includes(search))
      );
    }

    // Filter by course
    if (course && course !== "All") {
      students = students.filter((s) => s.course === course);
    }

    // Filter by batch
    if (batch && batch !== "All") {
      students = students.filter((s) => s.batchCode === batch);
    }

    // Filter by status (Active, Inactive, Completed, Dropped)
    if (status && status !== "All") {
      students = students.filter((s) => s.status === status);
    }

    // Filter by joining date
    if (joiningDate) {
      students = students.filter((s) => s.joiningDate === joiningDate);
    }

    // Sorting
    students.sort((a, b) => {
      if (sortBy === "name") {
        return order === "asc"
          ? a.fullName.localeCompare(b.fullName)
          : b.fullName.localeCompare(a.fullName);
      }
      if (sortBy === "attendance") {
        const diff = (a.attendancePercentage || 0) - (b.attendancePercentage || 0);
        return order === "asc" ? diff : -diff;
      }
      if (sortBy === "fee") {
        const diff = (a.pendingAmount || 0) - (b.pendingAmount || 0);
        return order === "asc" ? diff : -diff;
      }
      // Default: sort by admission date / newest
      const aTime = new Date(a.admissionDate || a.createdAt).getTime();
      const bTime = new Date(b.admissionDate || b.createdAt).getTime();
      return order === "asc" ? aTime - bTime : bTime - aTime;
    });

    const stats = await getStudentStats();

    return NextResponse.json({
      success: true,
      total: students.length,
      data: students,
      stats,
    });
  } catch (error: any) {
    console.error("API GET /api/students error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = studentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const created = await createStudent(validation.data);
    return NextResponse.json(
      {
        success: true,
        message: "Student registered successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API POST /api/students error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create student" },
      { status: 400 }
    );
  }
}
