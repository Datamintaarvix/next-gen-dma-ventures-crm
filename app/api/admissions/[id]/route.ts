import { NextRequest, NextResponse } from "next/server";
import {
  getAdmissionById,
  updateAdmission,
  deleteAdmission,
} from "@/lib/storage/admissions-store";
import { admissionSchema } from "@/lib/validations/admission";

export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const admission = await getAdmissionById(params.id);
    if (!admission) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: admission,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch admission details" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = admissionSchema.partial().safeParse(body);

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

    const updated = await updateAdmission(params.id, validation.data);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admission updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update admission" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const success = await deleteAdmission(params.id);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admission deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete admission" },
      { status: 500 }
    );
  }
}
