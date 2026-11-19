import { NextRequest, NextResponse } from "next/server";
import { getAllStaff, createStaff } from "@/lib/storage/staff-store";
import { supabaseAdmin, isSupabaseServerConfigured } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/server-auth";
import { staffSchema, defaultPermissionsForRole } from "@/lib/validations/staff";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const adminAuth = await requireAdmin(req);
    if (adminAuth instanceof NextResponse) return adminAuth;

    const staffList = await getAllStaff();

    // Correlate with Supabase Auth users if configured
    let authUsersMap: Record<string, { id: string; lastSignInAt: string | null; emailConfirmed: boolean }> = {};

    if (isSupabaseServerConfigured()) {
      try {
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000,
        });

        if (!authErr && authData?.users) {
          authData.users.forEach((u) => {
            if (u.email) {
              authUsersMap[u.email.toLowerCase()] = {
                id: u.id,
                lastSignInAt: u.last_sign_in_at || null,
                emailConfirmed: !!u.email_confirmed_at,
              };
            }
          });
        }
      } catch (authFetchErr) {
        console.warn("Could not fetch auth users for correlation:", authFetchErr);
      }
    }

    const enhancedUsers = staffList.map((s) => {
      const authInfo = authUsersMap[s.email.toLowerCase()] || null;
      return {
        ...s,
        hasAuthAccount: !!authInfo,
        authUserId: authInfo?.id || null,
        lastSignInAt: authInfo?.lastSignInAt || null,
        emailConfirmed: authInfo?.emailConfirmed ?? false,
      };
    });

    return NextResponse.json({
      success: true,
      users: enhancedUsers,
      totalCount: enhancedUsers.length,
    });
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve user accounts." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminAuth = await requireAdmin(req);
    if (adminAuth instanceof NextResponse) return adminAuth;

    const actingStaff = adminAuth.auth.staff;
    const body = await req.json();

    const {
      fullName,
      email,
      phoneNumber,
      role = "Counsellor",
      department = "Admissions & Counselling",
      designation = "Academic Counsellor",
      employmentType = "Full-time",
      joiningDate = new Date().toISOString().split("T")[0],
      temporaryPassword,
      permissions,
      notes,
    } = body;

    if (!fullName || !email) {
      return NextResponse.json(
        { success: false, error: "Full name and email address are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if staff already exists
    const existingStaff = await getAllStaff();
    if (existingStaff.some((s) => s.email.toLowerCase() === cleanEmail)) {
      return NextResponse.json(
        { success: false, error: `An account with email "${cleanEmail}" already exists in staff directory.` },
        { status: 400 }
      );
    }

    // Determine password
    const passwordToSet = temporaryPassword?.trim() || "NextGen@2026!";
    if (passwordToSet.length < 8) {
      return NextResponse.json(
        { success: false, error: "Temporary password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    let authUserId: string | null = null;

    // 1. Create or check Supabase Auth account
    if (isSupabaseServerConfigured()) {
      try {
        const { data: authCreated, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: passwordToSet,
          email_confirm: true,
          user_metadata: {
            fullName: fullName.trim(),
            role,
          },
        });

        if (authError) {
          // If user already exists in Auth, retrieve existing user id
          if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
            const { data: userLookup } = await supabaseAdmin.auth.admin.listUsers();
            const found = userLookup?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
            if (found) {
              authUserId = found.id;
              // Update user password and metadata
              await supabaseAdmin.auth.admin.updateUserById(found.id, {
                password: passwordToSet,
                user_metadata: { fullName: fullName.trim(), role },
              });
            }
          } else {
            console.error("Supabase Auth account creation error:", authError);
            return NextResponse.json(
              { success: false, error: `Failed to create Supabase Auth credentials: ${authError.message}` },
              { status: 400 }
            );
          }
        } else if (authCreated?.user) {
          authUserId = authCreated.user.id;
        }
      } catch (authExc: any) {
        console.error("Auth admin exception:", authExc);
        return NextResponse.json(
          { success: false, error: `Authentication provider error: ${authExc.message}` },
          { status: 500 }
        );
      }
    }

    // 2. Create staff record
    const finalPermissions = permissions || defaultPermissionsForRole(role);
    const newStaff = await createStaff(
      {
        fullName: fullName.trim(),
        email: cleanEmail,
        phoneNumber: phoneNumber || "+91 98765 00000",
        address: "Next Gen DMA Ventures Campus",
        department,
        designation,
        role,
        employmentType,
        joiningDate,
        reportingManager: "Rajesh Khanna",
        employmentStatus: "Active",
        emergencyContact: body.emergencyContact || {
          name: "Campus Administration",
          relation: "Employer",
          phone: "+91 98765 00000",
        },
        permissions: finalPermissions,
        notes: notes || `Created by ${actingStaff?.fullName || "Admin"}.`,
      },
      actingStaff?.fullName || "Admin"
    );

    return NextResponse.json(
      {
        success: true,
        message: `Employee account created successfully for ${newStaff.fullName}.`,
        user: {
          ...newStaff,
          authUserId,
          temporaryPassword: passwordToSet,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create employee account." },
      { status: 500 }
    );
  }
}
