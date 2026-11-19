import { NextRequest, NextResponse } from "next/server";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/lib/storage/notifications-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const settings = await getNotificationSettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    console.error("GET /api/notifications/settings error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch notification settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = await updateNotificationSettings(body);

    return NextResponse.json({
      success: true,
      message: "Notification settings updated successfully",
      settings: updated,
    });
  } catch (err: any) {
    console.error("PUT /api/notifications/settings error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update notification settings" },
      { status: 500 }
    );
  }
}
