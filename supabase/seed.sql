-- =============================================================================
-- BNI NatCon — Seed / bootstrap
--
-- Run AFTER the migrations (0001 → 0002 → 0003) are applied.
-- Goal: create the first Super Admin so you can log in and manage everything
-- else from the UI.
--
-- There are two ways to create the admin's auth user. OPTION A is the safe,
-- recommended path; OPTION B is pure-SQL for automated setups.
-- =============================================================================


-- ┌───────────────────────────────────────────────────────────────────────────
-- │ OPTION A (recommended) — create the auth user in the Dashboard, then
-- │ promote it here.
-- │
-- │ 1. Supabase Dashboard → Authentication → Users → "Add user"
-- │      • Email:    admin@bni.id   (change to yours)
-- │      • Password: <set one>
-- │      • ✅ Auto Confirm User
-- │ 2. Edit the email/name below, then run this whole file in the SQL editor.
-- └───────────────────────────────────────────────────────────────────────────
do $$
declare
  v_email text := 'admin@bni.id';   -- <-- CHANGE to the email you created
  v_name  text := 'Super Admin';    -- <-- CHANGE to the display name
  v_id    uuid;
begin
  select id into v_id from auth.users where email = v_email;

  if v_id is null then
    raise notice
      'No auth user found for %. Create it first (Dashboard → Authentication → Add user, Auto Confirm), then re-run.',
      v_email;
    return;
  end if;

  insert into public.users (id, name, email, role, status)
  values (v_id, v_name, v_email, 'super_admin', 'active')
  on conflict (id) do update
    set role = 'super_admin',
        name = excluded.name,
        status = 'active',
        deleted_at = null;

  -- The users_sync_claims trigger mirrors role -> auth.users.raw_app_meta_data,
  -- so the JWT carries role=super_admin on the next sign-in.
  raise notice 'OK: % is now super_admin. Sign out/in to refresh the JWT claim.', v_email;
end $$;


-- ┌───────────────────────────────────────────────────────────────────────────
-- │ OPTION B (pure SQL) — create the auth user AND profile in one shot.
-- │ Uncomment to use. Edit the email/password/name first.
-- │ Note: column set works for current Supabase GoTrue; if your project errors
-- │ on a missing column, prefer OPTION A.
-- └───────────────────────────────────────────────────────────────────────────
-- do $$
-- declare
--   v_email text := 'admin@bni.id';
--   v_pass  text := 'ChangeMe123!';   -- the admin will use this to log in
--   v_name  text := 'Super Admin';
--   v_id    uuid := gen_random_uuid();
-- begin
--   if exists (select 1 from auth.users where email = v_email) then
--     raise notice 'auth user % already exists — skipping create.', v_email;
--   else
--     insert into auth.users (
--       instance_id, id, aud, role, email, encrypted_password,
--       email_confirmed_at, created_at, updated_at,
--       raw_app_meta_data, raw_user_meta_data,
--       confirmation_token, email_change, email_change_token_new, recovery_token
--     ) values (
--       '00000000-0000-0000-0000-000000000000', v_id,
--       'authenticated', 'authenticated', v_email,
--       crypt(v_pass, gen_salt('bf')),
--       now(), now(), now(),
--       '{"provider":"email","providers":["email"]}'::jsonb,
--       jsonb_build_object('name', v_name),
--       '', '', '', ''
--     );
--   end if;
--
--   select id into v_id from auth.users where email = v_email;
--   insert into public.users (id, name, email, role, status)
--   values (v_id, v_name, v_email, 'super_admin', 'active')
--   on conflict (id) do update set role = 'super_admin', status = 'active', deleted_at = null;
--   raise notice 'OK: % (super_admin) ready. Password: %', v_email, v_pass;
-- end $$;


-- ┌───────────────────────────────────────────────────────────────────────────
-- │ OPTIONAL — a little starter master data so the admin isn't empty.
-- │ Safe & idempotent. Delete or skip if you'll import your own.
-- └───────────────────────────────────────────────────────────────────────────
-- insert into public.cities (name) values ('Bandung'), ('Jakarta'), ('Surabaya')
--   on conflict do nothing;
--
-- insert into public.chapters (city_id, name)
-- select c.id, x.name
-- from (values
--   ('Bandung','BNI Bandung A'),
--   ('Bandung','BNI Bandung B'),
--   ('Jakarta','BNI Jakarta Selatan'),
--   ('Surabaya','BNI Surabaya 1')
-- ) as x(city, name)
-- join public.cities c on lower(c.name) = lower(x.city)
-- on conflict do nothing;
--
-- insert into public.booths (code, name, category, location)
-- values
--   ('B-A01','Sponsor Booth A','Sponsor','Main Hall · Aisle 1'),
--   ('B-B02','Partner Booth B','Partner','Main Hall · Aisle 2')
-- on conflict do nothing;
--
-- insert into public.raffle_settings (min_stamps) values (8) on conflict do nothing;
