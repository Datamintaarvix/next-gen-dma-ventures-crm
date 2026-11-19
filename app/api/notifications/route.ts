import { NextRequest, NextResponse } from "next/server";
import {
  getAllNotifications,
  getNotificationKPIs,
  createNotification,
} from "@/lib/storage/notifications-store";
import { notificationSchema } from "@/lib/validations/notification";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "All";
    const type = searchParams.get("type") || "All";
    const priority = searchParams.get("priority") || "All";
    const search = searchParams.get("search") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;

    let list = await getAllNotifications({
      status,
      type,
      priority,
      search,
    });

    if (limit && limit > 0) {
      list = list.slice(0, limit);
    }

    const kpis = await getNotificationKPIs();

    return NextResponse.json({
      success: true,
      notifications: list,
      kpis,
      totalCount: list.length,
    });
  } catch (err: any) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = notificationSchema.parse(body);

    const created = await createNotification(validatedData);

    return NextResponse.json(
      {
        success: true,
        message: "Notification created successfully",
        notification: created,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/notifications error:", err);
    const errorMsg =
      err.errors && Array.isArray(err.errors)
        ? err.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ")
        : err.message || "Validation error";

    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 400 }
    );
  }
}
