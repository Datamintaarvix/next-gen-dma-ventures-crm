import { NextRequest, NextResponse } from "next/server";
import { getEnquiries, createEnquiry } from "@/lib/storage/enquiries-store";
import { enquirySchema } from "@/lib/validations/enquiry";
import { syncEnquiryFollowUp } from "@/lib/services/follow-up-sync";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const status = searchParams.get("status") || "All";
    const course = searchParams.get("course") || "All";
    const source = searchParams.get("source") || "All";
    const date = searchParams.get("date") || "";
    const sort = searchParams.get("sort") || "newest";

    let enquiries = await getEnquiries();

    // Search filter
    if (search) {
      enquiries = enquiries.filter(
        (e) =>
          e.studentName.toLowerCase().includes(search) ||
          e.phoneNumber.toLowerCase().includes(search) ||
          e.email?.toLowerCase().includes(search) ||
          e.interestedCourse.toLowerCase().includes(search) ||
          e.assignedCounsellor.toLowerCase().includes(search) ||
          e.enquiryCode.toLowerCase().includes(search) ||
          e.enquiryMessage.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (status && status !== "All") {
      enquiries = enquiries.filter((e) => e.status === status);
    }

    // Course filter
    if (course && course !== "All") {
      enquiries = enquiries.filter((e) => e.interestedCourse === course);
    }

    // Source filter
    if (source && source !== "All") {
      enquiries = enquiries.filter((e) => e.enquirySource === source);
    }

    // Date filter
    if (date) {
      enquiries = enquiries.filter((e) => e.enquiryDate === date);
    }

    // Sort by newest or oldest
    enquiries.sort((a, b) => {
      const aTime = new Date(a.enquiryDate || a.createdAt).getTime();
      const bTime = new Date(b.enquiryDate || b.createdAt).getTime();
      return sort === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return NextResponse.json({
      success: true,
      total: enquiries.length,
      data: enquiries,
    });
  } catch (error: any) {
    console.error("API GET /api/enquiries error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch enquiries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = enquirySchema.safeParse(body);

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

    const created = await createEnquiry(validation.data);
    await syncEnquiryFollowUp(created);

    return NextResponse.json(
      {
        success: true,
        message: "Enquiry created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API POST /api/enquiries error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create enquiry" },
      { status: 500 }
    );
  }
}
