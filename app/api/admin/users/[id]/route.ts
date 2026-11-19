import { NextRequest, NextResponse } from "next/server";
import {
  getStaffById,
  getAllStaff,
  updateStaff,
  deleteStaff,
  getStaffCrossModuleActivity,
} from "@/lib/storage/staff-store";
import { supabaseAdmin, isSupabaseServerConfigured } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { staffSchema } from "@/lib/validations/staff";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminAuth = await requireAdmin(req);
    if (adminAuth instanceof NextResponse) return adminAuth;

    const staff = await getStaffById(params.id);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff account not found." },
        { status: 404 }
      );
    }

    const activity = getStaffCrossModuleActivity(staff.fullName);

    // Get Auth user if available
    let authUser: any = null;
    if (isSupabaseServerConfigured()) {
      try {
        const { data } = await supabaseAdmin.auth.admin.listUsers();
        authUser = data?.users?.find((u) => u.email?.toLowerCase() === staff.email.toLowerCase()) || null;
      } catch (e) {
        console.warn("Auth user lookup failed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...staff,
        authUserId: authUser?.id || null,
        lastSignInAt: authUser?.last_sign_in_at || null,
        emailConfirmed: !!authUser?.email_confirmed_at,
        activity,
      },
    });
  } catch (err: any) {
    console.error(`GET /api/admin/users/${params.id} error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch user details." },
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
        { success: false, error: "Staff account not found." },
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
    const willBeDemoted =
      validatedData.role && validatedData.role !== "Super Admin" && validatedData.role !== "Admin";
    const willBeDeactivated =
      validatedData.employmentStatus && validatedData.employmentStatus !== "Active";

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
            error: "Security Policy: Cannot remove or demote the last active administrator account. Promote another active administrator first.",
          },
          { status: 403 }
        );
      }
    }

    // Update staff record
    const updated = await updateStaff(
      params.id,
      validatedData,
      actingStaff?.fullName || "Admin"
    );

    // Sync Supabase Auth metadata if role or status changed
    if (isSupabaseServerConfigured()) {
      try {
        const { data: userLookup } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = userLookup?.users?.find(
          (u) => u.email?.toLowerCase() === target.email.toLowerCase()
        );

        if (authUser) {
          const updates: any = {};
          if (validatedData.role || validatedData.fullName) {
            updates.user_metadata = {
              ...(authUser.user_metadata || {}),
              fullName: updated.fullName,
              role: updated.role,
            };
          }
          if (validatedData.employmentStatus === "Inactive") {
            // Ban for 100 years if inactive to prevent token refresh
            updates.ban_duration = "876000h";
          } else if (validatedData.employmentStatus === "Active" && authUser.banned_until) {
            updates.ban_duration = "none";
          }

          if (Object.keys(updates).length > 0) {
            await supabaseAdmin.auth.admin.updateUserById(authUser.id, updates);
          }
        }
      } catch (authSyncErr) {
        console.warn("Failed to sync auth user metadata:", authSyncErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `User ${updated.fullName} updated successfully.`,
      user: updated,
    });
  } catch (err: any) {
    console.error(`PUT /api/admin/users/${params.id} error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update user account." },
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
        { success: false, error: "Staff account not found." },
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
            error: "Security Policy: Cannot deactivate the last active administrator.",
          },
          { status: 403 }
        );
      }
    }

    const success = await deleteStaff(params.id, actingStaff?.fullName || "Admin");
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to deactivate account." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Staff account ${target.fullName} (${target.id}) deactivated.`,
    });
  } catch (err: any) {
    console.error(`DELETE /api/admin/users/${params.id} error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to deactivate user." },
      { status: 500 }
    );
  }
}
