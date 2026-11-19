import { NextRequest, NextResponse } from "next/server";
import { getAllStaff, getStaffKPIs, createStaff } from "@/lib/storage/staff-store";
import { staffSchema } from "@/lib/validations/staff";
import { requireAuth, requireAdmin } from "@/lib/auth/server-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authCheck = await requireAuth(req);
    if (authCheck instanceof NextResponse) return authCheck;

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.toLowerCase();

    let list = await getAllStaff();

    if (department && department !== "All") {
      list = list.filter((s) => s.department === department);
    }
    if (role && role !== "All") {
      list = list.filter((s) => s.role === role);
    }
    if (status && status !== "All") {
      list = list.filter((s) => s.employmentStatus === status);
    }
    if (search) {
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search) ||
          s.id.toLowerCase().includes(search) ||
          s.designation.toLowerCase().includes(search) ||
          s.phoneNumber.includes(search)
      );
    }

    const kpis = await getStaffKPIs();

    return NextResponse.json({
      success: true,
      staff: list,
      kpis,
      totalCount: list.length,
    });
  } catch (err: any) {
    console.error("GET /api/staff error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch staff records" },
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
    const validatedData = staffSchema.parse(body);

    const newStaff = await createStaff(validatedData, actingStaff?.fullName || "Admin");

    return NextResponse.json(
      {
        success: true,
        message: "Staff member created successfully",
        staff: newStaff,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/staff error:", err);
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
