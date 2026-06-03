"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select } from "@/components/ui/Field";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/lib/actions/users";
import type { ActionResult } from "@/lib/actions/result";
import type { AdminUserRow } from "@/lib/dev/admin-mock";

const ROLE_LABEL: Record<AdminUserRow["role"], string> = {
  super_admin: "Super Admin",
  event_admin: "Event Admin",
  booth_pic: "Booth PIC",
  management_viewer: "Management Viewer",
  display_operator: "Display Operator",
};

export function UsersManager({
  rows,
  boothOptions,
  readOnly,
}: {
  rows: AdminUserRow[];
  boothOptions: Array<{ id: string; name: string }>;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [role, setRole] = useState<AdminUserRow["role"]>("booth_pic");
  const [toDelete, setToDelete] = useState<AdminUserRow | null>(null);
  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, startSubmit] = useTransition();
  const [, startDelete] = useTransition();

  function openNew() {
    setEditing(null);
    setRole("booth_pic");
    setState(null);
    setOpen(true);
  }
  function openEdit(u: AdminUserRow) {
    setEditing(u);
    setRole(u.role);
    setState(null);
    setOpen(true);
  }

  function submit(formData: FormData) {
    startSubmit(async () => {
      const res = editing
        ? await updateUserAction(undefined, formData)
        : await createUserAction(undefined, formData);
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
    startDelete(async () => {
      const res = await deleteUserAction(id);
      setState(res);
      setToDelete(null);
      router.refresh();
    });
  }

  // Pre-select booths on edit by matching names to option ids.
  const editingBoothIds = editing
    ? boothOptions.filter((b) => editing.boothNames.includes(b.name)).map((b) => b.id)
    : [];

  const columns: Column<AdminUserRow>[] = [
    {
      key: "name",
      header: "User",
      render: (u) => (
        <div>
          <p className="font-medium">{u.name}</p>
          <p className="text-xs text-wit-muted">{u.email}</p>
        </div>
      ),
    },
    { key: "role", header: "Role", render: (u) => <Badge tone="info">{ROLE_LABEL[u.role]}</Badge> },
    {
      key: "booths",
      header: "Booths",
      render: (u) =>
        u.boothNames.length > 0 ? (
          u.boothNames.join(", ")
        ) : (
          <span className="text-wit-gray">—</span>
        ),
    },
    { key: "status", header: "Status", render: (u) => <Badge tone={u.status === "active" ? "active" : "inactive"}>{u.status}</Badge> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (u) =>
        readOnly ? null : (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => setToDelete(u)}>Delete</Button>
          </div>
        ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm text-wit-muted">
          {rows.length} {rows.length === 1 ? "user" : "users"}
        </span>
        {!readOnly ? <Button onClick={openNew}>+ New user</Button> : null}
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(u) => u.id} />

      {state?.message && !open && toDelete === null ? (
        <p
          className={`mt-3 text-sm rounded-md px-3 py-2 ${
            state.ok
              ? "bg-state-success-bg text-wit-success"
              : "bg-state-duplicate-bg text-wit-orange"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit user" : "New staff user"}
      >
        <form action={submit} className="space-y-4">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <Field label="Full name">
            <Input name="name" required defaultValue={editing?.name ?? ""} placeholder="Rina Wijaya" autoFocus />
          </Field>
          {!editing ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <Input type="email" name="email" required placeholder="rina@bni.id" />
              </Field>
              <Field label="Temp password">
                <Input type="text" name="password" required placeholder="min 8 chars" />
              </Field>
            </div>
          ) : (
            <p className="text-xs text-wit-muted">
              {editing.email} · role/booth changes require the user to sign in
              again.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role">
              <Select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as AdminUserRow["role"])}
              >
                {Object.entries(ROLE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </Field>
            {editing ? (
              <Field label="Status">
                <Select name="status" defaultValue={editing.status}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </Field>
            ) : null}
          </div>
          {role === "booth_pic" ? (
            <Field label="Assigned booths" hint="Cmd/Ctrl-click to select multiple.">
              <Select
                name="boothIds"
                multiple
                className="h-32"
                defaultValue={editingBoothIds}
              >
                {boothOptions.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
            </Field>
          ) : null}
          {state?.message ? (
            <p className={`text-sm ${state.ok ? "text-wit-success" : "text-wit-red"}`}>
              {state.message}
            </p>
          ) : null}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save" : "Create user"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Remove user?"
        description={toDelete ? `${toDelete.name} (${toDelete.email})` : ""}
      >
        <p className="text-sm text-wit-muted">
          Soft-deletes the account and revokes booth assignments. They will lose
          access immediately.
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setToDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Remove</Button>
        </div>
      </Modal>
    </>
  );
}
