import { NextRequest, NextResponse } from "next/server";
import { rescheduleFollowUpRecord } from "@/lib/storage/follow-ups-store";
import { rescheduleFollowUpSchema } from "@/lib/validations/follow-up";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = rescheduleFollowUpSchema.safeParse(body);

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

    const { newDate, newTime, reason } = validation.data;
    const updated = await rescheduleFollowUpRecord(params.id, newDate, newTime, reason);

    return NextResponse.json({
      success: true,
      message: "Follow-up rescheduled successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("API POST reschedule error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reschedule follow-up" },
      { status: 400 }
    );
  }
}
