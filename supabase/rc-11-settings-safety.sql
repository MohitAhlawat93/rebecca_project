-- RC-11 — Settings & Safety Controls
-- Adds owner preferences to the existing protected system row.

alter table public.rebecca_system_state
  add column if not exists settings jsonb not null default '{}'::jsonb;

grant select (settings) on public.rebecca_system_state to anon;
grant update (settings) on public.rebecca_system_state to anon;

-- Preserve the existing view column order and append settings at the end.
create or replace view public.rebecca_system_api
with (security_invoker = true)
as
select
  id,
  version,
  events,
  snapshots,
  updated_by,
  updated_at,
  settings
from public.rebecca_system_state;

revoke all on public.rebecca_system_api from anon, authenticated;

grant select (
  id, version, events, snapshots, updated_by, updated_at, settings
) on public.rebecca_system_api to anon;

grant update (
  version, events, snapshots, updated_by, updated_at, settings
) on public.rebecca_system_api to anon;

notify pgrst, 'reload schema';
