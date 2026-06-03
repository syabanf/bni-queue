"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  upsertChapter,
  toggleChapterStatus,
  deleteChapter,
} from "@/lib/actions/chapters";
import type { ActionResult } from "@/lib/actions/result";
import type { ChapterRow } from "@/lib/dev/admin-mock";

export function ChaptersManager({
  rows,
  cityOptions,
  readOnly,
}: {
  rows: ChapterRow[];
  cityOptions: Array<{ id: string; name: string }>;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<ChapterRow | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<ChapterRow | null>(null);
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, startSubmit] = useTransition();
  const [, startToggle] = useTransition();

  function submit(formData: FormData) {
    startSubmit(async () => {
      const res = await upsertChapter(undefined, formData);
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
      await deleteChapter(id);
      setToDelete(null);
      router.refresh();
    });
  }

  const columns: Column<ChapterRow>[] = [
    { key: "name", header: "Chapter", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "city", header: "City", render: (r) => <span className="text-wit-muted">{r.cityName}</span> },
    { key: "participants", header: "Participants", align: "right", render: (r) => r.participantCount.toLocaleString() },
    { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "active" ? "active" : "inactive"}>{r.status}</Badge> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) =>
        readOnly ? null : (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => startToggle(() => toggleChapterStatus(r.id, r.status === "active" ? "inactive" : "active").then(() => router.refresh()))}>
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
          {rows.length} {rows.length === 1 ? "chapter" : "chapters"}
        </span>
        {!readOnly ? (
          <Button onClick={() => { setEditing(null); setOpen(true); }}>+ New chapter</Button>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        empty={<EmptyState title="No chapters yet" description="Create chapters and link them to a city." />}
      />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit chapter" : "New chapter"}>
        <form action={submit} className="space-y-4">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <Field label="Chapter name">
            <Input name="name" required defaultValue={editing?.name ?? ""} placeholder="e.g. BNI Bandung A" autoFocus />
          </Field>
          <Field label="City">
            <Select name="city_id" required defaultValue={editing?.city_id ?? ""}>
              <option value="" disabled>Select a city…</option>
              {cityOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
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
        title="Remove chapter?"
        description={toDelete?.name}
      >
        <p className="text-sm text-wit-muted">
          Soft-deletes the chapter. Participant history is preserved.
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Remove</Button>
        </div>
      </Modal>
    </>
  );
}
