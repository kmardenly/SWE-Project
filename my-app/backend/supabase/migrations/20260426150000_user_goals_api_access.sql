-- Ensure goals persist via PostgREST: table + privileges + authenticated-scoped RLS.
-- Safe if 20260424173000_user_goals.sql already ran (IF NOT EXISTS / DROP POLICY).

create table if not exists public.user_goals (
  goal_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(user_id) on delete cascade,
  title text not null,
  deadline text,
  sub_goals jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  completed_at timestamptz,
  archived boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_goals_user_id_created_idx
  on public.user_goals (user_id, created_at desc);

alter table public.user_goals enable row level security;

grant select, insert, update, delete on table public.user_goals to authenticated;
grant select, insert, update, delete on table public.user_goals to service_role;

drop policy if exists "User goals: select own" on public.user_goals;
create policy "User goals: select own"
  on public.user_goals
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "User goals: insert own" on public.user_goals;
create policy "User goals: insert own"
  on public.user_goals
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "User goals: update own" on public.user_goals;
create policy "User goals: update own"
  on public.user_goals
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "User goals: delete own" on public.user_goals;
create policy "User goals: delete own"
  on public.user_goals
  for delete
  to authenticated
  using (user_id = auth.uid());
