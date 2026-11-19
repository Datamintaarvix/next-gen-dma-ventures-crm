import { NextRequest, NextResponse } from "next/server";
import { scheduleInterview } from "@/lib/storage/placements-store";
import { scheduleInterviewSchema } from "@/lib/validations/placement";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = scheduleInterviewSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const interview = await scheduleInterview(parsed.data);

    return NextResponse.json({
      success: true,
      message: `Interview scheduled for ${interview.studentName} with ${interview.companyName} on ${interview.interviewDate} at ${interview.interviewTime}`,
      interview,
    });
  } catch (error: any) {
    console.error("POST /api/placements/interviews error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to schedule interview" },
      { status: 400 }
    );
  }
}
