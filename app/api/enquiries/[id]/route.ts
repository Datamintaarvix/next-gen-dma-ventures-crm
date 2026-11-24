import { NextRequest, NextResponse } from "next/server";
import { getEnquiryById, updateEnquiry, deleteEnquiry } from "@/lib/storage/enquiries-store";
import { enquirySchema } from "@/lib/validations/enquiry";
import { syncEnquiryFollowUp } from "@/lib/services/follow-up-sync";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const enquiry = await getEnquiryById(params.id);
    if (!enquiry) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: enquiry });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch enquiry" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = enquirySchema.safeParse(body);

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

    const updated = await updateEnquiry(params.id, validation.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found" },
        { status: 404 }
      );
    }

    await syncEnquiryFollowUp(updated);

    return NextResponse.json({
      success: true,
      message: "Enquiry updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update enquiry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const success = await deleteEnquiry(params.id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete enquiry" },
      { status: 500 }
    );
  }
}
