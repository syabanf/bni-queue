import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { getSession } from "@/lib/auth/session";
import { isManagementOrAdmin } from "@/lib/auth/rbac";
import {
  buildReportDataset,
  isReportType,
  type ReportDataset,
} from "@/lib/reports/datasets";

/**
 * GET /api/reports/:type/export?format=xlsx|csv
 * Streams a report as Excel (default) or CSV. Admin/management only.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const session = await getSession();
  if (!session || !isManagementOrAdmin(session.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { type } = await params;
  if (!isReportType(type)) {
    return NextResponse.json({ error: "unknown report" }, { status: 404 });
  }

  const dataset = await buildReportDataset(type);
  const format = req.nextUrl.searchParams.get("format") === "csv" ? "csv" : "xlsx";

  if (format === "csv") {
    const csv = toCsv(dataset);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${dataset.filename}.csv"`,
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(dataset.sheet);
  ws.addRow(dataset.columns);
  ws.getRow(1).font = { bold: true };
  dataset.rows.forEach((r) => ws.addRow(r));
  ws.columns.forEach((col) => {
    col.width = 22;
  });
  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${dataset.filename}.xlsx"`,
    },
  });
}

function toCsv(ds: ReportDataset): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [ds.columns.map(esc).join(",")];
  for (const row of ds.rows) lines.push(row.map(esc).join(","));
  return lines.join("\n");
}
