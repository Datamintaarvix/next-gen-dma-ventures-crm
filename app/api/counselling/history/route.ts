import { NextRequest, NextResponse } from "next/server";
import { getCounsellingHistory } from "@/lib/storage/counselling-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const personName = searchParams.get("personName") || "";
    const contactNumber = searchParams.get("contactNumber") || undefined;
    const participantId = searchParams.get("participantId") || undefined;

    if (!personName && !contactNumber && !participantId) {
      return NextResponse.json(
        { success: false, error: "personName, contactNumber, or participantId is required" },
        { status: 400 }
      );
    }

    const history = await getCounsellingHistory(personName, contactNumber, participantId);

    return NextResponse.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error: any) {
    console.error("GET /api/counselling/history error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch counselling history" },
      { status: 500 }
    );
  }
}
