import { NextRequest, NextResponse } from "next/server";
import { getJobs, createJob } from "@/lib/storage/placements-store";
import { jobOpportunitySchema } from "@/lib/validations/placement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const companyId = searchParams.get("companyId") || undefined;
    const course = searchParams.get("course") || undefined;
    const status = searchParams.get("status") || undefined;

    const jobs = await getJobs({ search, companyId, course, status });

    return NextResponse.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error: any) {
    console.error("GET /api/placements/jobs error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = jobOpportunitySchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const job = await createJob(parsed.data);

    return NextResponse.json({
      success: true,
      message: `Job opportunity "${job.jobTitle}" posted successfully`,
      job,
    });
  } catch (error: any) {
    console.error("POST /api/placements/jobs error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create job opportunity" },
      { status: 400 }
    );
  }
}
