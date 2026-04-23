-- Per-user read cursor per channel, for unread message counts in the chat list.

create table if not exists public.group_channel_read_state (
  user_id uuid not null references public.users (user_id) on delete cascade,
  channel_id uuid not null references public.group_channels (channel_id) on delete cascade,
  last_read_at timestamptz not null default 'epoch'::timestamptz,
  primary key (user_id, channel_id)
);

create index if not exists idx_gcr_state_channel
  on public.group_channel_read_state (channel_id);

comment on table public.group_channel_read_state is
  'When the user last marked messages as read in a group channel.';

alter table public.group_channel_read_state enable row level security;

drop policy if exists "Read own channel read state" on public.group_channel_read_state;
create policy "Read own channel read state"
  on public.group_channel_read_state
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Insert own channel read state" on public.group_channel_read_state;
create policy "Insert own channel read state"
  on public.group_channel_read_state
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Update own channel read state" on public.group_channel_read_state;
create policy "Update own channel read state"
  on public.group_channel_read_state
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Count messages from others that are newer than the user''s last_read_at (epoch = never read).
create or replace function public.get_group_unread_counts(p_channel_ids uuid[])
returns table (channel_id uuid, unread_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.cid as channel_id,
    coalesce((
      select count(*)::bigint
      from public.group_messages m
      where m.channel_id = u.cid
        and m.user_id <> auth.uid()
        and m.created_at > coalesce(
          (
            select r.last_read_at
            from public.group_channel_read_state r
            where r.user_id = auth.uid()
              and r.channel_id = u.cid
          ),
          'epoch'::timestamptz
        )
    ), 0) as unread_count
  from unnest(coalesce(p_channel_ids, array[]::uuid[])) as u(cid)
  where exists (
    select 1
    from public.group_channels gc
    inner join public.group_members gm
      on gm.group_id = gc.group_id
     and gm.user_id = auth.uid()
    where gc.channel_id = u.cid
  );
$$;

revoke all on function public.get_group_unread_counts(uuid[]) from public;
grant execute on function public.get_group_unread_counts(uuid[]) to authenticated;
