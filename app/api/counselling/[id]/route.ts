import { NextRequest, NextResponse } from "next/server";
import {
  getCounsellingSessionById,
  updateCounsellingSession,
  deleteCounsellingSession,
} from "@/lib/storage/counselling-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCounsellingSessionById(id);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Counselling session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    console.error("GET /api/counselling/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch session" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateCounsellingSession(id, body, body.operatorName);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Counselling session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Updated counselling session ${updated.sessionCode}`,
      session: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/counselling/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update counselling session" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteCounsellingSession(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Counselling session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Counselling session deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/counselling/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete session" },
      { status: 500 }
    );
  }
}
