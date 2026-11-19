import { NextRequest, NextResponse } from "next/server";
import { readAuditLogsFromDisk } from "@/lib/storage/settings-store";

export const dynamic = "force-dynamic";

function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(request: NextRequest) {
  try {
    const logs = await readAuditLogsFromDisk();

    const lines: string[] = [];
    lines.push(`"NEXT GEN DMA VENTURES - CRM ADMINISTRATIVE AUDIT TRAIL"`);
    lines.push(`"Generated On:","${new Date().toLocaleString()}"`);
    lines.push(`"Total Entries:",${logs.length}`);
    lines.push("");
    lines.push(`"Log ID","Timestamp","Administrator","Email","Category","Action","Details","IP Address","Affected ID"`);

    logs.forEach((l) => {
      lines.push(
        [
          escapeCsv(l.id),
          escapeCsv(l.timestamp),
          escapeCsv(l.user),
          escapeCsv(l.userEmail),
          escapeCsv(l.category),
          escapeCsv(l.action),
          escapeCsv(l.details),
          escapeCsv(l.ipAddress || "127.0.0.1"),
          escapeCsv(l.affectedRecordId || "N/A"),
        ].join(",")
      );
    });

    const csvContent = lines.join("\n");
    const filename = `nextgen-crm-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting audit logs to CSV:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export audit logs." },
      { status: 500 }
    );
  }
}
