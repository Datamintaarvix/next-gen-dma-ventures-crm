import { NextRequest, NextResponse } from "next/server";
import {
  readSettingsFromDisk,
  getDatabaseHealthAndStorage,
  updateCompanySettings,
  updateGeneralSettings,
  updateDepartmentSettings,
  updateCourseBatchSettings,
  updateSecuritySettings,
} from "@/lib/storage/settings-store";
import { requireAdmin } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin(request);
    if (adminAuth instanceof NextResponse) return adminAuth;

    const settings = await readSettingsFromDisk();
    const databaseHealth = getDatabaseHealthAndStorage();

    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        databaseHealth,
      },
    });
  } catch (error: any) {
    console.error("Error reading CRM settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load CRM settings." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminAuth = await requireAdmin(request);
    if (adminAuth instanceof NextResponse) return adminAuth;

    const actingStaff = adminAuth.auth.staff;
    const body = await request.json();
    const {
      section,
      data,
      adminUser = actingStaff?.fullName || "Rajesh Khanna (Super Admin)",
      adminEmail = actingStaff?.email || "rajesh.khanna@nextgendma.com",
    } = body;

    if (!section || !data) {
      return NextResponse.json(
        { success: false, error: "Settings section and data payload are required." },
        { status: 400 }
      );
    }

    let updatedResult: any = null;

    switch (section) {
      case "company":
        updatedResult = await updateCompanySettings(data, adminUser, adminEmail);
        break;
      case "general":
        updatedResult = await updateGeneralSettings(data, adminUser, adminEmail);
        break;
      case "departments":
        if (!Array.isArray(data)) {
          throw new Error("Departments data must be an array of department objects.");
        }
        updatedResult = await updateDepartmentSettings(data, adminUser, adminEmail);
        break;
      case "courseBatch":
        updatedResult = await updateCourseBatchSettings(data, adminUser, adminEmail);
        break;
      case "security":
        updatedResult = await updateSecuritySettings(data, adminUser, adminEmail);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unknown settings section: ${section}` },
          { status: 400 }
        );
    }

    const fullSettings = await readSettingsFromDisk();
    const databaseHealth = getDatabaseHealthAndStorage();

    return NextResponse.json({
      success: true,
      message: `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully.`,
      section,
      data: {
        ...fullSettings,
        databaseHealth,
      },
    });
  } catch (error: any) {
    console.error("Error updating CRM settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update settings." },
      { status: 500 }
    );
  }
}
