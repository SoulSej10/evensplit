-- Schedule the materialize-recurring-expenses Edge Function to run daily at
-- 00:15 UTC via pg_cron + pg_net. Uses the public anon key for the required
-- Authorization header (the function itself uses the auto-injected
-- SUPABASE_SERVICE_ROLE_KEY internally to bypass RLS for its writes; the
-- anon key here only satisfies the edge gateway's verify_jwt check and is
-- not a sensitive secret — it's already shipped in both client apps).
--
-- NOTE: the anon key below is project-specific (opwiuqodrnhkysmbukme). If
-- this migration is ever re-run against a different Supabase project, swap
-- both the function URL and the anon key for that project's values first.
select cron.schedule(
  'materialize-recurring-expenses-daily',
  '15 0 * * *',
  $$
  select net.http_post(
    url := 'https://opwiuqodrnhkysmbukme.supabase.co/functions/v1/materialize-recurring-expenses',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wd2l1cW9kcm5oa3lzbWJ1a21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODI3MzksImV4cCI6MjEwMzE1ODczOX0.5JQcGNPRV2-gHSkONioqVTqaQW7_jMYlqhUszJrDOJ8'
    ),
    body := '{}'::jsonb
  );
  $$
);
