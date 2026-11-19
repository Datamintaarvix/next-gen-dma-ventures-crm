import { NextRequest, NextResponse } from "next/server";
import {
  getBackupList,
  createRealDatabaseBackup,
} from "@/lib/storage/settings-store";
import { requireAdmin } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin(request);
    if (adminAuth instanceof NextResponse) return adminAuth;

    const backups = getBackupList();
    return NextResponse.json({
      success: true,
      data: backups,
    });
  } catch (error: any) {
    console.error("Error reading backup list:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve backups." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin(request);
    if (adminAuth instanceof NextResponse) return adminAuth;

    const actingStaff = adminAuth.auth.staff;
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // optional body
    }

    const adminUser = body.adminUser || actingStaff?.fullName || "Rajesh Khanna (Super Admin)";
    const adminEmail = body.adminEmail || actingStaff?.email || "rajesh.khanna@nextgendma.com";

    const backup = await createRealDatabaseBackup(adminUser, adminEmail);

    return NextResponse.json({
      success: true,
      message: `Database backup "${backup.fileName}" created and verified successfully.`,
      backup,
    });
  } catch (error: any) {
    console.error("Error creating database backup:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create database backup." },
      { status: 500 }
    );
  }
}
