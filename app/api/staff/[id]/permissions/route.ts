import { NextRequest, NextResponse } from "next/server";
import { getStaffById, updateStaffPermissions } from "@/lib/storage/staff-store";
import { StaffPermissions } from "@/lib/validations/staff";
import { requireAdmin } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminAuth = await requireAdmin(req);
    if (adminAuth instanceof NextResponse) return adminAuth;

    const actingStaff = adminAuth.auth.staff;
    const body = await req.json();
    if (!body.permissions) {
      return NextResponse.json(
        { success: false, error: "Permissions object is required" },
        { status: 400 }
      );
    }

    const targetStaff = await getStaffById(params.id);
    if (!targetStaff) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 }
      );
    }

    if (targetStaff.id === "STF-101" || targetStaff.role === "Super Admin") {
      return NextResponse.json(
        { success: false, error: "Security Policy: Permissions of the primary Super Admin account cannot be restricted." },
        { status: 403 }
      );
    }

    const updated = await updateStaffPermissions(
      params.id,
      body.permissions as StaffPermissions,
      actingStaff?.fullName || "Admin"
    );

    return NextResponse.json({
      success: true,
      message: "Role-based permissions updated successfully",
      staff: updated,
    });
  } catch (err: any) {
    console.error(`PUT /api/staff/${params.id}/permissions error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update permissions" },
      { status: 400 }
    );
  }
}
