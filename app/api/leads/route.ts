import { NextRequest, NextResponse } from "next/server";
import { getLeads, createLead } from "@/lib/storage/leads-store";
import { leadSchema } from "@/lib/validations/lead";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const status = searchParams.get("status") || "All";
    const course = searchParams.get("course") || "All";
    const sortBy = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    let leads = await getLeads();

    // Filter by search
    if (search) {
      leads = leads.filter(
        (lead) =>
          lead.studentName.toLowerCase().includes(search) ||
          lead.phoneNumber.toLowerCase().includes(search) ||
          lead.email?.toLowerCase().includes(search) ||
          lead.interestedCourse.toLowerCase().includes(search) ||
          lead.assignedCounselor.toLowerCase().includes(search) ||
          lead.leadCode.toLowerCase().includes(search)
      );
    }

    // Filter by status
    if (status && status !== "All") {
      leads = leads.filter((lead) => lead.status === status);
    }

    // Filter by course
    if (course && course !== "All") {
      leads = leads.filter((lead) => lead.interestedCourse === course);
    }

    // Sort
    leads.sort((a: any, b: any) => {
      const aVal = a[sortBy] ?? "";
      const bVal = b[sortBy] ?? "";
      if (aVal < bVal) return order === "asc" ? -1 : 1;
      if (aVal > bVal) return order === "asc" ? 1 : -1;
      return 0;
    });

    return NextResponse.json({
      success: true,
      total: leads.length,
      data: leads,
    });
  } catch (error: any) {
    console.error("API GET /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = leadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const created = await createLead(validation.data);
    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API POST /api/leads error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
