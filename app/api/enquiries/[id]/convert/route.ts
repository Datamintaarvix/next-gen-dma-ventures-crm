import { NextRequest, NextResponse } from "next/server";
import { convertEnquiryToLead } from "@/lib/storage/enquiries-store";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const result = await convertEnquiryToLead(params.id);
    return NextResponse.json({
      success: true,
      message: `Enquiry successfully converted to Lead ${result.lead.leadCode}`,
      data: result,
    });
  } catch (error: any) {
    console.error("API POST /api/enquiries/[id]/convert error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to convert enquiry to lead" },
      { status: 400 }
    );
  }
}
