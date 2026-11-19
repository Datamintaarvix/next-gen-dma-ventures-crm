import { NextRequest, NextResponse } from "next/server";
import {
  getBatches,
  createBatch,
  getBatchStats,
} from "@/lib/storage/batches-store";
import { batchSchema } from "@/lib/validations/batch";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const course = searchParams.get("course") || "All";
    const trainer = searchParams.get("trainer") || "All";
    const status = searchParams.get("status") || "All";
    const sortBy = searchParams.get("sortBy") || "name"; // 'name' | 'startDate' | 'capacity' | 'enrolled'
    const order = searchParams.get("order") === "desc" ? "desc" : "asc";

    let batches = await getBatches();

    // Search filter: batch name, code, trainer, course, classroom
    if (search) {
      batches = batches.filter(
        (b) =>
          b.batchName.toLowerCase().includes(search) ||
          b.batchCode.toLowerCase().includes(search) ||
          b.courseName.toLowerCase().includes(search) ||
          b.trainer.toLowerCase().includes(search) ||
          (b.classroom && b.classroom.toLowerCase().includes(search))
      );
    }

    // Filter by course
    if (course && course !== "All") {
      batches = batches.filter((b) => b.courseName === course);
    }

    // Filter by trainer
    if (trainer && trainer !== "All") {
      batches = batches.filter((b) => b.trainer === trainer);
    }

    // Filter by status
    if (status && status !== "All") {
      batches = batches.filter((b) => b.status === status);
    }

    // Sorting
    batches.sort((a, b) => {
      if (sortBy === "startDate") {
        const aTime = new Date(a.startDate).getTime();
        const bTime = new Date(b.startDate).getTime();
        return order === "asc" ? aTime - bTime : bTime - aTime;
      }
      if (sortBy === "capacity") {
        const diff = a.maxCapacity - b.maxCapacity;
        return order === "asc" ? diff : -diff;
      }
      if (sortBy === "enrolled") {
        const diff = (a.enrolledCount || 0) - (b.enrolledCount || 0);
        return order === "asc" ? diff : -diff;
      }
      // default: batch name
      return order === "asc"
        ? a.batchName.localeCompare(b.batchName)
        : b.batchName.localeCompare(a.batchName);
    });

    const stats = await getBatchStats();

    return NextResponse.json({
      success: true,
      total: batches.length,
      data: batches,
      stats,
    });
  } catch (error: any) {
    console.error("API GET /api/batches error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = batchSchema.safeParse(body);

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

    const created = await createBatch(validation.data);
    return NextResponse.json(
      {
        success: true,
        message: "Batch created successfully",
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API POST /api/batches error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create batch" },
      { status: 400 }
    );
  }
}
