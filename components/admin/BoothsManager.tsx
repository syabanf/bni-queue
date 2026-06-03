"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { upsertBooth, toggleBoothStatus, deleteBooth } from "@/lib/actions/booths";
import { formatJakartaTime, WIB_LABEL } from "@/lib/utils/time";
import type { ActionResult } from "@/lib/actions/result";
import type { BoothRow } from "@/lib/dev/admin-mock";

export function BoothsManager({
  rows,
  readOnly,
}: {
  rows: BoothRow[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<BoothRow | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<BoothRow | null>(null);
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, startSubmit] = useTransition();
  const [, startToggle] = useTransition();

  function submit(formData: FormData) {
    startSubmit(async () => {
      const res = await upsertBooth(undefined, formData);
      setState(res);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    startToggle(async () => {
      await deleteBooth(id);
      setToDelete(null);
      router.refresh();
    });
  }

  const columns: Column<BoothRow>[] = [
    {
      key: "booth",
      header: "Booth",
      render: (r) => (
        <div>
          <p className="font-medium">{r.name}</p>
          <p className="text-xs text-wit-muted">{r.code}{r.location ? ` · ${r.location}` : ""}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (r) => r.category ? <Badge tone="info">{r.category}</Badge> : <span className="text-wit-gray">—</span> },
    { key: "pic", header: "PIC", render: (r) => r.picName ?? <span className="text-wit-gray">Unassigned</span> },
    { key: "visitors", header: "Visitors", align: "right", render: (r) => r.visitorCount.toLocaleString() },
    { key: "last", header: "Last scan", align: "right", render: (r) => r.lastScanAt ? `${formatJakartaTime(r.lastScanAt)} ${WIB_LABEL}` : "—" },
    { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "active" ? "active" : "inactive"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) =>
        readOnly ? null : (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => startToggle(() => toggleBoothStatus(r.id, r.status === "active" ? "inactive" : "active").then(() => router.refresh()))}>
              {r.status === "active" ? "Deactivate" : "Activate"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setToDelete(r)}>Delete</Button>
          </div>
        ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm text-wit-muted">
          {rows.length} {rows.length === 1 ? "booth" : "booths"}
        </span>
        {!readOnly ? (
          <Button onClick={() => { setEditing(null); setOpen(true); }}>+ New booth</Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        empty={<EmptyState title="No booths yet" description="Create booths, then assign a PIC from the Users page." />}
      />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit booth" : "New booth"}>
        <form action={submit} className="space-y-4">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code"><Input name="code" required defaultValue={editing?.code ?? ""} placeholder="B-A01" autoFocus /></Field>
            <Field label="Category"><Input name="category" defaultValue={editing?.category ?? ""} placeholder="Sponsor" /></Field>
          </div>
          <Field label="Booth name"><Input name="name" required defaultValue={editing?.name ?? ""} placeholder="Sponsor Booth A" /></Field>
          <Field label="Location"><Input name="location" defaultValue={editing?.location ?? ""} placeholder="Main Hall · Aisle 1" /></Field>
          <input type="hidden" name="status" value={editing?.status ?? "active"} />
          {state?.message ? (
            <p className={`text-sm ${state.ok ? "text-wit-success" : "text-wit-red"}`}>{state.message}</p>
          ) : null}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Remove booth?"
        description={toDelete ? `${toDelete.name} (${toDelete.code})` : ""}
      >
        <p className="text-sm text-wit-muted">
          Soft-deletes the booth. Stamp history is preserved.
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Remove</Button>
        </div>
      </Modal>
    </>
  );
}
