import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseServerConfigured } from "@/lib/supabase/server";
import { getStaffByEmail } from "@/lib/storage/staff-store";
import { StaffRecord, CrmModule, ModulePermission } from "@/lib/validations/staff";

export interface AuthContextResult {
  authenticated: boolean;
  user: any | null;
  staff: StaffRecord | null;
  isAdmin: boolean;
  role: string | null;
  error?: string;
}

/**
 * Extracts and verifies the authenticated staff member from a NextRequest.
 * Checks Bearer Authorization header and cookies.
 */
export async function getAuthenticatedStaff(req: NextRequest): Promise<AuthContextResult> {
  if (!isSupabaseServerConfigured()) {
    // If Supabase is not configured, fallback to default Super Admin for offline mode
    const defaultAdmin = (await getStaffByEmail("info@datamintaarvix.com")) || (await getStaffByEmail("rajesh.khanna@nextgendma.com"));
    return {
      authenticated: true,
      user: { id: "local-admin", email: "info@datamintaarvix.com" },
      staff: defaultAdmin,
      isAdmin: true,
      role: "Super Admin",
    };
  }

  // 1. Check for Service Role Key bypass (for internal CLI test scripts)
  const serviceKeyHeader = req.headers.get("x-service-role-key");
  const authHeader = req.headers.get("authorization") || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    serviceKey &&
    (serviceKeyHeader === serviceKey || authHeader === `Bearer ${serviceKey}`)
  ) {
    const superAdmin = (await getStaffByEmail("info@datamintaarvix.com")) || (await getStaffByEmail("rajesh.khanna@nextgendma.com"));
    return {
      authenticated: true,
      user: { id: "service-admin", email: "info@datamintaarvix.com" },
      staff: superAdmin,
      isAdmin: true,
      role: "Super Admin",
    };
  }

  // 2. Extract JWT Token
  let token: string | null = null;
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else {
    // Check cookies
    const cookieToken =
      req.cookies.get("sb-access-token")?.value ||
      req.cookies.get("sb_access_token")?.value ||
      req.cookies.get("supabase-auth-token")?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) {
    return {
      authenticated: false,
      user: null,
      staff: null,
      isAdmin: false,
      role: null,
      error: "Authentication token missing.",
    };
  }

  // 3. Verify Token with Supabase Auth
  try {
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user?.email) {
      return {
        authenticated: false,
        user: null,
        staff: null,
        isAdmin: false,
        role: null,
        error: userError ? userError.message : "Invalid or expired session token.",
      };
    }

    const email = userData.user.email.toLowerCase().trim();
    const staff = await getStaffByEmail(email);

    if (!staff) {
      return {
        authenticated: false,
        user: userData.user,
        staff: null,
        isAdmin: false,
        role: null,
        error: "No active staff profile linked to this authenticated account.",
      };
    }

    if (staff.employmentStatus !== "Active") {
      return {
        authenticated: false,
        user: userData.user,
        staff,
        isAdmin: false,
        role: staff.role,
        error: "Your employee account has been deactivated. Please contact your CRM Administrator.",
      };
    }

    const isAdmin = staff.role === "Super Admin" || staff.role === "Admin";

    return {
      authenticated: true,
      user: userData.user,
      staff,
      isAdmin,
      role: staff.role,
    };
  } catch (err: any) {
    console.error("Auth verification error:", err);
    return {
      authenticated: false,
      user: null,
      staff: null,
      isAdmin: false,
      role: null,
      error: "Session validation failed.",
    };
  }
}

/**
 * Enforces that the request is authenticated.
 * Returns null if allowed, or a 401 NextResponse if unauthorized.
 */
export async function requireAuth(req: NextRequest): Promise<{ auth: AuthContextResult } | NextResponse> {
  const auth = await getAuthenticatedStaff(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      {
        success: false,
        error: auth.error || "Authentication required. Please sign in.",
      },
      { status: 401 }
    );
  }
  return { auth };
}

/**
 * Enforces that the authenticated user is an Administrator (Admin or Super Admin).
 * Returns null if allowed, or a 401/403 NextResponse if denied.
 */
export async function requireAdmin(req: NextRequest): Promise<{ auth: AuthContextResult } | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;

  const { auth } = result;
  if (!auth.isAdmin) {
    return NextResponse.json(
      {
        success: false,
        error: "Access denied. Administrator privileges required.",
      },
      { status: 403 }
    );
  }

  return { auth };
}

/**
 * Enforces module-level RBAC permission for the authenticated staff member.
 */
export async function requireModulePermission(
  req: NextRequest,
  module: CrmModule,
  action: keyof ModulePermission
): Promise<{ auth: AuthContextResult } | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;

  const { auth } = result;
  if (auth.isAdmin) {
    return { auth }; // Admins have universal permission
  }

  const staff = auth.staff;
  if (!staff) {
    return NextResponse.json(
      { success: false, error: "Access denied. Employee profile not found." },
      { status: 403 }
    );
  }

  const perms = staff.permissions || {};
  const modulePerms = perms[module];

  if (!modulePerms || !modulePerms[action]) {
    return NextResponse.json(
      {
        success: false,
        error: `Access denied. You do not have '${action}' permission for ${module}.`,
      },
      { status: 403 }
    );
  }

  return { auth };
}
