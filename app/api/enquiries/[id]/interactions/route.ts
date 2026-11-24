import { NextRequest, NextResponse } from "next/server";
import { addCommunicationInteraction, updateEnquiry } from "@/lib/storage/enquiries-store";
import { interactionSchema } from "@/lib/validations/enquiry";
import { syncEnquiryFollowUp } from "@/lib/services/follow-up-sync";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = interactionSchema.safeParse(body);

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

    let updated = await addCommunicationInteraction(params.id, validation.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found" },
        { status: 404 }
      );
    }

    if (validation.data.type === "Follow-up") {
      const updates: any = { status: "Follow-up" };
      if (validation.data.followUpDate) {
        updates.nextFollowUpDate = validation.data.followUpDate;
      }
      const refreshed = await updateEnquiry(params.id, updates);
      if (refreshed) {
        updated = refreshed;
      }
      await syncEnquiryFollowUp(updated, {
        isFollowUpInteraction: true,
        followUpDate: validation.data.followUpDate,
        staffName: validation.data.staffName,
        interactionSummary: validation.data.summary,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Communication record logged successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to record communication" },
      { status: 500 }
    );
  }
}
