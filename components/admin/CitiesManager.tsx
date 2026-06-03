"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { upsertCity, toggleCityStatus, deleteCity } from "@/lib/actions/cities";
import type { ActionResult } from "@/lib/actions/result";
import type { CityRow } from "@/lib/dev/admin-mock";

export function CitiesManager({
  rows,
  readOnly,
}: {
  rows: CityRow[];
  readOnly: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<CityRow | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CityRow | null>(null);
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, startSubmit] = useTransition();
  const [, startToggle] = useTransition();

  function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    startToggle(async () => {
      await deleteCity(id);
      setToDelete(null);
      router.refresh();
    });
  }

  function submit(formData: FormData) {
    startSubmit(async () => {
      const res = await upsertCity(undefined, formData);
      setState(res);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(row: CityRow) {
    setEditing(row);
    setOpen(true);
  }

  const columns: Column<CityRow>[] = [
    { key: "name", header: "City", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "chapters", header: "Chapters", align: "right", render: (r) => r.chapterCount },
    { key: "participants", header: "Participants", align: "right", render: (r) => r.participantCount.toLocaleString() },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge tone={r.status === "active" ? "active" : "inactive"}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) =>
        readOnly ? null : (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                startToggle(() =>
                  toggleCityStatus(
                    r.id,
                    r.status === "active" ? "inactive" : "active",
                  ).then(() => router.refresh()),
                )
              }
            >
              {r.status === "active" ? "Deactivate" : "Activate"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setToDelete(r)}>
              Delete
            </Button>
          </div>
        ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm text-wit-muted">
          {rows.length} {rows.length === 1 ? "city" : "cities"}
        </span>
        {!readOnly ? <Button onClick={openNew}>+ New city</Button> : null}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        empty={
          <EmptyState
            title="No cities yet"
            description="Add the cities hosting BNI chapters to get started."
            action={!readOnly ? <Button onClick={openNew}>+ New city</Button> : undefined}
          />
        }
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit city" : "New city"}
      >
        <form action={submit} className="space-y-4">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <Field label="City name">
            <Input
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              placeholder="e.g. Bandung"
              autoFocus
            />
          </Field>
          <input
            type="hidden"
            name="status"
            value={editing?.status ?? "active"}
          />
          {state?.message ? (
            <p
              className={`text-sm ${state.ok ? "text-wit-success" : "text-wit-red"}`}
            >
              {state.message}
            </p>
          ) : null}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Remove city?"
        description={toDelete?.name}
      >
        <p className="text-sm text-wit-muted">
          Soft-deletes the city. Existing chapters and history are preserved.
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Remove
          </Button>
        </div>
      </Modal>
    </>
  );
}
