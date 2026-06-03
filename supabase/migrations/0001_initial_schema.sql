-- =============================================================================
-- BNI NatCon Digital Passport & Stamp System
-- Migration: 0001_initial_schema
--
-- Implements the data model from the implementation plan. Key shape:
--   - UUIDs everywhere (gen_random_uuid())
--   - Soft delete on master data via deleted_at + partial unique indexes
--   - Two-table split for stamps:
--       stamps         = unique successful (UNIQUE on participant_id, booth_id
--                        WHERE voided_at IS NULL)
--       scan_attempts  = append-only audit of every scan including failures
--   - booth_assignments many-to-many (replaces single pic_user_id)
--   - Materialized view leaderboard_participants refreshed by dirty-gated cron
--   - lookup_participant_for_scan SECURITY DEFINER limits PII exposure to PICs
--   - RLS reads role + booth_ids from JWT claims (auth.jwt() ->> 'role')
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid, digest
create extension if not exists "citext";   -- case-insensitive email
-- pg_cron is enabled at the database level via the Supabase dashboard.
-- The schedule statement is included at the bottom and is idempotent.

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type user_role as enum (
  'super_admin',
  'event_admin',
  'booth_pic',
  'management_viewer',
  'display_operator'
);

create type entity_status as enum ('active', 'inactive');

create type checkin_status as enum (
  'not_checked_in',
  'checked_in',
  'no_show'
);

create type scan_source as enum (
  'camera',
  'manual_input',
  'admin_correction'
);

create type scan_outcome as enum (
  'success',
  'duplicate',
  'invalid_qr',
  'invalid_participant',
  'invalid_booth',
  'unauthorized_pic'
);

create type raffle_draw_status as enum ('pending', 'drawn', 'locked');

create type eligibility_type as enum ('standard', 'full_passport_bonus');

-- -----------------------------------------------------------------------------
-- Shared trigger: updated_at = now() on any update
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- users (mirrors auth.users 1:1; do not store credentials here)
-- -----------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email citext not null,
  role user_role not null,
  status entity_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index users_email_unique
  on public.users (email)
  where deleted_at is null;
create index users_role_idx on public.users (role) where deleted_at is null;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- cities
-- -----------------------------------------------------------------------------
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status entity_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index cities_name_unique
  on public.cities (lower(name))
  where deleted_at is null;

create trigger cities_set_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- chapters
-- -----------------------------------------------------------------------------
create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id),
  name text not null,
  status entity_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index chapters_city_name_unique
  on public.chapters (city_id, lower(name))
  where deleted_at is null;
create index chapters_city_idx on public.chapters (city_id);

