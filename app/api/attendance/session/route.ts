import { NextRequest, NextResponse } from "next/server";
import { getSessionByBatchAndDate } from "@/lib/storage/attendance-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const batchCode = searchParams.get("batchCode");
    const date = searchParams.get("date");

    if (!batchCode || !date) {
      return NextResponse.json(
        { success: false, error: "batchCode and date query parameters are required" },
        { status: 400 }
      );
    }

    const session = await getSessionByBatchAndDate(batchCode, date);

    return NextResponse.json({
      success: true,
      exists: session !== null,
      session,
    });
  } catch (error: any) {
    console.error("GET /api/attendance/session error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch session" },
      { status: 500 }
    );
  }
}
