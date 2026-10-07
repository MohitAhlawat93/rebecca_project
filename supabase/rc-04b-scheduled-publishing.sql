-- RC-04B — Scheduled Media Publishing
-- Add one protected schedule payload to the existing RC-03 media state row.
-- No new table, cron job, service-role key or public endpoint is required.

alter table public.rebecca_media_state
  add column if not exists schedule jsonb not null default '{}'::jsonb;

grant select (schedule) on public.rebecca_media_state to anon;
grant update (schedule) on public.rebecca_media_state to anon;

create or replace view public.rebecca_media_api
with (security_invoker = true)
as
select
  id,
  version,
  draft,
  published,
  published_version,
  history,
  updated_by,
  updated_at,
  published_at,
  schedule
from public.rebecca_media_state;

revoke all on public.rebecca_media_api from anon, authenticated;

grant select (
  id, version, draft, published, published_version,
  history, updated_by, updated_at, published_at, schedule
) on public.rebecca_media_api to anon;

grant update (
  version, draft, published, published_version,
  history, updated_by, updated_at, published_at, schedule
) on public.rebecca_media_api to anon;

notify pgrst, 'reload schema';