create trigger chapters_set_updated_at
  before update on public.chapters
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- booths
-- -----------------------------------------------------------------------------
create table public.booths (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  category text,
  location text,
  status entity_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index booths_code_unique
  on public.booths (lower(code))
  where deleted_at is null;

create trigger booths_set_updated_at
  before update on public.booths
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- booth_assignments (many-to-many: PICs <-> booths)
-- -----------------------------------------------------------------------------
create table public.booth_assignments (
  booth_id uuid not null references public.booths(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  is_primary boolean not null default false,
  assigned_at timestamptz not null default now(),
  primary key (booth_id, user_id)
);

create index booth_assignments_user_idx on public.booth_assignments (user_id);

-- -----------------------------------------------------------------------------
-- participants
-- -----------------------------------------------------------------------------
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  phone text,
  email citext,
  city_id uuid not null references public.cities(id),
  chapter_id uuid not null references public.chapters(id),
  qr_token text not null,
  qr_version smallint not null default 1,
  checkin_status checkin_status not null default 'not_checked_in',
  checked_in_at timestamptz,
  status entity_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index participants_code_unique
  on public.participants (code)
  where deleted_at is null;
create unique index participants_qr_token_unique
  on public.participants (qr_token)
  where deleted_at is null;
create index participants_chapter_idx on public.participants (chapter_id);
create index participants_city_idx on public.participants (city_id);
create index participants_checkin_idx on public.participants (checkin_status)
  where deleted_at is null;

create trigger participants_set_updated_at
  before update on public.participants
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- stamps (UNIQUE successful only)
-- -----------------------------------------------------------------------------
create table public.stamps (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id),
  booth_id uuid not null references public.booths(id),
  scanned_by uuid not null references public.users(id),
  scanned_at timestamptz not null default now(),
  scan_source scan_source not null default 'camera',
  voided_at timestamptz,
  voided_by uuid references public.users(id),
  void_reason text,
  created_at timestamptz not null default now()
);

-- The load-bearing invariant: one stamp per (participant, booth).
-- Partial index lets admin "void" a stamp and re-stamp without deleting history.
create unique index stamps_participant_booth_unique
  on public.stamps (participant_id, booth_id)
  where voided_at is null;
create index stamps_scanned_at_idx on public.stamps (scanned_at desc);
create index stamps_booth_idx on public.stamps (booth_id);
create index stamps_scanned_by_idx on public.stamps (scanned_by);
create index stamps_participant_idx on public.stamps (participant_id);

-- -----------------------------------------------------------------------------
-- scan_attempts (append-only audit of every scan)
-- -----------------------------------------------------------------------------
create table public.scan_attempts (
  id uuid primary key default gen_random_uuid(),
  attempted_at timestamptz not null default now(),
  outcome scan_outcome not null,
  participant_id uuid references public.participants(id),
  booth_id uuid not null references public.booths(id),
  scanned_by uuid not null references public.users(id),
  scan_source scan_source not null,
  raw_token_hash text,
  stamp_id uuid references public.stamps(id),
  client_request_id text,
  user_agent text,
  ip_address inet
);

create index scan_attempts_booth_time_idx
  on public.scan_attempts (booth_id, attempted_at desc);
create index scan_attempts_outcome_idx
  on public.scan_attempts (outcome, attempted_at desc);
create index scan_attempts_participant_idx
  on public.scan_attempts (participant_id);
-- Idempotency: same scanned_by + client_request_id => duplicate request, dedupe.
create unique index scan_attempts_idempotency_unique
  on public.scan_attempts (scanned_by, client_request_id)
  where client_request_id is not null;

-- -----------------------------------------------------------------------------
-- raffle_settings (singleton enforced via unique index over a constant)
-- -----------------------------------------------------------------------------
create table public.raffle_settings (
  id uuid primary key default gen_random_uuid(),
  min_stamps int not null default 8,
  required_booth_ids uuid[] not null default '{}',
  exclude_user_ids uuid[] not null default '{}',
  full_passport_bonus_entries int not null default 0,
  is_locked boolean not null default false,
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);

create unique index raffle_settings_singleton on public.raffle_settings ((true));

create trigger raffle_settings_set_updated_at
  before update on public.raffle_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- raffle_entries (multi-tier prize support)
-- -----------------------------------------------------------------------------
create table public.raffle_entries (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id),
  eligibility_type eligibility_type not null default 'standard',
  stamp_count int not null,
  draw_status raffle_draw_status not null default 'pending',
  winner_order int,
  prize_label text,
  generated_at timestamptz not null default now(),
  drawn_at timestamptz,
  locked_at timestamptz
);

-- Allow regenerating before lock: unique on (participant, eligibility) only
-- while not locked. Locked rows are immutable history; re-generation does not
-- collide with them.
create unique index raffle_entries_active_unique
  on public.raffle_entries (participant_id, eligibility_type)
  where draw_status <> 'locked';
create index raffle_entries_status_idx on public.raffle_entries (draw_status);
create index raffle_entries_winner_order_idx
  on public.raffle_entries (winner_order)
  where winner_order is not null;

-- -----------------------------------------------------------------------------
-- audit_logs (every admin mutation)
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  action text not null,
  module text not null,
  reference_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_logs_user_time_idx
  on public.audit_logs (user_id, created_at desc);
create index audit_logs_module_time_idx
  on public.audit_logs (module, created_at desc);
create index audit_logs_reference_idx
  on public.audit_logs (reference_id)
  where reference_id is not null;

-- -----------------------------------------------------------------------------
-- display_settings (singleton; controls the LED screen)
-- -----------------------------------------------------------------------------
create table public.display_settings (
  id uuid primary key default gen_random_uuid(),
  active_mode text not null default 'rotation',
  slide_duration_ms int not null default 15000,
  rotation_order text[] not null default array[
    'overall', 'chapter', 'city', 'booth', 'raffle'
  ],
  show_overall boolean not null default true,
  show_chapter boolean not null default true,
  show_city boolean not null default true,
  show_booth boolean not null default true,
  show_raffle boolean not null default true,
  announcement_text text,
  announcement_active boolean not null default false,
  winner_display_active boolean not null default false,
  winner_display_entry_id uuid references public.raffle_entries(id),
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);

