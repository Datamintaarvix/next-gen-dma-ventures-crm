import { NextRequest, NextResponse } from "next/server";
import { addCommunicationInteraction } from "@/lib/storage/enquiries-store";
import { interactionSchema } from "@/lib/validations/enquiry";

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

    const updated = await addCommunicationInteraction(params.id, validation.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Enquiry not found" },
        { status: 404 }
      );
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
