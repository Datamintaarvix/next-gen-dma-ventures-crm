import { NextRequest, NextResponse } from "next/server";
import {
  getPayments,
  recordPayment,
  getPaymentStats,
} from "@/lib/storage/payments-store";
import { createPaymentSchema } from "@/lib/validations/payment";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const course = searchParams.get("course") || "All";
    const method = searchParams.get("method") || "All";
    const status = searchParams.get("status") || "All";
    const dateRange = searchParams.get("dateRange") || "All";
    const sortBy = searchParams.get("sortBy") || "date";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    let payments = await getPayments();

    // Search filter
    if (search) {
      const cleanPhone = search.replace(/[^0-9]/g, "");
      payments = payments.filter((p) => {
        const matchId = p.id.toLowerCase().includes(search);
        const matchRec = p.receiptNo.toLowerCase().includes(search);
        const matchStudent = p.studentName.toLowerCase().includes(search);
        const matchCode = p.studentCode.toLowerCase().includes(search);
        const matchAdm = p.admissionCode.toLowerCase().includes(search);
        const matchCourse = p.courseName.toLowerCase().includes(search);
        const matchRef = p.transactionRef?.toLowerCase().includes(search);
        const matchPhone =
          p.studentPhone.toLowerCase().includes(search) ||
          (cleanPhone.length >= 4 && p.studentPhone.replace(/[^0-9]/g, "").includes(cleanPhone));

        return (
          matchId ||
          matchRec ||
          matchStudent ||
          matchCode ||
          matchAdm ||
          matchCourse ||
          matchRef ||
          matchPhone
        );
      });
    }

    // Filter by Course
    if (course && course !== "All") {
      payments = payments.filter((p) => p.courseName === course);
    }

    // Filter by Payment Method
    if (method && method !== "All") {
      payments = payments.filter((p) => p.paymentMethod === method);
    }

    // Filter by Status
    if (status && status !== "All") {
      payments = payments.filter((p) => p.status === status);
    }

    // Filter by Date Range
    if (dateRange && dateRange !== "All") {
      const today = new Date().toISOString().split("T")[0];
      if (dateRange === "today") {
        payments = payments.filter((p) => p.paymentDate === today);
      } else if (dateRange === "month") {
        const currentMonth = today.substring(0, 7);
        payments = payments.filter((p) => p.paymentDate.startsWith(currentMonth));
      }
    }

    // Sorting
    payments.sort((a, b) => {
      if (sortBy === "date") {
        const timeA = new Date(a.paymentDate).getTime();
        const timeB = new Date(b.paymentDate).getTime();
        return order === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (sortBy === "amount") {
        return order === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortBy === "name") {
        return order === "asc"
          ? a.studentName.localeCompare(b.studentName)
          : b.studentName.localeCompare(a.studentName);
      }
      if (sortBy === "balance") {
        return order === "asc"
          ? a.outstandingBalance - b.outstandingBalance
          : b.outstandingBalance - a.outstandingBalance;
      }
      return 0;
    });

    const stats = await getPaymentStats();

    return NextResponse.json({
      success: true,
      total: payments.length,
      data: payments,
      stats,
    });
  } catch (error: any) {
    console.error("API GET /api/payments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createPaymentSchema.safeParse(body);

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

    const newPayment = await recordPayment(validation.data);

    return NextResponse.json(
      {
        success: true,
        message: `Payment receipt ${newPayment.receiptNo} recorded successfully`,
        data: newPayment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API POST /api/payments error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record payment" },
      { status: 400 }
    );
  }
}
