import { NextRequest, NextResponse } from "next/server";
import { rescheduleCounsellingSession } from "@/lib/storage/counselling-store";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { newDate, newStartTime, newEndTime, reason, operatorName } = body;

    if (!newDate || !newStartTime || !newEndTime) {
      return NextResponse.json(
        { success: false, error: "newDate, newStartTime, and newEndTime are required" },
        { status: 400 }
      );
    }

    const updated = await rescheduleCounsellingSession(
      id,
      newDate,
      newStartTime,
      newEndTime,
      reason,
      operatorName
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Counselling session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Counselling session rescheduled to ${newDate} (${newStartTime} - ${newEndTime})`,
      session: updated,
    });
  } catch (error: any) {
    console.error("POST /api/counselling/[id]/reschedule error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reschedule session" },
      { status: 400 }
    );
  }
}
