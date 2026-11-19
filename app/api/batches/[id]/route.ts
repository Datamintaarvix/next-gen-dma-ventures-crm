import { NextRequest, NextResponse } from "next/server";
import {
  getBatchById,
  updateBatch,
  deleteBatch,
} from "@/lib/storage/batches-store";
import { batchSchema } from "@/lib/validations/batch";

export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { batch, enrolledStudents } = await getBatchById(params.id);
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...batch,
        enrolledStudents,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch batch details" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = batchSchema.partial().safeParse(body);

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

    const updated = await updateBatch(params.id, validation.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Batch updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update batch" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const result = await deleteBatch(params.id, force);

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
      { success: false, error: error.message || "Failed to delete batch" },
      { status: 500 }
    );
  }
}
