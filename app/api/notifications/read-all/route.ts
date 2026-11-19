import { NextRequest, NextResponse } from "next/server";
import { markAllAsRead } from "@/lib/storage/notifications-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const updatedCount = await markAllAsRead();

    return NextResponse.json({
      success: true,
      message: `Marked ${updatedCount} notifications as read`,
      updatedCount,
    });
  } catch (err: any) {
    console.error("POST /api/notifications/read-all error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to mark all as read" },
      { status: 500 }
    );
  }
}
