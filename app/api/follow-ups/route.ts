import { NextRequest, NextResponse } from "next/server";
import { getFollowUps, createFollowUp } from "@/lib/storage/follow-ups-store";
import { followUpSchema } from "@/lib/validations/follow-up";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const status = searchParams.get("status") || "All";
    const priority = searchParams.get("priority") || "All";
    const counsellor = searchParams.get("counsellor") || "All";
    const type = searchParams.get("type") || "All";
    const date = searchParams.get("date") || "";
    const relatedType = searchParams.get("relatedType");
    const relatedId = searchParams.get("relatedId");
    const sortBy = searchParams.get("sortBy") || "date"; // 'date' | 'priority'
    const order = searchParams.get("order") === "desc" ? "desc" : "asc";

    let list = await getFollowUps();

    // Related filter
    if (relatedType && relatedId) {
      list = list.filter(
        (f) =>
          f.relatedType === relatedType &&
          (f.relatedId === relatedId || f.relatedCode === relatedId)
      );
    }

    // Search filter
    if (search) {
      list = list.filter(
        (f) =>
          f.studentName.toLowerCase().includes(search) ||
          f.contactNumber.toLowerCase().includes(search) ||
          f.followUpCode.toLowerCase().includes(search) ||
          (f.relatedCode && f.relatedCode.toLowerCase().includes(search)) ||
          f.assignedCounsellor.toLowerCase().includes(search) ||
          (f.notes && f.notes.toLowerCase().includes(search))
      );
    }

    // Status filter
    if (status && status !== "All") {
      list = list.filter((f) => f.status === status);
    }

    // Priority filter
    if (priority && priority !== "All") {
      list = list.filter((f) => f.priority === priority);
    }

    // Counsellor filter
    if (counsellor && counsellor !== "All") {
      list = list.filter((f) => f.assignedCounsellor === counsellor);
    }

    // Type filter
    if (type && type !== "All") {
      list = list.filter((f) => f.type === type);
    }

    // Date filter
    if (date) {
      list = list.filter((f) => f.followUpDate === date);
    }

    // Sort
    const priorityWeight: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
    list.sort((a, b) => {
      if (sortBy === "priority") {
        const diff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        return order === "desc" ? -diff : diff;
      }
      // Default: sort by date and time
      const aDateTime = `${a.followUpDate}T${a.followUpTime || "00:00"}`;
      const bDateTime = `${b.followUpDate}T${b.followUpTime || "00:00"}`;
      if (aDateTime < bDateTime) return order === "asc" ? -1 : 1;
      if (aDateTime > bDateTime) return order === "asc" ? 1 : -1;
      return 0;
    });

    return NextResponse.json({
      success: true,
      total: list.length,
      data: list,
    });
  } catch (error: any) {
    console.error("API GET /api/follow-ups error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch follow-ups" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = followUpSchema.safeParse(body);

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

    const created = await createFollowUp(validation.data);
    return NextResponse.json(
      {
        success: true,
        message: "Follow-up created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API POST /api/follow-ups error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create follow-up" },
      { status: 500 }
    );
  }
}
