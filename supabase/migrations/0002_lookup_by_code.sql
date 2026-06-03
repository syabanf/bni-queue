-- =============================================================================
-- 0002 — lookup_participant_for_scan_by_code
--
-- Manual stamp flow: PIC types a participant code (e.g. "BNI-NATCON-000123")
-- when the QR is damaged or camera fails. Same minimal projection as the
-- QR-based lookup, same SECURITY DEFINER pattern.
-- =============================================================================

create or replace function public.lookup_participant_for_scan_by_code(
  p_participant_code text
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
  where p.code = p_participant_code
    and p.deleted_at is null
    and p.status = 'active';

  if result.participant_id is null then
    return null;
  end if;

  return result;
end;
$$;

revoke all on function public.lookup_participant_for_scan_by_code(text)
  from public, anon;
grant execute on function public.lookup_participant_for_scan_by_code(text)
  to authenticated;
