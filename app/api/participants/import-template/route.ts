import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { getSession } from "@/lib/auth/session";
import { isManagementOrAdmin } from "@/lib/auth/rbac";

/**
 * GET /api/participants/import-template?format=xlsx|csv
 * Downloads a ready-to-fill participant import template with the exact column
 * headers the importer expects (name, city, chapter required; phone, email,
 * code optional) plus two example rows. Admin/management only.
 */

const COLUMNS = ["name", "city", "chapter", "phone", "email", "code"];
const SAMPLES: string[][] = [
  ["Budi Santoso", "Bandung", "BNI Bandung A", "081234567890", "budi@email.com", ""],
  ["Siti Aminah", "Jakarta", "BNI Jakarta Selatan", "081298765432", "siti@email.com", ""],
];

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isManagementOrAdmin(session.role)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const format = req.nextUrl.searchParams.get("format") === "csv" ? "csv" : "xlsx";

  if (format === "csv") {
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const lines = [COLUMNS.join(","), ...SAMPLES.map((r) => r.map(esc).join(","))];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="participant-import-template.csv"',
      },
    });
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Participants");
  ws.addRow(COLUMNS);
  ws.getRow(1).font = { bold: true };
  SAMPLES.forEach((r) => ws.addRow(r));
  ws.columns.forEach((col) => {
    col.width = 22;
  });
  // A second sheet documenting the rules.
  const guide = wb.addWorksheet("How to fill");
  guide.addRow(["Column", "Required", "Notes"]);
  guide.getRow(1).font = { bold: true };
  [
    ["name", "Yes", "Participant full name"],
    ["city", "Yes", "Must match an existing city exactly"],
    ["chapter", "Yes", "Must match an existing chapter in that city"],
    ["phone", "No", "Optional"],
    ["email", "No", "Optional, must be a valid email if present"],
    ["code", "No", "Optional; auto-generated if blank"],
  ].forEach((r) => guide.addRow(r));
  guide.columns.forEach((c) => (c.width = 30));

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="participant-import-template.xlsx"',
    },
  });
}
