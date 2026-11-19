import { NextRequest, NextResponse } from "next/server";
import { getStaffById } from "@/lib/storage/staff-store";
import { supabaseAdmin, isSupabaseServerConfigured } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminAuth = await requireAdmin(req);
    if (adminAuth instanceof NextResponse) return adminAuth;

    const actingStaff = adminAuth.auth.staff;
    const body = await req.json().catch(() => ({}));
    const { newPassword } = body;

    const staff = await getStaffById(params.id);
    if (!staff) {
      return NextResponse.json(
        { success: false, error: "Staff account not found." },
        { status: 404 }
      );
    }

    if (!isSupabaseServerConfigured()) {
      return NextResponse.json(
        { success: false, error: "Supabase authentication is not configured on this server." },
        { status: 503 }
      );
    }

    // Find Auth user by email
    const { data: userLookup, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) {
      return NextResponse.json(
        { success: false, error: `Failed to query auth accounts: ${listErr.message}` },
        { status: 500 }
      );
    }

    let authUser = userLookup?.users?.find(
      (u) => u.email?.toLowerCase() === staff.email.toLowerCase()
    );

    const passwordToSet = newPassword?.trim();

    // If user does not exist in Auth, create them
    if (!authUser) {
      const generatedPass = passwordToSet || "NextGen@2026!";
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: staff.email.toLowerCase(),
        password: generatedPass,
        email_confirm: true,
        user_metadata: {
          fullName: staff.fullName,
          role: staff.role,
        },
      });

      if (createErr) {
        return NextResponse.json(
          { success: false, error: `Failed to create auth account: ${createErr.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Auth account provisioned and password set for ${staff.fullName}.`,
        temporaryPassword: generatedPass,
      });
    }

    // If password provided, update directly
    if (passwordToSet) {
      if (passwordToSet.length < 8) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 8 characters long." },
          { status: 400 }
        );
      }

      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password: passwordToSet,
      });

      if (updateErr) {
        return NextResponse.json(
          { success: false, error: `Failed to update password: ${updateErr.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Password successfully updated for ${staff.fullName} (${staff.email}).`,
      });
    }

    // If no password provided, generate recovery link
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: staff.email.toLowerCase(),
    });

    if (linkErr) {
      return NextResponse.json(
        { success: false, error: `Failed to generate recovery link: ${linkErr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password reset link generated for ${staff.fullName}.`,
      actionLink: linkData.properties?.action_link,
    });
  } catch (err: any) {
    console.error(`POST /api/admin/users/${params.id}/reset-password error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to reset password." },
      { status: 500 }
    );
  }
}
