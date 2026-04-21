-- Soft delete helper: marks posts.deleted_at instead of hard-deleting rows.
create or replace function public.soft_delete_post(p_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer := 0;
begin
  update public.posts
  set deleted_at = timezone('utc', now())
  where post_id = p_post_id
    and creator_id = auth.uid()
    and deleted_at is null;

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

revoke all on function public.soft_delete_post(uuid) from public;
grant execute on function public.soft_delete_post(uuid) to authenticated;
