-- Ensure all users can read visible posts and their media in the feed.
alter table public.posts enable row level security;
alter table public.post_media enable row level security;

drop policy if exists "Public read posts" on public.posts;
create policy "Public read posts"
on public.posts
for select
to public
using (deleted_at is null);

drop policy if exists "Authenticated create own posts" on public.posts;
create policy "Authenticated create own posts"
on public.posts
for insert
to authenticated
with check (creator_id = auth.uid());

drop policy if exists "Authenticated update own posts" on public.posts;
create policy "Authenticated update own posts"
on public.posts
for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

drop policy if exists "Authenticated delete own posts" on public.posts;
create policy "Authenticated delete own posts"
on public.posts
for delete
to authenticated
using (creator_id = auth.uid());

drop policy if exists "Public read post media" on public.post_media;
create policy "Public read post media"
on public.post_media
for select
to public
using (
  exists (
    select 1
    from public.posts p
    where p.post_id = post_media.post_id
      and p.deleted_at is null
  )
);

drop policy if exists "Authenticated create own post media" on public.post_media;
create policy "Authenticated create own post media"
on public.post_media
for insert
to authenticated
with check (
  exists (
    select 1
    from public.posts p
    where p.post_id = post_media.post_id
      and p.creator_id = auth.uid()
  )
);

drop policy if exists "Authenticated update own post media" on public.post_media;
create policy "Authenticated update own post media"
on public.post_media
for update
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.post_id = post_media.post_id
      and p.creator_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.posts p
    where p.post_id = post_media.post_id
      and p.creator_id = auth.uid()
  )
);

drop policy if exists "Authenticated delete own post media" on public.post_media;
create policy "Authenticated delete own post media"
on public.post_media
for delete
to authenticated
using (
  exists (
    select 1
    from public.posts p
    where p.post_id = post_media.post_id
      and p.creator_id = auth.uid()
  )
);
