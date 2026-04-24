-- Fix goals not persisting from the app:
-- 1) PostgREST uses the anon key; grant DML to anon + authenticated (RLS still enforces auth.uid()).
-- 2) Policies without TO-role so they apply regardless of how the request role is resolved.
-- 3) Ensure public.users exists for new auth signups (FK on user_goals.user_id -> users.user_id).

-- ---------------------------------------------------------------------------
-- user_goals: API privileges (match style of older public.* tables in repo)
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on table public.user_goals to anon;
grant select, insert, update, delete on table public.user_goals to authenticated;
grant select, insert, update, delete on table public.user_goals to service_role;

-- ---------------------------------------------------------------------------
-- user_goals: RLS (require a logged-in user)
-- ---------------------------------------------------------------------------
drop policy if exists "User goals: select own" on public.user_goals;
create policy "User goals: select own"
  on public.user_goals
  for select
  using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "User goals: insert own" on public.user_goals;
create policy "User goals: insert own"
  on public.user_goals
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "User goals: update own" on public.user_goals;
create policy "User goals: update own"
  on public.user_goals
  for update
  using (auth.uid() is not null and user_id = auth.uid())
  with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "User goals: delete own" on public.user_goals;
create policy "User goals: delete own"
  on public.user_goals
  for delete
  using (auth.uid() is not null and user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- auth.users -> public.users (minimal row for FK + profile updates)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (user_id, email, created_at, updated_at)
  values (new.id, new.email, now(), now())
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to service_role;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
