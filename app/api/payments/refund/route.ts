import { NextRequest, NextResponse } from "next/server";
import { recordRefund } from "@/lib/storage/payments-store";
import { refundPaymentSchema } from "@/lib/validations/payment";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = refundPaymentSchema.safeParse(body);

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

    const refund = await recordRefund(validation.data);

    return NextResponse.json({
      success: true,
      message: `Refund of ₹${Math.abs(refund.amount).toLocaleString("en-IN")} processed with reference ${refund.receiptNo}`,
      data: refund,
    });
  } catch (error: any) {
    console.error("API POST /api/payments/refund error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process refund" },
      { status: 400 }
    );
  }
}