create unique index display_settings_singleton on public.display_settings ((true));

create trigger display_settings_set_updated_at
  before update on public.display_settings
  for each row execute function public.set_updated_at();

-- Seed the singleton.
insert into public.display_settings default values;

-- -----------------------------------------------------------------------------
-- leaderboard refresh signalling
-- -----------------------------------------------------------------------------
-- A single-row counter incremented by a trigger on stamps insert. A scheduled
-- job reads it and only refreshes the materialised view if dirty. Idle = 0 work.
create table public.leaderboard_dirty (
  id boolean primary key default true,
  dirty_count bigint not null default 0,
  last_refreshed_at timestamptz
);

insert into public.leaderboard_dirty (id) values (true);
alter table public.leaderboard_dirty
  add constraint leaderboard_dirty_singleton check (id = true);

create or replace function public.mark_leaderboard_dirty()
returns trigger
language plpgsql
as $$
begin
  update public.leaderboard_dirty
     set dirty_count = dirty_count + 1
   where id = true;
  return new;
end;
$$;

create trigger stamps_mark_leaderboard_dirty
  after insert or update of voided_at on public.stamps
  for each row execute function public.mark_leaderboard_dirty();

-- -----------------------------------------------------------------------------
-- Materialized view: leaderboard_participants
-- -----------------------------------------------------------------------------
create materialized view public.leaderboard_participants as
select
  p.id           as participant_id,
  p.code,
  p.name,
  p.city_id,
  p.chapter_id,
  coalesce(count(s.id), 0)::int as stamp_count,
  max(s.scanned_at) as last_scanned_at,
  min(s.scanned_at) as first_scanned_at
from public.participants p
left join public.stamps s
  on s.participant_id = p.id
 and s.voided_at is null
where p.deleted_at is null
group by p.id;

-- CONCURRENTLY refresh requires a unique index.
create unique index leaderboard_participants_pk
  on public.leaderboard_participants (participant_id);
create index leaderboard_participants_rank_idx
  on public.leaderboard_participants (
    stamp_count desc,
    last_scanned_at asc
  );
create index leaderboard_participants_chapter_idx
  on public.leaderboard_participants (chapter_id);
create index leaderboard_participants_city_idx
  on public.leaderboard_participants (city_id);

create or replace function public.refresh_leaderboard_if_dirty()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_dirty bigint;
begin
  select dirty_count into current_dirty
    from public.leaderboard_dirty where id = true;

  if current_dirty = 0 then
    return;
  end if;

  refresh materialized view concurrently public.leaderboard_participants;

  update public.leaderboard_dirty
     set dirty_count = greatest(0, dirty_count - current_dirty),
         last_refreshed_at = now()
   where id = true;
end;
$$;

