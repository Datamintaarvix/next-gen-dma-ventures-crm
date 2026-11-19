import { NextRequest, NextResponse } from "next/server";
import { updateBatchStatus } from "@/lib/storage/batches-store";
import { batchStatusUpdateSchema } from "@/lib/validations/batch";

export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = batchStatusUpdateSchema.safeParse(body);

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
    const updated = await updateBatchStatus(params.id, status);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Batch status updated to ${status}`,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update batch status" },
      { status: 400 }
    );
  }
}
