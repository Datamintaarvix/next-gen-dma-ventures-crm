import { NextRequest, NextResponse } from "next/server";
import { cancelCounsellingSession } from "@/lib/storage/counselling-store";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { reason, operatorName } = body;
    if (!reason) {
      return NextResponse.json(
        { success: false, error: "Cancellation reason is required" },
        { status: 400 }
      );
    }

    const updated = await cancelCounsellingSession(id, reason, operatorName);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Counselling session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Counselling session ${updated.sessionCode} cancelled`,
      session: updated,
    });
  } catch (error: any) {
    console.error("POST /api/counselling/[id]/cancel error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to cancel session" },
      { status: 400 }
    );
  }
}
