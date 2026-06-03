-- =============================================================================
-- 0003 — Admin summary views
--
-- Single-select sources for the admin list screens so the app never does N+1
-- count queries. Plain (non-materialized) views: the admin tables are low
-- traffic and want live numbers, unlike the public leaderboard.
-- =============================================================================

-- City summary: chapter + participant counts per city.
create or replace view public.city_summary as
select
  c.id,
  c.name,
  c.status,
  c.created_at,
  c.updated_at,
  (select count(*) from public.chapters ch
     where ch.city_id = c.id and ch.deleted_at is null) as chapter_count,
  (select count(*) from public.participants p
     where p.city_id = c.id and p.deleted_at is null) as participant_count
from public.cities c
where c.deleted_at is null;

-- Chapter summary: city name + participant count.
create or replace view public.chapter_summary as
select
  ch.id,
  ch.name,
  ch.city_id,
  c.name as city_name,
  ch.status,
  ch.created_at,
  ch.updated_at,
  (select count(*) from public.participants p
     where p.chapter_id = ch.id and p.deleted_at is null) as participant_count
from public.chapters ch
join public.cities c on c.id = ch.city_id
where ch.deleted_at is null;

-- Booth summary: primary PIC name + visitor (successful stamp) count + last scan.
create or replace view public.booth_summary as
select
  b.id,
  b.code,
  b.name,
  b.category,
  b.location,
  b.status,
  b.created_at,
  b.updated_at,
  (select u.name
     from public.booth_assignments ba
     join public.users u on u.id = ba.user_id
    where ba.booth_id = b.id
    order by ba.is_primary desc, ba.assigned_at asc
    limit 1) as pic_name,
  (select count(*) from public.stamps s
     where s.booth_id = b.id and s.voided_at is null) as visitor_count,
  (select max(s.scanned_at) from public.stamps s
     where s.booth_id = b.id and s.voided_at is null) as last_scan_at
from public.booths b
where b.deleted_at is null;

-- Participant summary: names + stamp count + raffle qualification (against the
-- single raffle_settings row's min_stamps; defaults to 8 if unset).
create or replace view public.participant_summary as
select
  p.id,
  p.code,
  p.name,
  p.phone,
  p.email,
  p.city_id,
  p.chapter_id,
  c.name as city_name,
  ch.name as chapter_name,
  p.checkin_status,
  p.status,
  p.created_at,
  (select count(*) from public.stamps s
     where s.participant_id = p.id and s.voided_at is null) as stamp_count,
  (
    (select count(*) from public.stamps s
       where s.participant_id = p.id and s.voided_at is null)
    >= coalesce((select min_stamps from public.raffle_settings limit 1), 8)
  ) as raffle_qualified
from public.participants p
join public.cities c on c.id = p.city_id
join public.chapters ch on ch.id = p.chapter_id
where p.deleted_at is null;

-- Views inherit RLS from their base tables (security_invoker default on PG15+
-- for views created by non-superusers under Supabase). Make it explicit so the
-- admin-only policies on participants/stamps are enforced for view readers too.
alter view public.city_summary set (security_invoker = true);
alter view public.chapter_summary set (security_invoker = true);
alter view public.booth_summary set (security_invoker = true);
alter view public.participant_summary set (security_invoker = true);
