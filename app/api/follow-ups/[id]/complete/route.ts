import { NextRequest, NextResponse } from "next/server";
import { completeFollowUpRecord } from "@/lib/storage/follow-ups-store";
import { completeFollowUpSchema } from "@/lib/validations/follow-up";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = completeFollowUpSchema.safeParse(body);

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

    const { completionNotes, scheduleNext, nextDate, nextTime, nextType, nextNotes } =
      validation.data;

    const result = await completeFollowUpRecord(
      params.id,
      completionNotes,
      scheduleNext && nextDate
        ? {
            date: nextDate,
            time: nextTime || "11:00",
            type: nextType || "Phone Call",
            notes: nextNotes,
          }
        : undefined
    );

    return NextResponse.json({
      success: true,
      message: "Follow-up marked as completed",
      data: result,
    });
  } catch (error: any) {
    console.error("API POST complete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to complete follow-up" },
      { status: 400 }
    );
  }
}
