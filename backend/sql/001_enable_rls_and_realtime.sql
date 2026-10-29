-- Apply AFTER deploying the backend change that makes config/supabase.js export the service-role client.
-- The backend uses the service-role key (bypasses RLS); browser clients must not read tables directly.

-- 1. Drop wide-open read policies that would become active once RLS is enabled.
drop policy if exists chat_read on public.chat_messages;
drop policy if exists conversation_read on public.conversations;
drop policy if exists company_read on public.companies;
drop policy if exists placement_drives_read on public.placement_drives;
drop policy if exists training_read on public.training_modules;

-- 2. Enable RLS on every public table that does not have it yet.
do $$
declare t record;
begin
  for t in
    select c.relname from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  loop
    execute format('alter table public.%I enable row level security', t.relname);
  end loop;
end $$;

-- 3. Realtime: deliver notification inserts to their owner (notification_owner / notifications_select_policy apply).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
