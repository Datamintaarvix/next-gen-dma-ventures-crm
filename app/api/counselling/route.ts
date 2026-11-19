import { NextRequest, NextResponse } from "next/server";
import {
  getCounsellingSessions,
  getCounsellingKPIs,
  createCounsellingSession,
} from "@/lib/storage/counselling-store";
import { scheduleCounsellingSchema } from "@/lib/validations/counselling";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const counsellor = searchParams.get("counsellor") || undefined;
    const status = searchParams.get("status") || undefined;
    const sessionType = searchParams.get("sessionType") || undefined;
    const dateRange = searchParams.get("dateRange") || undefined;
    const date = searchParams.get("date") || undefined;
    const sortBy = (searchParams.get("sortBy") as any) || "date";
    const sortOrder = (searchParams.get("sortOrder") as any) || "desc";
    const includeStats = searchParams.get("includeStats") === "true";

    const sessions = await getCounsellingSessions({
      search,
      counsellor,
      status,
      sessionType,
      dateRange,
      date,
      sortBy,
      sortOrder,
    });

    let stats = null;
    if (includeStats) {
      stats = await getCounsellingKPIs(date, counsellor);
    }

    return NextResponse.json({
      success: true,
      count: sessions.length,
      sessions,
      stats,
    });
  } catch (error: any) {
    console.error("GET /api/counselling error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch counselling sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = scheduleCounsellingSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const session = await createCounsellingSession(parsed.data, body.operatorName);

    return NextResponse.json({
      success: true,
      message: `Counselling session ${session.sessionCode} scheduled successfully for ${session.personName}`,
      session,
    });
  } catch (error: any) {
    console.error("POST /api/counselling error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to schedule counselling session" },
      { status: 400 }
    );
  }
}
