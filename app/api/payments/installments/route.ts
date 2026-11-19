import { NextRequest, NextResponse } from "next/server";
import {
  getInstallmentPlans,
  getInstallmentPlanByAdmission,
  updateInstallmentSchedule,
} from "@/lib/storage/payments-store";
import { updateInstallmentPlanSchema } from "@/lib/validations/payment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const admissionId = searchParams.get("admissionId");

    if (admissionId) {
      const plan = await getInstallmentPlanByAdmission(admissionId);
      if (!plan) {
        return NextResponse.json(
          { success: false, error: "No installment plan found for this admission" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: plan,
      });
    }

    const plans = await getInstallmentPlans();
    return NextResponse.json({
      success: true,
      total: plans.length,
      data: plans,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch installment plans" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = updateInstallmentPlanSchema.safeParse(body);

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

    const updated = await updateInstallmentSchedule(
      validation.data.planId,
      validation.data.installments
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Installment plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Installment schedule updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update installment schedule" },
      { status: 400 }
    );
  }
}
