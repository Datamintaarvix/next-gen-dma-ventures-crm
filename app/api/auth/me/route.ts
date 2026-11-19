import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedStaff } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedStaff(req);
    if (!auth.authenticated || !auth.staff) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error || "Unauthenticated",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
      },
      staff: auth.staff,
      role: auth.role,
      isAdmin: auth.isAdmin,
    });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
