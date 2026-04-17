-- Remove legacy local-device image references that can never render for other users.
-- Safe to run after uploads have been fixed to store real Supabase URLs.

delete from public.post_media
where media_url like 'blob:%'
   or media_url like 'file://%';