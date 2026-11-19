import { NextRequest, NextResponse } from "next/server";
import { getApplications, applyStudentToJob } from "@/lib/storage/placements-store";
import { applyJobSchema } from "@/lib/validations/placement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId") || undefined;
    const studentId = searchParams.get("studentId") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const applications = await getApplications({ jobId, studentId, status, search });

    return NextResponse.json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error: any) {
    console.error("GET /api/placements/applications error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = applyJobSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const application = await applyStudentToJob(
      parsed.data.jobId,
      parsed.data.studentId,
      parsed.data.notes
    );

    return NextResponse.json({
      success: true,
      message: `Candidate ${application.studentName} applied for ${application.jobTitle} at ${application.companyName}`,
      application,
    });
  } catch (error: any) {
    console.error("POST /api/placements/applications error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to apply candidate to job" },
      { status: 400 }
    );
  }
}
