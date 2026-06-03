"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { upsertParticipant, deleteParticipant } from "@/lib/actions/participants";
import type { ActionResult } from "@/lib/actions/result";
import type { ParticipantRow } from "@/lib/dev/admin-mock";

interface Opt {
  id: string;
  name: string;
}
interface ChapterOpt extends Opt {
  city_id: string;
}

interface Props {
  rows: ParticipantRow[];
  cityOptions: Opt[];
  chapterOptions: ChapterOpt[];
  readOnly: boolean;
  /** Dashboard mode: hide filters, show a "View all" link. */
  compact?: boolean;
  viewAllHref?: string;
}

export function ParticipantsManager({
  rows,
  cityOptions,
  chapterOptions,
  readOnly,
  compact,
  viewAllHref,
}: Props) {
  const [search, setSearch] = useState("");
  const [raffle, setRaffle] = useState<"all" | "qualified" | "not_yet">("all");

  const [editing, setEditing] = useState<ParticipantRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formCity, setFormCity] = useState<string>("");
  const [detail, setDetail] = useState<ParticipantRow | null>(null);
  const [toDelete, setToDelete] = useState<ParticipantRow | null>(null);

  const [state, setState] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    if (compact) return rows;
    return rows.filter((p) => {
      if (raffle !== "all" && p.raffleStatus !== raffle) return false;
      if (
        search &&
        !`${p.name} ${p.code} ${p.email ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [rows, search, raffle, compact]);

  function openNew() {
    setEditing(null);
    setFormCity(cityOptions[0]?.id ?? "");
    setState(null);
    setFormOpen(true);
  }
  function openEdit(p: ParticipantRow) {
    setEditing(p);
    setFormCity(p.cityId);
    setState(null);
    setFormOpen(true);
  }

  function submit(formData: FormData) {
    start(async () => {
      const res = await upsertParticipant(undefined, formData);
      setState(res);
      if (res.ok) setFormOpen(false);
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const id = toDelete.id;
    start(async () => {
      const res = await deleteParticipant(id);
      setState(res);
      setToDelete(null);
    });
  }

  const chaptersForCity = chapterOptions.filter((c) => c.city_id === formCity);

  const columns: Column<ParticipantRow>[] = [
    {
      key: "name",
      header: "Participant",
      render: (p) => (
        <div>
          <p className="font-medium">{p.name}</p>
          <p className="text-xs text-wit-muted">{p.code}</p>
        </div>
      ),
    },
    { key: "chapter", header: "Chapter", render: (p) => <span className="text-wit-muted">{p.chapterName}</span> },
    {
      key: "stamps",
      header: "Stamps",
      align: "right",
      render: (p) => (
        <span className="font-semibold text-wit-red tabular-nums">
          {p.stampCount}
          <span className="text-wit-muted">/{p.totalBooths}</span>
        </span>
      ),
    },
    {
      key: "raffle",
      header: "Raffle",
      render: (p) => (
        <Badge tone={p.raffleStatus === "qualified" ? "qualified" : "neutral"}>
          {p.raffleStatus === "qualified" ? "Qualified" : "Not yet"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={() => setDetail(p)}>
            View
          </Button>
          {!readOnly ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setToDelete(p)}>
                Delete
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {!compact ? (
          <>
            <Input
              className="mt-0 max-w-xs"
              placeholder="Search name, code, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              className="mt-0 max-w-[12rem]"
              value={raffle}
              onChange={(e) => setRaffle(e.target.value as typeof raffle)}
            >
              <option value="all">All raffle status</option>
              <option value="qualified">Qualified</option>
              <option value="not_yet">Not yet</option>
            </Select>
          </>
        ) : null}
        {compact && viewAllHref ? (
          <Link
            href={viewAllHref}
            className="text-sm text-wit-red hover:text-wit-red-bright transition-colors"
          >
            View all →
          </Link>
        ) : null}
        {!readOnly ? (
          <Button className="ml-auto" onClick={openNew}>
            + New participant
          </Button>
        ) : null}
      </div>

      {state?.message ? (
        <p
          className={`mb-3 text-sm rounded-md px-3 py-2 ${
            state.ok
              ? "bg-state-success-bg text-wit-success"
              : "bg-state-duplicate-bg text-wit-orange"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(p) => p.id}
        empty={
          <EmptyState
            title="No participants"
            description="Add one manually or import from Excel/CSV."
            action={!readOnly ? <Button onClick={openNew}>+ New participant</Button> : undefined}
          />
        }
      />

      {/* Create / edit form */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit participant" : "New participant"}
      >
        <form action={submit} className="space-y-4">
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <Field label="Full name">
            <Input name="name" required defaultValue={editing?.name ?? ""} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <Input name="phone" defaultValue={editing?.phone ?? ""} placeholder="08…" />
            </Field>
            <Field label="Email">
              <Input type="email" name="email" defaultValue={editing?.email ?? ""} placeholder="name@email.com" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <Select
                name="city_id"
                required
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
              >
                <option value="" disabled>Select…</option>
                {cityOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Chapter">
              <Select
                name="chapter_id"
                required
                defaultValue={editing?.chapterId ?? ""}
                key={formCity}
              >
                <option value="" disabled>Select…</option>
                {chaptersForCity.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
          </div>
          {state?.message && !state.ok ? (
            <p className="text-sm text-wit-red">{state.message}</p>
          ) : null}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Remove participant?"
        description={toDelete ? `${toDelete.name} (${toDelete.code})` : ""}
      >
        <p className="text-sm text-wit-muted">
          This soft-deletes the participant. Stamp history is preserved and can
          be restored by an admin in the database.
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={pending}>
            {pending ? "Removing…" : "Remove"}
          </Button>
        </div>
      </Modal>

      {/* Detail + QR */}
      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ""}
        description={detail?.code}
      >
        {detail ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="shrink-0 rounded-lg bg-white p-2">
                <Image
                  src={`/api/qr/${encodeURIComponent(detail.code)}`}
                  alt={`QR for ${detail.name}`}
                  width={120}
                  height={120}
                  unoptimized
                />
              </div>
              <dl className="text-sm space-y-1.5 flex-1">
                <DRow label="City" value={detail.cityName} />
                <DRow label="Chapter" value={detail.chapterName} />
                <DRow label="Phone" value={detail.phone ?? "—"} />
                <DRow label="Email" value={detail.email ?? "—"} />
                <DRow label="Stamps" value={`${detail.stampCount} / ${detail.totalBooths}`} />
              </dl>
            </div>
            <div className="flex gap-2 justify-end">
              <a href={`/api/qr/${encodeURIComponent(detail.code)}`} download={`${detail.code}.png`}>
                <Button variant="secondary">Download QR</Button>
              </a>
              <a
                href={`/admin/participants/print?code=${encodeURIComponent(detail.code)}`}
                target="_blank"
                rel="noopener"
              >
                <Button variant="secondary">Print badge</Button>
              </a>
              <Button onClick={() => setDetail(null)}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function DRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-wit-muted">{label}</dt>
      <dd className="text-wit-white text-right">{value}</dd>
    </div>
  );
}
