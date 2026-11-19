import { NextRequest, NextResponse } from "next/server";
import {
  getStudentById,
  updateStudent,
  deleteStudent,
} from "@/lib/storage/students-store";
import { studentSchema } from "@/lib/validations/student";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const student = await getStudentById(params.id);
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: student });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch student details" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = studentSchema.partial().safeParse(body);

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

    const updated = await updateStudent(params.id, validation.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student record updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update student" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const success = await deleteStudent(params.id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student record deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
