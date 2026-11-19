import { NextRequest, NextResponse } from "next/server";
import { getOffers, recordPlacementOffer } from "@/lib/storage/placements-store";
import { recordOfferSchema } from "@/lib/validations/placement";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const offers = await getOffers();
    return NextResponse.json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (error: any) {
    console.error("GET /api/placements/offers error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = recordOfferSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      return NextResponse.json(
        { success: false, error: errorMsg, issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const offer = await recordPlacementOffer(parsed.data);

    return NextResponse.json({
      success: true,
      message: `Placement offer of ${offer.offeredSalaryDisplay} recorded for ${offer.studentName}`,
      offer,
    });
  } catch (error: any) {
    console.error("POST /api/placements/offers error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record placement offer" },
      { status: 400 }
    );
  }
}
