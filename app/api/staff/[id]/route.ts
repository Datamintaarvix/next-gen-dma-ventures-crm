import { NextRequest, NextResponse } from "next/server";
import {
  getStaffById,
  getAllStaff,
  updateStaff,
  deleteStaff,
  getStaffCrossModuleActivity,
} from "@/lib/storage/staff-store";
import { staffSchema } from "@/lib/validations/staff";
import { requireAdmin, requireAuth } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authCheck = await requireAuth(req);
    if (authCheck instanceof NextResponse) return authCheck;

    const staff = await getStaffById(params.id);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 }
      );
    }

    const activity = getStaffCrossModuleActivity(staff.fullName);

    return NextResponse.json({
      success: true,
      staff,
      activity,
    });
  } catch (err: any) {
    console.error(`GET /api/staff/${params.id} error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch staff record" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminAuth = await requireAdmin(req);
    if (adminAuth instanceof NextResponse) return adminAuth;

    const actingStaff = adminAuth.auth.staff;
    const body = await req.json();
    const validatedData = staffSchema.partial().parse(body);

    const target = await getStaffById(params.id);
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 }
      );
    }

    // Protect Super Admin STF-101
    if (target.id === "STF-101" || target.role === "Super Admin") {
      if (validatedData.role && validatedData.role !== "Super Admin") {
        return NextResponse.json(
          { success: false, error: "Security Policy: Cannot demote the primary Super Admin account (STF-101)." },
          { status: 403 }
        );
      }
      if (validatedData.employmentStatus && validatedData.employmentStatus !== "Active") {
        return NextResponse.json(
          { success: false, error: "Security Policy: Cannot deactivate the primary Super Admin account (STF-101)." },
          { status: 403 }
        );
      }
    }

    // Check last remaining active admin protection
    const isTargetAdmin = target.role === "Super Admin" || target.role === "Admin";
    const willBeDemoted = validatedData.role && validatedData.role !== "Super Admin" && validatedData.role !== "Admin";
    const willBeDeactivated = validatedData.employmentStatus && validatedData.employmentStatus !== "Active";

    if (isTargetAdmin && (willBeDemoted || willBeDeactivated)) {
      const allStaff = await getAllStaff();
      const activeAdmins = allStaff.filter(
        (s) =>
          s.id !== target.id &&
          s.employmentStatus === "Active" &&
          (s.role === "Super Admin" || s.role === "Admin")
      );
      if (activeAdmins.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Security Policy: Cannot remove the last active administrator. Promote another active administrator first.",
          },
          { status: 403 }
        );
      }
    }

    const updated = await updateStaff(
      params.id,
      validatedData,
      actingStaff?.fullName || "Admin"
    );

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully",
      staff: updated,
    });
  } catch (err: any) {
    console.error(`PUT /api/staff/${params.id} error:`, err);
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminAuth = await requireAdmin(req);
    if (adminAuth instanceof NextResponse) return adminAuth;

    const actingStaff = adminAuth.auth.staff;
    const target = await getStaffById(params.id);
    if (!target) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 }
      );
    }

    if (target.id === "STF-101" || target.role === "Super Admin") {
      return NextResponse.json(
        { success: false, error: "Security Policy: Cannot delete or deactivate the primary Super Admin account (STF-101)." },
        { status: 403 }
      );
    }

    const isTargetAdmin = target.role === "Admin";
    if (isTargetAdmin) {
      const allStaff = await getAllStaff();
      const activeAdmins = allStaff.filter(
        (s) =>
          s.id !== target.id &&
          s.employmentStatus === "Active" &&
          (s.role === "Super Admin" || s.role === "Admin")
      );
      if (activeAdmins.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Security Policy: Cannot deactivate the last active administrator. Promote another active administrator first.",
          },
          { status: 403 }
        );
      }
    }

    const success = await deleteStaff(params.id, actingStaff?.fullName || "Admin");
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff member deactivated successfully",
    });
  } catch (err: any) {
    console.error(`DELETE /api/staff/${params.id} error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to deactivate staff" },
      { status: 500 }
    );
  }
}
