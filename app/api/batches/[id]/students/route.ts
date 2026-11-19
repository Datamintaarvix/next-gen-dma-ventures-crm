import { NextRequest, NextResponse } from "next/server";
import {
  assignStudentToBatch,
  transferStudentBatch,
  removeStudentFromBatch,
} from "@/lib/storage/batches-store";
import { assignStudentSchema } from "@/lib/validations/batch";

export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = assignStudentSchema.safeParse(body);

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

    const { studentId, transferFromBatchCode, remarks } = validation.data;

    if (transferFromBatchCode) {
      const result = await transferStudentBatch(studentId, params.id, remarks || undefined);
      return NextResponse.json({
        success: true,
        message: `Student transferred from ${result.fromBatchCode} to ${result.toBatch.batchName}`,
        data: result,
      });
    } else {
      const result = await assignStudentToBatch(params.id, studentId, remarks || undefined);
      return NextResponse.json({
        success: true,
        message: `Student successfully enrolled in ${result.batch.batchName}`,
        data: result,
      });
    }
  } catch (error: any) {
    console.error("API POST assign student error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to assign student" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "studentId query parameter is required" },
        { status: 400 }
      );
    }

    const success = await removeStudentFromBatch(params.id, studentId);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Batch not found or student not assigned" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student removed from batch",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove student" },
      { status: 500 }
    );
  }
}