revoke all on function public.refresh_leaderboard_if_dirty() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- JWT claims propagation
-- Mirrors users.role + booth_assignments.booth_ids into auth.users.raw_app_meta_data
-- so RLS can read claims directly without joining at request time.
-- -----------------------------------------------------------------------------
create or replace function public.sync_user_app_metadata(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
  v_booth_ids uuid[];
begin
  select role::text into v_role from public.users where id = p_user_id;
  if v_role is null then
    return;
  end if;

  select coalesce(array_agg(booth_id), '{}')
    into v_booth_ids
    from public.booth_assignments
   where user_id = p_user_id;

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
       || jsonb_build_object('role', v_role)
       || jsonb_build_object('booth_ids',
            (select coalesce(jsonb_agg(b::text), '[]'::jsonb)
               from unnest(v_booth_ids) b))
   where id = p_user_id;
end;
$$;

revoke all on function public.sync_user_app_metadata(uuid) from public, anon, authenticated;

create or replace function public.users_sync_claims()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_user_app_metadata(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create trigger users_sync_claims_aiu
  after insert or update of role on public.users
  for each row execute function public.users_sync_claims();

create or replace function public.booth_assignments_sync_claims()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_user_app_metadata(coalesce(new.user_id, old.user_id));
  return coalesce(new, old);
end;
$$;

create trigger booth_assignments_sync_claims_aiud
  after insert or update or delete on public.booth_assignments
  for each row execute function public.booth_assignments_sync_claims();

-- -----------------------------------------------------------------------------
-- lookup_participant_for_scan (SECURITY DEFINER, called from the scan handler)
-- Returns the minimal projection a PIC needs. PICs do NOT have direct SELECT
-- on public.participants — this is the only path through which they can see
-- participant data, and the projection is restricted to non-PII fields.
-- -----------------------------------------------------------------------------
create type public.participant_scan_projection as (
  participant_id uuid,
  display_name text,
  city_name text,
  chapter_name text,
  current_stamp_count int
);

create or replace function public.lookup_participant_for_scan(
  p_qr_token text,
  p_qr_version smallint default 1
)
returns public.participant_scan_projection
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.participant_scan_projection;
begin
  select
    p.id,
    -- First name + initial of last name only; no full name leakage.
    case
      when position(' ' in p.name) > 0 then
        split_part(p.name, ' ', 1) || ' ' ||
        upper(substring(split_part(p.name, ' ', 2), 1, 1)) || '.'
      else p.name
    end,
    c.name,
    ch.name,
    coalesce((
      select count(*)::int
        from public.stamps s
       where s.participant_id = p.id
         and s.voided_at is null
    ), 0)
  into result
  from public.participants p
  join public.cities c on c.id = p.city_id
  join public.chapters ch on ch.id = p.chapter_id
  where p.qr_token = p_qr_token
    and p.qr_version = p_qr_version
    and p.deleted_at is null
    and p.status = 'active';

  if result.participant_id is null then
    return null;
  end if;

  return result;
end;
$$;

revoke all on function public.lookup_participant_for_scan(text, smallint)
  from public, anon;
grant execute on function public.lookup_participant_for_scan(text, smallint)
  to authenticated;

-- -----------------------------------------------------------------------------
-- Auto check-in trigger: first successful stamp flips checkin_status
-- -----------------------------------------------------------------------------
create or replace function public.auto_checkin_on_first_stamp()
returns trigger
language plpgsql
as $$
begin
  update public.participants
     set checkin_status = 'checked_in',
         checked_in_at = coalesce(checked_in_at, new.scanned_at)
   where id = new.participant_id
     and checkin_status = 'not_checked_in';
  return new;
end;
$$;

create trigger stamps_auto_checkin
  after insert on public.stamps
  for each row execute function public.auto_checkin_on_first_stamp();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.users enable row level security;
alter table public.cities enable row level security;
alter table public.chapters enable row level security;
alter table public.booths enable row level security;
alter table public.booth_assignments enable row level security;
alter table public.participants enable row level security;
alter table public.stamps enable row level security;
alter table public.scan_attempts enable row level security;
alter table public.raffle_settings enable row level security;
alter table public.raffle_entries enable row level security;
alter table public.audit_logs enable row level security;
alter table public.display_settings enable row level security;
alter table public.leaderboard_dirty enable row level security;

-- Helper: claim accessors
create or replace function public.jwt_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'role', '')::text;
$$;

create or replace function public.jwt_booth_ids()
returns uuid[]
language sql
stable
as $$
  select coalesce(
    (
      select array_agg(b::uuid)
        from jsonb_array_elements_text(auth.jwt() -> 'booth_ids') b
    ),
    '{}'::uuid[]
  );
$$;

create or replace function public.is_admin_role()
returns boolean
language sql
stable
as $$
  select public.jwt_role() in ('super_admin', 'event_admin');
$$;

create or replace function public.is_management_or_admin()
returns boolean
language sql
stable
as $$
  select public.jwt_role()
    in ('super_admin', 'event_admin', 'management_viewer');
$$;

-- -----------------------------------------------------------------------------
-- users: own row read, admins read all; admins write
-- -----------------------------------------------------------------------------
create policy users_self_read on public.users
  for select using (auth.uid() = id);
create policy users_admin_read on public.users
  for select using (public.is_management_or_admin());
create policy users_admin_write on public.users
  for all
  using (public.is_admin_role())
  with check (public.is_admin_role());

-- -----------------------------------------------------------------------------
-- master data (cities, chapters, booths): authenticated read, admin write
-- -----------------------------------------------------------------------------
create policy cities_auth_read on public.cities
  for select using (auth.role() = 'authenticated');
create policy cities_admin_write on public.cities
  for all using (public.is_admin_role()) with check (public.is_admin_role());

create policy chapters_auth_read on public.chapters
  for select using (auth.role() = 'authenticated');
create policy chapters_admin_write on public.chapters
  for all using (public.is_admin_role()) with check (public.is_admin_role());

create policy booths_auth_read on public.booths
  for select using (auth.role() = 'authenticated');
create policy booths_admin_write on public.booths
  for all using (public.is_admin_role()) with check (public.is_admin_role());

create policy booth_assignments_auth_read on public.booth_assignments
  for select using (auth.role() = 'authenticated');
create policy booth_assignments_admin_write on public.booth_assignments
  for all using (public.is_admin_role()) with check (public.is_admin_role());

-- -----------------------------------------------------------------------------
-- participants: PII restricted. PICs have NO direct SELECT — they call
-- lookup_participant_for_scan() instead.
-- -----------------------------------------------------------------------------
create policy participants_admin_read on public.participants
  for select using (public.is_management_or_admin());
create policy participants_admin_write on public.participants
  for all using (public.is_admin_role()) with check (public.is_admin_role());

-- -----------------------------------------------------------------------------
-- stamps: PIC insert only for assigned booth; PIC read own-booth; admin read all
-- -----------------------------------------------------------------------------
create policy stamps_pic_insert on public.stamps
  for insert
  with check (
    public.jwt_role() = 'booth_pic'
    and booth_id = any(public.jwt_booth_ids())
    and scanned_by = auth.uid()
  );

create policy stamps_pic_select_own_booth on public.stamps
  for select
  using (
    public.jwt_role() = 'booth_pic'
    and booth_id = any(public.jwt_booth_ids())
  );

create policy stamps_admin_select on public.stamps
  for select using (public.is_management_or_admin());

-- Admin voids/corrections only.
create policy stamps_admin_update on public.stamps
  for update using (public.is_admin_role())
  with check (public.is_admin_role());

-- -----------------------------------------------------------------------------
-- scan_attempts: PIC can insert their own attempts; PIC reads own-booth;
-- admin reads all.
-- -----------------------------------------------------------------------------
create policy scan_attempts_pic_insert on public.scan_attempts
  for insert
  with check (
    public.jwt_role() = 'booth_pic'
    and booth_id = any(public.jwt_booth_ids())
    and scanned_by = auth.uid()
  );

create policy scan_attempts_pic_select on public.scan_attempts
  for select
  using (
    public.jwt_role() = 'booth_pic'
    and booth_id = any(public.jwt_booth_ids())
  );

create policy scan_attempts_admin_select on public.scan_attempts
  for select using (public.is_management_or_admin());

-- -----------------------------------------------------------------------------
-- raffle / audit / display: admin-only (display_operator can read display_settings)
-- -----------------------------------------------------------------------------
create policy raffle_settings_admin_all on public.raffle_settings
  for all using (public.is_admin_role()) with check (public.is_admin_role());

create policy raffle_entries_admin_all on public.raffle_entries
  for all using (public.is_admin_role()) with check (public.is_admin_role());
create policy raffle_entries_management_read on public.raffle_entries
  for select using (public.is_management_or_admin());

create policy audit_logs_admin_read on public.audit_logs
  for select using (public.is_management_or_admin());
create policy audit_logs_admin_insert on public.audit_logs
  for insert with check (public.is_admin_role());

create policy display_settings_read_op_or_mgmt on public.display_settings
  for select
  using (
    public.jwt_role() = 'display_operator'
    or public.is_management_or_admin()
  );
create policy display_settings_write on public.display_settings
  for update
  using (
    public.jwt_role() = 'display_operator'
    or public.is_admin_role()
  )
  with check (
    public.jwt_role() = 'display_operator'
    or public.is_admin_role()
  );

-- leaderboard_dirty: only the SECURITY DEFINER refresh function touches it.
-- No policy = no anon/authenticated access (RLS denies by default).

-- =============================================================================
-- Schedule the leaderboard refresh every 5 seconds (idempotent re-schedule).
-- Requires pg_cron to be enabled in Supabase (Database > Extensions).
-- =============================================================================
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
      from cron.job
     where jobname = 'refresh_leaderboard_if_dirty_5s';
    perform cron.schedule(
      'refresh_leaderboard_if_dirty_5s',
      '5 seconds',
      'select public.refresh_leaderboard_if_dirty();'
    );
  end if;
end;
$$;

-- =============================================================================
-- Done.
-- =============================================================================
