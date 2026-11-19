import { NextRequest, NextResponse } from "next/server";
import {
  getJobById,
  updateJob,
  deleteJob,
} from "@/lib/storage/placements-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await getJobById(id);

    if (!job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    console.error("GET /api/placements/jobs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch job" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateJob(id, body);

    if (!updated) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Updated job ${updated.jobTitle}`,
      job: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/placements/jobs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update job" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteJob(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Job opportunity deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/placements/jobs/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete job" },
      { status: 500 }
    );
  }
}
