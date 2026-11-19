import { NextRequest, NextResponse } from "next/server";
import {
  getCourseById,
  updateCourse,
  deleteCourse,
} from "@/lib/storage/courses-store";
import { courseSchema } from "@/lib/validations/course";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { course, enrolledStudents, associatedBatches } = await getCourseById(params.id);
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        enrolledStudents,
        associatedBatches,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch course details" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = courseSchema.partial().safeParse(body);

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

    const updated = await updateCourse(params.id, validation.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Course updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update course" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const result = await deleteCourse(params.id, force);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          blockedByStudents: result.blockedByStudents,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete course" },
      { status: 500 }
    );
  }
}
