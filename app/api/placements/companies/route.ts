import { NextRequest, NextResponse } from "next/server";
import { getCompanies, createCompany } from "@/lib/storage/placements-store";
import { companySchema } from "@/lib/validations/placement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const companies = await getCompanies(search, status);

    return NextResponse.json({
      success: true,
      count: companies.length,
      companies,
    });
  } catch (error: any) {
    console.error("GET /api/placements/companies error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = companySchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const company = await createCompany(parsed.data);

    return NextResponse.json({
      success: true,
      message: `Partner company ${company.name} registered successfully`,
      company,
    });
  } catch (error: any) {
    console.error("POST /api/placements/companies error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create company" },
      { status: 400 }
    );
  }
}
