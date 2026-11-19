import { NextRequest, NextResponse } from "next/server";
import {
  getCourses,
  createCourse,
  getCourseStats,
} from "@/lib/storage/courses-store";
import { courseSchema } from "@/lib/validations/course";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const category = searchParams.get("category") || "All";
    const status = searchParams.get("status") || "All";
    const sortBy = searchParams.get("sortBy") || "name"; // 'name' | 'duration' | 'fees' | 'enrolled'
    const order = searchParams.get("order") === "desc" ? "desc" : "asc";

    let courses = await getCourses();

    // Search filter: course name, code, instructor, category, syllabus keywords
    if (search) {
      courses = courses.filter(
        (c) =>
          c.courseName.toLowerCase().includes(search) ||
          c.courseCode.toLowerCase().includes(search) ||
          c.category.toLowerCase().includes(search) ||
          c.instructor.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (category && category !== "All") {
      courses = courses.filter((c) => c.category === category);
    }

    // Status filter
    if (status && status !== "All") {
      courses = courses.filter((c) => c.status === status);
    }

    // Sorting
    courses.sort((a, b) => {
      if (sortBy === "duration") {
        const diff = a.durationWeeks - b.durationWeeks;
        return order === "asc" ? diff : -diff;
      }
      if (sortBy === "fees") {
        const diff = a.fees - b.fees;
        return order === "asc" ? diff : -diff;
      }
      if (sortBy === "enrolled") {
        const diff = (a.enrolledStudentsCount || 0) - (b.enrolledStudentsCount || 0);
        return order === "asc" ? diff : -diff;
      }
      // default: course name
      return order === "asc"
        ? a.courseName.localeCompare(b.courseName)
        : b.courseName.localeCompare(a.courseName);
    });

    const stats = await getCourseStats();

    return NextResponse.json({
      success: true,
      total: courses.length,
      data: courses,
      stats,
    });
  } catch (error: any) {
    console.error("API GET /api/courses error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = courseSchema.safeParse(body);

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

    const created = await createCourse(validation.data);
    return NextResponse.json(
      {
        success: true,
        message: "Course created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API POST /api/courses error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create course" },
      { status: 400 }
    );
  }
}
