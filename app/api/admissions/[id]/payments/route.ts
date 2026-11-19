import { NextRequest, NextResponse } from "next/server";
import { recordAdmissionPayment } from "@/lib/storage/admissions-store";
import { addPaymentSchema } from "@/lib/validations/admission";

export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const validation = addPaymentSchema.safeParse(body);

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

    const updated = await recordAdmissionPayment(params.id, {
      amount: validation.data.amount,
      paymentMethod: validation.data.paymentMethod,
      date: validation.data.date,
      receiptNo: validation.data.receiptNo,
      transactionRef: validation.data.transactionRef || undefined,
      remarks: validation.data.remarks || undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Admission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record payment" },
      { status: 400 }
    );
  }
}
