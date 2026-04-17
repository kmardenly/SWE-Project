-- Ensure feed image buckets are readable across accounts.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read post images" on storage.objects;
create policy "Public read post images"
on storage.objects
for select
to public
using (bucket_id in ('images', 'post-media'));

drop policy if exists "Authenticated upload post images" on storage.objects;
create policy "Authenticated upload post images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('images', 'post-media')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated update own post images" on storage.objects;
create policy "Authenticated update own post images"
on storage.objects
for update
to authenticated
using (bucket_id in ('images', 'post-media') and owner = auth.uid())
with check (bucket_id in ('images', 'post-media') and owner = auth.uid());

drop policy if exists "Authenticated delete own post images" on storage.objects;
create policy "Authenticated delete own post images"
on storage.objects
for delete
to authenticated
using (bucket_id in ('images', 'post-media') and owner = auth.uid());
