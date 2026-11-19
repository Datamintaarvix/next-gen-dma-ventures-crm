import { NextRequest, NextResponse } from "next/server";
import { getBackupRawContent } from "@/lib/storage/settings-store";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const backupId = params.id;
    // backupId might be "BKP-..." or a file name
    const fileName = backupId.endsWith(".json")
      ? backupId
      : `nextgen_crm_backup_${backupId.replace("BKP-", "")}.json`;

    const content = getBackupRawContent(fileName);
    if (!content) {
      return NextResponse.json(
        { success: false, error: `Backup file "${fileName}" not found.` },
        { status: 404 }
      );
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error("Error downloading backup:", error);
    return NextResponse.json(
      { success: false, error: "Failed to download backup." },
      { status: 500 }
    );
  }
}
