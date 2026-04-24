-- In-app notifications for: comment, like, save on your post, and new post from someone you follow.
-- Inserts are created by triggers (security definer); clients only read their own rows (RLS).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.post_title_from_content(p_content text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  j jsonb;
  t text;
begin
  if p_content is null or btrim(p_content) = '' then
    return 'this post';
  end if;
  begin
    j := p_content::jsonb;
  exception
    when others then
      return 'this post';
  end;
  t := j->>'title';
  if t is not null and btrim(t) <> '' then
    return left(btrim(t), 120);
  end if;
  return 'this post';
end;
$$;

create or replace function public.user_display_name(p_user_id uuid)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce(
    (select
      case
        when u.display_name is not null and btrim(u.display_name) <> '' then btrim(u.display_name)
        when u.username is not null and btrim(u.username) <> '' then btrim(u.username)
        else null
      end
     from public.users u
     where u.user_id = p_user_id),
    'Someone'
  );
$$;

-- ---------------------------------------------------------------------------
-- Triggers: notify post owner
-- ---------------------------------------------------------------------------
create or replace function public.tg_notify_post_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
  v_content text;
  v_title text;
begin
  select p.creator_id, p.content
  into v_creator, v_content
  from public.posts p
  where p.post_id = new.post_id
    and p.deleted_at is null;

  if v_creator is null or v_creator = new.user_id then
    return new;
  end if;

  v_title := public.post_title_from_content(v_content);

  insert into public.notifications (user_id, actor_id, type, target_type, target_id, message_content)
  values (
    v_creator,
    new.user_id,
    'comment',
    'post',
    new.post_id,
    format('New comment on "%s".', v_title)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_post_comment on public.post_comments;
create trigger trg_notify_post_comment
  after insert on public.post_comments
  for each row
  execute function public.tg_notify_post_comment();

create or replace function public.tg_notify_post_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
  v_content text;
  v_title text;
  v_actor text;
  v_like_count integer;
begin
  select p.creator_id, p.content
  into v_creator, v_content
  from public.posts p
  where p.post_id = new.post_id
    and p.deleted_at is null;

  if v_creator is null or v_creator = new.user_id then
    return new;
  end if;

  select count(*)
  into v_like_count
  from public.post_likes pl
  where pl.post_id = new.post_id;

  v_title := public.post_title_from_content(v_content);
  v_actor := public.user_display_name(new.user_id);

  -- First 5 likes: notify every like individually
  if v_like_count <= 5 then
    insert into public.notifications (
      user_id,
      actor_id,
      type,
      target_type,
      target_id,
      message_content
    )
    values (
      v_creator,
      new.user_id,
      'like',
      'post',
      new.post_id,
      format('%s liked your post "%s".', v_actor, v_title)
    );

  -- After 5: only notify on every multiple of 5
  elsif v_like_count % 5 = 0 then
    insert into public.notifications (
      user_id,
      actor_id,
      type,
      target_type,
      target_id,
      message_content
    )
    values (
      v_creator,
      null,
      'like_group',
      'post',
      new.post_id,
      format('You have %s new likes on your post "%s"!', v_like_count, v_title)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_post_like on public.post_likes;
create trigger trg_notify_post_like
  after insert on public.post_likes
  for each row
  execute function public.tg_notify_post_like();

create or replace function public.tg_notify_post_save()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
  v_content text;
  v_title text;
  v_actor text;
begin
  select p.creator_id, p.content
  into v_creator, v_content
  from public.posts p
  where p.post_id = new.post_id
    and p.deleted_at is null;

  if v_creator is null or v_creator = new.user_id then
    return new;
  end if;

  v_title := public.post_title_from_content(v_content);
  v_actor := public.user_display_name(new.user_id);

  insert into public.notifications (user_id, actor_id, type, target_type, target_id, message_content)
  values (
    v_creator,
    new.user_id,
    'save',
    'post',
    new.post_id,
    format('%s saved your post "%s".', v_actor, v_title)
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_post_save on public.bookmarks;
create trigger trg_notify_post_save
  after insert on public.bookmarks
  for each row
  execute function public.tg_notify_post_save();

-- ---------------------------------------------------------------------------
-- New post: notify each follower
-- ---------------------------------------------------------------------------
create or replace function public.tg_notify_new_post_from_followed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_name text;
  r record;
begin
  if new.deleted_at is not null then
    return new;
  end if;

  v_title := public.post_title_from_content(new.content);
  v_name := public.user_display_name(new.creator_id);

  for r in
    select f.follower_id
    from public.follows f
    where f.followed_id = new.creator_id
      and f.follower_id is distinct from new.creator_id
  loop
    insert into public.notifications (user_id, actor_id, type, target_type, target_id, message_content)
    values (
      r.follower_id,
      new.creator_id,
      'new_post',
      'post',
      new.post_id,
      format('%s posted: "%s".', v_name, v_title)
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_notify_new_post on public.posts;
create trigger trg_notify_new_post
  after insert on public.posts
  for each row
  execute function public.tg_notify_new_post_from_followed();

-- ---------------------------------------------------------------------------
-- RLS: read/update own; inserts only via triggers (no insert policy for users)
-- ---------------------------------------------------------------------------
alter table public.notifications enable row level security;

drop policy if exists "Notifications: select own" on public.notifications;
create policy "Notifications: select own"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Notifications: update own" on public.notifications;
create policy "Notifications: update own"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Realtime (for live updates in the app)
do $pub$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$pub$;

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);