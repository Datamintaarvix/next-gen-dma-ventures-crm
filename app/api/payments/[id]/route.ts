import { NextRequest, NextResponse } from "next/server";
import { getPaymentById } from "@/lib/storage/payments-store";

export const dynamic = "force-dynamic";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const payment = await getPaymentById(params.id);
    if (!payment) {
      return NextResponse.json(
        { success: false, error: "Payment transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment details" },
      { status: 500 }
    );
  }
}
