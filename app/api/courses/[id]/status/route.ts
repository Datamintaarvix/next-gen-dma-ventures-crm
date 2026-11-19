import { NextRequest, NextResponse } from "next/server";
import { updateCourseStatus } from "@/lib/storage/courses-store";
import { courseStatusUpdateSchema } from "@/lib/validations/course";

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = courseStatusUpdateSchema.safeParse(body);

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

    const { status } = validation.data;
    const updated = await updateCourseStatus(params.id, status);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Course status updated to ${status}`,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update course status" },
      { status: 400 }
    );
  }
}
