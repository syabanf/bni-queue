"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatJakartaTime, WIB_LABEL } from "@/lib/utils/time";
import type { ScanMonitorRow } from "@/lib/dev/ops-mock";

const OUTCOME_TONE: Record<ScanMonitorRow["outcome"], BadgeTone> = {
  success: "success",
  duplicate: "duplicate",
  invalid_qr: "invalid",
  invalid_participant: "invalid",
};

export function MonitorTable({ rows }: { rows: ScanMonitorRow[] }) {
  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState<"all" | ScanMonitorRow["outcome"]>("all");
  const [source, setSource] = useState<"all" | ScanMonitorRow["source"]>("all");

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (outcome !== "all" && r.outcome !== outcome) return false;
        if (source !== "all" && r.source !== source) return false;
        if (
          search &&
          !`${r.participant} ${r.booth} ${r.scannedBy}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [rows, search, outcome, source],
  );

  const columns: Column<ScanMonitorRow>[] = [
    { key: "time", header: "Time", render: (r) => <span className="font-mono text-wit-muted">{formatJakartaTime(r.time)} {WIB_LABEL}</span> },
    { key: "participant", header: "Participant", render: (r) => <span className="font-medium">{r.participant}</span> },
    { key: "chapter", header: "Chapter", render: (r) => <span className="text-wit-muted">{r.chapter}</span> },
    { key: "booth", header: "Booth", render: (r) => r.booth },
    { key: "by", header: "Scanned by", render: (r) => <span className="text-wit-muted">{r.scannedBy}</span> },
    { key: "source", header: "Source", render: (r) => <Badge tone={r.source === "manual_input" ? "info" : "neutral"}>{r.source === "manual_input" ? "Manual" : "Camera"}</Badge> },
    { key: "outcome", header: "Outcome", render: (r) => <Badge tone={OUTCOME_TONE[r.outcome]}>{r.outcome.replace("_", " ")}</Badge> },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input className="mt-0 max-w-xs" placeholder="Search participant, booth, PIC…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="mt-0 max-w-[12rem]" value={outcome} onChange={(e) => setOutcome(e.target.value as typeof outcome)}>
          <option value="all">All outcomes</option>
          <option value="success">Success</option>
          <option value="duplicate">Duplicate</option>
          <option value="invalid_qr">Invalid QR</option>
        </Select>
        <Select className="mt-0 max-w-[10rem]" value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
          <option value="all">All sources</option>
          <option value="camera">Camera</option>
          <option value="manual_input">Manual</option>
        </Select>
        <span className="ml-auto self-center text-sm text-wit-muted">{filtered.length} of {rows.length}</span>
      </div>
      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.id}
        empty={<EmptyState title="No scan activity" description="Scans appear here in real time during the event." />}
      />
    </>
  );
}
