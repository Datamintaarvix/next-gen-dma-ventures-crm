import { NextRequest, NextResponse } from "next/server";
import { readAuditLogsFromDisk, logAuditAction } from "@/lib/storage/settings-store";
import { AuditCategory } from "@/lib/validations/settings";
import { requireAdmin, requireAuth } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin(request);
    if (adminAuth instanceof NextResponse) return adminAuth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const category = searchParams.get("category") as AuditCategory | null;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    let logs = await readAuditLogsFromDisk();

    if (category && category !== ("all" as any)) {
      logs = logs.filter((l) => l.category === category);
    }

    if (search) {
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(search) ||
          l.user.toLowerCase().includes(search) ||
          l.details.toLowerCase().includes(search) ||
          (l.affectedRecordId && l.affectedRecordId.toLowerCase().includes(search))
      );
    }

    const total = logs.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedLogs = logs.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("Error reading audit logs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load audit logs." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, userEmail, action, category, details, affectedRecordId } = body;

    if (!action || !details) {
      return NextResponse.json(
        { success: false, error: "Action and details are required to log an audit entry." },
        { status: 400 }
      );
    }

    const newLog = await logAuditAction({
      user: user || "Rajesh Khanna (Super Admin)",
      userEmail: userEmail || "rajesh.khanna@nextgendma.com",
      action,
      category: category || "System",
      details,
      affectedRecordId,
    });

    return NextResponse.json({
      success: true,
      log: newLog,
    });
  } catch (error: any) {
    console.error("Error creating audit log entry:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create audit log." },
      { status: 500 }
    );
  }
}
