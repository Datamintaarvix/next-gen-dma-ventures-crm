import { NextRequest, NextResponse } from "next/server";
import { updateStudentStatus } from "@/lib/storage/students-store";
import { studentStatusUpdateSchema } from "@/lib/validations/student";

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = studentStatusUpdateSchema.safeParse(body);

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

    const { status, remarks } = validation.data;
    const updated = await updateStudentStatus(params.id, status, remarks);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Student status updated to ${status}`,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update student status" },
      { status: 400 }
    );
  }
}
