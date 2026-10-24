-- Supabase grants new public tables ALL privileges to anon/authenticated by
-- default, so 0001's GRANT SELECT, INSERT didn't take anything away. Row-level
-- security already blocks edits and deletes (no policies for them), but revoke
-- the privileges too so a future policy mistake can't open them up.
-- Verified 2026-10-24: before this, PATCH/DELETE with the publishable key
-- returned 200 with 0 rows affected (RLS); after, they're refused outright.

REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.favorite_books FROM anon, authenticated;
