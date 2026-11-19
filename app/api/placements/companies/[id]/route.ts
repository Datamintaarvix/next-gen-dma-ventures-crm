import { NextRequest, NextResponse } from "next/server";
import {
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "@/lib/storage/placements-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const company = await getCompanyById(id);

    if (!company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error("GET /api/placements/companies/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch company" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateCompany(id, body);

    if (!updated) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Updated company ${updated.name}`,
      company: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/placements/companies/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update company" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteCompany(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Company removed successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/placements/companies/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete company" },
      { status: 500 }
    );
  }
}
