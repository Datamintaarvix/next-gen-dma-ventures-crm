import { NextRequest, NextResponse } from "next/server";
import { updateAdmissionStatus } from "@/lib/storage/admissions-store";
import { admissionStatusUpdateSchema } from "@/lib/validations/admission";

export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = admissionStatusUpdateSchema.safeParse(body);

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

    const { status, remarks, staffName } = validation.data;
    const updated = await updateAdmissionStatus(params.id, status, remarks, staffName);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Admission status updated to "${status}"`,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update admission status" },
      { status: 400 }
    );
  }
}
