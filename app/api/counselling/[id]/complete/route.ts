import { NextRequest, NextResponse } from "next/server";
import { completeCounsellingSession } from "@/lib/storage/counselling-store";
import { completeSessionSchema } from "@/lib/validations/counselling";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const parsed = completeSessionSchema.safeParse(body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { session, createdFollowUpId } = await completeCounsellingSession(
      id,
      parsed.data,
      body.operatorName
    );

    return NextResponse.json({
      success: true,
      message: `Counselling session ${session.sessionCode} marked as ${session.status} and discussion notes saved.`,
      session,
      createdFollowUpId,
    });
  } catch (error: any) {
    console.error("POST /api/counselling/[id]/complete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to complete counselling session" },
      { status: 400 }
    );
  }
}
