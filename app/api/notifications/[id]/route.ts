import { NextRequest, NextResponse } from "next/server";
import {
  markAsRead,
  markAsUnread,
  archiveNotification,
  deleteNotification,
  toggleImportant,
} from "@/lib/storage/notifications-store";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await req.json();

    let updated = null;
    if (action === "read") {
      updated = await markAsRead(params.id);
    } else if (action === "unread") {
      updated = await markAsUnread(params.id);
    } else if (action === "archive") {
      updated = await archiveNotification(params.id);
    } else if (action === "toggle-important") {
      updated = await toggleImportant(params.id);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (err: any) {
    console.error(`PATCH /api/notifications/${params.id} error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteNotification(params.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification removed successfully",
    });
  } catch (err: any) {
    console.error(`DELETE /api/notifications/${params.id} error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete notification" },
      { status: 500 }
    );
  }
}
