import { NextRequest, NextResponse } from "next/server";
import {
  getFollowUpById,
  updateFollowUp,
  deleteFollowUp,
} from "@/lib/storage/follow-ups-store";
import { followUpSchema } from "@/lib/validations/follow-up";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const record = await getFollowUpById(params.id);
    if (!record) {
      return NextResponse.json(
        { success: false, error: "Follow-up record not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch follow-up" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = followUpSchema.safeParse(body);

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

    const updated = await updateFollowUp(params.id, validation.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Follow-up record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Follow-up updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update follow-up" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const success = await deleteFollowUp(params.id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Follow-up record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Follow-up deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete follow-up" },
      { status: 500 }
    );
  }
}
