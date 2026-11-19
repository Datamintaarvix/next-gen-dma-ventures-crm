import { NextRequest, NextResponse } from "next/server";
import {
  getAdmissions,
  createAdmission,
  getAdmissionStats,
} from "@/lib/storage/admissions-store";
import { admissionSchema } from "@/lib/validations/admission";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const course = searchParams.get("course") || "All";
    const batch = searchParams.get("batch") || "All";
    const status = searchParams.get("status") || "All";
    const paymentStatus = searchParams.get("paymentStatus") || "All";
    const counsellor = searchParams.get("counsellor") || "All";
    const sortBy = searchParams.get("sortBy") || "date";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    let admissions = await getAdmissions();

    // Global Search
    if (search) {
      const cleanSearchPhone = search.replace(/[^0-9]/g, "");
      admissions = admissions.filter((a) => {
        const matchName = a.studentName.toLowerCase().includes(search);
        const matchCode = a.admissionCode.toLowerCase().includes(search);
        const matchStudentCode = a.studentCode.toLowerCase().includes(search);
        const matchCourse = a.courseName.toLowerCase().includes(search);
        const matchBatch = a.batchCode.toLowerCase().includes(search) || a.batchName.toLowerCase().includes(search);
        const matchCounsellor = a.counsellor.toLowerCase().includes(search);
        const matchEmail = a.studentEmail.toLowerCase().includes(search);
        const matchPhone =
          a.studentPhone.toLowerCase().includes(search) ||
          (cleanSearchPhone.length >= 4 &&
            a.studentPhone.replace(/[^0-9]/g, "").includes(cleanSearchPhone));

        return (
          matchName ||
          matchCode ||
          matchStudentCode ||
          matchCourse ||
          matchBatch ||
          matchCounsellor ||
          matchEmail ||
          matchPhone
        );
      });
    }

    // Filter by Course
    if (course && course !== "All") {
      admissions = admissions.filter((a) => a.courseName === course);
    }

    // Filter by Batch
    if (batch && batch !== "All") {
      admissions = admissions.filter(
        (a) => a.batchCode === batch || a.batchName === batch
      );
    }

    // Filter by Status
    if (status && status !== "All") {
      if (status === "pending_applications") {
        admissions = admissions.filter(
          (a) => a.status === "Documents Pending" || a.status === "Under Review"
        );
      } else {
        admissions = admissions.filter((a) => a.status === status);
      }
    }

    // Filter by Payment Status
    if (paymentStatus && paymentStatus !== "All") {
      admissions = admissions.filter((a) => a.paymentStatus === paymentStatus);
    }

    // Filter by Counsellor
    if (counsellor && counsellor !== "All") {
      admissions = admissions.filter((a) => a.counsellor === counsellor);
    }

    // Sorting
    admissions.sort((a, b) => {
      if (sortBy === "date") {
        const timeA = new Date(a.admissionDate).getTime();
        const timeB = new Date(b.admissionDate).getTime();
        return order === "asc" ? timeA - timeB : timeB - timeA;
      }
      if (sortBy === "name") {
        return order === "asc"
          ? a.studentName.localeCompare(b.studentName)
          : b.studentName.localeCompare(a.studentName);
      }
      if (sortBy === "fee") {
        return order === "asc" ? a.finalFee - b.finalFee : b.finalFee - a.finalFee;
      }
      if (sortBy === "pending") {
        return order === "asc"
          ? a.pendingAmount - b.pendingAmount
          : b.pendingAmount - a.pendingAmount;
      }
      return 0;
    });

    const stats = await getAdmissionStats();

    return NextResponse.json({
      success: true,
      total: admissions.length,
      data: admissions,
      stats,
    });
  } catch (error: any) {
    console.error("API GET /api/admissions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch admissions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = admissionSchema.safeParse(body);

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

    const newAdmission = await createAdmission(validation.data);

    return NextResponse.json(
      {
        success: true,
        message: `Admission ${newAdmission.admissionCode} created successfully`,
        data: newAdmission,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API POST /api/admissions error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create admission" },
      { status: 400 }
    );
  }
}
