import { NextRequest, NextResponse } from "next/server";
import { acceptPlacementOffer } from "@/lib/storage/placements-store";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const offer = await acceptPlacementOffer(id);

    if (!offer) {
      return NextResponse.json(
        { success: false, error: "Placement offer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Offer accepted! ${offer.studentName} is officially placed at ${offer.companyName} (${offer.offeredSalaryDisplay})`,
      offer,
    });
  } catch (error: any) {
    console.error("POST /api/placements/offers/[id]/accept error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to accept offer" },
      { status: 400 }
    );
  }
}
