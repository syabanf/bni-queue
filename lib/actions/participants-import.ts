"use server";

import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/auth/rbac";
import { isMockMode } from "@/lib/data/mode";
import { signNewQrToken } from "@/lib/qr/token";
import { writeAuditLog } from "@/lib/audit/log";
import { DEMO_NOTICE } from "./result";

export interface ImportResult {
  ok: boolean;
  message?: string;
  inserted: number;
  failed: number;
  errors: Array<{ row: number; reason: string }>;
}

const empty: ImportResult = { ok: false, inserted: 0, failed: 0, errors: [] };

interface ParsedRow {
  name: string;
  phone: string;
  email: string;
  city: string;
  chapter: string;
  code: string;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

async function parseFile(file: File): Promise<ParsedRow[]> {
  const buf = Buffer.from(await file.arrayBuffer());
  const isCsv =
    file.name.toLowerCase().endsWith(".csv") || file.type.includes("csv");

  const records: Array<Record<string, string>> = [];

  if (isCsv) {
    const text = buf.toString("utf8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];
    const headers = splitCsvLine(lines[0]!).map(normalizeHeader);
    for (let i = 1; i < lines.length; i++) {
      const cells = splitCsvLine(lines[i]!);
      const rec: Record<string, string> = {};
      headers.forEach((h, idx) => (rec[h] = (cells[idx] ?? "").trim()));
      records.push(rec);
    }
  } else {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
    const ws = wb.worksheets[0];
    if (!ws) return [];
    const headers: string[] = [];
    ws.getRow(1).eachCell((cell, col) => {
      headers[col] = normalizeHeader(String(cell.value ?? ""));
    });
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const rec: Record<string, string> = {};
      row.eachCell((cell, col) => {
        const key = headers[col];
        if (key) rec[key] = String(cell.value ?? "").trim();
      });
      records.push(rec);
    });
  }

  return records.map((r) => ({
    name: r["name"] ?? "",
    phone: r["phone"] ?? "",
    email: r["email"] ?? "",
    city: r["city"] ?? "",
    chapter: r["chapter"] ?? "",
    code: r["code"] ?? "",
  }));
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export async function importParticipants(
  _prev: ImportResult | undefined,
  formData: FormData,
): Promise<ImportResult> {
  const session = await requireRole(ADMIN_ROLES);
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ...empty, message: "Choose a .csv or .xlsx file." };
  }

  if (await isMockMode()) {
    // Still parse so the admin sees the file was read, but don't persist.
    const parsed = await parseFile(file);
    return {
      ok: false,
      message: `${DEMO_NOTICE} Parsed ${parsed.length} rows.`,
      inserted: 0,
      failed: 0,
      errors: [],
    };
  }

  const rows = await parseFile(file);
  if (rows.length === 0) {
    return { ...empty, message: "No data rows found." };
  }

  const supabase = await createSupabaseServerClient();

  // Build lookup maps for city + chapter by name.
  const [{ data: cities }, { data: chapters }] = await Promise.all([
    supabase.from("cities").select("id, name").is("deleted_at", null),
    supabase.from("chapters").select("id, name, city_id").is("deleted_at", null),
  ]);
  const cityByName = new Map<string, string>();
  for (const c of (cities ?? []) as Array<{ id: string; name: string }>) {
    cityByName.set(c.name.toLowerCase(), c.id);
  }
  const chapterByKey = new Map<string, string>();
  for (const ch of (chapters ?? []) as Array<{
    id: string;
    name: string;
    city_id: string;
  }>) {
    chapterByKey.set(`${ch.city_id}:${ch.name.toLowerCase()}`, ch.id);
  }

  const errors: ImportResult["errors"] = [];
  const payloads: Array<Record<string, unknown>> = [];

  rows.forEach((r, idx) => {
    const rowNum = idx + 2; // +1 header, +1 to 1-base
    if (!r.name) {
      errors.push({ row: rowNum, reason: "Missing name" });
      return;
    }
    const cityId = cityByName.get(r.city.toLowerCase());
    if (!cityId) {
      errors.push({ row: rowNum, reason: `Unknown city "${r.city}"` });
      return;
    }
    const chapterId = chapterByKey.get(`${cityId}:${r.chapter.toLowerCase()}`);
    if (!chapterId) {
      errors.push({
        row: rowNum,
        reason: `Unknown chapter "${r.chapter}" in ${r.city}`,
      });
      return;
    }
    const { token } = signNewQrToken(1);
    const code =
      r.code || `BNI-NATCON-${String(Date.now()).slice(-6)}${idx}`;
    payloads.push({
      code,
      name: r.name,
      phone: r.phone || null,
      email: r.email || null,
      city_id: cityId,
      chapter_id: chapterId,
      qr_token: token,
      qr_version: 1,
    });
  });

  let inserted = 0;
  if (payloads.length > 0) {
    // Insert in batches of 500.
    for (let i = 0; i < payloads.length; i += 500) {
      const batch = payloads.slice(i, i + 500);
      const { error, count } = await supabase
        .from("participants")
        .insert(batch as never, { count: "exact" });
      if (error) {
        errors.push({ row: 0, reason: `Batch insert failed: ${error.message}` });
      } else {
        inserted += count ?? batch.length;
      }
    }
  }

  await writeAuditLog({
    userId: session.userId,
    action: "participant.import",
    module: "participants",
    newValue: { inserted, failed: errors.length, fileName: file.name },
  });

  revalidatePath("/admin/participants");
  return {
    ok: inserted > 0,
    message: `Imported ${inserted} participant(s). ${errors.length} row(s) skipped.`,
    inserted,
    failed: errors.length,
    errors: errors.slice(0, 50),
  };
}
