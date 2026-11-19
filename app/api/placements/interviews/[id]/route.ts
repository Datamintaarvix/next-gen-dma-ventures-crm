import { NextRequest, NextResponse } from "next/server";
import { recordInterviewFeedback } from "@/lib/storage/placements-store";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { feedback, rating, result } = body;

    if (!feedback || !result) {
      return NextResponse.json(
        { success: false, error: "feedback and result are required" },
        { status: 400 }
      );
    }

    const updated = await recordInterviewFeedback(
      id,
      feedback,
      Number(rating) || 4,
      result
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Interview record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Interview feedback recorded (${result})`,
      interview: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/placements/interviews/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update interview" },
      { status: 400 }
    );
  }
}
